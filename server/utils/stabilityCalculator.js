const { normalizeDomain } = require('./urlNormalizer');

const generateAnalytics = (logs, habits) => {
  let totalFocusTime = 0;
  let totalDistractionTime = 0;
  let habitProgress = {};
  const totalFocusGoal = habits
    .filter((habit) => habit.type === 'focus')
    .reduce((sum, habit) => sum + (habit.dailyGoal || 0), 0);

  habits.forEach(habit => {
    habitProgress[habit._id] = {
      name: habit.name,
      type: habit.type, // 'focus' or 'distraction'
      targetUrls: habit.urls, // e.g., ['leetcode.com', 'github.com']
      dailyGoal: habit.dailyGoal, // in seconds
      timeSpent: 0,
      completionRate: 0
    };
  });

  logs.forEach(log => {
    const logDomain = normalizeDomain(log.url);
    const matchedHabit = habits.find((habit) =>
      habit.urls.some((targetUrl) => {
        const targetDomain = normalizeDomain(targetUrl);
        if (!logDomain || !targetDomain) return false;
        return logDomain === targetDomain || logDomain.endsWith(`.${targetDomain}`);
      })
    );

    if (matchedHabit) {
      const habitId = matchedHabit._id;
      habitProgress[habitId].timeSpent += log.duration;

      if (matchedHabit.type === 'focus') {
        totalFocusTime += log.duration;
      } else if (matchedHabit.type === 'distraction') {
        totalDistractionTime += log.duration;
      }
    }
  });

  Object.keys(habitProgress).forEach(key => {
    const habit = habitProgress[key];
    if (habit.dailyGoal > 0) {
      habit.completionRate = Math.min(100, Math.round((habit.timeSpent / habit.dailyGoal) * 100));
    }
  });

  const totalCategorizedTime = totalFocusTime + totalDistractionTime;
  let stabilityScore = 0;
  
  if (totalCategorizedTime > 0 && totalFocusGoal > 0) {
    const quality = totalFocusTime / totalCategorizedTime;
    const progress = Math.min(1, totalFocusTime / totalFocusGoal);
    stabilityScore = Math.round(quality * progress * 100);
  } else if (totalCategorizedTime > 0) {
    stabilityScore = Math.round((totalFocusTime / totalCategorizedTime) * 100);
  }

  return {
    stabilityScore,
    totalFocusTime,
    totalDistractionTime,
    detailedProgress: Object.values(habitProgress)
  };
};

module.exports = { generateAnalytics };
