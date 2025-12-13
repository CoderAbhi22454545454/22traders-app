const mongoose = require('mongoose');

const backtestTemplateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Template information
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
  
  // Template category
  category: {
    type: String,
    enum: ['swing', 'scalping', 'breakout', 'reversal', 'trend-following', 'custom'],
    default: 'custom'
  },
  
  // Pre-filled template data - all fields are optional
  templateData: {
    instrument: { type: String, default: undefined },
    tradePair: { type: String, default: undefined },
    direction: { type: String, default: undefined },
    lotSize: { type: Number, default: undefined },
    positionSize: { type: String, default: undefined },
    riskReward: { type: String, default: undefined },
    patternIdentified: { type: String, default: undefined },
    marketCondition: { type: String, default: undefined },
    confidence: { type: Number, default: undefined },
    reasonForEntry: { type: String, default: undefined },
    reasonForExit: { type: String, default: undefined },
    customChips: { type: Array, default: [] },
    backtestNotes: { type: String, default: undefined },
    whatWorked: { type: String, default: undefined },
    whatDidntWork: { type: String, default: undefined },
    improvementAreas: { type: String, default: undefined }
  },
  
  // Usage statistics
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsedAt: {
    type: Date
  },
  
  // Template settings
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
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
backtestTemplateSchema.index({ userId: 1, isActive: 1 });
backtestTemplateSchema.index({ userId: 1, category: 1 });
backtestTemplateSchema.index({ userId: 1, usageCount: -1 });

// Method to increment usage count
backtestTemplateSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

// Static method to get default template for user
backtestTemplateSchema.statics.getDefaultTemplate = function(userId) {
  return this.findOne({ 
    userId: new mongoose.Types.ObjectId(userId), 
    isDefault: true, 
    isActive: true 
  });
};

// Static method to get templates by category
backtestTemplateSchema.statics.getByCategory = function(userId, category) {
  return this.find({ 
    userId: new mongoose.Types.ObjectId(userId), 
    category, 
    isActive: true 
  }).sort({ usageCount: -1 });
};

// Static method to get most used templates
backtestTemplateSchema.statics.getMostUsed = function(userId, limit = 5) {
  return this.find({ 
    userId: new mongoose.Types.ObjectId(userId), 
    isActive: true 
  })
  .sort({ usageCount: -1 })
  .limit(limit);
};

module.exports = mongoose.model('BacktestTemplate', backtestTemplateSchema);

