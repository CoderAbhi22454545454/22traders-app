const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'fundamental', 'risk-management', 'psychology', 'execution', 'custom'],
    default: 'custom'
  },
  inputType: {
    type: String,
    enum: ['checkbox', 'text', 'number', 'select', 'radio'],
    default: 'checkbox'
  },
  options: [{
    label: String,
    value: String
  }],
  validationRules: {
    minValue: Number,
    maxValue: Number,
    required: Boolean,
    pattern: String
  }
});

const tradeChecklistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  items: [checklistItemSchema],
  totalSteps: {
    type: Number,
    default: 0
  },
  requiredSteps: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['scalping', 'day-trading', 'swing-trading', 'position-trading', 'custom'],
    default: 'custom'
  },
  instruments: [{
    type: String,
    trim: true,
    uppercase: true
  }],
  strategies: [{
    type: String,
    trim: true
  }],
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
tradeChecklistSchema.index({ userId: 1, isActive: 1 });
tradeChecklistSchema.index({ userId: 1, isDefault: 1 });
tradeChecklistSchema.index({ userId: 1, category: 1 });

// Pre-save middleware to update totalSteps and requiredSteps
tradeChecklistSchema.pre('save', function(next) {
  this.totalSteps = this.items.length;
  this.requiredSteps = this.items.filter(item => item.isRequired).length;
  this.updatedAt = new Date();
  next();
});

// Static method to get default checklist for user
tradeChecklistSchema.statics.getDefaultChecklist = function(userId) {
  return this.findOne({ userId, isDefault: true, isActive: true });
};

// Static method to get checklists by category
tradeChecklistSchema.statics.getByCategory = function(userId, category) {
  return this.find({ userId, category, isActive: true }).sort({ name: 1 });
};

// Method to duplicate checklist
tradeChecklistSchema.methods.duplicate = function() {
  const duplicated = new this.constructor({
    userId: this.userId,
    name: `${this.name} (Copy)`,
    description: this.description,
    items: this.items,
    category: this.category,
    instruments: this.instruments,
    strategies: this.strategies,
    isDefault: false
  });
  return duplicated.save();
};

module.exports = mongoose.model('TradeChecklist', tradeChecklistSchema); 