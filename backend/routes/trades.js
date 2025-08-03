const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const Trade = require('../models/Trade');

const router = express.Router();

// Configure Multer for memory storage with better limits
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for Cloudinary
  },
  fileFilter: (req, file, cb) => {
    // Allow common image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
    }
  }
});

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (buffer, originalname) => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'trade-journal', // Organize uploads in a folder
          use_filename: true,
          unique_filename: true,
          quality: 'auto'
          // Removed format: 'auto' as it's causing transformation errors
          // Cloudinary will automatically choose the best format
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
                uploadDate: new Date(),
                cloudinaryUrl: result.secure_url,
                cloudinaryPublicId: result.public_id
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

// Validation rules for trade creation
const tradeValidation = [
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  // Keep both old and new field names for compatibility
  body('instrument').optional().trim(),
  body('tradePair').optional().trim(),
  body('tradeNumber').optional().trim(),
  body('entryPrice').optional().isFloat({ min: 0 }).withMessage('Entry price must be a positive number'),
  body('exitPrice').optional().isFloat({ min: 0 }).withMessage('Exit price must be a positive number'),
  body('stopLoss').optional().isFloat({ min: 0 }).withMessage('Stop loss must be a positive number'),
  body('takeProfit').optional().isFloat({ min: 0 }).withMessage('Take profit must be a positive number'),
  body('pnl').optional().isNumeric().withMessage('PnL must be a number'),
  body('pipes').optional().trim().isLength({ max: 10 }).withMessage('Pipes must be less than 10 characters'),
  body('isBacktest').optional().isBoolean().withMessage('isBacktest must be a boolean'),
  body('result').optional().isIn(['win', 'loss', 'be']).withMessage('Result must be win, loss, or be'),
  body('tradeOutcome').optional().isIn(['Win', 'Loss', 'Break Even']).withMessage('Trade outcome must be Win, Loss, or Break Even'),
  body('direction').optional().isIn(['Long', 'Short']).withMessage('Direction must be Long or Short'),
  body('lotSize').optional().isFloat({ min: 0.01 }).withMessage('Lot size must be a positive number (minimum 0.01)'),
  body('positionSize').optional().trim(),
  body('riskReward').optional().trim(),
  body('strategy').optional().trim(),
  body('session').optional().isIn(['London', 'NY', 'Asian', 'Overlap']).withMessage('Session must be London, NY, Asian, or Overlap'),
  body('tradeDuration').optional().trim(),
  body('executionScore').optional().isInt({ min: 1, max: 10 }).withMessage('Execution score must be between 1 and 10'),
  body('emotions').optional().isLength({ max: 500 }).withMessage('Emotions must be less than 500 characters'),
  body('reasonForTrade').optional().isLength({ max: 1000 }).withMessage('Reason for trade must be less than 1000 characters'),
  body('lessonLearned').optional().isLength({ max: 1000 }).withMessage('Lesson learned must be less than 1000 characters'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
  body('additionalNotes').optional().isLength({ max: 1000 }).withMessage('Additional notes must be less than 1000 characters')
];

// GET /api/trades - Get all trades with optional filters
router.get('/', async (req, res) => {
  try {
    const { date, instrument, userId, page = 1, limit = 10, timeRange, tradeType } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (userId) filter.userId = new mongoose.Types.ObjectId(userId);
    
    // Add backtest filtering
    if (tradeType === 'real') {
      filter.isBacktest = { $ne: true };
    } else if (tradeType === 'backtest') {
      filter.isBacktest = true;
    }
    // If tradeType is not specified, show all trades
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    } else if (timeRange) {
      // Add time range filtering (same logic as stats endpoint)
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '7d':
        case '1w':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '10d':
          startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
          break;
        case '1m':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '2m':
          startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
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
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      filter.date = { $gte: startDate };
    }
    if (instrument) filter.instrument = new RegExp(instrument, 'i');

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch trades with pagination
    const trades = await Trade.find(filter)
      .populate('userId', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Trade.countDocuments(filter);

    // Calculate statistics
    const stats = await Trade.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          totalPnL: { $sum: '$pnl' },
          winningTrades: {
            $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] }
          },
          losingTrades: {
            $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] }
          },
          breakEvenTrades: {
            $sum: { $cond: [{ $eq: ['$result', 'be'] }, 1, 0] }
          }
        }
      }
    ]);

    const statistics = stats.length > 0 ? {
      ...stats[0],
      winRate: stats[0].totalTrades > 0 ? (stats[0].winningTrades / stats[0].totalTrades * 100).toFixed(2) : 0
    } : {
      totalTrades: 0,
      totalPnL: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0
    };

    res.json({
      trades,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTrades: total,
        hasNext: skip + trades.length < total,
        hasPrev: parseInt(page) > 1
      },
      statistics
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ message: 'Error fetching trades', error: error.message });
  }
});

// GET /api/trades/count - Get total trade count for auto-filling trade number
router.get('/count', async (req, res) => {
  try {
    const { userId, tradeType } = req.query;
    const filter = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
    
    // Add backtest filtering
    if (tradeType === 'real') {
      filter.isBacktest = { $ne: true };
    } else if (tradeType === 'backtest') {
      filter.isBacktest = true;
    }
    
    const count = await Trade.countDocuments(filter);
    
    res.json({
      count: count,
      nextTradeNumber: count + 1
    });
  } catch (error) {
    console.error('Error fetching trade count:', error);
    res.status(500).json({ 
      message: 'Error fetching trade count', 
      error: error.message 
    });
  }
});

// POST /api/trades - Add a new trade entry
router.post('/', upload.single('screenshot'), tradeValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      userId,
      date,
      instrument,
      tradePair,
      tradeNumber,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      pnl,
      pipes,
      isBacktest,
      result,
      tradeOutcome,
      direction,
      lotSize,
      positionSize,
      riskReward,
      strategy,
      session,
      tradeDuration,
      executionScore,
      emotions,
      reasonForTrade,
      lessonLearned,
      notes,
      additionalNotes
    } = req.body;

    // Upload screenshot if provided
    let screenshotUrl = '';
    let screenshotPublicId = '';
    let screenshotMetadata = {};
    if (req.file) {
      try {
        // Upload image to Cloudinary
        const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);

        screenshotUrl = uploadResult.url;
        screenshotPublicId = uploadResult.publicId;
        screenshotMetadata = uploadResult.metadata;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Error uploading screenshot to Cloudinary', 
          error: uploadError.message 
        });
      }
    }

    // Create new trade
    const trade = new Trade({
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
      pipes: pipes !== undefined ? pipes.toString() : '0',
      isBacktest: isBacktest === true || isBacktest === 'true',
      result,
      tradeOutcome,
      direction,
      lotSize: lotSize ? parseFloat(lotSize) : undefined,
      positionSize,
      riskReward,
      strategy,
      session,
      tradeDuration,
      executionScore: executionScore ? parseInt(executionScore) : undefined,
      emotions,
      reasonForTrade,
      lessonLearned,
      notes,
      additionalNotes,
      screenshotUrl,
      screenshotPublicId,
      screenshotMetadata
    });

    const savedTrade = await trade.save();
    await savedTrade.populate('userId', 'name email');

    res.status(201).json({
      message: 'Trade created successfully',
      trade: savedTrade
    });
  } catch (error) {
    console.error('Error creating trade:', error);
    res.status(500).json({ 
      message: 'Error creating trade', 
      error: error.message 
    });
  }
});

// GET /api/trades/dates - Get all dates that have trades (for calendar indicators)
router.get('/dates', async (req, res) => {
  try {
    const { userId, tradeType } = req.query;
    const filter = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
    
    // Add backtest filtering
    if (tradeType === 'real') {
      filter.isBacktest = { $ne: true };
    } else if (tradeType === 'backtest') {
      filter.isBacktest = true;
    }

    const dates = await Trade.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(dates.map(d => ({ date: d._id, count: d.count })));
  } catch (error) {
    console.error('Error fetching trade dates:', error);
    res.status(500).json({ 
      message: 'Error fetching trade dates', 
      error: error.message 
    });
  }
});

// GET /api/trades/stats - Get comprehensive trading statistics
router.get('/stats', async (req, res) => {
  try {
    const { userId, timeRange, tradeType } = req.query;
    const filter = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
    
    // Add backtest filtering
    if (tradeType === 'real') {
      filter.isBacktest = { $ne: true };
    } else if (tradeType === 'backtest') {
      filter.isBacktest = true;
    }
    // If tradeType is not specified, show all trades
    
    // Add time range filtering
    if (timeRange) {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '7d':
        case '1w':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '10d':
          startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
          break;
        case '1m':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '2m':
          startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
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
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      filter.date = { $gte: startDate };
    }

    // Basic statistics
    const basicStats = await Trade.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          totalPnL: { $sum: '$pnl' },
          totalWins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          totalLosses: { $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] } },
          totalBreakEven: { $sum: { $cond: [{ $eq: ['$result', 'be'] }, 1, 0] } },
          avgExecutionScore: { $avg: '$executionScore' },
          bestDay: { $max: '$pnl' },
          worstDay: { $min: '$pnl' },
          avgPnL: { $avg: '$pnl' }
        }
      }
    ]);

    // Strategy performance
    const strategyStats = await Trade.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$strategy',
          trades: { $sum: 1 },
          totalPnL: { $sum: '$pnl' },
          wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] } },
          avgPnL: { $avg: '$pnl' }
        }
      },
      { $sort: { totalPnL: -1 } }
    ]);

    // Session performance
    const sessionStats = await Trade.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$session',
          trades: { $sum: 1 },
          totalPnL: { $sum: '$pnl' },
          wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          avgPnL: { $avg: '$pnl' }
        }
      },
      { $sort: { totalPnL: -1 } }
    ]);

    // Instrument performance
    const instrumentStats = await Trade.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$instrument',
          trades: { $sum: 1 },
          totalPnL: { $sum: '$pnl' },
          wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
          avgPnL: { $avg: '$pnl' }
        }
      },
      { $sort: { totalPnL: -1 } }
    ]);

    // Monthly PnL
    const monthlyPnL = await Trade.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalPnL: { $sum: '$pnl' },
          trades: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Win/Loss streaks calculation
    const allTrades = await Trade.find(filter)
      .sort({ date: 1, createdAt: 1 })
      .select('result');

    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentStreakType = null;

    allTrades.forEach(trade => {
      if (trade.result === currentStreakType) {
        currentStreak++;
      } else {
        if (currentStreakType === 'win') {
          maxWinStreak = Math.max(maxWinStreak, currentStreak);
        } else if (currentStreakType === 'loss') {
          maxLossStreak = Math.max(maxLossStreak, currentStreak);
        }
        currentStreak = 1;
        currentStreakType = trade.result;
      }
    });

    // Handle final streak
    if (currentStreakType === 'win') {
      maxWinStreak = Math.max(maxWinStreak, currentStreak);
    } else if (currentStreakType === 'loss') {
      maxLossStreak = Math.max(maxLossStreak, currentStreak);
    }

    const stats = basicStats[0] || {
      totalTrades: 0,
      totalPnL: 0,
      totalWins: 0,
      totalLosses: 0,
      totalBreakEven: 0,
      avgExecutionScore: 0,
      bestDay: 0,
      worstDay: 0,
      avgPnL: 0
    };

    // Calculate additional metrics
    const winRate = stats.totalTrades > 0 ? ((stats.totalWins / stats.totalTrades) * 100).toFixed(2) : 0;
    const avgRiskReward = stats.totalLosses > 0 ? 
      (Math.abs(stats.totalPnL / stats.totalWins) / Math.abs(stats.totalPnL / stats.totalLosses)).toFixed(2) : 0;

    // Find best and worst strategies
    const bestStrategy = strategyStats.length > 0 ? strategyStats[0]._id : 'N/A';
    const worstStrategy = strategyStats.length > 0 ? strategyStats[strategyStats.length - 1]._id : 'N/A';

    // Find best and worst instruments
    const bestInstrument = instrumentStats.length > 0 ? instrumentStats[0]._id : 'N/A';
    const worstInstrument = instrumentStats.length > 0 ? instrumentStats[instrumentStats.length - 1]._id : 'N/A';

    res.json({
      overview: {
        totalTrades: stats.totalTrades,
        winRate: parseFloat(winRate),
        avgRiskReward: parseFloat(avgRiskReward),
        totalPnL: stats.totalPnL,
        avgPnL: stats.avgPnL,
        avgExecutionScore: stats.avgExecutionScore || 0,
        bestDay: stats.bestDay,
        worstDay: stats.worstDay,
        bestStrategy,
        worstStrategy,
        bestInstrument,
        worstInstrument,
        maxWinStreak,
        maxLossStreak
      },
      breakdown: {
        wins: stats.totalWins,
        losses: stats.totalLosses,
        breakEven: stats.totalBreakEven
      },
      strategies: strategyStats.map(s => ({
        name: s._id,
        trades: s.trades,
        totalPnL: s.totalPnL,
        winRate: s.trades > 0 ? ((s.wins / s.trades) * 100).toFixed(2) : 0,
        avgPnL: s.avgPnL
      })),
      sessions: sessionStats.map(s => ({
        name: s._id,
        trades: s.trades,
        totalPnL: s.totalPnL,
        winRate: s.trades > 0 ? ((s.wins / s.trades) * 100).toFixed(2) : 0,
        avgPnL: s.avgPnL
      })),
      instruments: instrumentStats.map(i => ({
        name: i._id,
        trades: i.trades,
        totalPnL: i.totalPnL,
        winRate: i.trades > 0 ? ((i.wins / i.trades) * 100).toFixed(2) : 0,
        avgPnL: i.avgPnL
      })),
      monthlyData: monthlyPnL.map(m => ({
        month: `${m._id.year}-${m._id.month.toString().padStart(2, '0')}`,
        pnl: m.totalPnL,
        trades: m.trades,
        winRate: m.trades > 0 ? ((m.wins / m.trades) * 100).toFixed(2) : 0
      }))
    });
  } catch (error) {
    console.error('Error fetching trading statistics:', error);
    res.status(500).json({ 
      message: 'Error fetching trading statistics', 
      error: error.message 
    });
  }
});

// GET /api/trades/:id - Get single trade by ID
router.get('/:id', async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    res.json({ trade });
  } catch (error) {
    console.error('Error fetching trade:', error);
    res.status(500).json({ 
      message: 'Error fetching trade', 
      error: error.message 
    });
  }
});

// PUT /api/trades/:id - Update trade
router.put('/:id', upload.single('screenshot'), tradeValidation, async (req, res) => {
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
      stopLoss, takeProfit, pnl, pipes, isBacktest, result, tradeOutcome, direction, lotSize,
      positionSize, riskReward, strategy, session, tradeDuration,
      executionScore, emotions, reasonForTrade, lessonLearned, notes, additionalNotes
    } = req.body;

    // Upload new screenshot if provided
    let screenshotUrl;
    let screenshotPublicId;
    let screenshotMetadata;
    if (req.file) {
      try {
        // Delete old screenshot from Cloudinary if exists
        const existingTrade = await Trade.findById(req.params.id);
        if (existingTrade && existingTrade.screenshotPublicId) {
          try {
            await deleteFromCloudinary(existingTrade.screenshotPublicId);
          } catch (deleteError) {
            console.warn('Failed to delete old screenshot from Cloudinary:', deleteError);
          }
        }

        // Upload new image to Cloudinary
        const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);

        screenshotUrl = uploadResult.url;
        screenshotPublicId = uploadResult.publicId;
        screenshotMetadata = uploadResult.metadata;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ 
          message: 'Error uploading screenshot to Cloudinary', 
          error: uploadError.message 
        });
      }
    }

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
      pipes: pipes !== undefined ? pipes.toString() : undefined,
      isBacktest: isBacktest !== undefined ? (isBacktest === true || isBacktest === 'true') : undefined,
      result,
      tradeOutcome,
      direction,
      lotSize: lotSize ? parseFloat(lotSize) : undefined,
      positionSize,
      riskReward,
      strategy,
      session,
      tradeDuration,
      executionScore: executionScore ? parseInt(executionScore) : undefined,
      emotions,
      reasonForTrade,
      lessonLearned,
      notes,
      additionalNotes
    };

    // Remove undefined values to avoid overwriting existing data with undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Only update screenshot if new one provided
    if (screenshotUrl) {
      updateData.screenshotUrl = screenshotUrl;
      updateData.screenshotPublicId = screenshotPublicId;
      updateData.screenshotMetadata = screenshotMetadata;
    }

    const trade = await Trade.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    res.json({
      message: 'Trade updated successfully',
      trade
    });
  } catch (error) {
    console.error('Error updating trade:', error);
    res.status(500).json({ 
      message: 'Error updating trade', 
      error: error.message 
    });
  }
});

// DELETE /api/trades/:id/screenshot - Delete trade screenshot
router.delete('/:id/screenshot', async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    if (!trade.screenshotUrl) {
      return res.status(404).json({ message: 'No screenshot found for this trade' });
    }

    // Delete image from Cloudinary if publicId exists
    if (trade.screenshotPublicId) {
      try {
        await deleteFromCloudinary(trade.screenshotPublicId);
      } catch (deleteError) {
        console.warn('Failed to delete screenshot from Cloudinary:', deleteError);
      }
    }

    // Remove screenshot data from trade
    trade.screenshotUrl = undefined;
    trade.screenshotPublicId = undefined;
    trade.screenshotMetadata = undefined;
    await trade.save();

    res.json({ message: 'Screenshot deleted successfully' });
  } catch (error) {
    console.error('Error deleting screenshot:', error);
    res.status(500).json({ 
      message: 'Error deleting screenshot', 
      error: error.message 
    });
  }
});

// DELETE /api/trades/:id - Delete trade
router.delete('/:id', async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    
    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    // Delete image from Cloudinary if publicId exists
    if (trade.screenshotPublicId) {
      try {
        await deleteFromCloudinary(trade.screenshotPublicId);
      } catch (deleteError) {
        console.warn('Failed to delete screenshot from Cloudinary:', deleteError);
      }
    }

    // Delete the trade
    await Trade.findByIdAndDelete(req.params.id);

    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Error deleting trade:', error);
    res.status(500).json({ 
      message: 'Error deleting trade', 
      error: error.message 
    });
  }
});

module.exports = router; 