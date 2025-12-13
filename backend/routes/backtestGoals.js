const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const BacktestGoal = require('../models/BacktestGoal');
const Backtest = require('../models/Backtest');
const MasterCard = require('../models/MasterCard');

const router = express.Router();

// Validation rules
const goalValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('target').isFloat({ min: 0.01 }).withMessage('Target must be a positive number').custom((value, { req }) => {
    // For 'trades' goal type, target should be an integer
    if (req.body.goalType === 'trades' && !Number.isInteger(parseFloat(value))) {
      throw new Error('Target must be a whole number for trades goal type');
    }
    return true;
  }),
  body('goalType').isIn(['trades', 'winRate', 'pnl', 'custom']).withMessage('Invalid goal type'),
  body('scope').isIn(['overall', 'masterCard']).withMessage('Scope must be overall or masterCard'),
  body('masterCardId').optional().custom((value, { req }) => {
    if (req.body.scope === 'masterCard' && !value) {
      throw new Error('Master Card ID is required when scope is masterCard');
    }
    return true;
  }),
  body('timePeriod').isIn(['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']).withMessage('Invalid time period'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('milestones').optional().isArray().withMessage('Milestones must be an array')
];

// GET /api/backtest-goals - Get all goals for a user
router.get('/', async (req, res) => {
  try {
    const { userId, scope, masterCardId, status } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const query = { userId: new mongoose.Types.ObjectId(userId) };
    
    if (scope) {
      query.scope = scope;
    }
    
    if (masterCardId) {
      query.masterCardId = new mongoose.Types.ObjectId(masterCardId);
    }
    
    if (status) {
      query.status = status;
    }

    const goals = await BacktestGoal.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate progress for each goal
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const progressData = await BacktestGoal.calculateProgress(goal._id);
        return {
          ...goal,
          progress: progressData?.progress || goal.currentProgress,
          progressPercentage: progressData?.percentage || 0,
          isCompleted: progressData?.isCompleted || false,
          milestones: progressData?.milestones || goal.milestones || []
        };
      })
    );

    res.json({
      success: true,
      goals: goalsWithProgress
    });
  } catch (error) {
    console.error('Error fetching backtest goals:', error);
    res.status(500).json({ success: false, message: 'Error fetching goals', error: error.message });
  }
});

// GET /api/backtest-goals/:id - Get a specific goal
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const goal = await BacktestGoal.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Calculate current progress
    const progressData = await BacktestGoal.calculateProgress(goal._id);

    res.json({
      success: true,
      goal: {
        ...goal.toObject(),
        progress: progressData?.progress || goal.currentProgress,
        progressPercentage: progressData?.percentage || 0,
        isCompleted: progressData?.isCompleted || false,
        milestones: progressData?.milestones || goal.milestones || []
      }
    });
  } catch (error) {
    console.error('Error fetching backtest goal:', error);
    res.status(500).json({ success: false, message: 'Error fetching goal', error: error.message });
  }
});

// POST /api/backtest-goals - Create a new goal
router.post('/', goalValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const {
      userId,
      scope,
      masterCardId,
      title,
      description,
      target,
      goalType,
      timePeriod,
      startDate,
      endDate,
      milestones
    } = req.body;

    // Validate master card if scope is masterCard
    if (scope === 'masterCard') {
      if (!masterCardId) {
        return res.status(400).json({ success: false, message: 'Master Card ID is required for masterCard scope' });
      }
      
      const masterCard = await MasterCard.findOne({
        _id: masterCardId,
        userId: new mongoose.Types.ObjectId(userId)
      });
      
      if (!masterCard) {
        return res.status(404).json({ success: false, message: 'Master Card not found' });
      }
    }

    // Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }

    const goal = new BacktestGoal({
      userId: new mongoose.Types.ObjectId(userId),
      scope,
      masterCardId: scope === 'masterCard' ? new mongoose.Types.ObjectId(masterCardId) : undefined,
      title,
      description,
      target,
      goalType,
      timePeriod: timePeriod || 'none',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      milestones: milestones || [],
      currentProgress: 0,
      status: 'active'
    });

    await goal.save();

    // Calculate initial progress
    const progressData = await BacktestGoal.calculateProgress(goal._id);

    res.status(201).json({
      success: true,
      goal: {
        ...goal.toObject(),
        progress: progressData?.progress || 0,
        progressPercentage: progressData?.percentage || 0,
        isCompleted: progressData?.isCompleted || false,
        milestones: progressData?.milestones || goal.milestones || []
      }
    });
  } catch (error) {
    console.error('Error creating backtest goal:', error);
    res.status(500).json({ success: false, message: 'Error creating goal', error: error.message });
  }
});

// PUT /api/backtest-goals/:id - Update a goal
router.put('/:id', goalValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const goal = await BacktestGoal.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Update fields
    const {
      title,
      description,
      target,
      goalType,
      timePeriod,
      startDate,
      endDate,
      milestones,
      status
    } = req.body;

    if (title) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (target) goal.target = target;
    if (goalType) goal.goalType = goalType;
    if (timePeriod) goal.timePeriod = timePeriod;
    if (startDate) goal.startDate = new Date(startDate);
    if (endDate) goal.endDate = new Date(endDate);
    if (milestones) goal.milestones = milestones;
    if (status) goal.status = status;

    // Validate date range
    if (goal.startDate && goal.endDate && goal.startDate > goal.endDate) {
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }

    await goal.save();

    // Recalculate progress
    const progressData = await BacktestGoal.calculateProgress(goal._id);

    res.json({
      success: true,
      goal: {
        ...goal.toObject(),
        progress: progressData?.progress || goal.currentProgress,
        progressPercentage: progressData?.percentage || 0,
        isCompleted: progressData?.isCompleted || false,
        milestones: progressData?.milestones || goal.milestones || []
      }
    });
  } catch (error) {
    console.error('Error updating backtest goal:', error);
    res.status(500).json({ success: false, message: 'Error updating goal', error: error.message });
  }
});

// DELETE /api/backtest-goals/:id - Delete a goal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const goal = await BacktestGoal.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting backtest goal:', error);
    res.status(500).json({ success: false, message: 'Error deleting goal', error: error.message });
  }
});

// POST /api/backtest-goals/:id/calculate - Manually recalculate progress
router.post('/:id/calculate', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const goal = await BacktestGoal.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const progressData = await BacktestGoal.calculateProgress(goal._id);

    res.json({
      success: true,
      progress: progressData
    });
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    res.status(500).json({ success: false, message: 'Error calculating progress', error: error.message });
  }
});

// GET /api/backtest-goals/summary/:userId - Get summary of all goals
router.get('/summary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const goals = await BacktestGoal.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'active'
    }).lean();

    // Calculate progress for all active goals
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const progressData = await BacktestGoal.calculateProgress(goal._id);
        return {
          ...goal,
          progress: progressData?.progress || goal.currentProgress,
          progressPercentage: progressData?.percentage || 0,
          isCompleted: progressData?.isCompleted || false
        };
      })
    );

    const summary = {
      total: goalsWithProgress.length,
      completed: goalsWithProgress.filter(g => g.isCompleted).length,
      active: goalsWithProgress.filter(g => !g.isCompleted).length,
      overall: goalsWithProgress.filter(g => g.scope === 'overall').length,
      masterCard: goalsWithProgress.filter(g => g.scope === 'masterCard').length,
      goals: goalsWithProgress
    };

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error fetching goal summary:', error);
    res.status(500).json({ success: false, message: 'Error fetching summary', error: error.message });
  }
});

module.exports = router;

