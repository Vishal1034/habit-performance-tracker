const express = require('express');
const router = express.Router();
const { createLog } = require('../controllers/logController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createLog);

module.exports = router;
