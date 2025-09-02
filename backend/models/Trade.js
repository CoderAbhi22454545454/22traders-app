const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  // New field: Trade Number
  tradeNumber: {
    type: String,
    trim: true
  },
  // Keep existing instrument field, but also add tradePair
  instrument: {
    type: String,
    trim: true
  },
  tradePair: {
    type: String,
    trim: true
  },
  entryPrice: {
    type: Number,
    min: 0
  },
  exitPrice: {
    type: Number,
    min: 0
  },
  // New fields: Stop Loss and Take Profit
  stopLoss: {
    type: Number,
    min: 0
  },
  takeProfit: {
    type: Number,
    min: 0
  },
  pnl: {
    type: Number
  },
  // New field: Pipes (text field for flexible values)
  pipes: {
    type: String,
    trim: true,
    default: '0'
  },
  result: {
    type: String,
    enum: ['win', 'loss', 'be']
  },
  // New field: Trade Outcome (similar to result but more descriptive)
  tradeOutcome: {
    type: String,
    enum: ['Win', 'Loss', 'Break Even']
  },
  direction: {
    type: String,
    enum: ['Long', 'Short']
  },
  // Keep existing lotSize, but also add positionSize
  lotSize: {
    type: Number,
    min: 0.01
  },
  positionSize: {
    type: String,
    trim: true
  },
  // New field: Risk Reward ratio
  riskReward: {
    type: String,
    trim: true
  },
  strategy: {
    type: String,
    trim: true
  },
  session: {
    type: String,
    enum: ['London', 'NY', 'Asian', 'Overlap']
  },
  // New field: Trade Duration
  tradeDuration: {
    type: String,
    trim: true
  },
  executionScore: {
    type: Number,
    min: 1,
    max: 10
  },
  emotions: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // New field: Reason for Trade
  reasonForTrade: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // New field: Lesson Learned
  lessonLearned: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // New field: Additional Notes (separate from regular notes)
  additionalNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // New field: Is Backtest Trade
  isBacktest: {
    type: Boolean,
    default: false
  },
  screenshotUrl: {
    type: String,
    trim: true
  },
  screenshotPublicId: {
    type: String,
    trim: true
  },
  screenshotMetadata: {
    filename: {
      type: String,
      trim: true
    },
    mimetype: {
      type: String,
      trim: true
    },
    size: {
      type: Number,
      min: 0
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    cloudinaryUrl: {
      type: String,
      trim: true
    },
    cloudinaryPublicId: {
      type: String,
      trim: true
    }
  },
  // Pre-trade checklist data
  preTradeChecklist: {
    checklistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TradeChecklist'
    },
    checklistName: {
      type: String,
      trim: true
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    qualityScore: {
      type: Number,
      min: 1,
      max: 10
    },
    setupQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'terrible']
    },
    items: [{
      itemId: mongoose.Schema.Types.ObjectId,
      title: String,
      isCompleted: Boolean,
      value: mongoose.Schema.Types.Mixed,
      notes: String,
      order: Number
    }],
    overallNotes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    completedAt: {
      type: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
tradeSchema.index({ userId: 1, date: -1 });
tradeSchema.index({ userId: 1, instrument: 1 });
tradeSchema.index({ userId: 1, tradePair: 1 });
tradeSchema.index({ userId: 1, strategy: 1 });
tradeSchema.index({ userId: 1, session: 1 });
tradeSchema.index({ userId: 1, direction: 1 });
tradeSchema.index({ userId: 1, tradeNumber: 1 });

// Virtual for calculating quantity
tradeSchema.virtual('quantity').get(function() {
  if (this.entryPrice && this.exitPrice && this.pnl) {
    return Math.abs(this.pnl / (this.exitPrice - this.entryPrice));
  }
  return null;
});

module.exports = mongoose.model('Trade', tradeSchema); 