const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const MasterCard = require('../models/MasterCard');
const Backtest = require('../models/Backtest');

const router = express.Router();

// Validation rules
const masterCardValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 200 }).withMessage('Name must be less than 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('strategy').optional().trim(),
  body('timeframe').optional().trim(),
  body('pattern').optional().trim(),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
];

// GET /api/master-cards - Get all master cards for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const masterCards = await MasterCard.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    // Get statistics for each master card
    const masterCardsWithStats = await Promise.all(
      masterCards.map(async (card) => {
        const backtests = await Backtest.find({ masterCardId: card._id });
        const masterCard = await MasterCard.findById(card._id);
        const stats = await masterCard.getStatistics();
        return {
          ...card,
          statistics: stats,
          backtestCount: backtests.length
        };
      })
    );

    res.json({
      success: true,
      masterCards: masterCardsWithStats
    });
  } catch (error) {
    console.error('Error fetching master cards:', error);
    res.status(500).json({ message: 'Error fetching master cards', error: error.message });
  }
});

// GET /api/master-cards/:id - Get single master card with backtests
router.get('/:id', async (req, res) => {
  try {
    const masterCard = await MasterCard.findById(req.params.id);
    
    if (!masterCard) {
      return res.status(404).json({ message: 'Master card not found' });
    }

    const backtests = await Backtest.find({ masterCardId: masterCard._id })
      .sort({ date: -1 })
      .lean();

    const statistics = await masterCard.getStatistics();

    res.json({
      success: true,
      masterCard: {
        ...masterCard.toObject(),
        backtests,
        statistics
      }
    });
  } catch (error) {
    console.error('Error fetching master card:', error);
    res.status(500).json({ message: 'Error fetching master card', error: error.message });
  }
});

// POST /api/master-cards - Create new master card
router.post('/', masterCardValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { userId, name, description, strategy, timeframe, pattern, color, tags } = req.body;

    const masterCard = new MasterCard({
      userId,
      name,
      description,
      strategy,
      timeframe,
      pattern,
      color: color || '#3B82F6',
      tags: tags || []
    });

    const savedMasterCard = await masterCard.save();

    res.status(201).json({
      success: true,
      message: 'Master card created successfully',
      masterCard: savedMasterCard
    });
  } catch (error) {
    console.error('Error creating master card:', error);
    res.status(500).json({ message: 'Error creating master card', error: error.message });
  }
});

// PUT /api/master-cards/:id - Update master card
router.put('/:id', masterCardValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { name, description, strategy, timeframe, pattern, color, tags } = req.body;

    const masterCard = await MasterCard.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        strategy,
        timeframe,
        pattern,
        color,
        tags,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!masterCard) {
      return res.status(404).json({ message: 'Master card not found' });
    }

    res.json({
      success: true,
      message: 'Master card updated successfully',
      masterCard
    });
  } catch (error) {
    console.error('Error updating master card:', error);
    res.status(500).json({ message: 'Error updating master card', error: error.message });
  }
});

// DELETE /api/master-cards/:id - Delete master card and all its backtests
router.delete('/:id', async (req, res) => {
  try {
    const masterCard = await MasterCard.findById(req.params.id);
    
    if (!masterCard) {
      return res.status(404).json({ message: 'Master card not found' });
    }

    // Delete all backtests in this master card
    const backtests = await Backtest.find({ masterCardId: masterCard._id });
    
    // Delete screenshots from Cloudinary for each backtest
    const cloudinary = require('../config/cloudinary');
    for (const backtest of backtests) {
      for (const screenshot of backtest.screenshots || []) {
        try {
          await cloudinary.uploader.destroy(screenshot.publicId);
        } catch (deleteError) {
          console.warn('Failed to delete screenshot from Cloudinary:', deleteError);
        }
      }
    }

    // Delete all backtests
    await Backtest.deleteMany({ masterCardId: masterCard._id });

    // Delete master card
    await MasterCard.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Master card and all associated backtests deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting master card:', error);
    res.status(500).json({ message: 'Error deleting master card', error: error.message });
  }
});

// GET /api/master-cards/:id/analytics - Get analytics for a specific master card
router.get('/:id/analytics', async (req, res) => {
  try {
    const masterCard = await MasterCard.findById(req.params.id);
    
    if (!masterCard) {
      return res.status(404).json({ message: 'Master card not found' });
    }

    const backtests = await Backtest.find({ masterCardId: masterCard._id }).sort({ date: 1 });

    if (backtests.length === 0) {
      return res.json({
        success: true,
        masterCard: masterCard.toObject(),
        analytics: {
          overview: {},
          performance: {},
          equityCurve: [],
          pnlDistribution: [],
          bestWorstTrades: { best: [], worst: [] },
          streaks: {},
          timeAnalysis: {},
          riskAnalysis: {},
          insights: []
        }
      });
    }

    // Calculate analytics (similar to comprehensive analytics)
    const totalTrades = backtests.length;
    const wins = backtests.filter(b => b.result === 'win').length;
    const losses = backtests.filter(b => b.result === 'loss').length;
    const totalPnL = backtests.reduce((sum, b) => sum + (b.pnl || 0), 0);
    const avgPnL = totalPnL / totalTrades;
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;

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

    // Equity curve
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

    // Best and worst trades
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

    // Streaks
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;
    let currentStreak = 0;
    let currentStreakType = null;

    backtests.forEach(b => {
      if (b.result === 'win') {
        tempWinStreak++;
        tempLossStreak = 0;
        if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
      } else if (b.result === 'loss') {
        tempLossStreak++;
        tempWinStreak = 0;
        if (tempLossStreak > longestLossStreak) longestLossStreak = tempLossStreak;
      }
    });

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

    // Max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    equityCurve.forEach(point => {
      if (point.cumulativePnL > peak) peak = point.cumulativePnL;
      const drawdown = peak - point.cumulativePnL;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    res.json({
      success: true,
      masterCard: masterCard.toObject(),
      analytics: {
        overview: {
          totalTrades,
          wins,
          losses,
          totalPnL,
          avgPnL: avgPnL.toFixed(2),
          winRate: winRate.toFixed(2),
          avgWin: avgWin.toFixed(2),
          avgLoss: avgLoss.toFixed(2),
          profitFactor: profitFactor.toFixed(2),
          expectancy: expectancy.toFixed(2)
        },
        equityCurve,
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
        riskAnalysis: {
          maxDrawdown: maxDrawdown.toFixed(2)
        },
        insights: []
      }
    });
  } catch (error) {
    console.error('Error fetching master card analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// GET /api/master-cards/analytics/combined - Get combined analytics for all master cards
router.get('/analytics/combined', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const masterCards = await MasterCard.find({ userId: new mongoose.Types.ObjectId(userId) });
    const allBacktests = await Backtest.find({ 
      userId: new mongoose.Types.ObjectId(userId) 
    }).sort({ date: 1 });

    if (allBacktests.length === 0) {
      return res.json({
        success: true,
        analytics: {
          overview: {},
          masterCards: [],
          combined: {}
        }
      });
    }

    // Combined statistics
    const totalTrades = allBacktests.length;
    const wins = allBacktests.filter(b => b.result === 'win').length;
    const losses = allBacktests.filter(b => b.result === 'loss').length;
    const totalPnL = allBacktests.reduce((sum, b) => sum + (b.pnl || 0), 0);
    const avgPnL = totalPnL / totalTrades;
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;

    // Per master card statistics
    const masterCardStats = await Promise.all(
      masterCards.map(async (card) => {
        const cardBacktests = await Backtest.find({ masterCardId: card._id });
        const cardWins = cardBacktests.filter(b => b.result === 'win').length;
        const cardLosses = cardBacktests.filter(b => b.result === 'loss').length;
        const cardPnL = cardBacktests.reduce((sum, b) => sum + (b.pnl || 0), 0);
        const cardWinRate = (cardWins + cardLosses) > 0 ? (cardWins / (cardWins + cardLosses)) * 100 : 0;

        return {
          id: card._id,
          name: card.name,
          strategy: card.strategy,
          timeframe: card.timeframe,
          totalTrades: cardBacktests.length,
          wins: cardWins,
          losses: cardLosses,
          totalPnL: cardPnL,
          winRate: cardWinRate.toFixed(2),
          avgPnL: cardBacktests.length > 0 ? (cardPnL / cardBacktests.length).toFixed(2) : 0
        };
      })
    );

    res.json({
      success: true,
      analytics: {
        overview: {
          totalMasterCards: masterCards.length,
          totalTrades,
          wins,
          losses,
          totalPnL: totalPnL.toFixed(2),
          avgPnL: avgPnL.toFixed(2),
          winRate: winRate.toFixed(2)
        },
        masterCards: masterCardStats.sort((a, b) => b.totalPnL - a.totalPnL),
        combined: {
          totalTrades,
          totalPnL: totalPnL.toFixed(2),
          winRate: winRate.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching combined analytics:', error);
    res.status(500).json({ message: 'Error fetching combined analytics', error: error.message });
  }
});

module.exports = router;

