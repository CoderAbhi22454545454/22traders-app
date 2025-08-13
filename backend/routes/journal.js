const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const Journal = require('../models/Journal');
const Trade = require('../models/Trade');

const router = express.Router();

// Configure Multer for drawing image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
    }
  }
});

// Helper function to upload drawing to Cloudinary
const uploadDrawingToCloudinary = async (buffer, originalname) => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'journal-drawings',
          use_filename: true,
          unique_filename: true,
          quality: 'auto'
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              metadata: {
                filename: originalname,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes
              }
            });
          }
        }
      );
      buffer && cloudinary.uploader.upload_stream({ 
        resource_type: 'image',
        folder: 'journal-drawings' 
      }).end(buffer);
    });
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Validation middleware for journal entries
const validateJournalEntry = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('mood')
    .optional()
    .isIn(['confident', 'reflective', 'analytical', 'excited', 'calm', 'frustrated', 'neutral'])
    .withMessage('Invalid mood value'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('isFavorite')
    .optional()
    .isBoolean()
    .withMessage('isFavorite must be a boolean'),
  body('linkedTrades')
    .optional()
    .isArray()
    .withMessage('linkedTrades must be an array of trade IDs'),
  body('linkedTrades.*')
    .optional()
    .isMongoId()
    .withMessage('Each linkedTrade must be a valid MongoDB ObjectId'),
  body('pnl')
    .optional()
    .isNumeric()
    .withMessage('PnL must be a number'),
  body('category')
    .optional()
    .isIn(['analysis', 'psychology', 'strategy', 'review', 'lesson', 'idea', 'other'])
    .withMessage('Invalid category value'),
  body('template')
    .optional()
    .isIn(['daily-review', 'technical-analysis', 'psychology-log', 'trade-post-mortem', 'weekly-strategy', 'market-insights', 'custom'])
    .withMessage('Invalid template value')
];

// GET /api/journal - Get all journal entries for a user with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      userId,
      page = 1,
      limit = 120,
      sortBy = '-createdAt',
      mood,
      category,
      isFavorite,
      tags,
      search,
      dateFrom,
      dateTo,
      hasDrawing,
      template
    } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid userId format' 
      });
    }

    // Build query options
    const options = {
      limit: Math.min(parseInt(limit), 1000), // Increased max limit to 1000 entries
      sortBy
    };
    
    // Only add page if it's provided (for pagination)
    if (page) {
      options.page = parseInt(page);
    }

    // Add filters
    if (mood) options.mood = mood;
    if (category) options.category = category;
    if (isFavorite === 'true') options.isFavorite = true;
    if (isFavorite === 'false') options.isFavorite = false;
    if (tags) options.tags = Array.isArray(tags) ? tags : [tags];
    if (search) options.search = search;
    if (dateFrom) options.dateFrom = dateFrom;
    if (dateTo) options.dateTo = dateTo;
    if (template) options.template = template;

    // Get entries
    const entries = await Journal.findByUserId(userId, options);
    
    // Get total count for pagination
    let countQuery = { userId: new mongoose.Types.ObjectId(userId) };
    if (mood) countQuery.mood = mood;
    if (category) countQuery.category = category;
    if (typeof options.isFavorite === 'boolean') countQuery.isFavorite = options.isFavorite;
    if (options.tags && options.tags.length > 0) countQuery.tags = { $in: options.tags };
    if (hasDrawing === 'true') countQuery.hasDrawing = true;
    if (template) countQuery.template = template;
    
    // Date range filter for count
    if (dateFrom || dateTo) {
      countQuery.date = {};
      if (dateFrom) countQuery.date.$gte = new Date(dateFrom);
      if (dateTo) countQuery.date.$lte = new Date(dateTo);
    }

    // Text search for count
    if (search) {
      countQuery.$text = { $search: search };
    }

    const totalEntries = await Journal.countDocuments(countQuery);
    
    // Only include pagination if page is specified
    const responseData = {
      success: true,
      data: {
        entries
      }
    };
    
    if (options.page) {
      const totalPages = Math.ceil(totalEntries / options.limit);
      responseData.data.pagination = {
        currentPage: options.page,
        totalPages,
        totalEntries,
        limit: options.limit,
        hasNext: options.page < totalPages,
        hasPrev: options.page > 1
      };
    } else {
      // If no pagination, include total count
      responseData.data.totalEntries = totalEntries;
    }

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch journal entries',
      error: error.message 
    });
  }
});

// GET /api/journal/analytics - Get journal analytics for a user
router.get('/analytics', async (req, res) => {
  try {
    const { userId, dateFrom, dateTo } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid userId format' 
      });
    }

    const analytics = await Journal.getAnalytics(userId, dateFrom, dateTo);
    
    if (!analytics || analytics.length === 0) {
      return res.json({
        success: true,
        data: {
          totalEntries: 0,
          totalWords: 0,
          averageWords: 0,
          totalReadingTime: 0,
          favoriteEntries: 0,
          entriesWithDrawings: 0,
          entriesWithTrades: 0,
          totalPnL: 0,
          moodDistribution: {},
          categoryDistribution: {},
          topTags: []
        }
      });
    }

    const result = analytics[0];
    
    // Process mood distribution
    const moodCounts = {};
    result.moodDistribution.forEach(mood => {
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });

    // Process category distribution
    const categoryCounts = {};
    result.categoryDistribution.forEach(category => {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Process top tags
    const tagCounts = {};
    result.tagsUsed.flat().forEach(tag => {
      if (tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    });
    
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      success: true,
      data: {
        totalEntries: result.totalEntries || 0,
        totalWords: result.totalWords || 0,
        averageWords: Math.round(result.averageWords || 0),
        totalReadingTime: result.totalReadingTime || 0,
        favoriteEntries: result.favoriteEntries || 0,
        entriesWithDrawings: result.entriesWithDrawings || 0,
        entriesWithTrades: result.entriesWithTrades || 0,
        totalPnL: result.totalPnL || 0,
        moodDistribution: moodCounts,
        categoryDistribution: categoryCounts,
        topTags
      }
    });

  } catch (error) {
    console.error('Error fetching journal analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics',
      error: error.message 
    });
  }
});

// GET /api/journal/tags - Get all unique tags for a user
router.get('/tags', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid userId format' 
      });
    }

    const tags = await Journal.distinct('tags', { 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    res.json({
      success: true,
      data: tags.filter(tag => tag && tag.length > 0).sort()
    });

  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tags',
      error: error.message 
    });
  }
});

// GET /api/journal/:id - Get a specific journal entry
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid entry ID format' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    const entry = await Journal.findOne({ 
      _id: id, 
      userId: new mongoose.Types.ObjectId(userId) 
    }).populate('linkedTrades', 'instrument date pnl result direction lotSize');

    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Journal entry not found' 
      });
    }

    // Update view count and last viewed date
    entry.views += 1;
    entry.lastViewedAt = new Date();
    await entry.save();

    res.json({
      success: true,
      data: entry
    });

  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch journal entry',
      error: error.message 
    });
  }
});

// POST /api/journal - Create a new journal entry
router.post('/', validateJournalEntry, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      userId,
      title,
      content,
      date,
      mood = 'neutral',
      tags = [],
      isFavorite = false,
      linkedTrades = [],
      pnl = null,
      category = 'other',
      template = 'custom',
      hasDrawing = false,
      drawingData = null,
      instruments = [],
      tradeSetups = []
    } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid userId format' 
      });
    }

    // Verify linked trades exist and belong to the user
    if (linkedTrades.length > 0) {
      const trades = await Trade.find({
        _id: { $in: linkedTrades },
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (trades.length !== linkedTrades.length) {
        return res.status(400).json({
          success: false,
          message: 'Some linked trades do not exist or do not belong to this user'
        });
      }
    }

    // Create journal entry
    const journalEntry = new Journal({
      userId: new mongoose.Types.ObjectId(userId),
      title,
      content,
      date: date ? new Date(date) : new Date(),
      mood,
      tags: tags.map(tag => tag.toLowerCase().trim()).filter(tag => tag.length > 0),
      isFavorite,
      linkedTrades: linkedTrades.map(id => new mongoose.Types.ObjectId(id)),
      pnl: pnl !== null ? parseFloat(pnl) : null,
      category,
      template,
      hasDrawing,
      drawingData,
      instruments: instruments.map(instrument => instrument.toUpperCase().trim()),
      tradeSetups
    });

    const savedEntry = await journalEntry.save();
    
    // Populate linked trades for response
    await savedEntry.populate('linkedTrades', 'instrument date pnl result direction lotSize');

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      data: savedEntry
    });

  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create journal entry',
      error: error.message 
    });
  }
});

// PUT /api/journal/:id - Update a journal entry
router.put('/:id', validateJournalEntry, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { userId, ...updateData } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid entry ID format' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    // Find existing entry
    const existingEntry = await Journal.findOne({ 
      _id: id, 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    if (!existingEntry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Journal entry not found' 
      });
    }

    // Verify linked trades if provided
    if (updateData.linkedTrades && updateData.linkedTrades.length > 0) {
      const trades = await Trade.find({
        _id: { $in: updateData.linkedTrades },
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (trades.length !== updateData.linkedTrades.length) {
        return res.status(400).json({
          success: false,
          message: 'Some linked trades do not exist or do not belong to this user'
        });
      }

      updateData.linkedTrades = updateData.linkedTrades.map(id => new mongoose.Types.ObjectId(id));
    }

    // Process tags
    if (updateData.tags) {
      updateData.tags = updateData.tags.map(tag => tag.toLowerCase().trim()).filter(tag => tag.length > 0);
    }

    // Process instruments
    if (updateData.instruments) {
      updateData.instruments = updateData.instruments.map(instrument => instrument.toUpperCase().trim());
    }

    // Convert pnl to number if provided
    if (updateData.pnl !== undefined && updateData.pnl !== null) {
      updateData.pnl = parseFloat(updateData.pnl);
    }

    // Add edit history
    const changes = Object.keys(updateData).join(', ');
    existingEntry.addEditHistory(`Updated: ${changes}`);

    // Update the entry
    Object.assign(existingEntry, updateData);
    const updatedEntry = await existingEntry.save();
    
    // Populate linked trades for response
    await updatedEntry.populate('linkedTrades', 'instrument date pnl result direction lotSize');

    res.json({
      success: true,
      message: 'Journal entry updated successfully',
      data: updatedEntry
    });

  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update journal entry',
      error: error.message 
    });
  }
});

// POST /api/journal/:id/drawing - Upload drawing image for journal entry
router.post('/:id/drawing', upload.single('drawing'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid entry ID format' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Drawing image file is required' 
      });
    }

    // Find the journal entry
    const entry = await Journal.findOne({ 
      _id: id, 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Journal entry not found' 
      });
    }

    // Delete old drawing from Cloudinary if exists
    if (entry.drawingPublicId) {
      try {
        await cloudinary.uploader.destroy(entry.drawingPublicId);
      } catch (deleteError) {
        console.warn('Failed to delete old drawing from Cloudinary:', deleteError.message);
      }
    }

    // Upload new drawing to Cloudinary
    const uploadResult = await uploadDrawingToCloudinary(req.file.buffer, req.file.originalname);

    // Update journal entry
    entry.drawingImageUrl = uploadResult.url;
    entry.drawingPublicId = uploadResult.publicId;
    entry.hasDrawing = true;
    
    if (req.body.drawingData) {
      try {
        entry.drawingData = JSON.parse(req.body.drawingData);
      } catch (parseError) {
        console.warn('Failed to parse drawing data:', parseError.message);
      }
    }

    await entry.save();

    res.json({
      success: true,
      message: 'Drawing uploaded successfully',
      data: {
        drawingImageUrl: uploadResult.url,
        metadata: uploadResult.metadata
      }
    });

  } catch (error) {
    console.error('Error uploading drawing:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload drawing',
      error: error.message 
    });
  }
});

// DELETE /api/journal/:id - Delete a journal entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid entry ID format' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    const entry = await Journal.findOne({ 
      _id: id, 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Journal entry not found' 
      });
    }

    // Delete drawing from Cloudinary if exists
    if (entry.drawingPublicId) {
      try {
        await cloudinary.uploader.destroy(entry.drawingPublicId);
      } catch (deleteError) {
        console.warn('Failed to delete drawing from Cloudinary:', deleteError.message);
      }
    }

    // Delete the entry
    await Journal.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete journal entry',
      error: error.message 
    });
  }
});

// PATCH /api/journal/:id/favorite - Toggle favorite status
router.patch('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid entry ID format' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    const entry = await Journal.findOne({ 
      _id: id, 
      userId: new mongoose.Types.ObjectId(userId) 
    });

    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Journal entry not found' 
      });
    }

    entry.isFavorite = !entry.isFavorite;
    await entry.save();

    res.json({
      success: true,
      message: `Journal entry ${entry.isFavorite ? 'added to' : 'removed from'} favorites`,
      data: { isFavorite: entry.isFavorite }
    });

  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle favorite status',
      error: error.message 
    });
  }
});

// GET /api/journal/search/:query - Search journal entries
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { userId, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId is required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid userId format' 
      });
    }

    const searchResults = await Journal.find({
      userId: new mongoose.Types.ObjectId(userId),
      $text: { $search: query }
    })
    .select('title content date mood tags isFavorite hasDrawing createdAt')
    .limit(parseInt(limit))
    .sort({ score: { $meta: 'textScore' } });

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    console.error('Error searching journal entries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search journal entries',
      error: error.message 
    });
  }
});

module.exports = router; 