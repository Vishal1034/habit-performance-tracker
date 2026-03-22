const Habit = require('../models/Habit');
const { normalizeDomain } = require('../utils/urlNormalizer');
const { resolveUserContext } = require('../utils/userResolver');

const getHabits = async (req, res) => {
  try {
    const { userId } = resolveUserContext(req);
    const habits = await Habit.find({ user: userId });
    res.json({
      success: true,
      data: habits,
    });
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch habits',
      error: error.message,
    });
  }
};

const createHabit = async (req, res) => {
  try {
    const { userId } = resolveUserContext(req);
    const { name, type, urls, dailyGoal } = req.body;

    if (!name || !type || !urls || !dailyGoal) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type, urls, dailyGoal',
      });
    }

    if (!['focus', 'distraction'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "focus" or "distraction"',
      });
    }

    const urlArray = (Array.isArray(urls) ? urls : [urls])
      .map((value) => normalizeDomain(value))
      .filter(Boolean);
    if (urlArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one URL is required',
      });
    }

    const habit = new Habit({
      user: userId,
      name,
      type,
      urls: urlArray,
      dailyGoal: parseInt(dailyGoal, 10), // Convert to seconds (assuming input is in minutes)
      createdAt: new Date(),
    });

    const savedHabit = await habit.save();

    res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      data: savedHabit,
    });
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create habit',
      error: error.message,
    });
  }
};

const updateHabit = async (req, res) => {
  try {
    const { userId } = resolveUserContext(req);
    const { id } = req.params;
    const { name, type, urls, dailyGoal } = req.body;

    let habit = await Habit.findById(id);
    
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    if (habit.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this habit',
      });
    }

    if (name) habit.name = name;
    if (type) {
      if (!['focus', 'distraction'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Type must be either "focus" or "distraction"',
        });
      }
      habit.type = type;
    }
    if (urls) {
      const urlArray = (Array.isArray(urls) ? urls : [urls])
        .map((value) => normalizeDomain(value))
        .filter(Boolean);
      if (urlArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one URL is required',
        });
      }
      habit.urls = urlArray;
    }
    if (dailyGoal) {
      habit.dailyGoal = parseInt(dailyGoal, 10);
    }

    const updatedHabit = await habit.save();

    res.json({
      success: true,
      message: 'Habit updated successfully',
      data: updatedHabit,
    });
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update habit',
      error: error.message,
    });
  }
};

const deleteHabit = async (req, res) => {
  try {
    const { userId } = resolveUserContext(req);
    const { id } = req.params;

    const habit = await Habit.findById(id);

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found',
      });
    }

    if (habit.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this habit',
      });
    }

    await Habit.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Habit deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete habit',
      error: error.message,
    });
  }
};

module.exports = {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
};
