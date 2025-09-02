const mongoose = require('mongoose');

// Schema for custom chips/labels
const chipSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  category: {
    type: String,
    enum: ['strategy', 'timeframe', 'session', 'pattern', 'custom'],
    default: 'custom'
  }
});

// Schema for screenshot with description
const screenshotSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['before', 'entry', 'after'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  metadata: {
    filename: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }
});

const backtestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Basic trade information
  date: {
    type: Date,
    required: true
  },
  tradeNumber: {
    type: String,
    trim: true
  },
  instrument: {
    type: String,
    trim: true
  },
  tradePair: {
    type: String,
    trim: true
  },
  
  // Price data
  entryPrice: {
    type: Number,
    min: 0
  },
  exitPrice: {
    type: Number,
    min: 0
  },
  stopLoss: {
    type: Number,
    min: 0
  },
  takeProfit: {
    type: Number,
    min: 0
  },
  
  // Trade outcome
  pnl: {
    type: Number
  },
  result: {
    type: String,
    enum: ['win', 'loss', 'be']
  },
  direction: {
    type: String,
    enum: ['Long', 'Short']
  },
  
  // Position sizing
  lotSize: {
    type: Number,
    min: 0.01
  },
  positionSize: {
    type: String,
    trim: true
  },
  riskReward: {
    type: String,
    trim: true
  },
  
  // Custom chips/labels - this is the key feature for backtesting
  customChips: [chipSchema],
  
  // Multiple screenshots with descriptions
  screenshots: [screenshotSchema],
  
  // Backtesting specific fields
  backtestNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  patternIdentified: {
    type: String,
    trim: true
  },
  marketCondition: {
    type: String,
    enum: ['trending', 'ranging', 'volatile', 'calm'],
    trim: true
  },
  confidence: {
    type: Number,
    min: 1,
    max: 10
  },
  
  // Analysis fields
  reasonForEntry: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  reasonForExit: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  whatWorked: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  whatDidntWork: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  improvementAreas: {
    type: String,
    trim: true,
    maxlength: 1000
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
backtestSchema.index({ userId: 1, date: -1 });
backtestSchema.index({ userId: 1, 'customChips.name': 1 });
backtestSchema.index({ userId: 1, 'customChips.value': 1 });
backtestSchema.index({ userId: 1, patternIdentified: 1 });
backtestSchema.index({ userId: 1, marketCondition: 1 });

// Virtual for calculating risk-reward ratio
backtestSchema.virtual('calculatedRiskReward').get(function() {
  if (this.entryPrice && this.stopLoss && this.takeProfit) {
    const risk = Math.abs(this.entryPrice - this.stopLoss);
    const reward = Math.abs(this.takeProfit - this.entryPrice);
    return risk > 0 ? (reward / risk).toFixed(2) : 0;
  }
  return null;
});

// Method to get chips by category
backtestSchema.methods.getChipsByCategory = function(category) {
  return this.customChips.filter(chip => chip.category === category);
};

// Static method to get all unique chip values for a user
backtestSchema.statics.getUniqueChips = async function(userId, category = null) {
  const pipeline = [
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $unwind: '$customChips' }
  ];
  
  if (category) {
    pipeline.push({ $match: { 'customChips.category': category } });
  }
  
  pipeline.push(
    {
      $group: {
        _id: {
          name: '$customChips.name',
          value: '$customChips.value',
          category: '$customChips.category'
        },
        count: { $sum: 1 },
        color: { $first: '$customChips.color' }
      }
    },
    { $sort: { count: -1 } }
  );
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Backtest', backtestSchema);
