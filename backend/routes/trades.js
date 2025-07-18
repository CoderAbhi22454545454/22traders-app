const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Trade = require('../models/Trade');

const router = express.Router();

// Configure Multer for memory storage with better limits
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit (Base64 increases size by ~33%)
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

// Helper function to convert image buffer to Base64
const convertToBase64 = (buffer, mimetype) => {
  try {
    const base64 = buffer.toString('base64');
    return `data:${mimetype};base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to convert image to Base64: ${error.message}`);
  }
};

// Helper function to compress image (optional - for better performance)
const compressImage = async (buffer, mimetype) => {
  try {
    // For now, we'll just return the original buffer
    // You can add image compression libraries like 'sharp' later if needed
    return buffer;
  } catch (error) {
    console.error('Image compression failed:', error);
    return buffer; // Return original if compression fails
  }
};

// Helper function to get image metadata
const getImageMetadata = (buffer, mimetype, originalname) => {
  return {
    filename: originalname,
    mimetype: mimetype,
    size: buffer.length,
    uploadDate: new Date()
  };
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
    const { date, instrument, userId, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (userId) filter.userId = new mongoose.Types.ObjectId(userId);
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
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
    const { userId } = req.query;
    const filter = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
    
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
    let screenshotMetadata = {};
    if (req.file) {
      try {
        // Convert image to Base64 and get metadata
        const compressedBuffer = await compressImage(req.file.buffer, req.file.mimetype);
        const base64Image = convertToBase64(compressedBuffer, req.file.mimetype);
        const metadata = getImageMetadata(compressedBuffer, req.file.mimetype, req.file.originalname);

        screenshotUrl = base64Image;
        screenshotMetadata = metadata;
      } catch (uploadError) {
        console.error('Base64 conversion error:', uploadError);
        return res.status(500).json({ 
          message: 'Error processing screenshot', 
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
    const { userId } = req.query;
    const filter = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};

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
    const { userId } = req.query;
    const filter = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};

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
      stopLoss, takeProfit, pnl, result, tradeOutcome, direction, lotSize,
      positionSize, riskReward, strategy, session, tradeDuration,
      executionScore, emotions, reasonForTrade, lessonLearned, notes, additionalNotes
    } = req.body;

    // Upload new screenshot if provided
    let screenshotUrl;
    let screenshotMetadata;
    if (req.file) {
      try {
        // Convert image to Base64 and get metadata
        const compressedBuffer = await compressImage(req.file.buffer, req.file.mimetype);
        const base64Image = convertToBase64(compressedBuffer, req.file.mimetype);
        const metadata = getImageMetadata(compressedBuffer, req.file.mimetype, req.file.originalname);

        screenshotUrl = base64Image;
        screenshotMetadata = metadata;
      } catch (uploadError) {
        console.error('Base64 conversion error:', uploadError);
        return res.status(500).json({ 
          message: 'Error processing screenshot', 
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

    // For Base64 storage, we don't need to delete from external service
    // The image data is stored directly in MongoDB and will be removed with the trade

    // Remove screenshot data from trade
    trade.screenshotUrl = undefined;
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

    // For Base64 storage, we don't need to delete from external service
    // The image data is stored directly in MongoDB and will be removed with the trade

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