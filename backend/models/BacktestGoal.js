const mongoose = require('mongoose');

// Schema for milestones
const milestoneSchema = new mongoose.Schema({
  target: {
    type: Number,
    required: true,
    min: 1
  },
  label: {
    type: String,
    trim: true,
    maxlength: 100
  },
  achieved: {
    type: Boolean,
    default: false
  },
  achievedAt: {
    type: Date
  }
}, { _id: false });

const backtestGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Goal scope: 'overall' or 'masterCard'
  scope: {
    type: String,
    enum: ['overall', 'masterCard'],
    required: true
  },
  
  // Master Card reference (only if scope is 'masterCard')
  masterCardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterCard',
    required: function() {
      return this.scope === 'masterCard';
    }
  },
  
  // Goal details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Goal target
  target: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Current progress (calculated, but can be manually set)
  currentProgress: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Goal type: 'trades', 'winRate', 'pnl', 'custom'
  goalType: {
    type: String,
    enum: ['trades', 'winRate', 'pnl', 'custom'],
    default: 'trades'
  },
  
  // Time period settings
  timePeriod: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
    default: 'none'
  },
  
  // Custom date range (if timePeriod is 'custom')
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  
  // Milestones for tracking progress
  milestones: [milestoneSchema],
  
  // Goal status
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  
  // Completion date
  completedAt: {
    type: Date
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
backtestGoalSchema.index({ userId: 1, scope: 1, status: 1 });
backtestGoalSchema.index({ userId: 1, masterCardId: 1, status: 1 });
backtestGoalSchema.index({ userId: 1, createdAt: -1 });

// Virtual for progress percentage
backtestGoalSchema.virtual('progressPercentage').get(function() {
  if (this.target <= 0) return 0;
  return Math.min((this.currentProgress / this.target) * 100, 100);
});

// Virtual for isCompleted
backtestGoalSchema.virtual('isCompleted').get(function() {
  return this.currentProgress >= this.target || this.status === 'completed';
});

// Method to update progress
backtestGoalSchema.methods.updateProgress = async function(newProgress) {
  this.currentProgress = Math.max(0, newProgress);
  
  // Check if goal is completed
  if (this.currentProgress >= this.target && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  // Update milestones
  if (this.milestones && this.milestones.length > 0) {
    this.milestones.forEach(milestone => {
      if (!milestone.achieved && this.currentProgress >= milestone.target) {
        milestone.achieved = true;
        milestone.achievedAt = new Date();
      }
    });
  }
  
  this.updatedAt = new Date();
  return this.save();
};

// Static method to calculate progress for a goal
backtestGoalSchema.statics.calculateProgress = async function(goalId) {
  const goal = await this.findById(goalId);
  if (!goal) return null;
  
  const Backtest = mongoose.model('Backtest');
  let query = { userId: new mongoose.Types.ObjectId(goal.userId) };
  
  // Add master card filter if scope is masterCard
  if (goal.scope === 'masterCard' && goal.masterCardId) {
    query.masterCardId = new mongoose.Types.ObjectId(goal.masterCardId);
  }
  
  // Add date filter if time period is set
  if (goal.timePeriod !== 'none') {
    const now = new Date();
    let startDate, endDate;
    
    switch (goal.timePeriod) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
        if (goal.startDate && goal.endDate) {
          startDate = goal.startDate;
          endDate = goal.endDate;
        }
        break;
    }
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
  } else if (goal.startDate && goal.endDate) {
    query.date = { $gte: goal.startDate, $lte: goal.endDate };
  }
  
  // Calculate progress based on goal type
  let progress = 0;
  const backtests = await Backtest.find(query);
  
  switch (goal.goalType) {
    case 'trades':
      progress = backtests.length;
      break;
    case 'winRate':
      if (backtests.length > 0) {
        const wins = backtests.filter(b => b.result === 'win').length;
        progress = (wins / backtests.length) * 100;
      }
      break;
    case 'pnl':
      progress = backtests.reduce((sum, b) => sum + (b.pnl || 0), 0);
      break;
    case 'custom':
      // For custom goals, progress should be manually updated
      progress = goal.currentProgress;
      break;
  }
  
  // Update goal progress
  await goal.updateProgress(progress);
  
  return {
    progress,
    percentage: goal.progressPercentage,
    isCompleted: goal.isCompleted,
    milestones: goal.milestones
  };
};

module.exports = mongoose.model('BacktestGoal', backtestGoalSchema);

