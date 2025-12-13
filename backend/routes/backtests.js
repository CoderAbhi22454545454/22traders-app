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
  body('masterCardId').notEmpty().withMessage('Master Card ID is required').isMongoId().withMessage('Invalid Master Card ID'),
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
      masterCardId,
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
    if (masterCardId) filter.masterCardId = new mongoose.Types.ObjectId(masterCardId);
    
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
      userId, masterCardId, date, tradeNumber, instrument, tradePair,
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
      masterCardId,
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

// GET /api/backtests/analytics/comprehensive - Get comprehensive analytics
router.get('/analytics/comprehensive', async (req, res) => {
  try {
    const { userId, dateFrom, dateTo, timeRange, pattern, marketCondition, result, minConfidence, maxConfidence } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    } else if (timeRange) {
      // Handle timeRange filter
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
          startDate = null;
      }
      
      if (startDate) {
        filter.date = { $gte: startDate };
      }
    }
    
    // Additional filters
    if (pattern) filter.patternIdentified = new RegExp(pattern, 'i');
    if (marketCondition) filter.marketCondition = marketCondition;
    if (result) filter.result = result;
    if (minConfidence || maxConfidence) {
      filter.confidence = {};
      if (minConfidence) filter.confidence.$gte = parseInt(minConfidence);
      if (maxConfidence) filter.confidence.$lte = parseInt(maxConfidence);
    }

    // Get all backtests for analysis
    const backtests = await Backtest.find(filter).sort({ date: 1 });

    if (backtests.length === 0) {
      return res.json({
        overview: {},
        performance: {},
        patterns: [],
        timeAnalysis: {},
        riskAnalysis: {},
        equityCurve: [],
        pnlDistribution: [],
        bestWorstTrades: { best: [], worst: [] },
        streaks: {},
        insights: []
      });
    }

    // Calculate overview statistics
    const totalTrades = backtests.length;
    const wins = backtests.filter(b => b.result === 'win').length;
    const losses = backtests.filter(b => b.result === 'loss').length;
    const breakEven = backtests.filter(b => b.result === 'be').length;
    const totalPnL = backtests.reduce((sum, b) => sum + (b.pnl || 0), 0);
    const avgPnL = totalPnL / totalTrades;
    const winRate = (wins / totalTrades) * 100;
    
    const winningTrades = backtests.filter(b => b.result === 'win');
    const losingTrades = backtests.filter(b => b.result === 'loss');
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, b) => sum + (b.pnl || 0), 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, b) => sum + (b.pnl || 0), 0) / losingTrades.length)
      : 0;
    
    const profitFactor = avgLoss > 0 ? (avgWin * wins) / (avgLoss * losses) : 0;
    const expectancy = (winRate / 100 * avgWin) - ((100 - winRate) / 100 * avgLoss);
    
    const avgConfidence = backtests
      .filter(b => b.confidence)
      .reduce((sum, b) => sum + (b.confidence || 0), 0) / backtests.filter(b => b.confidence).length || 0;

    // Equity curve (cumulative P&L)
    let cumulativePnL = 0;
    const equityCurve = backtests.map((b, index) => {
      cumulativePnL += (b.pnl || 0);
      return {
        date: b.date,
        pnl: b.pnl || 0,
        cumulativePnL: cumulativePnL,
        tradeNumber: index + 1
      };
    });

    // P&L Distribution (for histogram)
    const pnlRanges = {
      'Very Large Loss': 0, // < -500
      'Large Loss': 0,     // -500 to -200
      'Medium Loss': 0,    // -200 to -50
      'Small Loss': 0,     // -50 to 0
      'Small Win': 0,      // 0 to 50
      'Medium Win': 0,     // 50 to 200
      'Large Win': 0,      // 200 to 500
      'Very Large Win': 0  // > 500
    };
    
    backtests.forEach(b => {
      const pnl = b.pnl || 0;
      if (pnl < -500) pnlRanges['Very Large Loss']++;
      else if (pnl < -200) pnlRanges['Large Loss']++;
      else if (pnl < -50) pnlRanges['Medium Loss']++;
      else if (pnl < 0) pnlRanges['Small Loss']++;
      else if (pnl < 50) pnlRanges['Small Win']++;
      else if (pnl < 200) pnlRanges['Medium Win']++;
      else if (pnl < 500) pnlRanges['Large Win']++;
      else pnlRanges['Very Large Win']++;
    });

    const pnlDistribution = Object.entries(pnlRanges).map(([range, count]) => ({
      range,
      count,
      percentage: (count / totalTrades) * 100
    }));

    // Best and Worst Trades
    const sortedByPnL = [...backtests].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
    const bestTrades = sortedByPnL.slice(0, 5).map(b => ({
      id: b._id,
      date: b.date,
      pnl: b.pnl || 0,
      pattern: b.patternIdentified,
      marketCondition: b.marketCondition,
      confidence: b.confidence,
      tradePair: b.tradePair || b.instrument
    }));
    const worstTrades = sortedByPnL.slice(-5).reverse().map(b => ({
      id: b._id,
      date: b.date,
      pnl: b.pnl || 0,
      pattern: b.patternIdentified,
      marketCondition: b.marketCondition,
      confidence: b.confidence,
      tradePair: b.tradePair || b.instrument
    }));

    // Streak Analysis
    let currentStreak = 0;
    let currentStreakType = null;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;
    
    backtests.forEach(b => {
      if (b.result === 'win') {
        tempWinStreak++;
        tempLossStreak = 0;
        if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
      } else if (b.result === 'loss') {
        tempLossStreak++;
        tempWinStreak = 0;
        if (tempLossStreak > longestLossStreak) longestLossStreak = tempLossStreak;
      } else {
        tempWinStreak = 0;
        tempLossStreak = 0;
      }
    });
    
    // Current streak
    const lastTrade = backtests[backtests.length - 1];
    if (lastTrade) {
      for (let i = backtests.length - 1; i >= 0; i--) {
        if (backtests[i].result === lastTrade.result) {
          currentStreak++;
          currentStreakType = lastTrade.result;
        } else {
          break;
        }
      }
    }

    // Pattern Performance
    const patternPerformance = await Backtest.aggregate([
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
    ]).limit(10);

    // Time-based Analysis
    const timeAnalysis = {
      byHour: {},
      byDayOfWeek: {},
      byMonth: {}
    };
    
    backtests.forEach(b => {
      const date = new Date(b.date);
      const hour = date.getHours();
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const month = date.getMonth();
      
      // By hour
      if (!timeAnalysis.byHour[hour]) {
        timeAnalysis.byHour[hour] = { trades: 0, wins: 0, pnl: 0 };
      }
      timeAnalysis.byHour[hour].trades++;
      if (b.result === 'win') timeAnalysis.byHour[hour].wins++;
      timeAnalysis.byHour[hour].pnl += (b.pnl || 0);
      
      // By day of week
      if (!timeAnalysis.byDayOfWeek[dayOfWeek]) {
        timeAnalysis.byDayOfWeek[dayOfWeek] = { trades: 0, wins: 0, pnl: 0 };
      }
      timeAnalysis.byDayOfWeek[dayOfWeek].trades++;
      if (b.result === 'win') timeAnalysis.byDayOfWeek[dayOfWeek].wins++;
      timeAnalysis.byDayOfWeek[dayOfWeek].pnl += (b.pnl || 0);
      
      // By month
      if (!timeAnalysis.byMonth[month]) {
        timeAnalysis.byMonth[month] = { trades: 0, wins: 0, pnl: 0 };
      }
      timeAnalysis.byMonth[month].trades++;
      if (b.result === 'win') timeAnalysis.byMonth[month].wins++;
      timeAnalysis.byMonth[month].pnl += (b.pnl || 0);
    });

    // Risk Analysis
    const tradesWithRR = backtests.filter(b => b.riskReward);
    const riskRewardRatios = tradesWithRR.map(b => {
      const rr = b.riskReward.split(':');
      return rr.length === 2 ? parseFloat(rr[1]) / parseFloat(rr[0]) : null;
    }).filter(rr => rr !== null);
    
    const avgRiskReward = riskRewardRatios.length > 0
      ? riskRewardRatios.reduce((sum, rr) => sum + rr, 0) / riskRewardRatios.length
      : 0;

    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    equityCurve.forEach(point => {
      if (point.cumulativePnL > peak) peak = point.cumulativePnL;
      const drawdown = peak - point.cumulativePnL;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Generate Insights
    const insights = [];
    
    // Best pattern insight
    if (patternPerformance.length > 0) {
      const bestPattern = patternPerformance[0];
      insights.push({
        type: 'success',
        title: 'Best Performing Pattern',
        message: `${bestPattern._id} has ${bestPattern.wins}/${bestPattern.totalTrades} wins (${((bestPattern.wins / bestPattern.totalTrades) * 100).toFixed(1)}% win rate) with $${bestPattern.totalPnL.toFixed(2)} total P&L`
      });
    }
    
    // Win rate insight
    if (winRate >= 60) {
      insights.push({
        type: 'success',
        title: 'Excellent Win Rate',
        message: `Your win rate of ${winRate.toFixed(1)}% is above average. Keep up the good work!`
      });
    } else if (winRate < 40) {
      insights.push({
        type: 'warning',
        title: 'Low Win Rate',
        message: `Your win rate of ${winRate.toFixed(1)}% is below average. Consider reviewing your entry criteria.`
      });
    }
    
    // Confidence insight
    if (avgConfidence > 0) {
      const highConfidenceTrades = backtests.filter(b => b.confidence && b.confidence >= 7);
      const highConfWins = highConfidenceTrades.filter(b => b.result === 'win').length;
      const highConfWinRate = highConfidenceTrades.length > 0 
        ? (highConfWins / highConfidenceTrades.length) * 100 
        : 0;
      
      if (highConfWinRate > winRate + 10) {
        insights.push({
          type: 'info',
          title: 'Confidence Matters',
          message: `Trades with confidence ≥7 have ${highConfWinRate.toFixed(1)}% win rate vs ${winRate.toFixed(1)}% overall. Trust your high-confidence setups!`
        });
      }
    }

    res.json({
      overview: {
        totalTrades,
        wins,
        losses,
        breakEven,
        totalPnL,
        avgPnL,
        winRate: winRate.toFixed(2),
        avgWin,
        avgLoss,
        profitFactor: profitFactor.toFixed(2),
        expectancy: expectancy.toFixed(2),
        avgConfidence: avgConfidence.toFixed(1)
      },
      performance: {
        patternPerformance: patternPerformance.map(p => ({
          pattern: p._id,
          totalTrades: p.totalTrades,
          totalPnL: p.totalPnL,
          winRate: p.totalTrades > 0 ? ((p.wins / p.totalTrades) * 100).toFixed(2) : 0,
          avgPnL: p.avgPnL,
          avgConfidence: p.avgConfidence
        }))
      },
      equityCurve,
      pnlDistribution,
      bestWorstTrades: {
        best: bestTrades,
        worst: worstTrades
      },
      streaks: {
        current: currentStreak,
        currentType: currentStreakType,
        longestWin: longestWinStreak,
        longestLoss: longestLossStreak
      },
      timeAnalysis: {
        byHour: Object.entries(timeAnalysis.byHour).map(([hour, data]) => ({
          hour: parseInt(hour),
          trades: data.trades,
          wins: data.wins,
          winRate: data.trades > 0 ? ((data.wins / data.trades) * 100).toFixed(1) : 0,
          pnl: data.pnl
        })),
        byDayOfWeek: Object.entries(timeAnalysis.byDayOfWeek).map(([day, data]) => ({
          day: parseInt(day),
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)],
          trades: data.trades,
          wins: data.wins,
          winRate: data.trades > 0 ? ((data.wins / data.trades) * 100).toFixed(1) : 0,
          pnl: data.pnl
        })),
        byMonth: Object.entries(timeAnalysis.byMonth).map(([month, data]) => ({
          month: parseInt(month),
          monthName: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(month)],
          trades: data.trades,
          wins: data.wins,
          winRate: data.trades > 0 ? ((data.wins / data.trades) * 100).toFixed(1) : 0,
          pnl: data.pnl
        }))
      },
      riskAnalysis: {
        avgRiskReward: avgRiskReward.toFixed(2),
        maxDrawdown: maxDrawdown.toFixed(2),
        totalRisk: maxDrawdown,
        recoveryFactor: maxDrawdown > 0 ? (totalPnL / maxDrawdown).toFixed(2) : 0
      },
      insights
    });
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// GET /api/backtests/export/csv - Export backtests to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const { userId, dateFrom, dateTo, pattern, marketCondition, result } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.date.$lte = endDate;
      }
    }
    
    if (pattern) filter.patternIdentified = new RegExp(pattern, 'i');
    if (marketCondition) filter.marketCondition = marketCondition;
    if (result) filter.result = result;

    const backtests = await Backtest.find(filter).sort({ date: -1 });

    // Generate CSV
    const headers = [
      'Date', 'Trade Number', 'Instrument', 'Direction', 'Entry Price', 'Exit Price',
      'Stop Loss', 'Take Profit', 'P&L', 'Result', 'Lot Size', 'Risk:Reward',
      'Pattern', 'Market Condition', 'Confidence', 'Reason for Entry', 'Reason for Exit',
      'What Worked', 'What Didn\'t Work', 'Improvement Areas', 'Notes'
    ];
    
    const rows = backtests.map(b => [
      new Date(b.date).toISOString().split('T')[0],
      b.tradeNumber || '',
      b.tradePair || b.instrument || '',
      b.direction || '',
      b.entryPrice || '',
      b.exitPrice || '',
      b.stopLoss || '',
      b.takeProfit || '',
      b.pnl || 0,
      b.result || '',
      b.lotSize || '',
      b.riskReward || '',
      b.patternIdentified || '',
      b.marketCondition || '',
      b.confidence || '',
      b.reasonForEntry || '',
      b.reasonForExit || '',
      b.whatWorked || '',
      b.whatDidntWork || '',
      b.improvementAreas || '',
      b.backtestNotes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        const str = String(cell || '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=backtests_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ message: 'Error exporting CSV', error: error.message });
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

// Validation rules for backtest update (masterCardId is optional)
const backtestUpdateValidation = [
  body('masterCardId').optional().isMongoId().withMessage('Invalid Master Card ID'),
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
  body('positionSize').optional().trim(),
  body('riskReward').optional().isFloat({ min: 0 }).withMessage('Risk/Reward must be a positive number'),
  body('patternIdentified').optional().trim(),
  body('marketCondition').optional().trim(),
  body('confidence').optional().isInt({ min: 1, max: 10 }).withMessage('Confidence must be between 1 and 10'),
  body('reasonForEntry').optional().trim(),
  body('reasonForExit').optional().trim(),
  body('whatWorked').optional().trim(),
  body('whatDidntWork').optional().trim(),
  body('improvementAreas').optional().trim(),
  body('backtestNotes').optional().trim()
];

// PUT /api/backtests/:id - Update backtest
router.put('/:id', upload.array('screenshots', 3), backtestUpdateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      masterCardId, date, instrument, tradePair, tradeNumber, entryPrice, exitPrice,
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
      ...(masterCardId && { masterCardId }),
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
