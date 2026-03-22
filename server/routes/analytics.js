const express = require('express');
const router = express.Router();
const { getDailyAnalytics, getPeerComparison, getAnalyticsHistory, getAnalyticsByDate } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/today', protect, getDailyAnalytics);

router.get('/peers', protect, getPeerComparison);

router.get('/history', protect, getAnalyticsHistory);

router.get('/date', protect, getAnalyticsByDate);

module.exports = router;
