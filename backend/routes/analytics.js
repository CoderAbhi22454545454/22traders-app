const express = require('express');
const mongoose = require('mongoose');
const Trade = require('../models/Trade');

const router = express.Router();

// GET /api/analytics/comprehensive - Get comprehensive analytics with filters
router.get('/comprehensive', async (req, res) => {
  try {
    const {
      userId,
      dateFrom,
      dateTo,
      instrument,
      strategy,
      session,
      direction,
      tradeType
    } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    // Build filter
    const filter = { userId: new mongoose.Types.ObjectId(userId) };

    // Date range filter
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    // Other filters
    if (instrument) filter.instrument = instrument;
    if (strategy) filter.strategy = strategy;
    if (session) filter.session = session;
    if (direction) filter.direction = direction;
    
    // Trade type filter
    if (tradeType === 'real') {
      filter.isBacktest = { $ne: true };
    } else if (tradeType === 'backtest') {
      filter.isBacktest = true;
    }

    // Fetch all trades matching filter
    const trades = await Trade.find(filter).sort({ date: 1 });

    if (trades.length === 0) {
      return res.json(getEmptyAnalytics());
    }

    // Calculate all analytics
    const analytics = {
      overview: calculateOverview(trades),
      equity: calculateEquityCurve(trades),
      monthly: calculateMonthlyPnL(trades),
      weekly: calculateWeeklyPnL(trades),
      daily: calculateDailyPnL(trades),
      sessions: calculateSessionPerformance(trades),
      instruments: calculateInstrumentPerformance(trades),
      strategies: calculateStrategyPerformance(trades),
      rrDistribution: calculateRRDistribution(trades),
      rMultiples: calculateRMultiples(trades),
      executionScores: calculateExecutionScores(trades),
      streaks: calculateStreaks(trades),
      drawdown: calculateDrawdown(trades),
      filters: getAvailableFilters(trades),
      // NEW ADVANCED FEATURES
      advancedRiskMetrics: calculateAdvancedRiskMetrics(trades),
      timeOfDay: calculateTimeOfDayPerformance(trades),
      dayOfWeek: calculateDayOfWeekPerformance(trades),
      insights: generateInsights(trades),
      benchmarks: calculateBenchmarks(trades),
      correlations: calculateCorrelations(trades),
      hourlyHeatmap: calculateHourlyHeatmap(trades)
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Helper function: Calculate overview metrics
function calculateOverview(trades) {
  const totalTrades = trades.length;
  
  // Helper to get result status (handles both 'result' and 'tradeOutcome' fields)
  const getResult = (trade) => (trade.result || trade.tradeOutcome || '').toLowerCase();
  
  const winningTrades = trades.filter(t => getResult(t) === 'win').length;
  const losingTrades = trades.filter(t => getResult(t) === 'loss').length;
  const breakEvenTrades = trades.filter(t => getResult(t) === 'be' || getResult(t) === 'break even').length;

  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const avgPnL = totalPnL / totalTrades;

  const winningPnL = trades.filter(t => getResult(t) === 'win').reduce((sum, t) => sum + (t.pnl || 0), 0);
  const losingPnL = Math.abs(trades.filter(t => getResult(t) === 'loss').reduce((sum, t) => sum + (t.pnl || 0), 0));

  const avgWin = winningTrades > 0 ? winningPnL / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? losingPnL / losingTrades : 0;

  const winRate = (winningTrades + losingTrades) > 0 ? (winningTrades / (winningTrades + losingTrades)) * 100 : 0;
  const profitFactor = losingPnL > 0 ? winningPnL / losingPnL : 0;
  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;

  const avgExecutionScore = trades.reduce((sum, t) => sum + (t.executionScore || 0), 0) / totalTrades;

  const bestTrade = Math.max(...trades.map(t => t.pnl || 0), 0);
  const worstTrade = Math.min(...trades.map(t => t.pnl || 0), 0);

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakEvenTrades,
    winRate: parseFloat(winRate.toFixed(2)),
    totalPnL: parseFloat(totalPnL.toFixed(2)),
    avgPnL: parseFloat(avgPnL.toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    payoffRatio: parseFloat(payoffRatio.toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    avgExecutionScore: parseFloat(avgExecutionScore.toFixed(2)),
    bestTrade: parseFloat(bestTrade.toFixed(2)),
    worstTrade: parseFloat(worstTrade.toFixed(2))
  };
}

// Helper function: Calculate equity curve
function calculateEquityCurve(trades) {
  let cumulative = 0;
  return trades.map(trade => {
    cumulative += trade.pnl || 0;
    return {
      date: trade.date,
      cumulative: parseFloat(cumulative.toFixed(2)),
      pnl: trade.pnl || 0
    };
  });
}

// Helper function: Calculate monthly P&L
function calculateMonthlyPnL(trades) {
  const monthly = {};
  const getResult = (trade) => (trade.result || trade.tradeOutcome || '').toLowerCase();

  trades.forEach(trade => {
    const date = new Date(trade.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthly[key]) {
      monthly[key] = {
        month: key,
        pnl: 0,
        trades: 0,
        wins: 0,
        losses: 0
      };
    }

    monthly[key].pnl += trade.pnl || 0;
    monthly[key].trades++;
    if (getResult(trade) === 'win') monthly[key].wins++;
    if (getResult(trade) === 'loss') monthly[key].losses++;
  });

  return Object.values(monthly)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({
      ...m,
      pnl: parseFloat(m.pnl.toFixed(2)),
      winRate: (m.wins + m.losses) > 0 ? parseFloat(((m.wins / (m.wins + m.losses)) * 100).toFixed(2)) : 0
    }));
}

// Helper function: Calculate weekly P&L
function calculateWeeklyPnL(trades) {
  const weekly = {};
  const getResult = (trade) => (trade.result || trade.tradeOutcome || '').toLowerCase();

  trades.forEach(trade => {
    const date = new Date(trade.date);
    const weekNumber = getWeekNumber(date);
    const key = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
    
    if (!weekly[key]) {
      weekly[key] = {
        week: key,
        pnl: 0,
        trades: 0,
        wins: 0,
        losses: 0
      };
    }

    weekly[key].pnl += trade.pnl || 0;
    weekly[key].trades++;
    if (getResult(trade) === 'win') weekly[key].wins++;
    if (getResult(trade) === 'loss') weekly[key].losses++;
  });

  return Object.values(weekly)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12) // Last 12 weeks
    .map(w => ({
      ...w,
      pnl: parseFloat(w.pnl.toFixed(2)),
      winRate: (w.wins + w.losses) > 0 ? parseFloat(((w.wins / (w.wins + w.losses)) * 100).toFixed(2)) : 0
    }));
}

// Helper function: Calculate daily P&L
function calculateDailyPnL(trades) {
  const daily = {};

  trades.forEach(trade => {
    const key = new Date(trade.date).toISOString().split('T')[0];
    
    if (!daily[key]) {
      daily[key] = {
        date: key,
        pnl: 0,
        trades: 0
      };
    }

    daily[key].pnl += trade.pnl || 0;
    daily[key].trades++;
  });

  return Object.values(daily)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      pnl: parseFloat(d.pnl.toFixed(2))
    }));
}

// Helper function: Calculate session performance
function calculateSessionPerformance(trades) {
  const sessions = {};
  const getResult = (trade) => (trade.result || trade.tradeOutcome || '').toLowerCase();

  trades.forEach(trade => {
    const session = trade.session || 'Unknown';
    
    if (!sessions[session]) {
      sessions[session] = {
        session,
        trades: 0,
        wins: 0,
        losses: 0,
        pnl: 0
      };
    }

    sessions[session].trades++;
    sessions[session].pnl += trade.pnl || 0;
    if (getResult(trade) === 'win') sessions[session].wins++;
    if (getResult(trade) === 'loss') sessions[session].losses++;
  });

  return Object.values(sessions).map(s => ({
    ...s,
    pnl: parseFloat(s.pnl.toFixed(2)),
    winRate: (s.wins + s.losses) > 0 ? parseFloat(((s.wins / (s.wins + s.losses)) * 100).toFixed(2)) : 0,
    avgPnL: s.trades > 0 ? parseFloat((s.pnl / s.trades).toFixed(2)) : 0
  }));
}

// Helper function: Calculate instrument performance
function calculateInstrumentPerformance(trades) {
  const instruments = {};
  const getResult = (trade) => (trade.result || trade.tradeOutcome || '').toLowerCase();

  trades.forEach(trade => {
    const instrument = trade.instrument || trade.tradePair || 'Unknown';
    
    if (!instruments[instrument]) {
      instruments[instrument] = {
        instrument,
        trades: 0,
        wins: 0,
        losses: 0,
        pnl: 0
      };
    }

    instruments[instrument].trades++;
    instruments[instrument].pnl += trade.pnl || 0;
    if (getResult(trade) === 'win') instruments[instrument].wins++;
    if (getResult(trade) === 'loss') instruments[instrument].losses++;
  });

  return Object.values(instruments)
    .map(i => ({
      ...i,
      pnl: parseFloat(i.pnl.toFixed(2)),
      winRate: (i.wins + i.losses) > 0 ? parseFloat(((i.wins / (i.wins + i.losses)) * 100).toFixed(2)) : 0,
      avgPnL: i.trades > 0 ? parseFloat((i.pnl / i.trades).toFixed(2)) : 0
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

// Helper function: Calculate strategy performance
function calculateStrategyPerformance(trades) {
  const strategies = {};

  trades.forEach(trade => {
    const strategy = trade.strategy || 'Unknown';
    
    if (!strategies[strategy]) {
      strategies[strategy] = {
        strategy,
        trades: 0,
        wins: 0,
        losses: 0,
        pnl: 0
      };
    }

    strategies[strategy].trades++;
    strategies[strategy].pnl += trade.pnl || 0;
    
    // Handle both 'result' and 'tradeOutcome' fields (case insensitive)
    const result = (trade.result || trade.tradeOutcome || '').toLowerCase();
    if (result === 'win') strategies[strategy].wins++;
    if (result === 'loss') strategies[strategy].losses++;
  });

  return Object.values(strategies)
    .map(s => ({
      ...s,
      pnl: parseFloat(s.pnl.toFixed(2)),
      winRate: (s.wins + s.losses) > 0 ? parseFloat(((s.wins / (s.wins + s.losses)) * 100).toFixed(2)) : 0,
      avgPnL: s.trades > 0 ? parseFloat((s.pnl / s.trades).toFixed(2)) : 0
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

// Helper function: Calculate RR distribution
function calculateRRDistribution(trades) {
  const distribution = {};
  const getResult = (trade) => (trade.result || trade.tradeOutcome || '').toLowerCase();

  trades.forEach(trade => {
    if (!trade.riskReward) return;

    const rr = parseFloat(trade.riskReward);
    let bucket;

    if (rr < 1) bucket = '< 1:1';
    else if (rr < 2) bucket = '1:1 - 2:1';
    else if (rr < 3) bucket = '2:1 - 3:1';
    else if (rr < 5) bucket = '3:1 - 5:1';
    else bucket = '> 5:1';

    if (!distribution[bucket]) {
      distribution[bucket] = {
        range: bucket,
        count: 0,
        wins: 0,
        pnl: 0
      };
    }

    distribution[bucket].count++;
    distribution[bucket].pnl += trade.pnl || 0;
    if (getResult(trade) === 'win') distribution[bucket].wins++;
  });

  const order = ['< 1:1', '1:1 - 2:1', '2:1 - 3:1', '3:1 - 5:1', '> 5:1'];
  return order
    .filter(key => distribution[key])
    .map(key => {
      const losses = distribution[key].count - distribution[key].wins;
      return {
      ...distribution[key],
      pnl: parseFloat(distribution[key].pnl.toFixed(2)),
        winRate: (distribution[key].wins + losses) > 0 ? parseFloat(((distribution[key].wins / (distribution[key].wins + losses)) * 100).toFixed(2)) : 0
      };
    });
}

// Helper function: Calculate R-multiples
function calculateRMultiples(trades) {
  const multiples = {};

  trades.forEach(trade => {
    const pnl = trade.pnl || 0;
    let bucket;

    if (pnl < -200) bucket = '< -2R';
    else if (pnl < -100) bucket = '-2R to -1R';
    else if (pnl < 0) bucket = '-1R to 0R';
    else if (pnl < 100) bucket = '0R to 1R';
    else if (pnl < 200) bucket = '1R to 2R';
    else if (pnl < 300) bucket = '2R to 3R';
    else bucket = '> 3R';

    if (!multiples[bucket]) {
      multiples[bucket] = {
        range: bucket,
        count: 0,
        totalPnL: 0
      };
    }

    multiples[bucket].count++;
    multiples[bucket].totalPnL += pnl;
  });

  const order = ['< -2R', '-2R to -1R', '-1R to 0R', '0R to 1R', '1R to 2R', '2R to 3R', '> 3R'];
  return order
    .filter(key => multiples[key])
    .map(key => ({
      ...multiples[key],
      totalPnL: parseFloat(multiples[key].totalPnL.toFixed(2))
    }));
}

// Helper function: Calculate execution scores over time
function calculateExecutionScores(trades) {
  // Filter trades that have execution scores and map with their actual trade numbers
  const tradesWithScores = trades
    .map((trade, index) => ({
      tradeNumber: index + 1,
      date: trade.date,
      score: trade.executionScore || null,
      pnl: trade.pnl || 0
    }))
    .filter(t => t.score !== null && t.score > 0);

  return tradesWithScores;
}

// Helper function: Calculate streaks
function calculateStreaks(trades) {
  const getResult = (trade) => (trade.result || trade.tradeOutcome || '').toLowerCase();
  
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  let maxWinStreakPnL = 0;
  let maxLossStreakPnL = 0;
  let currentWinStreakPnL = 0;
  let currentLossStreakPnL = 0;

  trades.forEach(trade => {
    const result = getResult(trade);
    
    if (result === 'win') {
      currentWinStreak++;
      currentWinStreakPnL += trade.pnl || 0;
      currentLossStreak = 0;
      currentLossStreakPnL = 0;

      if (currentWinStreak > maxWinStreak) {
        maxWinStreak = currentWinStreak;
        maxWinStreakPnL = currentWinStreakPnL;
      }
    } else if (result === 'loss') {
      currentLossStreak++;
      currentLossStreakPnL += Math.abs(trade.pnl || 0);
      currentWinStreak = 0;
      currentWinStreakPnL = 0;

      if (currentLossStreak > maxLossStreak) {
        maxLossStreak = currentLossStreak;
        maxLossStreakPnL = currentLossStreakPnL;
      }
    }
  });

  return {
    maxWinStreak,
    maxWinStreakPnL: parseFloat(maxWinStreakPnL.toFixed(2)),
    maxLossStreak,
    maxLossStreakPnL: parseFloat(maxLossStreakPnL.toFixed(2)),
    currentWinStreak,
    currentLossStreak
  };
}

// Helper function: Calculate drawdown
function calculateDrawdown(trades) {
  let peak = 0;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let cumulative = 0;

  const drawdownData = trades.map(trade => {
    cumulative += trade.pnl || 0;
    
    if (cumulative > peak) {
      peak = cumulative;
    }

    const drawdown = cumulative - peak;
    const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;

    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }

    return {
      date: trade.date,
      drawdown: parseFloat(drawdown.toFixed(2)),
      cumulative: parseFloat(cumulative.toFixed(2))
    };
  });

  return {
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: parseFloat(maxDrawdownPercent.toFixed(2)),
    data: drawdownData
  };
}

// Helper function: Get available filters
function getAvailableFilters(trades) {
  return {
    instruments: [...new Set(trades.map(t => t.instrument || t.tradePair).filter(Boolean))],
    strategies: [...new Set(trades.map(t => t.strategy).filter(Boolean))],
    sessions: [...new Set(trades.map(t => t.session).filter(Boolean))],
    directions: [...new Set(trades.map(t => t.direction).filter(Boolean))]
  };
}

// Helper function: Get empty analytics
function getEmptyAnalytics() {
  return {
    overview: {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      totalPnL: 0,
      avgPnL: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      payoffRatio: 0,
      expectancy: 0,
      avgExecutionScore: 0,
      bestTrade: 0,
      worstTrade: 0
    },
    equity: [],
    monthly: [],
    weekly: [],
    daily: [],
    sessions: [],
    instruments: [],
    strategies: [],
    rrDistribution: [],
    rMultiples: [],
    executionScores: [],
    streaks: {
      maxWinStreak: 0,
      maxWinStreakPnL: 0,
      maxLossStreak: 0,
      maxLossStreakPnL: 0,
      currentWinStreak: 0,
      currentLossStreak: 0
    },
    drawdown: {
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      data: []
    },
    filters: {
      instruments: [],
      strategies: [],
      sessions: [],
      directions: []
    }
  };
}

// Helper function: Get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ==================== ADVANCED ANALYTICS FUNCTIONS ====================

// Helper function: Calculate advanced risk metrics
function calculateAdvancedRiskMetrics(trades) {
  if (trades.length === 0) return {};

  const returns = [];
  let cumulative = 0;
  
  trades.forEach(trade => {
    const pnl = trade.pnl || 0;
    cumulative += pnl;
    returns.push(pnl);
  });

  // Calculate returns statistics
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );

  // Downside deviation (for Sortino ratio)
  const negativeReturns = returns.filter(r => r < 0);
  const downsideDeviation = negativeReturns.length > 0
    ? Math.sqrt(
        negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
      )
    : 0;

  // Sharpe Ratio (assuming risk-free rate of 0 for simplicity)
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  // Sortino Ratio
  const sortinoRatio = downsideDeviation > 0 ? (avgReturn / downsideDeviation) * Math.sqrt(252) : 0;

  // Max Drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let currentDrawdown = 0;
  cumulative = 0;

  trades.forEach(trade => {
    cumulative += trade.pnl || 0;
    if (cumulative > peak) {
      peak = cumulative;
    }
    currentDrawdown = peak - cumulative;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
  });

  // Calmar Ratio (Annual Return / Max Drawdown)
  const totalReturn = returns.reduce((sum, r) => sum + r, 0);
  const calmarRatio = maxDrawdown > 0 ? (totalReturn / maxDrawdown) : 0;

  // Recovery Factor
  const recoveryFactor = maxDrawdown > 0 ? (totalReturn / maxDrawdown) : 0;

  // Profit Factor
  const grossProfit = returns.filter(r => r > 0).reduce((sum, r) => sum + r, 0);
  const grossLoss = Math.abs(returns.filter(r => r < 0).reduce((sum, r) => sum + r, 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : 0;

  return {
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
    calmarRatio: parseFloat(calmarRatio.toFixed(2)),
    recoveryFactor: parseFloat(recoveryFactor.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    standardDeviation: parseFloat(stdDev.toFixed(2)),
    downsideDeviation: parseFloat(downsideDeviation.toFixed(2)),
    averageReturn: parseFloat(avgReturn.toFixed(2))
  };
}

// Helper function: Calculate time of day performance
function calculateTimeOfDayPerformance(trades) {
  const hours = {};
  
  trades.forEach(trade => {
    const hour = new Date(trade.date).getHours();
    
    if (!hours[hour]) {
      hours[hour] = {
        hour,
        trades: 0,
        wins: 0,
        losses: 0,
        pnl: 0
      };
    }

    hours[hour].trades++;
    hours[hour].pnl += trade.pnl || 0;
    
    const result = (trade.result || trade.tradeOutcome || '').toLowerCase();
    if (result === 'win') hours[hour].wins++;
    if (result === 'loss') hours[hour].losses++;
  });

  return Object.values(hours)
    .map(h => ({
      ...h,
      pnl: parseFloat(h.pnl.toFixed(2)),
      winRate: (h.wins + h.losses) > 0 ? parseFloat(((h.wins / (h.wins + h.losses)) * 100).toFixed(2)) : 0,
      avgPnL: h.trades > 0 ? parseFloat((h.pnl / h.trades).toFixed(2)) : 0
    }))
    .sort((a, b) => a.hour - b.hour);
}

// Helper function: Calculate day of week performance
function calculateDayOfWeekPerformance(trades) {
  const days = {
    0: { day: 'Sunday', trades: 0, wins: 0, losses: 0, pnl: 0 },
    1: { day: 'Monday', trades: 0, wins: 0, losses: 0, pnl: 0 },
    2: { day: 'Tuesday', trades: 0, wins: 0, losses: 0, pnl: 0 },
    3: { day: 'Wednesday', trades: 0, wins: 0, losses: 0, pnl: 0 },
    4: { day: 'Thursday', trades: 0, wins: 0, losses: 0, pnl: 0 },
    5: { day: 'Friday', trades: 0, wins: 0, losses: 0, pnl: 0 },
    6: { day: 'Saturday', trades: 0, wins: 0, losses: 0, pnl: 0 }
  };

  const getResult = (trade) => (trade.result || trade.tradeOutcome || '').toLowerCase();

  trades.forEach(trade => {
    const dayOfWeek = new Date(trade.date).getDay();
    
    days[dayOfWeek].trades++;
    days[dayOfWeek].pnl += trade.pnl || 0;
    
    const result = getResult(trade);
    if (result === 'win') days[dayOfWeek].wins++;
    if (result === 'loss') days[dayOfWeek].losses++;
  });

  return Object.values(days)
    .filter(d => d.trades > 0)
    .map(d => ({
      ...d,
      pnl: parseFloat(d.pnl.toFixed(2)),
      winRate: (d.wins + d.losses) > 0 ? parseFloat(((d.wins / (d.wins + d.losses)) * 100).toFixed(2)) : 0,
      avgPnL: d.trades > 0 ? parseFloat((d.pnl / d.trades).toFixed(2)) : 0
    }));
}

// Helper function: Calculate hourly heatmap (hour x day of week)
function calculateHourlyHeatmap(trades) {
  const heatmap = {};

  trades.forEach(trade => {
    const date = new Date(trade.date);
    const hour = date.getHours();
    const day = date.getDay();
    const key = `${day}-${hour}`;

    if (!heatmap[key]) {
      heatmap[key] = {
        day,
        hour,
        trades: 0,
        pnl: 0,
        wins: 0,
        losses: 0
      };
    }

    heatmap[key].trades++;
    heatmap[key].pnl += trade.pnl || 0;
    
    const result = (trade.result || trade.tradeOutcome || '').toLowerCase();
    if (result === 'win') heatmap[key].wins++;
    if (result === 'loss') heatmap[key].losses++;
  });

  return Object.values(heatmap).map(h => ({
    day: h.day,
    hour: h.hour,
    trades: h.trades,
    pnl: parseFloat(h.pnl.toFixed(2)),
    winRate: (h.wins + h.losses) > 0 ? parseFloat(((h.wins / (h.wins + h.losses)) * 100).toFixed(2)) : 0
  }));
}

// Helper function: Generate AI insights
function generateInsights(trades) {
  if (trades.length < 10) return [];

  const insights = [];
  const getResult = (trade) => (trade.result || trade.tradeOutcome || '').toLowerCase();

  // Day of week analysis
  const dayStats = calculateDayOfWeekPerformance(trades);
  const bestDay = dayStats.reduce((best, day) => day.winRate > best.winRate ? day : best, dayStats[0]);
  const worstDay = dayStats.reduce((worst, day) => day.winRate < worst.winRate ? day : worst, dayStats[0]);

  if (bestDay && bestDay.winRate > 60) {
    insights.push({
      type: 'success',
      icon: '✅',
      title: 'Best Trading Day',
      message: `${bestDay.day} is your best day with ${bestDay.winRate}% win rate on ${bestDay.trades} trades`
    });
  }

  if (worstDay && worstDay.winRate < 40 && worstDay.trades >= 5) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Avoid Trading',
      message: `${worstDay.day} shows ${worstDay.winRate}% win rate. Consider reducing activity on this day`
    });
  }

  // Time of day analysis
  const hourStats = calculateTimeOfDayPerformance(trades);
  const profitableHours = hourStats.filter(h => h.avgPnL > 0 && h.trades >= 3);
  if (profitableHours.length > 0) {
    const bestHour = profitableHours.reduce((best, hour) => hour.avgPnL > best.avgPnL ? hour : best);
    insights.push({
      type: 'info',
      icon: '⏰',
      title: 'Best Trading Hour',
      message: `Hour ${bestHour.hour}:00 averages $${bestHour.avgPnL.toFixed(2)} per trade`
    });
  }

  // Strategy analysis
  const strategies = {};
  trades.forEach(trade => {
    const strat = trade.strategy || 'Unknown';
    if (!strategies[strat]) {
      strategies[strat] = { wins: 0, total: 0, pnl: 0 };
    }
    strategies[strat].total++;
    strategies[strat].pnl += trade.pnl || 0;
    if (getResult(trade) === 'win') strategies[strat].wins++;
  });

  const stratArray = Object.entries(strategies)
    .map(([name, data]) => {
      const losses = data.total - data.wins;
      return {
      name,
        winRate: (data.wins + losses) > 0 ? (data.wins / (data.wins + losses)) * 100 : 0,
      pnl: data.pnl,
      trades: data.total
      };
    })
    .filter(s => s.trades >= 5);

  const bestStrategy = stratArray.reduce((best, strat) => strat.pnl > best.pnl ? strat : best, stratArray[0] || {});
  if (bestStrategy && bestStrategy.name) {
    insights.push({
      type: 'success',
      icon: '🎯',
      title: 'Top Strategy',
      message: `${bestStrategy.name} generated $${bestStrategy.pnl.toFixed(2)} with ${bestStrategy.winRate.toFixed(1)}% win rate`
    });
  }

  // Consecutive trades warning
  let maxConsecutiveTrades = 0;
  let currentConsecutive = 1;
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  for (let i = 1; i < sortedTrades.length; i++) {
    const timeDiff = (new Date(sortedTrades[i].date) - new Date(sortedTrades[i-1].date)) / 1000 / 60;
    if (timeDiff < 60) {
      currentConsecutive++;
      maxConsecutiveTrades = Math.max(maxConsecutiveTrades, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }

  if (maxConsecutiveTrades >= 5) {
    insights.push({
      type: 'warning',
      icon: '🔥',
      title: 'Overtrading Alert',
      message: `You took ${maxConsecutiveTrades} trades within an hour. Consider reducing frequency`
    });
  }

  // Risk/Reward insights
  const avgRR = trades
    .filter(t => t.riskReward && t.riskReward > 0)
    .reduce((sum, t) => sum + parseFloat(t.riskReward), 0) / trades.filter(t => t.riskReward).length;

  if (avgRR > 2) {
    insights.push({
      type: 'success',
      icon: '📊',
      title: 'Excellent Risk Management',
      message: `Average Risk:Reward of ${avgRR.toFixed(2)}:1 is outstanding`
    });
  } else if (avgRR < 1 && !isNaN(avgRR)) {
    insights.push({
      type: 'danger',
      icon: '⚡',
      title: 'Poor Risk:Reward',
      message: `Average R:R of ${avgRR.toFixed(2)}:1 is too low. Aim for at least 2:1`
    });
  }

  return insights;
}

// Helper function: Calculate personal benchmarks
function calculateBenchmarks(trades) {
  if (trades.length === 0) return {};

  const getResult = (trade) => (trade.result || trade.tradeOutcome || '').toLowerCase();
  
  // Best single trade
  const bestTrade = trades.reduce((best, trade) => {
    return (trade.pnl || 0) > (best.pnl || 0) ? trade : best;
  }, trades[0]);

  // Worst single trade
  const worstTrade = trades.reduce((worst, trade) => {
    return (trade.pnl || 0) < (worst.pnl || 0) ? trade : worst;
  }, trades[0]);

  // Best day
  const dailyPnL = {};
  trades.forEach(trade => {
    const dateKey = new Date(trade.date).toISOString().split('T')[0];
    if (!dailyPnL[dateKey]) dailyPnL[dateKey] = 0;
    dailyPnL[dateKey] += trade.pnl || 0;
  });

  const bestDay = Object.entries(dailyPnL).reduce((best, [date, pnl]) => {
    return pnl > best.pnl ? { date, pnl } : best;
  }, { date: '', pnl: -Infinity });

  const worstDay = Object.entries(dailyPnL).reduce((worst, [date, pnl]) => {
    return pnl < worst.pnl ? { date, pnl } : worst;
  }, { date: '', pnl: Infinity });

  // Best month
  const monthlyPnL = {};
  trades.forEach(trade => {
    const date = new Date(trade.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyPnL[monthKey]) monthlyPnL[monthKey] = 0;
    monthlyPnL[monthKey] += trade.pnl || 0;
  });

  const bestMonth = Object.entries(monthlyPnL).reduce((best, [month, pnl]) => {
    return pnl > best.pnl ? { month, pnl } : best;
  }, { month: '', pnl: -Infinity });

  // Longest win streak
  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossStreak = 0;

  trades.forEach(trade => {
    const result = getResult(trade);
    if (result === 'win') {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else if (result === 'loss') {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    }
  });

  // Most profitable strategy
  const strategyPnL = {};
  trades.forEach(trade => {
    const strat = trade.strategy || 'Unknown';
    if (!strategyPnL[strat]) strategyPnL[strat] = { pnl: 0, trades: 0 };
    strategyPnL[strat].pnl += trade.pnl || 0;
    strategyPnL[strat].trades++;
  });

  const bestStrategyEntry = Object.entries(strategyPnL).reduce((best, [name, data]) => {
    return data.pnl > best.data.pnl ? { name, data } : best;
  }, { name: '', data: { pnl: -Infinity, trades: 0 } });

  return {
    bestTrade: {
      pnl: parseFloat((bestTrade.pnl || 0).toFixed(2)),
      date: bestTrade.date,
      instrument: bestTrade.instrument || bestTrade.tradePair,
      strategy: bestTrade.strategy
    },
    worstTrade: {
      pnl: parseFloat((worstTrade.pnl || 0).toFixed(2)),
      date: worstTrade.date,
      instrument: worstTrade.instrument || worstTrade.tradePair,
      strategy: worstTrade.strategy
    },
    bestDay: {
      date: bestDay.date,
      pnl: parseFloat(bestDay.pnl.toFixed(2))
    },
    worstDay: {
      date: worstDay.date,
      pnl: parseFloat(worstDay.pnl.toFixed(2))
    },
    bestMonth: {
      month: bestMonth.month,
      pnl: parseFloat(bestMonth.pnl.toFixed(2))
    },
    longestWinStreak: maxWinStreak,
    longestLossStreak: maxLossStreak,
    mostProfitableStrategy: {
      name: bestStrategyEntry.name,
      pnl: parseFloat(bestStrategyEntry.data.pnl.toFixed(2)),
      trades: bestStrategyEntry.data.trades
    }
  };
}

// Helper function: Calculate correlations
function calculateCorrelations(trades) {
  if (trades.length < 10) return {};

  // Strategy vs Instrument correlation
  const strategyInstrumentMatrix = {};
  
  trades.forEach(trade => {
    const strat = trade.strategy || 'Unknown';
    const inst = trade.instrument || trade.tradePair || 'Unknown';
    const key = `${strat}|${inst}`;
    
    if (!strategyInstrumentMatrix[key]) {
      strategyInstrumentMatrix[key] = { strategy: strat, instrument: inst, trades: 0, pnl: 0, wins: 0 };
    }
    
    strategyInstrumentMatrix[key].trades++;
    strategyInstrumentMatrix[key].pnl += trade.pnl || 0;
    
    const result = (trade.result || trade.tradeOutcome || '').toLowerCase();
    if (result === 'win') strategyInstrumentMatrix[key].wins++;
  });

  const correlationData = Object.values(strategyInstrumentMatrix)
    .filter(item => item.trades >= 3)
    .map(item => {
      const losses = item.trades - item.wins;
      return {
      strategy: item.strategy,
      instrument: item.instrument,
      trades: item.trades,
      pnl: parseFloat(item.pnl.toFixed(2)),
        winRate: (item.wins + losses) > 0 ? parseFloat(((item.wins / (item.wins + losses)) * 100).toFixed(2)) : 0
      };
    })
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 10);

  return {
    strategyInstrumentPairs: correlationData
  };
}

module.exports = router;

