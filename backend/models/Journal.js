const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  mood: {
    type: String,
    enum: ['confident', 'reflective', 'analytical', 'excited', 'calm', 'frustrated', 'neutral'],
    default: 'neutral',
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  hasDrawing: {
    type: Boolean,
    default: false
  },
  drawingData: {
    type: mongoose.Schema.Types.Mixed, // Stores canvas drawing data as JSON
    default: null
  },
  drawingImageUrl: {
    type: String, // Cloudinary URL for drawing image
    trim: true
  },
  drawingPublicId: {
    type: String, // Cloudinary public ID for deletion
    trim: true
  },
  linkedTrades: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade'
  }],
  // Trading-specific fields
  instruments: [{
    type: String,
    trim: true,
    uppercase: true
  }],
  pnl: {
    type: Number,
    default: null // Can be null if not trade-related
  },
  tradeSetups: [{
    instrument: String,
    direction: {
      type: String,
      enum: ['long', 'short']
    },
    entryPrice: Number,
    exitPrice: Number,
    stopLoss: Number,
    takeProfit: Number,
    riskReward: Number,
    lotSize: Number
  }],
  // Metadata
  wordCount: {
    type: Number,
    default: 0
  },
  characterCount: {
    type: Number,
    default: 0
  },
  readingTime: {
    type: Number, // Estimated reading time in minutes
    default: 0
  },
  // Template and category
  template: {
    type: String,
    enum: ['daily-review', 'technical-analysis', 'psychology-log', 'trade-post-mortem', 'weekly-strategy', 'market-insights', 'custom'],
    default: 'custom'
  },
  category: {
    type: String,
    enum: ['analysis', 'psychology', 'strategy', 'review', 'lesson', 'idea', 'other'],
    default: 'other',
    index: true
  },
  // Performance tracking
  views: {
    type: Number,
    default: 0
  },
  lastViewedAt: {
    type: Date,
    default: Date.now
  },
  // Version control for edits
  version: {
    type: Number,
    default: 1
  },
  editHistory: [{
    editedAt: {
      type: Date,
      default: Date.now
    },
    changes: String, // Brief description of changes
    version: Number
  }]
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
journalSchema.index({ userId: 1, createdAt: -1 });
journalSchema.index({ userId: 1, isFavorite: 1 });
journalSchema.index({ userId: 1, mood: 1 });
journalSchema.index({ userId: 1, category: 1 });
journalSchema.index({ userId: 1, tags: 1 });
journalSchema.index({ 'title': 'text', 'content': 'text', 'tags': 'text' }); // Text search

// Virtual for linked trades count
journalSchema.virtual('linkedTradesCount').get(function() {
  return this.linkedTrades ? this.linkedTrades.length : 0;
});

// Virtual for estimated reading time (200 words per minute average)
journalSchema.virtual('estimatedReadingTime').get(function() {
  return Math.max(1, Math.ceil(this.wordCount / 200));
});

// Pre-save middleware to calculate word count and reading time
journalSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Calculate word count (simple approach)
    const words = this.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0);
    this.wordCount = words.length;
    this.characterCount = this.content.length;
    this.readingTime = Math.max(1, Math.ceil(this.wordCount / 200));
    
    // Track version if content changed
    if (!this.isNew) {
      this.version += 1;
    }
  }
  next();
});

// Static methods for common queries
journalSchema.statics.findByUserId = function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = '-createdAt',
    mood,
    category,
    isFavorite,
    tags,
    search,
    dateFrom,
    dateTo
  } = options;

  let query = { userId };

  // Add filters
  if (mood) query.mood = mood;
  if (category) query.category = category;
  if (typeof isFavorite === 'boolean') query.isFavorite = isFavorite;
  if (tags && tags.length > 0) query.tags = { $in: tags };
  
  // Date range filter
  if (dateFrom || dateTo) {
    query.date = {};
    if (dateFrom) query.date.$gte = new Date(dateFrom);
    if (dateTo) query.date.$lte = new Date(dateTo);
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('linkedTrades', 'instrument date pnl result')
    .sort(sortBy)
    .skip(skip)
    .limit(limit);
};

// Static method for analytics
journalSchema.statics.getAnalytics = function(userId, dateFrom, dateTo) {
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
  
  if (dateFrom || dateTo) {
    matchStage.date = {};
    if (dateFrom) matchStage.date.$gte = new Date(dateFrom);
    if (dateTo) matchStage.date.$lte = new Date(dateTo);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        totalWords: { $sum: '$wordCount' },
        averageWords: { $avg: '$wordCount' },
        totalReadingTime: { $sum: '$readingTime' },
        favoriteEntries: { 
          $sum: { $cond: ['$isFavorite', 1, 0] } 
        },
        entriesWithDrawings: { 
          $sum: { $cond: ['$hasDrawing', 1, 0] } 
        },
        entriesWithTrades: { 
          $sum: { $cond: [{ $gt: [{ $size: '$linkedTrades' }, 0] }, 1, 0] } 
        },
        totalPnL: { $sum: '$pnl' },
        moodDistribution: {
          $push: '$mood'
        },
        categoryDistribution: {
          $push: '$category'
        },
        tagsUsed: {
          $push: '$tags'
        }
      }
    }
  ]);
};

// Method to add edit history
journalSchema.methods.addEditHistory = function(changes) {
  this.editHistory.push({
    changes,
    version: this.version,
    editedAt: new Date()
  });
  
  // Keep only last 10 edit history entries
  if (this.editHistory.length > 10) {
    this.editHistory = this.editHistory.slice(-10);
  }
};

// Export the model
module.exports = mongoose.model('Journal', journalSchema); 