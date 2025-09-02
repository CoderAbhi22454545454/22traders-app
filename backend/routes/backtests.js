const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const Backtest = require('../models/Backtest');

const router = express.Router();

// Configure Multer for multiple file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 3 // Maximum 3 files (before, entry, after)
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

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (buffer, originalname, folder = 'backtests') => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: folder,
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
                mimetype: result.format ? `image/${result.format}` : 'image/jpeg',
                size: result.bytes,
                uploadDate: new Date()
              }
            });
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
};

// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
};

// Validation rules for backtest creation
const backtestValidation = [
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  body('instrument').optional().trim(),
  body('tradePair').optional().trim(),
  body('tradeNumber').optional().trim(),
  body('entryPrice').optional().isFloat({ min: 0 }).withMessage('Entry price must be a positive number'),
  body('exitPrice').optional().isFloat({ min: 0 }).withMessage('Exit price must be a positive number'),
  body('stopLoss').optional().isFloat({ min: 0 }).withMessage('Stop loss must be a positive number'),
  body('takeProfit').optional().isFloat({ min: 0 }).withMessage('Take profit must be a positive number'),
  body('pnl').optional().isNumeric().withMessage('PnL must be a number'),
  body('result').optional().isIn(['win', 'loss', 'be']).withMessage('Result must be win, loss, or be'),
  body('direction').optional().isIn(['Long', 'Short']).withMessage('Direction must be Long or Short'),
  body('lotSize').optional().isFloat({ min: 0.01 }).withMessage('Lot size must be a positive number'),
  body('confidence').optional().isInt({ min: 1, max: 10 }).withMessage('Confidence must be between 1 and 10'),
  body('marketCondition').optional().isIn(['trending', 'ranging', 'volatile', 'calm']).withMessage('Invalid market condition')
];

// GET /api/backtests - Get all backtests with filters
router.get('/', async (req, res) => {
  try {
    const { 
      userId, 
      page = 1, 
      limit = 10, 
      timeRange,
      strategy,
      pattern,
      marketCondition,
      chipName,
      chipValue
    } = req.query;
    
    const filter = {};
    if (userId) filter.userId = new mongoose.Types.ObjectId(userId);
    
    // Time range filtering
    if (timeRange) {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '1m':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3m':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      filter.date = { $gte: startDate };
    }
    
    // Pattern filtering
    if (pattern) {
      filter.patternIdentified = new RegExp(pattern, 'i');
    }
    
    // Market condition filtering
    if (marketCondition) {
      filter.marketCondition = marketCondition;
    }
    
    // Custom chip filtering
    if (chipName || chipValue) {
      const chipFilter = {};
      if (chipName) chipFilter['customChips.name'] = new RegExp(chipName, 'i');
      if (chipValue) chipFilter['customChips.value'] = new RegExp(chipValue, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push(chipFilter);
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch backtests with pagination
    const backtests = await Backtest.find(filter)
      .populate('userId', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Backtest.countDocuments(filter);

    // Calculate statistics
    const stats = await Backtest.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBacktests: { $sum: 1 },
          totalPnL: { $sum: '$pnl' },
          winningTrades: {
            $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] }
          },
          losingTrades: {
            $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] }
          },
          breakEvenTrades: {
            $sum: { $cond: [{ $eq: ['$result', 'be'] }, 1, 0] }
          },
          avgConfidence: { $avg: '$confidence' }
        }
      }
    ]);

    const statistics = stats.length > 0 ? {
      ...stats[0],
      winRate: stats[0].totalBacktests > 0 ? (stats[0].winningTrades / stats[0].totalBacktests * 100).toFixed(2) : 0
    } : {
      totalBacktests: 0,
      totalPnL: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      avgConfidence: 0
    };

    res.json({
      backtests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBacktests: total,
        hasNext: skip + backtests.length < total,
        hasPrev: parseInt(page) > 1
      },
      statistics
    });
  } catch (error) {
    console.error('Error fetching backtests:', error);
    res.status(500).json({ message: 'Error fetching backtests', error: error.message });
  }
});

// POST /api/backtests - Create new backtest
router.post('/', upload.array('screenshots', 3), backtestValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      userId, date, tradeNumber, instrument, tradePair,
      entryPrice, exitPrice, stopLoss, takeProfit, pnl,
      result, direction, lotSize, positionSize, riskReward,
      customChips, backtestNotes, patternIdentified,
      marketCondition, confidence, reasonForEntry,
      reasonForExit, whatWorked, whatDidntWork, improvementAreas,
      screenshotDescriptions, screenshotTypes
    } = req.body;

    // Parse custom chips if provided as JSON string
    let parsedChips = [];
    if (customChips) {
      try {
        parsedChips = typeof customChips === 'string' ? JSON.parse(customChips) : customChips;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid custom chips format' });
      }
    }

    // Handle multiple screenshot uploads
    const screenshots = [];
    if (req.files && req.files.length > 0) {
      try {
        const descriptions = screenshotDescriptions ? JSON.parse(screenshotDescriptions) : [];
        const types = screenshotTypes ? JSON.parse(screenshotTypes) : [];
        
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const uploadResult = await uploadToCloudinary(file.buffer, file.originalname, 'backtests');
          
          screenshots.push({
            type: types[i] || 'entry',
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            description: descriptions[i] || '',
            metadata: uploadResult.metadata
          });
        }
      } catch (uploadError) {
        console.error('Screenshot upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Error uploading screenshots', 
          error: uploadError.message 
        });
      }
    }

    // Create new backtest
    const backtest = new Backtest({
      userId,
      date: date ? new Date(date) : new Date(),
      tradeNumber,
      instrument,
      tradePair,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
      exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      pnl: pnl ? parseFloat(pnl) : undefined,
      result,
      direction,
      lotSize: lotSize ? parseFloat(lotSize) : undefined,
      positionSize,
      riskReward,
      customChips: parsedChips,
      screenshots,
      backtestNotes,
      patternIdentified,
      marketCondition,
      confidence: confidence ? parseInt(confidence) : undefined,
      reasonForEntry,
      reasonForExit,
      whatWorked,
      whatDidntWork,
      improvementAreas
    });

    const savedBacktest = await backtest.save();
    await savedBacktest.populate('userId', 'name email');

    res.status(201).json({
      message: 'Backtest created successfully',
      backtest: savedBacktest
    });
  } catch (error) {
    console.error('Error creating backtest:', error);
    res.status(500).json({ 
      message: 'Error creating backtest', 
      error: error.message 
    });
  }
});

// GET /api/backtests/chips - Get all unique chips for a user
router.get('/chips', async (req, res) => {
  try {
    const { userId, category } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const chips = await Backtest.getUniqueChips(userId, category);
    
    res.json({
      chips: chips.map(chip => ({
        name: chip._id.name,
        value: chip._id.value,
        category: chip._id.category,
        color: chip.color,
        usageCount: chip.count
      }))
    });
  } catch (error) {
    console.error('Error fetching chips:', error);
    res.status(500).json({ message: 'Error fetching chips', error: error.message });
  }
});

// GET /api/backtests/patterns - Get pattern analysis
router.get('/patterns', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const filter = { userId: new mongoose.Types.ObjectId(userId) };

    // Pattern performance analysis
    const patternStats = await Backtest.aggregate([
      { $match: filter },
      { $match: { patternIdentified: { $exists: true, $ne: null, $ne: '' } } },
      {
        $group: {
          _id: '$patternIdentified',
          totalTrades: { $sum: 1 },
          totalPnL: { $sum: '$pnl' },
          wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] } },
          avgPnL: { $avg: '$pnl' },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      { $sort: { totalPnL: -1 } }
    ]);

    // Market condition analysis
    const marketConditionStats = await Backtest.aggregate([
      { $match: filter },
      { $match: { marketCondition: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$marketCondition',
          totalTrades: { $sum: 1 },
          totalPnL: { $sum: '$pnl' },
          wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          avgPnL: { $avg: '$pnl' }
        }
      },
      { $sort: { totalPnL: -1 } }
    ]);

    // Strategy performance (from custom chips)
    const strategyStats = await Backtest.aggregate([
      { $match: filter },
      { $unwind: '$customChips' },
      { $match: { 'customChips.category': 'strategy' } },
      {
        $group: {
          _id: '$customChips.value',
          totalTrades: { $sum: 1 },
          totalPnL: { $sum: '$pnl' },
          wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          avgPnL: { $avg: '$pnl' }
        }
      },
      { $sort: { totalPnL: -1 } }
    ]);

    res.json({
      patterns: patternStats.map(p => ({
        pattern: p._id,
        totalTrades: p.totalTrades,
        totalPnL: p.totalPnL,
        winRate: p.totalTrades > 0 ? ((p.wins / p.totalTrades) * 100).toFixed(2) : 0,
        avgPnL: p.avgPnL,
        avgConfidence: p.avgConfidence
      })),
      marketConditions: marketConditionStats.map(m => ({
        condition: m._id,
        totalTrades: m.totalTrades,
        totalPnL: m.totalPnL,
        winRate: m.totalTrades > 0 ? ((m.wins / m.totalTrades) * 100).toFixed(2) : 0,
        avgPnL: m.avgPnL
      })),
      strategies: strategyStats.map(s => ({
        strategy: s._id,
        totalTrades: s.totalTrades,
        totalPnL: s.totalPnL,
        winRate: s.totalTrades > 0 ? ((s.wins / s.totalTrades) * 100).toFixed(2) : 0,
        avgPnL: s.avgPnL
      }))
    });
  } catch (error) {
    console.error('Error fetching pattern analysis:', error);
    res.status(500).json({ message: 'Error fetching pattern analysis', error: error.message });
  }
});

// GET /api/backtests/filters - Get available filter options
router.get('/filters', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const filter = { userId: new mongoose.Types.ObjectId(userId) };

    // Get unique patterns
    const patterns = await Backtest.distinct('patternIdentified', filter);
    
    // Get unique market conditions
    const marketConditions = await Backtest.distinct('marketCondition', filter);
    
    // Get unique instruments
    const instruments = await Backtest.distinct('instrument', filter);
    
    // Get chips by category
    const chipsByCategory = await Backtest.aggregate([
      { $match: filter },
      { $unwind: '$customChips' },
      {
        $group: {
          _id: {
            category: '$customChips.category',
            name: '$customChips.name',
            value: '$customChips.value'
          },
          count: { $sum: 1 },
          color: { $first: '$customChips.color' }
        }
      },
      { $sort: { '_id.category': 1, count: -1 } }
    ]);

    // Group chips by category
    const groupedChips = {};
    chipsByCategory.forEach(chip => {
      const category = chip._id.category;
      if (!groupedChips[category]) {
        groupedChips[category] = [];
      }
      groupedChips[category].push({
        name: chip._id.name,
        value: chip._id.value,
        color: chip.color,
        count: chip.count
      });
    });

    res.json({
      patterns: patterns.filter(p => p && p.trim() !== ''),
      marketConditions: marketConditions.filter(m => m),
      instruments: instruments.filter(i => i && i.trim() !== ''),
      chipsByCategory: groupedChips
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ message: 'Error fetching filter options', error: error.message });
  }
});

// GET /api/backtests/:id - Get single backtest by ID
router.get('/:id', async (req, res) => {
  try {
    const backtest = await Backtest.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!backtest) {
      return res.status(404).json({ message: 'Backtest not found' });
    }

    res.json({ backtest });
  } catch (error) {
    console.error('Error fetching backtest:', error);
    res.status(500).json({ 
      message: 'Error fetching backtest', 
      error: error.message 
    });
  }
});

// PUT /api/backtests/:id - Update backtest
router.put('/:id', upload.array('screenshots', 3), backtestValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      date, instrument, tradePair, tradeNumber, entryPrice, exitPrice,
      stopLoss, takeProfit, pnl, result, direction, lotSize,
      positionSize, riskReward, customChips, backtestNotes,
      patternIdentified, marketCondition, confidence,
      reasonForEntry, reasonForExit, whatWorked, whatDidntWork,
      improvementAreas, screenshotDescriptions, screenshotTypes,
      removeScreenshots
    } = req.body;

    // Parse custom chips if provided
    let parsedChips;
    if (customChips) {
      try {
        parsedChips = typeof customChips === 'string' ? JSON.parse(customChips) : customChips;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid custom chips format' });
      }
    }

    // Get existing backtest
    const existingBacktest = await Backtest.findById(req.params.id);
    if (!existingBacktest) {
      return res.status(404).json({ message: 'Backtest not found' });
    }

    // Handle screenshot removal if requested
    if (removeScreenshots) {
      const screenshotsToRemove = JSON.parse(removeScreenshots);
      for (const screenshotId of screenshotsToRemove) {
        const screenshot = existingBacktest.screenshots.id(screenshotId);
        if (screenshot) {
          try {
            await deleteFromCloudinary(screenshot.publicId);
          } catch (deleteError) {
            console.warn('Failed to delete screenshot from Cloudinary:', deleteError);
          }
          existingBacktest.screenshots.pull(screenshotId);
        }
      }
    }

    // Handle new screenshot uploads
    if (req.files && req.files.length > 0) {
      try {
        const descriptions = screenshotDescriptions ? JSON.parse(screenshotDescriptions) : [];
        const types = screenshotTypes ? JSON.parse(screenshotTypes) : [];
        
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const uploadResult = await uploadToCloudinary(file.buffer, file.originalname, 'backtests');
          
          existingBacktest.screenshots.push({
            type: types[i] || 'entry',
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            description: descriptions[i] || '',
            metadata: uploadResult.metadata
          });
        }
      } catch (uploadError) {
        console.error('Screenshot upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Error uploading screenshots', 
          error: uploadError.message 
        });
      }
    }

    // Update backtest data
    const updateData = {
      date: date ? new Date(date) : undefined,
      tradeNumber,
      instrument,
      tradePair,
      entryPrice: entryPrice ? parseFloat(entryPrice) : undefined,
      exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      pnl: pnl ? parseFloat(pnl) : undefined,
      result,
      direction,
      lotSize: lotSize ? parseFloat(lotSize) : undefined,
      positionSize,
      riskReward,
      backtestNotes,
      patternIdentified,
      marketCondition,
      confidence: confidence ? parseInt(confidence) : undefined,
      reasonForEntry,
      reasonForExit,
      whatWorked,
      whatDidntWork,
      improvementAreas,
      updatedAt: new Date()
    };

    if (parsedChips) {
      updateData.customChips = parsedChips;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Update the backtest
    const updatedBacktest = await Backtest.findByIdAndUpdate(
      req.params.id,
      { ...updateData, screenshots: existingBacktest.screenshots },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    res.json({
      message: 'Backtest updated successfully',
      backtest: updatedBacktest
    });
  } catch (error) {
    console.error('Error updating backtest:', error);
    res.status(500).json({ 
      message: 'Error updating backtest', 
      error: error.message 
    });
  }
});

// DELETE /api/backtests/:id - Delete backtest
router.delete('/:id', async (req, res) => {
  try {
    const backtest = await Backtest.findById(req.params.id);
    
    if (!backtest) {
      return res.status(404).json({ message: 'Backtest not found' });
    }

    // Delete all screenshots from Cloudinary
    for (const screenshot of backtest.screenshots) {
      try {
        await deleteFromCloudinary(screenshot.publicId);
      } catch (deleteError) {
        console.warn('Failed to delete screenshot from Cloudinary:', deleteError);
      }
    }

    // Delete the backtest
    await Backtest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Backtest deleted successfully' });
  } catch (error) {
    console.error('Error deleting backtest:', error);
    res.status(500).json({ 
      message: 'Error deleting backtest', 
      error: error.message 
    });
  }
});

// DELETE /api/backtests/:id/screenshots/:screenshotId - Delete specific screenshot
router.delete('/:id/screenshots/:screenshotId', async (req, res) => {
  try {
    const backtest = await Backtest.findById(req.params.id);
    
    if (!backtest) {
      return res.status(404).json({ message: 'Backtest not found' });
    }

    const screenshot = backtest.screenshots.id(req.params.screenshotId);
    if (!screenshot) {
      return res.status(404).json({ message: 'Screenshot not found' });
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(screenshot.publicId);
    } catch (deleteError) {
      console.warn('Failed to delete screenshot from Cloudinary:', deleteError);
    }

    // Remove from backtest
    backtest.screenshots.pull(req.params.screenshotId);
    await backtest.save();

    res.json({ message: 'Screenshot deleted successfully' });
  } catch (error) {
    console.error('Error deleting screenshot:', error);
    res.status(500).json({ 
      message: 'Error deleting screenshot', 
      error: error.message 
    });
  }
});

module.exports = router;
