const mongoose = require('mongoose');

const masterCardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Master card information
  name: {
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
  
  // Strategy/Pattern information
  strategy: {
    type: String,
    trim: true
  },
  timeframe: {
    type: String,
    trim: true
  },
  pattern: {
    type: String,
    trim: true
  },
  
  // Color for UI display
  color: {
    type: String,
    default: '#3B82F6'
  },
  
  // Tags/Categories
  tags: [{
    type: String,
    trim: true
  }],
  
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
masterCardSchema.index({ userId: 1, createdAt: -1 });
masterCardSchema.index({ userId: 1, name: 1 });

// Virtual for getting backtest count
masterCardSchema.virtual('backtestCount', {
  ref: 'Backtest',
  localField: '_id',
  foreignField: 'masterCardId',
  count: true
});

// Method to get statistics
masterCardSchema.methods.getStatistics = async function() {
  const Backtest = mongoose.model('Backtest');
  const backtests = await Backtest.find({ masterCardId: this._id });
  
  if (backtests.length === 0) {
    return {
      totalTrades: 0,
      totalPnL: 0,
      winRate: 0,
      wins: 0,
      losses: 0,
      avgPnL: 0
    };
  }
  
  const wins = backtests.filter(b => b.result === 'win').length;
  const losses = backtests.filter(b => b.result === 'loss').length;
  const totalPnL = backtests.reduce((sum, b) => sum + (b.pnl || 0), 0);
  const avgPnL = totalPnL / backtests.length;
  const winRate = (wins / backtests.length) * 100;
  
  return {
    totalTrades: backtests.length,
    totalPnL,
    winRate: winRate.toFixed(2),
    wins,
    losses,
    avgPnL: avgPnL.toFixed(2)
  };
};

module.exports = mongoose.model('MasterCard', masterCardSchema);

