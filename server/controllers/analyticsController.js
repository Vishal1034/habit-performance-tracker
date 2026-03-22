const Log = require('../models/Log');
const Habit = require('../models/Habit');
const { generateAnalytics } = require('../utils/stabilityCalculator');
const { resolveUserContext } = require('../utils/userResolver');

const getStartOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const getEndOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const toLocalDateKey = (dateValue) => {
  const value = new Date(dateValue);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDailyAnalytics = async (req, res) => {
  try {
    const { userId } = resolveUserContext(req);

    const startOfDay = getStartOfDay(new Date());
    const endOfDay = getEndOfDay(new Date());

    const userHabits = await Habit.find({ user: userId });

    const todaysLogs = await Log.find({
      user: userId,
      loggedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const analytics = generateAnalytics(todaysLogs, userHabits);
    const hasAnyTrackedData = todaysLogs.length > 0;
    const hasCategorizedData = (analytics.totalFocusTime + analytics.totalDistractionTime) > 0;

    res.status(200).json({
      success: true,
      data: {
        ...analytics,
        stabilityScore: hasCategorizedData ? analytics.stabilityScore : null,
        hasAnyTrackedData,
        hasCategorizedData,
      }
    });

  } catch (error) {
    console.error('Analytics Error:', error.message);
    res.status(500).json({ message: 'Server Error: Could not generate analytics.' });
  }
};

const getAnalyticsHistory = async (req, res) => {
  try {
    const { userId } = resolveUserContext(req);
    const days = Math.max(1, Math.min(parseInt(req.query.days, 10) || 30, 90));

    const today = getStartOfDay(new Date());
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - (days - 1));
    const rangeEnd = getEndOfDay(today);

    const userHabits = await Habit.find({ user: userId });
    const logs = await Log.find({
      user: userId,
      loggedAt: { $gte: rangeStart, $lte: rangeEnd },
    }).sort({ loggedAt: 1 });

    const logsByDay = logs.reduce((acc, log) => {
      const key = toLocalDateKey(log.loggedAt);
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});

    const history = [];
    for (let i = 0; i < days; i += 1) {
      const date = new Date(rangeStart);
      date.setDate(rangeStart.getDate() + i);
      const dateKey = toLocalDateKey(date);
      const dayLogs = logsByDay[dateKey] || [];
      const dayAnalytics = generateAnalytics(dayLogs, userHabits);
      const hasAnyTrackedData = dayLogs.length > 0;
      const hasCategorizedData = (dayAnalytics.totalFocusTime + dayAnalytics.totalDistractionTime) > 0;

      history.push({
        date: dateKey,
        totalFocusTime: dayAnalytics.totalFocusTime,
        totalDistractionTime: dayAnalytics.totalDistractionTime,
        totalTrackedTime: dayLogs.reduce((sum, item) => sum + item.duration, 0),
        stabilityScore: hasCategorizedData ? dayAnalytics.stabilityScore : null,
        hasAnyTrackedData,
        hasCategorizedData,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        days,
        history,
      },
    });
  } catch (error) {
    console.error('History Analytics Error:', error.message);
    res.status(500).json({ message: 'Server Error: Could not generate analytics history.' });
  }
};

const getPeerComparison = async (req, res) => {
  try {
    const { userId } = resolveUserContext(req);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const userLogs = await Log.aggregate([
      { $match: { user: userId, loggedAt: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
    ]);
    const userTotal = userLogs.length > 0 ? userLogs[0].totalDuration : 0;

    const globalLogs = await Log.aggregate([
      { $match: { loggedAt: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: '$user', dailyTotal: { $sum: '$duration' } } },
      { $group: { _id: null, averageDuration: { $avg: '$dailyTotal' } } }
    ]);
    const globalAverage = globalLogs.length > 0 ? Math.round(globalLogs[0].averageDuration) : 0;

    res.status(200).json({
      success: true,
      data: {
        userTrackedTime: userTotal,
        peerAverageTrackedTime: globalAverage,
        userFocusTime: userTotal,
        peerAverageTime: globalAverage,
        isAboveAverage: userTotal > globalAverage
      }
    });
  } catch (error) {
    console.error('Peer Comparison Error:', error.message);
    res.status(500).json({ message: 'Server Error: Could not generate peer comparison.' });
  }
};

const getAnalyticsByDate = async (req, res) => {
  try {
    const { userId } = resolveUserContext(req);
    const dateString = req.query.date || toLocalDateKey(new Date());

    const [year, month, day] = dateString.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);

    const startOfDay = getStartOfDay(targetDate);
    const endOfDay = getEndOfDay(targetDate);

    const userHabits = await Habit.find({ user: userId });

    const dayLogs = await Log.find({
      user: userId,
      loggedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const habitBreakdown = userHabits.map((habit) => {
      const matchingLogs = dayLogs.filter((log) => {
        const logDomain = log.url.toLowerCase();
        const habitUrls = habit.urls.map((u) => u.toLowerCase());
        
        return habitUrls.some((habitUrl) => 
          logDomain === habitUrl || logDomain.endsWith(`.${habitUrl}`)
        );
      });

      const totalTime = matchingLogs.reduce((sum, log) => sum + (log.duration || 0), 0);

      return {
        id: habit._id,
        name: habit.name,
        type: habit.type,
        timeSpent: totalTime,
        completionRate: habit.dailyGoal > 0 
          ? Math.min(100, Math.round((totalTime / habit.dailyGoal) * 100))
          : 0,
      };
    }).filter((h) => h.timeSpent > 0); // Only return habits with tracked time

    const analytics = generateAnalytics(dayLogs, userHabits);

    res.status(200).json({
      success: true,
      data: {
        date: dateString,
        habits: habitBreakdown,
        totalTrackedTime: dayLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
        totalFocusTime: analytics.totalFocusTime,
        totalDistractionTime: analytics.totalDistractionTime,
        stabilityScore: analytics.stabilityScore,
      }
    });
  } catch (error) {
    console.error('Analytics by Date Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server Error: Could not generate analytics for date.',
      error: error.message,
    });
  }
};

module.exports = { getDailyAnalytics, getPeerComparison, getAnalyticsHistory, getAnalyticsByDate };
