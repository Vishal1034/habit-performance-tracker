const express = require('express');
const router = express.Router();
const { getHabits, createHabit, updateHabit, deleteHabit } = require('../controllers/habitController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getHabits);
router.post('/', protect, createHabit);
router.put('/:id', protect, updateHabit);
router.delete('/:id', protect, deleteHabit);

module.exports = router;
