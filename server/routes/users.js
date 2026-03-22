const express = require('express');
const router = express.Router();
const { listUsers } = require('../controllers/usersController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, listUsers);

module.exports = router;
