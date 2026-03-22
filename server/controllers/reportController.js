const Log = require('../models/Log');
const { resolveUserContext } = require('../utils/userResolver');

const exportCSV = async (req, res) => {
  try {
    const { userId } = resolveUserContext(req);

    const logs = await Log.find({ user: userId }).sort({ loggedAt: -1 });

    if (!logs || logs.length === 0) {
      return res.status(404).json({ message: 'No activity data found to export.' });
    }

    let csvData = 'Date,Time,URL,Duration (Seconds),Duration (Minutes)\n';

    logs.forEach((log) => {
      const dateObj = new Date(log.loggedAt);
      const dateStr = dateObj.toLocaleDateString();
      const timeStr = dateObj.toLocaleTimeString();
      const durationMins = (log.duration / 60).toFixed(2);

      const safeUrl = `"${log.url}"`;

      csvData += `${dateStr},${timeStr},${safeUrl},${log.duration},${durationMins}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Habit Stability Tracker_report.csv"');

    res.status(200).send(csvData);
  } catch (error) {
    console.error('Report Generation Error:', error.message);
    res.status(500).json({ message: 'Server Error: Could not generate report.' });
  }
};

module.exports = { exportCSV };

