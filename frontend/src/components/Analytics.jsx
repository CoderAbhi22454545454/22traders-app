import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { tradesAPI, formatCurrency } from '../utils/api';
import {
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const Analytics = ({ userId }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    strategy: 'all',
    instrument: 'all',
    session: 'all'
  });
  const [activeTab, setActiveTab] = useState('overview');

  // Client-side data storage
  const [allTrades, setAllTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);

  // Fetch all trades once on component mount
  useEffect(() => {
    if (userId) {
      fetchAllTrades();
    }
  }, [userId]);

  // Apply filters when filter parameters change
  useEffect(() => {
    console.log('🔄 Analytics filters changed:', filters);
    if (allTrades.length > 0) {
      applyFiltersAndCalculateAnalytics();
    }
  }, [filters, allTrades]);

  // Fetch all trades once (no filtering parameters)
  const fetchAllTrades = async () => {
    console.log('📊 Fetching all trades for analytics...');
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all trades without any filtering
      const tradesData = await tradesAPI.getAllTrades({
        userId,
        page: 1,
        limit: 1000 // Get a large number of trades
      });
      
      console.log('📋 All trades fetched for analytics:', {
        tradesCount: tradesData?.trades?.length,
        firstTrade: tradesData?.trades?.[0],
        lastTrade: tradesData?.trades?.[tradesData?.trades?.length - 1]
      });
      
      setAllTrades(tradesData.trades || []);
      
    } catch (error) {
      console.error('❌ Error fetching trades for analytics:', error);
      setError(error.message || 'Failed to fetch trades data');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and calculate analytics
  const applyFiltersAndCalculateAnalytics = () => {
    console.log('🔍 Applying filters and calculating analytics:', {
      filters,
      totalTrades: allTrades.length
    });

    if (allTrades.length === 0) {
      console.log('⚠️ No trades to analyze');
      setAnalyticsData(null);
      return;
    }

    // Apply filters to trades
    let filtered = [...allTrades];

    // Date range filter
    if (filters.dateRange !== 'all') {
      const dateRange = getDateRange(filters.dateRange);
      if (dateRange) {
        filtered = filtered.filter(trade => {
          const tradeDate = new Date(trade.date);
          return tradeDate >= dateRange.startDate && tradeDate <= dateRange.endDate;
        });
      }
    }

    // Strategy filter
    if (filters.strategy !== 'all') {
      filtered = filtered.filter(trade => 
        trade.strategy && trade.strategy.toLowerCase() === filters.strategy.toLowerCase()
      );
    }

    // Instrument filter
    if (filters.instrument !== 'all') {
      filtered = filtered.filter(trade => 
        trade.instrument && trade.instrument.toLowerCase() === filters.instrument.toLowerCase()
      );
    }

    // Session filter
    if (filters.session !== 'all') {
      filtered = filtered.filter(trade => 
        trade.session && trade.session.toLowerCase() === filters.session.toLowerCase()
      );
    }

    console.log('✅ Filtered trades for analytics:', {
      originalCount: allTrades.length,
      filteredCount: filtered.length,
      filters
    });

    setFilteredTrades(filtered);
    
    // Calculate analytics from filtered trades
    const analyticsData = calculateAnalytics(filtered);
    setAnalyticsData(analyticsData);
  };

  // Get date range based on filter
  const getDateRange = (dateRange) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate = new Date(today);
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(today.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(today.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(today.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        return null;
    }
    
    return {
      startDate,
      endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) // End of today
    };
  };

  // Calculate comprehensive analytics from trades
  const calculateAnalytics = (trades) => {
    console.log('📊 Calculating analytics for', trades.length, 'trades');
    
    if (trades.length === 0) {
      return getEmptyAnalyticsData();
    }

    // Basic metrics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => trade.result === 'win').length;
    const losingTrades = trades.filter(trade => trade.result === 'loss').length;
    const winRate = Math.round((winningTrades / totalTrades) * 100);
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const avgScore = trades.reduce((sum, trade) => sum + (trade.executionScore || 0), 0) / totalTrades;

    // Calculate daily P&L
    const dailyPnL = calculateDailyPnL(trades);
    
    // Calculate strategy breakdown
    const strategyBreakdown = calculateStrategyBreakdown(trades);
    
    // Calculate session data
    const sessionData = calculateSessionData(trades);
    
    // Calculate strategy win rates
    const strategyWinRates = calculateStrategyWinRates(trades);
    
    // Calculate monthly data
    const monthlyData = calculateMonthlyData(trades);
    
    // Calculate instrument data
    const instrumentData = calculateInstrumentData(trades);
    
    // Calculate day of week data
    const dayOfWeekData = calculateDayOfWeekData(trades);
    
    // Calculate risk metrics
    const riskMetrics = calculateRiskMetrics(trades);
    
    // Calculate execution scores
    const executionScores = calculateExecutionScores(trades);
    
    // Calculate P&L distribution
    const pnlDistribution = calculatePnLDistribution(trades);
    
    // Find best/worst performers
    const bestWorstMetrics = calculateBestWorstMetrics(trades);

    const analyticsData = {
      totalTrades,
      winRate,
      totalPnL,
      avgScore,
      dailyPnL,
      strategyBreakdown,
      sessionData,
      strategyWinRates,
      monthlyData,
      instrumentData,
      dayOfWeekData,
      riskRewardData: [], // Can be calculated if risk/reward data is available
      executionScores,
      pnlDistribution,
      drawdownData: riskMetrics.drawdownData,
      maxDrawdown: riskMetrics.maxDrawdown,
      sharpeRatio: riskMetrics.sharpeRatio,
      profitFactor: riskMetrics.profitFactor,
      recoveryFactor: riskMetrics.recoveryFactor,
      ...bestWorstMetrics
    };

    console.log('📊 Analytics calculated:', analyticsData);
    return analyticsData;
  };

  // Helper functions for analytics calculations
  const getEmptyAnalyticsData = () => ({
    totalTrades: 0,
    winRate: 0,
    totalPnL: 0,
    avgScore: 0,
    dailyPnL: [],
    strategyBreakdown: [],
    sessionData: [],
    strategyWinRates: [],
    monthlyData: [],
    instrumentData: [],
    dayOfWeekData: [],
    riskRewardData: [],
    executionScores: [],
    pnlDistribution: [],
    drawdownData: [],
    maxDrawdown: 0,
    sharpeRatio: 0,
    profitFactor: 0,
    recoveryFactor: 0,
    bestDay: 0,
    worstDay: 0,
    bestStrategy: 'N/A',
    worstStrategy: 'N/A',
    bestInstrument: 'N/A',
    worstInstrument: 'N/A',
    maxWinStreak: 0,
    maxLossStreak: 0
  });

  const calculateDailyPnL = (trades) => {
    const dailyPnL = {};
    
    trades.forEach(trade => {
      const dateKey = new Date(trade.date).toISOString().split('T')[0];
      if (!dailyPnL[dateKey]) {
        dailyPnL[dateKey] = 0;
      }
      dailyPnL[dateKey] += trade.pnl || 0;
    });
    
    return Object.entries(dailyPnL)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, pnl]) => ({
        date: new Date(date).toLocaleDateString(),
        pnl
      }));
  };

  const calculateStrategyBreakdown = (trades) => {
    const strategies = {};
    
    trades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      if (!strategies[strategy]) {
        strategies[strategy] = { count: 0, pnl: 0 };
      }
      strategies[strategy].count++;
      strategies[strategy].pnl += trade.pnl || 0;
    });
    
    return Object.entries(strategies).map(([name, data]) => ({
      name,
      count: data.count,
      pnl: data.pnl
    }));
  };

  const calculateSessionData = (trades) => {
    const sessions = {};
    
    trades.forEach(trade => {
      const session = trade.session || 'Unknown';
      if (!sessions[session]) {
        sessions[session] = { trades: 0, pnl: 0 };
      }
      sessions[session].trades++;
      sessions[session].pnl += trade.pnl || 0;
    });
    
    return Object.entries(sessions).map(([session, data]) => ({
      session,
      trades: data.trades,
      pnl: data.pnl
    }));
  };

  const calculateStrategyWinRates = (trades) => {
    const strategies = {};
    
    trades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      if (!strategies[strategy]) {
        strategies[strategy] = { total: 0, wins: 0 };
      }
      strategies[strategy].total++;
      if (trade.result === 'win') {
        strategies[strategy].wins++;
      }
    });
    
    return Object.entries(strategies).map(([strategy, data]) => ({
      strategy,
      winRate: Math.round((data.wins / data.total) * 100)
    }));
  };

  const calculateMonthlyData = (trades) => {
    const monthly = {};
    
    trades.forEach(trade => {
      const date = new Date(trade.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthly[monthKey]) {
        monthly[monthKey] = 0;
      }
      monthly[monthKey] += trade.pnl || 0;
    });
    
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pnl]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        pnl
      }));
  };

  const calculateInstrumentData = (trades) => {
    const instruments = {};
    
    trades.forEach(trade => {
      const instrument = trade.instrument || 'Unknown';
      if (!instruments[instrument]) {
        instruments[instrument] = { trades: 0, totalPnL: 0 };
      }
      instruments[instrument].trades++;
      instruments[instrument].totalPnL += trade.pnl || 0;
    });
    
    return Object.entries(instruments).map(([instrument, data]) => ({
      instrument,
      trades: data.trades,
      totalPnL: data.totalPnL
    }));
  };

  const calculateDayOfWeekData = (trades) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayData = {};
    
    trades.forEach(trade => {
      const dayOfWeek = new Date(trade.date).getDay();
      const dayName = dayNames[dayOfWeek];
      
      if (!dayData[dayName]) {
        dayData[dayName] = { trades: 0, pnl: 0 };
      }
      dayData[dayName].trades++;
      dayData[dayName].pnl += trade.pnl || 0;
    });
    
    return dayNames.map(day => ({
      day,
      trades: dayData[day]?.trades || 0,
      avgPnL: dayData[day]?.trades ? dayData[day].pnl / dayData[day].trades : 0
    })).filter(day => day.trades > 0);
  };

  const calculateRiskMetrics = (trades) => {
    const pnlValues = trades.map(trade => trade.pnl || 0);
    const cumulativePnL = [];
    let runningTotal = 0;
    
    pnlValues.forEach((pnl, index) => {
      runningTotal += pnl;
      cumulativePnL.push({
        date: new Date(trades[index].date).toLocaleDateString(),
        cumulative: runningTotal
      });
    });
    
    // Calculate drawdown
    const drawdownData = [];
    let peak = 0;
    let maxDrawdown = 0;
    
    cumulativePnL.forEach(point => {
      if (point.cumulative > peak) {
        peak = point.cumulative;
      }
      const drawdown = point.cumulative - peak;
      drawdownData.push({
        date: point.date,
        drawdown
      });
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    // Calculate Sharpe ratio (simplified)
    const avgReturn = pnlValues.reduce((sum, pnl) => sum + pnl, 0) / pnlValues.length;
    const variance = pnlValues.reduce((sum, pnl) => sum + Math.pow(pnl - avgReturn, 2), 0) / pnlValues.length;
    const sharpeRatio = variance > 0 ? avgReturn / Math.sqrt(variance) : 0;
    
    // Calculate profit factor
    const grossProfit = pnlValues.filter(pnl => pnl > 0).reduce((sum, pnl) => sum + pnl, 0);
    const grossLoss = Math.abs(pnlValues.filter(pnl => pnl < 0).reduce((sum, pnl) => sum + pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
    
    // Calculate recovery factor
    const totalPnL = pnlValues.reduce((sum, pnl) => sum + pnl, 0);
    const recoveryFactor = maxDrawdown < 0 ? totalPnL / Math.abs(maxDrawdown) : 0;
    
    return {
      drawdownData,
      maxDrawdown,
      sharpeRatio,
      profitFactor,
      recoveryFactor
    };
  };

  const calculateExecutionScores = (trades) => {
    const categories = ['Entry', 'Exit', 'Risk Management', 'Discipline', 'Analysis'];
    
    if (trades.length === 0) {
      return categories.map(category => ({
        category,
        score: 0
      }));
    }
    
    // For now, we'll use the overall execution score for all categories
    // In a real implementation, you might have separate scores for each category
    const avgScore = trades.reduce((sum, trade) => sum + (trade.executionScore || 0), 0) / trades.length;
    
    return categories.map(category => ({
      category,
      score: avgScore
    }));
  };

  const calculatePnLDistribution = (trades) => {
    const ranges = [
      { range: '-200 to -100', min: -200, max: -100 },
      { range: '-100 to 0', min: -100, max: 0 },
      { range: '0 to 100', min: 0, max: 100 },
      { range: '100 to 200', min: 100, max: 200 },
      { range: '200+', min: 200, max: Infinity }
    ];
    
    return ranges.map(range => ({
      range: range.range,
      count: trades.filter(trade => {
        const pnl = trade.pnl || 0;
        return pnl >= range.min && pnl < range.max;
      }).length
    }));
  };

  const calculateBestWorstMetrics = (trades) => {
    const dailyPnL = {};
    
    trades.forEach(trade => {
      const dateKey = new Date(trade.date).toDateString();
      if (!dailyPnL[dateKey]) {
        dailyPnL[dateKey] = 0;
      }
      dailyPnL[dateKey] += trade.pnl || 0;
    });
    
    const dailyValues = Object.values(dailyPnL);
    const bestDay = Math.max(...dailyValues, 0);
    const worstDay = Math.min(...dailyValues, 0);
    
    // Calculate win/loss streaks
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    trades.forEach(trade => {
      if (trade.result === 'win') {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (trade.result === 'loss') {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });
    
    // Find best/worst strategy and instrument
    const strategyPnL = {};
    const instrumentPnL = {};
    
    trades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      const instrument = trade.instrument || 'Unknown';
      
      if (!strategyPnL[strategy]) strategyPnL[strategy] = 0;
      if (!instrumentPnL[instrument]) instrumentPnL[instrument] = 0;
      
      strategyPnL[strategy] += trade.pnl || 0;
      instrumentPnL[instrument] += trade.pnl || 0;
    });
    
    const bestStrategy = Object.keys(strategyPnL).reduce((best, strategy) => 
      strategyPnL[strategy] > (strategyPnL[best] || -Infinity) ? strategy : best
    , 'N/A');
    
    const worstStrategy = Object.keys(strategyPnL).reduce((worst, strategy) => 
      strategyPnL[strategy] < (strategyPnL[worst] || Infinity) ? strategy : worst
    , 'N/A');
    
    const bestInstrument = Object.keys(instrumentPnL).reduce((best, instrument) => 
      instrumentPnL[instrument] > (instrumentPnL[best] || -Infinity) ? instrument : best
    , 'N/A');
    
    const worstInstrument = Object.keys(instrumentPnL).reduce((worst, instrument) => 
      instrumentPnL[instrument] < (instrumentPnL[worst] || Infinity) ? instrument : worst
    , 'N/A');
    
    return {
      bestDay,
      worstDay,
      maxWinStreak,
      maxLossStreak,
      bestStrategy,
      worstStrategy,
      bestInstrument,
      worstInstrument
    };
  };



  const exportData = () => {
    if (!analyticsData) return;
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Metric,Value\n" +
      `Total Trades,${analyticsData.totalTrades}\n` +
      `Win Rate,${analyticsData.winRate}%\n` +
      `Total P&L,${analyticsData.totalPnL}\n` +
      `Average Score,${analyticsData.avgScore.toFixed(2)}\n` +
      `Best Day,${analyticsData.bestDay}\n` +
      `Worst Day,${analyticsData.worstDay}\n` +
      `Max Drawdown,${analyticsData.maxDrawdown}\n` +
      `Sharpe Ratio,${analyticsData.sharpeRatio.toFixed(2)}\n` +
      `Profit Factor,${analyticsData.profitFactor.toFixed(2)}\n` +
      `Recovery Factor,${analyticsData.recoveryFactor.toFixed(2)}\n` +
      `Max Win Streak,${analyticsData.maxWinStreak}\n` +
      `Max Loss Streak,${analyticsData.maxLossStreak}\n` +
      `Best Strategy,${analyticsData.bestStrategy}\n` +
      `Best Instrument,${analyticsData.bestInstrument}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trading_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'performance', name: 'Performance', icon: ArrowTrendingUpIcon },
    { id: 'patterns', name: 'Patterns', icon: FunnelIcon },
    { id: 'risk', name: 'Risk Analysis', icon: CurrencyDollarIcon }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="text-lg text-gray-800 mb-2">Error Loading Analytics</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button
            onClick={fetchAllTrades}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-lg text-gray-800 mb-2">No Analytics Data Available</div>
          <div className="text-sm text-gray-600">Start adding trades to see your analytics</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trading Analytics</h1>
              <p className="mt-1 text-sm text-gray-600">
                Deep dive into your trading performance and patterns
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Filters */}
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="form-input py-2 text-sm"
              >
                <option value="all">All time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>

              <select
                value={filters.strategy}
                onChange={(e) => setFilters(prev => ({ ...prev, strategy: e.target.value }))}
                className="form-input py-2 text-sm"
              >
                <option value="all">All Strategies</option>
                <option value="scalping">Scalping</option>
                <option value="swing">Swing</option>
                <option value="breakout">Breakout</option>
              </select>

              <button
                onClick={exportData}
                className="btn-primary"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && analyticsData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Trades</p>
                      <p className="text-2xl font-bold text-blue-900">{analyticsData.totalTrades}</p>
                    </div>
                    <ChartBarIcon className="h-8 w-8 text-blue-400" />
                  </div>
                </div>
                <div className="stat-card bg-gradient-to-br from-green-50 to-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Win Rate</p>
                      <p className="text-2xl font-bold text-green-900">{analyticsData.winRate}%</p>
                    </div>
                    <ArrowTrendingUpIcon className="h-8 w-8 text-green-400" />
                  </div>
                </div>
                <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Total P&L</p>
                      <p className="text-2xl font-bold text-purple-900">{formatCurrency(analyticsData.totalPnL)}</p>
                    </div>
                    <CurrencyDollarIcon className="h-8 w-8 text-purple-400" />
                  </div>
                </div>
                <div className="stat-card bg-gradient-to-br from-orange-50 to-orange-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Avg Score</p>
                      <p className="text-2xl font-bold text-orange-900">{analyticsData.avgScore}/10</p>
                    </div>
                    <ClockIcon className="h-8 w-8 text-orange-400" />
                  </div>
                </div>
              </div>

              {/* P&L Trend */}
              <div className="chart-container">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">P&L Trend</h3>
                {analyticsData.dailyPnL && analyticsData.dailyPnL.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={analyticsData.dailyPnL}>
                      <defs>
                        <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'P&L']} />
                      <Area 
                        type="monotone" 
                        dataKey="pnl" 
                        stroke="#3B82F6" 
                        fillOpacity={1}
                        fill="url(#colorPnL)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p>No P&L data available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Strategy Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="chart-container">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Breakdown</h3>
                  {analyticsData.strategyBreakdown && analyticsData.strategyBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.strategyBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {analyticsData.strategyBreakdown?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Trades']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-72 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>No strategy data available</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="chart-container">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Performance</h3>
                  {analyticsData.sessionData && analyticsData.sessionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.sessionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="session" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(value), 'P&L']} />
                        <Bar dataKey="pnl" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-72 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>No session data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && analyticsData && (
            <div className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="chart-container">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk vs Reward</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <ScatterChart data={analyticsData.riskRewardData}>
                      <CartesianGrid />
                      <XAxis dataKey="risk" name="Risk" />
                      <YAxis dataKey="reward" name="Reward" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Trades" dataKey="reward" fill="#3B82F6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-container">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Win Rate by Strategy</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analyticsData.strategyWinRates}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="strategy" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Win Rate']} />
                      <Bar dataKey="winRate" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-container">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analyticsData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'P&L']} />
                      <Line type="monotone" dataKey="pnl" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Execution Score Radar */}
              <div className="chart-container">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Score Analysis</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={analyticsData.executionScores}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                    <Radar 
                      name="Score" 
                      dataKey="score" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'patterns' && analyticsData && (
            <div className="space-y-6">
              {/* Trading Patterns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="chart-container">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Day of Week Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.dayOfWeekData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Avg P&L']} />
                      <Bar dataKey="avgPnL" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-container">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Instrument Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.instrumentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="instrument" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Total P&L']} />
                      <Bar dataKey="totalPnL" fill="#06B6D4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Insights */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">📊 Key Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-sm text-indigo-800">
                    <span className="font-medium">Best trading day:</span> {
                      analyticsData.dayOfWeekData.length > 0 
                        ? (() => {
                            const bestDay = analyticsData.dayOfWeekData.reduce((max, day) => 
                              day.avgPnL > max.avgPnL ? day : max
                            );
                            return `${bestDay.day} (avg P&L: ${formatCurrency(bestDay.avgPnL)})`;
                          })()
                        : 'N/A'
                    }
                  </div>
                  <div className="text-sm text-indigo-800">
                    <span className="font-medium">Most profitable instrument:</span> {
                      analyticsData.bestInstrument !== 'N/A' && analyticsData.instrumentData.length > 0
                        ? (() => {
                            const bestInstrument = analyticsData.instrumentData.find(i => i.instrument === analyticsData.bestInstrument);
                            return `${analyticsData.bestInstrument} (${formatCurrency(bestInstrument?.totalPnL || 0)})`;
                          })()
                        : 'N/A'
                    }
                  </div>
                  <div className="text-sm text-indigo-800">
                    <span className="font-medium">Optimal strategy:</span> {
                      analyticsData.bestStrategy !== 'N/A' && analyticsData.strategyWinRates.length > 0
                        ? (() => {
                            const bestStrategy = analyticsData.strategyWinRates.find(s => s.strategy === analyticsData.bestStrategy);
                            return `${analyticsData.bestStrategy} (${bestStrategy?.winRate || 0}% win rate)`;
                          })()
                        : 'N/A'
                    }
                  </div>
                  <div className="text-sm text-indigo-800">
                    <span className="font-medium">Peak performance session:</span> {
                      analyticsData.sessionData.length > 0 
                        ? (() => {
                            const bestSession = analyticsData.sessionData.reduce((max, session) => 
                              session.pnl > max.pnl ? session : max
                            );
                            return `${bestSession.session} (${formatCurrency(bestSession.pnl)})`;
                          })()
                        : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risk' && analyticsData && (
            <div className="space-y-6">
              {/* Risk Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: 'Max Drawdown', value: formatCurrency(analyticsData.maxDrawdown), color: 'red' },
                  { title: 'Sharpe Ratio', value: analyticsData.sharpeRatio?.toFixed(2), color: 'blue' },
                  { title: 'Profit Factor', value: analyticsData.profitFactor?.toFixed(2), color: 'green' },
                  { title: 'Recovery Factor', value: analyticsData.recoveryFactor?.toFixed(2), color: 'purple' }
                ].map((metric, index) => (
                  <div key={index} className="stat-card">
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className={`text-2xl font-bold text-${metric.color}-600`}>{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Drawdown Chart */}
              <div className="chart-container">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Drawdown Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.drawdownData}>
                    <defs>
                      <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Drawdown']} />
                    <Area 
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="#EF4444" 
                      fillOpacity={1}
                      fill="url(#colorDrawdown)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Risk Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="chart-container">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">P&L Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.pnlDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, 'Trades']} />
                      <Bar dataKey="count" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">⚠️ Risk Summary</h3>
                  <div className="space-y-3">
                    <div className="text-sm text-red-800">
                      <span className="font-medium">Risk Status:</span> {
                        analyticsData.maxDrawdown > -1000 ? 'High' : 
                        analyticsData.maxDrawdown > -500 ? 'Moderate' : 'Low'
                      }
                    </div>
                    <div className="text-sm text-red-800">
                      <span className="font-medium">Max consecutive losses:</span> {analyticsData.maxLossStreak}
                    </div>
                    <div className="text-sm text-red-800">
                      <span className="font-medium">Max drawdown:</span> {formatCurrency(analyticsData.maxDrawdown)}
                    </div>
                    <div className="text-sm text-red-800">
                      <span className="font-medium">Recommendation:</span> {
                        analyticsData.winRate < 50 
                          ? 'Focus on improving win rate and risk management'
                          : analyticsData.maxDrawdown < -1000
                            ? 'Consider reducing position sizes during losing streaks'
                            : 'Maintain current risk management practices'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics; 