const mongoose = require('mongoose');

const checklistItemResultSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Can be string, number, boolean, etc.
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  completedAt: {
    type: Date,
    default: null
  },
  order: {
    type: Number,
    required: true
  }
});

const tradeChecklistResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tradeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade',
    required: true,
    index: true
  },
  checklistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeChecklist',
    required: true,
    index: true
  },
  checklistName: {
    type: String,
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  totalItems: {
    type: Number,
    default: 0
  },
  completedItems: {
    type: Number,
    default: 0
  },
  requiredItemsCompleted: {
    type: Number,
    default: 0
  },
  totalRequiredItems: {
    type: Number,
    default: 0
  },
  items: [checklistItemResultSchema],
  overallNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  qualityScore: {
    type: Number,
    min: 1,
    max: 10,
    default: null
  },
  setupQuality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'terrible'],
    default: null
  },
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

// Indexes for better query performance
tradeChecklistResultSchema.index({ userId: 1, tradeId: 1 });
tradeChecklistResultSchema.index({ userId: 1, checklistId: 1 });
tradeChecklistResultSchema.index({ userId: 1, isCompleted: 1 });
tradeChecklistResultSchema.index({ userId: 1, startedAt: -1 });

// Pre-save middleware to calculate completion metrics
tradeChecklistResultSchema.pre('save', function(next) {
  this.totalItems = this.items.length;
  this.completedItems = this.items.filter(item => item.isCompleted).length;
  this.totalRequiredItems = this.items.filter(item => 
    this.checklistId && this.checklistId.items && 
    this.checklistId.items.find(cItem => cItem._id.toString() === item.itemId.toString())?.isRequired
  ).length;
  this.requiredItemsCompleted = this.items.filter(item => {
    const checklistItem = this.checklistId && this.checklistId.items && 
      this.checklistId.items.find(cItem => cItem._id.toString() === item.itemId.toString());
    return item.isCompleted && checklistItem?.isRequired;
  }).length;
  
  this.completionPercentage = this.totalItems > 0 ? 
    Math.round((this.completedItems / this.totalItems) * 100) : 0;
  
  this.isCompleted = this.completedItems === this.totalItems;
  
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  this.updatedAt = new Date();
  next();
});

// Virtual for quality assessment
tradeChecklistResultSchema.virtual('qualityAssessment').get(function() {
  if (this.completionPercentage >= 90 && this.requiredItemsCompleted === this.totalRequiredItems) {
    return 'excellent';
  } else if (this.completionPercentage >= 75 && this.requiredItemsCompleted === this.totalRequiredItems) {
    return 'good';
  } else if (this.completionPercentage >= 60) {
    return 'fair';
  } else if (this.completionPercentage >= 40) {
    return 'poor';
  } else {
    return 'terrible';
  }
});

// Static method to get checklist results for a trade
tradeChecklistResultSchema.statics.getByTradeId = function(tradeId) {
  return this.findOne({ tradeId })
    .populate('checklistId')
    .populate('tradeId', 'instrument date pnl result');
};

// Static method to get all checklist results for a user
tradeChecklistResultSchema.statics.getByUserId = function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    isCompleted,
    checklistId,
    dateFrom,
    dateTo,
    sortBy = '-startedAt'
  } = options;

  let query = { userId };

  if (typeof isCompleted === 'boolean') {
    query.isCompleted = isCompleted;
  }
  if (checklistId) {
    query.checklistId = checklistId;
  }
  if (dateFrom || dateTo) {
    query.startedAt = {};
    if (dateFrom) query.startedAt.$gte = new Date(dateFrom);
    if (dateTo) query.startedAt.$lte = new Date(dateTo);
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('checklistId', 'name category')
    .populate('tradeId', 'instrument date pnl result')
    .sort(sortBy)
    .skip(skip)
    .limit(limit);
};

// Method to add item result
tradeChecklistResultSchema.methods.addItemResult = function(itemId, isCompleted, value = null, notes = '') {
  const existingItem = this.items.find(item => item.itemId.toString() === itemId.toString());
  
  if (existingItem) {
    existingItem.isCompleted = isCompleted;
    existingItem.value = value;
    existingItem.notes = notes;
    existingItem.completedAt = isCompleted ? new Date() : null;
  } else {
    this.items.push({
      itemId,
      isCompleted,
      value,
      notes,
      completedAt: isCompleted ? new Date() : null,
      order: this.items.length + 1
    });
  }
  
  return this.save();
};

// Method to complete checklist
tradeChecklistResultSchema.methods.complete = function(overallNotes = '', qualityScore = null) {
  this.isCompleted = true;
  this.completedAt = new Date();
  this.overallNotes = overallNotes;
  this.qualityScore = qualityScore;
  
  // Auto-assess setup quality based on completion
  if (this.completionPercentage >= 90 && this.requiredItemsCompleted === this.totalRequiredItems) {
    this.setupQuality = 'excellent';
  } else if (this.completionPercentage >= 75 && this.requiredItemsCompleted === this.totalRequiredItems) {
    this.setupQuality = 'good';
  } else if (this.completionPercentage >= 60) {
    this.setupQuality = 'fair';
  } else if (this.completionPercentage >= 40) {
    this.setupQuality = 'poor';
  } else {
    this.setupQuality = 'terrible';
  }
  
  return this.save();
};

module.exports = mongoose.model('TradeChecklistResult', tradeChecklistResultSchema); 