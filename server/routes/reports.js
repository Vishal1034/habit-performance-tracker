const express = require('express');
const router = express.Router();
const { exportCSV } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/csv', protect, exportCSV);

module.exports = router;
