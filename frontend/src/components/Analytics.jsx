import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import {
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  InformationCircleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

const Analytics = ({ userId }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    instrument: 'all',
    strategy: 'all',
    session: 'all',
    direction: 'all',
    tradeType: 'all'
  });

  // Global highlight state - persists across all tables
  const [highlightedItems, setHighlightedItems] = useState(() => {
    const saved = localStorage.getItem(`analytics-highlights-${userId}`);
    return saved ? JSON.parse(saved) : {
      strategies: [],
      sessions: [],
      instruments: [],
      months: [],
      weeks: []
    };
  });

  // Table row order states
  const [tableOrders, setTableOrders] = useState(() => {
    const saved = localStorage.getItem(`analytics-table-orders-${userId}`);
    return saved ? JSON.parse(saved) : {
      strategies: null,
      sessions: null,
      instruments: null,
      months: null,
      weeks: null
    };
  });

  // Drag state
  const [draggedItem, setDraggedItem] = useState(null);

  // Goal Tracker state
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem(`trading-goals-${userId}`);
    return saved ? JSON.parse(saved) : {
      dailyPnL: { target: 100, enabled: true },
      weeklyPnL: { target: 500, enabled: true },
      monthlyPnL: { target: 2000, enabled: true },
      winRate: { target: 55, enabled: true }
    };
  });

  const [showGoalSettings, setShowGoalSettings] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(`analytics-active-tab-${userId}`);
    return saved || 'overview';
  });

  // Save active tab
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`analytics-active-tab-${userId}`, activeTab);
    }
  }, [activeTab, userId]);

  // Save highlights to localStorage whenever they change
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`analytics-highlights-${userId}`, JSON.stringify(highlightedItems));
    }
  }, [highlightedItems, userId]);

  // Save table orders to localStorage whenever they change
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`analytics-table-orders-${userId}`, JSON.stringify(tableOrders));
    }
  }, [tableOrders, userId]);

  // Save goals to localStorage
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`trading-goals-${userId}`, JSON.stringify(goals));
    }
  }, [goals, userId]);

  // Toggle highlight for any item
  const toggleHighlight = (category, item) => {
    setHighlightedItems(prev => {
      const categoryItems = prev[category] || [];
      const isHighlighted = categoryItems.includes(item);
      
      return {
        ...prev,
        [category]: isHighlighted 
          ? categoryItems.filter(i => i !== item)
          : [...categoryItems, item]
      };
    });
  };

  // Check if item is highlighted
  const isHighlighted = (category, item) => {
    return (highlightedItems[category] || []).includes(item);
  };

  // Handle drag start
  const handleDragStart = (category, index) => {
    setDraggedItem({ category, index });
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (category, dropIndex) => {
    if (!draggedItem || draggedItem.category !== category) return;

    const sourceIndex = draggedItem.index;
    if (sourceIndex === dropIndex) return;

    setTableOrders(prev => {
      const currentOrder = prev[category] || getDefaultOrder(category);
      const newOrder = [...currentOrder];
      const [movedItem] = newOrder.splice(sourceIndex, 1);
      newOrder.splice(dropIndex, 0, movedItem);

      return {
        ...prev,
        [category]: newOrder
      };
    });

    setDraggedItem(null);
  };

  // Get default order for a category
  const getDefaultOrder = (category) => {
    const data = analyticsData;
    if (!data) return [];
    
    switch(category) {
      case 'strategies': return data.strategies?.map(s => s.strategy) || [];
      case 'sessions': return data.sessions?.map(s => s.session) || [];
      case 'instruments': return data.instruments?.map(i => i.instrument) || [];
      case 'months': return data.monthly?.map(m => m.month) || [];
      case 'weeks': return data.weekly?.map(w => w.week) || [];
      default: return [];
    }
  };

  // Get ordered data for a table
  const getOrderedData = (category, data) => {
    if (!data || data.length === 0) return [];
    
    const savedOrder = tableOrders[category];
    if (!savedOrder || savedOrder.length === 0) return data;

    // Create a map of items by their identifier
    const dataMap = new Map();
    data.forEach(item => {
      const key = item.strategy || item.session || item.instrument || item.month || item.week;
      dataMap.set(key, item);
    });

    // Reorder based on saved order
    const orderedData = [];
    savedOrder.forEach(key => {
      if (dataMap.has(key)) {
        orderedData.push(dataMap.get(key));
        dataMap.delete(key);
      }
    });

    // Append any new items not in saved order
    dataMap.forEach(item => orderedData.push(item));

    return orderedData;
  };

  // Reset table order
  const resetTableOrder = (category) => {
    setTableOrders(prev => ({
      ...prev,
      [category]: null
    }));
  };

  // Clear all highlights
  const clearAllHighlights = () => {
    setHighlightedItems({
      strategies: [],
      sessions: [],
      instruments: [],
      months: [],
      weeks: []
    });
  };

  // Calculate goal progress
  const calculateGoalProgress = () => {
    if (!analyticsData) return {};

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Daily P&L
    const todayTrades = analyticsData.daily?.find(d => d.date.split('T')[0] === todayStr);
    const dailyPnL = todayTrades?.pnl || 0;
    const dailyProgress = goals.dailyPnL.enabled 
      ? (dailyPnL / goals.dailyPnL.target) * 100 
      : 0;

    // Weekly P&L (current week)
    const weeklyData = analyticsData.weekly?.[analyticsData.weekly.length - 1];
    const weeklyPnL = weeklyData?.pnl || 0;
    const weeklyProgress = goals.weeklyPnL.enabled 
      ? (weeklyPnL / goals.weeklyPnL.target) * 100 
      : 0;

    // Monthly P&L (current month)
    const monthlyData = analyticsData.monthly?.[analyticsData.monthly.length - 1];
    const monthlyPnL = monthlyData?.pnl || 0;
    const monthlyProgress = goals.monthlyPnL.enabled 
      ? (monthlyPnL / goals.monthlyPnL.target) * 100 
      : 0;

    // Win Rate
    const winRate = analyticsData.overview?.winRate || 0;
    const winRateProgress = goals.winRate.enabled 
      ? (winRate / goals.winRate.target) * 100 
      : 0;
    
    return {
      daily: { current: dailyPnL, progress: dailyProgress },
      weekly: { current: weeklyPnL, progress: weeklyProgress },
      monthly: { current: monthlyPnL, progress: monthlyProgress },
      winRate: { current: winRate, progress: winRateProgress }
    };
  };

  const updateGoal = (type, field, value) => {
    setGoals(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  // Fetch analytics data
  useEffect(() => {
    if (userId) {
      fetchAnalytics();
    }
  }, [userId, filters]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ userId });
      
      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });

      // Get base URL and ensure it doesn't have trailing /api, we'll add it explicitly
      let baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      // Remove trailing /api if present to avoid double /api/api/
      baseUrl = baseUrl.replace(/\/api\/?$/, '');
      const API_BASE_URL = `${baseUrl}/api`;
      const response = await fetch(`${API_BASE_URL}/analytics/comprehensive?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      instrument: 'all',
      strategy: 'all',
      session: 'all',
      direction: 'all',
      tradeType: 'all'
    });
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const { overview } = analyticsData;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Metric,Value\n" +
      `Total Trades,${overview.totalTrades}\n` +
      `Win Rate,${overview.winRate}%\n` +
      `Total P&L,$${overview.totalPnL}\n` +
      `Average P&L,$${overview.avgPnL}\n` +
      `Profit Factor,${overview.profitFactor}\n` +
      `Payoff Ratio,${overview.payoffRatio}\n` +
      `Expectancy,$${overview.expectancy}\n` +
      `Best Trade,$${overview.bestTrade}\n` +
      `Worst Trade,$${overview.worstTrade}\n` +
      `Avg Execution Score,${overview.avgExecutionScore}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

  // Info tooltip component
  const InfoTooltip = ({ title, description }) => {
    const [show, setShow] = useState(false);

    return (
      <div className="relative inline-block ml-2">
        <button
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          className="text-gray-400 hover:text-blue-500 transition-colors"
        >
          <InformationCircleIcon className="w-5 h-5" />
        </button>
        {show && (
          <div className="absolute left-0 top-8 z-50 w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl">
            <div className="font-semibold mb-1">{title}</div>
            <div className="text-gray-300 text-xs leading-relaxed">{description}</div>
            <div className="absolute -top-2 left-4 w-3 h-3 bg-gray-900 transform rotate-45"></div>
          </div>
        )}
      </div>
    );
  };

  // Format month for better readability
  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Format week for better readability
  const formatWeek = (weekStr) => {
    const [year, week] = weekStr.split('-W');
    return `Week ${week}, ${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XMarkIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData || analyticsData.overview.totalTrades === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Start adding trades to see your analytics dashboard</p>
        </div>
      </div>
    );
  }

  const { 
    overview, equity, monthly, weekly, sessions, instruments, strategies, 
    rrDistribution, rMultiples, executionScores, streaks, drawdown,
    // New advanced features
    advancedRiskMetrics, timeOfDay, dayOfWeek, insights, benchmarks, 
    correlations, hourlyHeatmap
  } = analyticsData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trading Analytics</h1>
              <p className="text-sm text-gray-600 mt-1">Comprehensive performance analysis</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                Filters {showFilters && '▲' || '▼'}
              </button>
              <button
                onClick={exportData}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Instrument</label>
              <select
                    value={filters.instrument}
                    onChange={(e) => handleFilterChange('instrument', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Instruments</option>
                    {analyticsData.filters.instruments.map(inst => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
              </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Strategy</label>
              <select
                value={filters.strategy}
                    onChange={(e) => handleFilterChange('strategy', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Strategies</option>
                    {analyticsData.filters.strategies.map(strat => (
                      <option key={strat} value={strat}>{strat}</option>
                    ))}
              </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Session</label>
                  <select
                    value={filters.session}
                    onChange={(e) => handleFilterChange('session', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Sessions</option>
                    {analyticsData.filters.sessions.map(sess => (
                      <option key={sess} value={sess}>{sess}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Direction</label>
                  <select
                    value={filters.direction}
                    onChange={(e) => handleFilterChange('direction', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Directions</option>
                    <option value="Long">Long</option>
                    <option value="Short">Short</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trade Type</label>
                  <select
                    value={filters.tradeType}
                    onChange={(e) => handleFilterChange('tradeType', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Trades</option>
                    <option value="real">Real Only</option>
                    <option value="backtest">Backtest Only</option>
                  </select>
                </div>
              </div>
              <button
                onClick={resetFilters}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Reset Filters
              </button>
            </div>
          )}
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Interactive Features Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-start">
            <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900 mb-1">✨ Interactive Tables with Smart Features</h3>
              <div className="text-xs text-gray-700 space-y-1">
                <p><strong className="text-blue-600">Click any row</strong> to highlight it (click again to remove)</p>
                <p><strong className="text-purple-600">Drag rows</strong> using the <Bars3Icon className="w-3 h-3 inline" /> icon to reorder tables</p>
                <p><strong className="text-green-600">All changes save automatically</strong> and persist across sessions</p>
              </div>
            </div>
                <button
              onClick={clearAllHighlights}
              className="ml-3 px-3 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors shadow-sm"
            >
              Clear All Highlights
                </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>📊</span>
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'performance'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>📈</span>
                <span>Performance</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('strategies')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'strategies'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>🎯</span>
                <span>Strategies</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'advanced'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>⚡</span>
                <span>Advanced</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* AI Insights Panel */}
        {insights && insights.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🤖 AI-Powered Insights</h3>
              <InfoTooltip 
                title="Smart Insights" 
                description="Automatically detected patterns and recommendations based on your trading data to help you improve performance."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((insight, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'success' ? 'bg-green-50 border-green-500' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                    insight.type === 'danger' ? 'bg-red-50 border-red-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{insight.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{insight.title}</h4>
                      <p className="text-xs text-gray-700">{insight.message}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          </div>
        )}

        {/* Personal Benchmarks */}
        {benchmarks && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">🏆 Personal Records</h3>
              <InfoTooltip 
                title="Your Best Performances" 
                description="Track your all-time best achievements and milestones. Use these as targets to beat!"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Best Trade */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-xs text-gray-600 mb-1">🎯 Best Trade</div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {formatCurrency(benchmarks.bestTrade?.pnl || 0)}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {benchmarks.bestTrade?.strategy} • {benchmarks.bestTrade?.instrument}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(benchmarks.bestTrade?.date).toLocaleDateString()}
                </div>
              </div>

              {/* Best Day */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-xs text-gray-600 mb-1">📅 Best Day</div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {formatCurrency(benchmarks.bestDay?.pnl || 0)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(benchmarks.bestDay?.date).toLocaleDateString()}
                </div>
              </div>

              {/* Best Month */}
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-xs text-gray-600 mb-1">🗓️ Best Month</div>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {formatCurrency(benchmarks.bestMonth?.pnl || 0)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {formatMonth(benchmarks.bestMonth?.month)}
                </div>
              </div>

              {/* Longest Win Streak */}
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="text-xs text-gray-600 mb-1">🔥 Win Streak</div>
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {benchmarks.longestWinStreak || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Consecutive wins
                </div>
              </div>

              {/* Most Profitable Strategy */}
              <div className="bg-white rounded-lg p-4 border border-indigo-200 md:col-span-2">
                <div className="text-xs text-gray-600 mb-1">💎 Top Strategy</div>
                <div className="text-2xl font-bold text-indigo-600 mb-1">
                  {benchmarks.mostProfitableStrategy?.name || 'N/A'}
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>{formatCurrency(benchmarks.mostProfitableStrategy?.pnl || 0)}</span>
                  <span>{benchmarks.mostProfitableStrategy?.trades || 0} trades</span>
                </div>
              </div>

              {/* Worst Trade (for awareness) */}
              <div className="bg-white rounded-lg p-4 border border-red-200 md:col-span-2">
                <div className="text-xs text-gray-600 mb-1">⚠️ Worst Trade (Learn & Avoid)</div>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {formatCurrency(benchmarks.worstTrade?.pnl || 0)}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {benchmarks.worstTrade?.strategy} • {benchmarks.worstTrade?.instrument}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(benchmarks.worstTrade?.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goal Tracker */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">🎯 Goal Tracker</h3>
              <InfoTooltip 
                title="Track Your Goals" 
                description="Set daily, weekly, and monthly targets to stay motivated and focused. Progress bars show how close you are to achieving your goals!"
              />
            </div>
            <button
              onClick={() => setShowGoalSettings(!showGoalSettings)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
            >
              {showGoalSettings ? 'Hide' : 'Edit'} Goals
            </button>
          </div>

          {/* Goal Settings */}
          {showGoalSettings && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Set Your Targets</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Daily P&L Target ($)</label>
                  <input
                    type="number"
                    value={goals.dailyPnL.target}
                    onChange={(e) => updateGoal('dailyPnL', 'target', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                    </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Weekly P&L Target ($)</label>
                  <input
                    type="number"
                    value={goals.weeklyPnL.target}
                    onChange={(e) => updateGoal('weeklyPnL', 'target', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monthly P&L Target ($)</label>
                  <input
                    type="number"
                    value={goals.monthlyPnL.target}
                    onChange={(e) => updateGoal('monthlyPnL', 'target', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                    <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Win Rate Target (%)</label>
                  <input
                    type="number"
                    value={goals.winRate.target}
                    onChange={(e) => updateGoal('winRate', 'target', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                    </div>
                  </div>
                </div>
          )}

          {/* Goal Progress */}
          {(() => {
            const progress = calculateGoalProgress();
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Daily Goal */}
                {goals.dailyPnL.enabled && (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-xs text-gray-600 mb-1">📅 Today's Goal</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(progress.daily?.current || 0)}
                    </div>
                  </div>
                      <div className={`text-xs font-semibold ${(progress.daily?.progress || 0) >= 100 ? 'text-green-600' : 'text-gray-600'}`}>
                        {((progress.daily?.progress || 0) >= 100 ? '✅ ' : '') + (progress.daily?.progress || 0).toFixed(0)}%
                </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Target: {formatCurrency(goals.dailyPnL.target)}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${(progress.daily?.progress || 0) >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min((progress.daily?.progress || 0), 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Weekly Goal */}
                {goals.weeklyPnL.enabled && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-xs text-gray-600 mb-1">📊 This Week</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(progress.weekly?.current || 0)}
                    </div>
                  </div>
                      <div className={`text-xs font-semibold ${(progress.weekly?.progress || 0) >= 100 ? 'text-green-600' : 'text-gray-600'}`}>
                        {((progress.weekly?.progress || 0) >= 100 ? '✅ ' : '') + (progress.weekly?.progress || 0).toFixed(0)}%
                </div>
              </div>
                    <div className="text-xs text-gray-500 mb-2">Target: {formatCurrency(goals.weeklyPnL.target)}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${(progress.weekly?.progress || 0) >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min((progress.weekly?.progress || 0), 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Monthly Goal */}
                {goals.monthlyPnL.enabled && (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">🗓️ This Month</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(progress.monthly?.current || 0)}
                        </div>
                      </div>
                      <div className={`text-xs font-semibold ${(progress.monthly?.progress || 0) >= 100 ? 'text-green-600' : 'text-gray-600'}`}>
                        {((progress.monthly?.progress || 0) >= 100 ? '✅ ' : '') + (progress.monthly?.progress || 0).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Target: {formatCurrency(goals.monthlyPnL.target)}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${(progress.monthly?.progress || 0) >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                        style={{ width: `${Math.min((progress.monthly?.progress || 0), 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Win Rate Goal */}
                {goals.winRate.enabled && (
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">🎯 Win Rate</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {(progress.winRate?.current || 0).toFixed(1)}%
                        </div>
                      </div>
                      <div className={`text-xs font-semibold ${(progress.winRate?.progress || 0) >= 100 ? 'text-green-600' : 'text-gray-600'}`}>
                        {((progress.winRate?.progress || 0) >= 100 ? '✅ ' : '') + (progress.winRate?.progress || 0).toFixed(0)}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Target: {goals.winRate.target}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${(progress.winRate?.progress || 0) >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                        style={{ width: `${Math.min((progress.winRate?.progress || 0), 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Trades</p>
              <ChartBarIcon className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{overview.totalTrades}</p>
            <p className="text-xs text-gray-500 mt-1">
              {overview.winningTrades}W · {overview.losingTrades}L · {overview.breakEvenTrades}BE
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{overview.winRate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              Payoff: {overview.payoffRatio.toFixed(2)}:1
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total P&L</p>
              <CurrencyDollarIcon className="w-5 h-5 text-purple-500" />
            </div>
            <p className={`text-3xl font-bold ${overview.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(overview.totalPnL)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Avg: {formatCurrency(overview.avgPnL)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Profit Factor</p>
              <FunnelIcon className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{overview.profitFactor.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Expectancy: {formatCurrency(overview.expectancy)}
            </p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-4">
            <p className="text-xs font-medium text-green-700 mb-1">Average Win</p>
            <p className="text-xl font-bold text-green-900">{formatCurrency(overview.avgWin)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-4">
            <p className="text-xs font-medium text-red-700 mb-1">Average Loss</p>
            <p className="text-xl font-bold text-red-900">{formatCurrency(overview.avgLoss)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-4">
            <p className="text-xs font-medium text-blue-700 mb-1">Best Trade</p>
            <p className="text-xl font-bold text-blue-900">{formatCurrency(overview.bestTrade)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-4">
            <p className="text-xs font-medium text-purple-700 mb-1">Execution Score</p>
            <p className="text-xl font-bold text-purple-900">{overview.avgExecutionScore.toFixed(1)}/10</p>
          </div>
        </div>

        {/* Streaks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Win/Loss Streaks</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Max Win Streak</p>
              <p className="text-2xl font-bold text-green-600">{streaks.maxWinStreak}</p>
              <p className="text-xs text-gray-500">{formatCurrency(streaks.maxWinStreakPnL)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Max Loss Streak</p>
              <p className="text-2xl font-bold text-red-600">{streaks.maxLossStreak}</p>
              <p className="text-xs text-gray-500">-{formatCurrency(streaks.maxLossStreakPnL)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Win Streak</p>
              <p className="text-2xl font-bold text-blue-600">{streaks.currentWinStreak}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Loss Streak</p>
              <p className="text-2xl font-bold text-orange-600">{streaks.currentLossStreak}</p>
            </div>
          </div>
        </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Advanced Risk Metrics */}
        {advancedRiskMetrics && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">📊 Advanced Risk Metrics</h3>
              <InfoTooltip 
                title="Professional Risk Analysis" 
                description="Industry-standard metrics used by professional traders and hedge funds to evaluate risk-adjusted returns and performance quality."
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-xs text-gray-600 mb-1">Sharpe Ratio</div>
                <div className={`text-2xl font-bold ${advancedRiskMetrics.sharpeRatio > 1 ? 'text-green-600' : 'text-gray-900'}`}>
                  {advancedRiskMetrics.sharpeRatio?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-500 mt-1">&gt;1 is good</div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="text-xs text-gray-600 mb-1">Sortino Ratio</div>
                <div className={`text-2xl font-bold ${advancedRiskMetrics.sortinoRatio > 1 ? 'text-green-600' : 'text-gray-900'}`}>
                  {advancedRiskMetrics.sortinoRatio?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Downside risk</div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <div className="text-xs text-gray-600 mb-1">Calmar Ratio</div>
                <div className={`text-2xl font-bold ${advancedRiskMetrics.calmarRatio > 1 ? 'text-green-600' : 'text-gray-900'}`}>
                  {advancedRiskMetrics.calmarRatio?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Return/DD ratio</div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="text-xs text-gray-600 mb-1">Std Deviation</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${advancedRiskMetrics.standardDeviation?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Volatility</div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="text-xs text-gray-600 mb-1">Profit Factor</div>
                <div className={`text-2xl font-bold ${advancedRiskMetrics.profitFactor > 2 ? 'text-green-600' : 'text-gray-900'}`}>
                  {advancedRiskMetrics.profitFactor?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-500 mt-1">&gt;2 is excellent</div>
              </div>
            </div>
          </div>
        )}

        {/* Day of Week & Time of Day Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day of Week */}
          {dayOfWeek && dayOfWeek.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">📅 Day of Week Performance</h3>
                  <InfoTooltip 
                    title="Best Trading Days" 
                    description="Identifies which days of the week are most profitable for you. Use this to focus trading activity on your best days."
                  />
                </div>
              </div>
              <div className="space-y-3">
                {dayOfWeek.sort((a, b) => b.pnl - a.pnl).map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{day.day}</div>
                      <div className="text-xs text-gray-600">{day.trades} trades • {day.winRate}% win rate</div>
                    </div>
                    <div className={`text-lg font-bold ${day.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(day.pnl)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time of Day */}
          {timeOfDay && timeOfDay.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">⏰ Time of Day Performance</h3>
                  <InfoTooltip 
                    title="Best Trading Hours" 
                    description="Shows your most profitable hours. Focus on trading during these times for better results."
                  />
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {timeOfDay
                  .filter(h => h.trades > 0)
                  .sort((a, b) => b.avgPnL - a.avgPnL)
                  .slice(0, 12)
                  .map((hour, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{hour.hour}:00 - {hour.hour}:59</div>
                        <div className="text-xs text-gray-600">{hour.trades} trades • {hour.winRate}% WR</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`text-sm font-bold ${hour.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(hour.pnl)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(hour.avgPnL)}/trade
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Calendar Heatmap */}
        {analyticsData.daily && analyticsData.daily.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">🗓️ Daily P&L Calendar</h3>
                <InfoTooltip 
                  title="Trading Calendar" 
                  description="GitHub-style heatmap showing your daily P&L. Green = profitable, Red = losing. Quickly spot patterns and consistency."
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  Profit
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
                  Break Even
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                  Loss
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <div className="inline-grid gap-1" style={{ gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
                {/* Generate last 12 weeks */}
                {(() => {
                  const today = new Date();
                  const days = [];
                  const dailyMap = {};
                  
                  // Create map of daily P&L
                  analyticsData.daily.forEach(day => {
                    const dateKey = new Date(day.date).toISOString().split('T')[0];
                    dailyMap[dateKey] = day.pnl || 0;
                  });
                  
                  // Generate last 84 days (12 weeks)
                  for (let i = 83; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateKey = date.toISOString().split('T')[0];
                    const pnl = dailyMap[dateKey] || 0;
                    const dayOfWeek = date.getDay();
                    
                    // Calculate color intensity
                    let bgColor = 'bg-gray-200';
                    if (pnl > 0) {
                      const intensity = Math.min(Math.abs(pnl) / 100, 1); // Max at $100
                      if (intensity > 0.75) bgColor = 'bg-green-600';
                      else if (intensity > 0.5) bgColor = 'bg-green-500';
                      else if (intensity > 0.25) bgColor = 'bg-green-400';
                      else bgColor = 'bg-green-300';
                    } else if (pnl < 0) {
                      const intensity = Math.min(Math.abs(pnl) / 100, 1);
                      if (intensity > 0.75) bgColor = 'bg-red-600';
                      else if (intensity > 0.5) bgColor = 'bg-red-500';
                      else if (intensity > 0.25) bgColor = 'bg-red-400';
                      else bgColor = 'bg-red-300';
                    }
                    
                    days.push(
                      <div
                        key={dateKey}
                        className={`w-3 h-3 ${bgColor} rounded-sm cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all`}
                        title={`${date.toLocaleDateString()}: ${formatCurrency(pnl)}`}
                        style={{ gridRow: dayOfWeek + 1 }}
                      />
                    );
                  }
                  
                  return days;
                })()}
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
              <span>Darker colors = higher P&L</span>
              <span>Last 12 weeks</span>
            </div>
          </div>
        )}

        {/* Equity Curve */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Equity Curve</h3>
            <InfoTooltip 
              title="Equity Curve" 
              description="Your cumulative profit/loss over time. This is your account balance trajectory. An upward trend indicates growing profitability, while a downward trend shows losses accumulating. The ideal curve should trend upward with minimal drawdowns."
            />
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={equity}>
                      <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                tick={{fontSize: 12}}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#6B7280" tick={{fontSize: 12}} />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Cumulative P&L']}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              />
                      <Area 
                        type="monotone" 
                dataKey="cumulative" 
                        stroke="#3B82F6" 
                strokeWidth={2}
                        fillOpacity={1}
                fill="url(#colorEquity)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                    </div>

        {/* Monthly & Weekly Performance - Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly P&L Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Monthly P&L</h3>
                <InfoTooltip 
                  title="Monthly Performance" 
                  description="Click any row to highlight. Drag rows to reorder. Your preferences are saved automatically."
                />
                  </div>
              <button
                onClick={() => resetTableOrder('months')}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Reset Order
              </button>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Month</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Trades</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Win Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getOrderedData('months', monthly).map((m, idx) => (
                    <tr 
                      key={idx}
                      draggable
                      onDragStart={() => handleDragStart('months', idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop('months', idx)}
                      onClick={() => toggleHighlight('months', m.month)}
                      className={`transition-all duration-300 cursor-move ${
                        isHighlighted('months', m.month)
                          ? 'bg-yellow-100 border-l-4 border-yellow-500 shadow-md scale-[1.01]' 
                          : 'hover:bg-blue-50'
                      }`}
                      title="Click to highlight, drag to reorder"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatMonth(m.month)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-sm">
                          {m.trades}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-base font-bold ${m.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {m.winRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-lg font-bold ${m.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(m.pnl)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              </div>

          {/* Weekly P&L Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Weekly P&L</h3>
                <InfoTooltip 
                  title="Weekly Performance" 
                  description="Click any row to highlight. Drag rows to reorder. Your preferences are saved automatically."
                />
              </div>
              <button
                onClick={() => resetTableOrder('weeks')}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Reset Order
              </button>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Week</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Trades</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Win Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getOrderedData('weeks', weekly).map((w, idx) => (
                    <tr 
                      key={idx}
                      draggable
                      onDragStart={() => handleDragStart('weeks', idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop('weeks', idx)}
                      onClick={() => toggleHighlight('weeks', w.week)}
                      className={`transition-all duration-300 cursor-move ${
                        isHighlighted('weeks', w.week)
                          ? 'bg-yellow-100 border-l-4 border-yellow-500 shadow-md scale-[1.01]' 
                          : 'hover:bg-blue-50'
                      }`}
                      title="Click to highlight, drag to reorder"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatWeek(w.week)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium text-sm">
                          {w.trades}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-base font-bold ${w.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {w.winRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-lg font-bold ${w.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(w.pnl)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Session & Instrument Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Performance Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Session Performance</h3>
                <InfoTooltip 
                  title="Trading Sessions" 
                  description="Click any row to highlight. Drag rows to reorder. Your preferences are saved automatically."
                />
              </div>
              <button
                onClick={() => resetTableOrder('sessions')}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Reset Order
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Session</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Trades</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Win Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">Total P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getOrderedData('sessions', sessions).map((session, idx) => (
                    <tr 
                      key={idx}
                      draggable
                      onDragStart={() => handleDragStart('sessions', idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop('sessions', idx)}
                      onClick={() => toggleHighlight('sessions', session.session)}
                      className={`transition-all duration-300 cursor-move ${
                        isHighlighted('sessions', session.session)
                          ? 'bg-yellow-100 border-l-4 border-yellow-500 shadow-md scale-[1.01]' 
                          : 'hover:bg-blue-50'
                      }`}
                      title="Click to highlight, drag to reorder"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900">{session.session}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-sm">
                          {session.trades}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-base font-bold ${session.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {session.winRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-lg font-bold ${session.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(session.pnl)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                      </div>
                    </div>

          {/* Top Instruments Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Instruments</h3>
                <InfoTooltip 
                  title="Instrument Performance" 
                  description="Click any row to highlight. Drag rows to reorder. Your preferences are saved automatically."
                />
              </div>
              <button
                onClick={() => resetTableOrder('instruments')}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Reset Order
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Instrument</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Trades</th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Win Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">Total P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getOrderedData('instruments', instruments).map((inst, idx) => (
                    <tr 
                      key={idx}
                      draggable
                      onDragStart={() => handleDragStart('instruments', idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop('instruments', idx)}
                      onClick={() => toggleHighlight('instruments', inst.instrument)}
                      className={`transition-all duration-300 cursor-move ${
                        isHighlighted('instruments', inst.instrument)
                          ? 'bg-yellow-100 border-l-4 border-yellow-500 shadow-md scale-[1.01]' 
                          : 'hover:bg-blue-50'
                      }`}
                      title="Click to highlight, drag to reorder"
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900">{inst.instrument}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium text-sm">
                          {inst.trades}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-base font-bold ${inst.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {inst.winRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-lg font-bold ${inst.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(inst.pnl)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
                </div>
          </div>
        )}

        {/* Strategies Tab */}
        {activeTab === 'strategies' && (
          <div className="space-y-6">
            {/* Strategy Performance - Table View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Strategy Performance</h3>
              <InfoTooltip 
                title="Strategy Analysis" 
                description="Click any row to highlight. Drag rows to reorder. Your preferences are saved automatically."
              />
                      </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => resetTableOrder('strategies')}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Reset Order
              </button>
              <button
                onClick={clearAllHighlights}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
              >
                Clear Highlights
              </button>
                    </div>
                </div>
          
          <div className="overflow-x-auto">
              <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-2 py-4 w-8"></th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Strategy Name</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-700">Total Trades</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-700">Wins</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-700">Losses</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-700">Win Rate %</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-700">Total P&L</th>
                  <th className="px-4 py-4 text-right text-sm font-bold text-gray-700">Avg P&L/Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getOrderedData('strategies', strategies).map((strat, idx) => (
                  <tr 
                    key={idx} 
                    draggable
                    onDragStart={() => handleDragStart('strategies', idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop('strategies', idx)}
                    onClick={() => toggleHighlight('strategies', strat.strategy)}
                    className={`transition-all duration-300 cursor-move ${
                      isHighlighted('strategies', strat.strategy)
                        ? 'bg-yellow-100 border-l-4 border-yellow-500 shadow-md scale-[1.01]' 
                        : 'hover:bg-blue-50'
                    }`}
                    title="Click to highlight, drag to reorder"
                  >
                    <td className="px-2 py-4 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                      <Bars3Icon className="w-5 h-5" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{strat.strategy}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium text-sm">
                        {strat.trades}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                        {strat.wins}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                        {strat.losses}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-lg font-bold ${strat.winRate >= 50 ? 'text-green-600' : strat.winRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {strat.winRate}%
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${strat.winRate >= 50 ? 'bg-green-500' : strat.winRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${strat.winRate}%` }}
                          ></div>
              </div>
            </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`text-lg font-bold ${strat.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(strat.pnl)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`text-base font-semibold ${strat.avgPnL >= 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {formatCurrency(strat.avgPnL)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-600 font-medium mb-1">Total Strategies</div>
              <div className="text-2xl font-bold text-blue-600">{strategies.length}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-gray-600 font-medium mb-1">Profitable Strategies</div>
              <div className="text-2xl font-bold text-green-600">
                {strategies.filter(s => s.pnl > 0).length}
              </div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xs text-gray-600 font-medium mb-1">Losing Strategies</div>
              <div className="text-2xl font-bold text-red-600">
                {strategies.filter(s => s.pnl < 0).length}
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xs text-gray-600 font-medium mb-1">Best Win Rate</div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.max(...strategies.map(s => s.winRate))}%
              </div>
            </div>
          </div>
        </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {/* Performance Attribution - Pie Charts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">💰 Where Does Your Profit Come From?</h3>
            <InfoTooltip 
              title="Performance Attribution" 
              description="Visual breakdown showing which strategies, instruments, and sessions contribute most to your total P&L. Focus on what works!"
            />
          </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strategy Attribution */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">By Strategy</h4>
                  <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={strategies.filter(s => s.pnl > 0).slice(0, 5).map(s => ({
                      name: s.strategy,
                      value: Math.abs(s.pnl)
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {strategies.filter(s => s.pnl > 0).slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
                  </ResponsiveContainer>
                </div>

            {/* Instrument Attribution */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">By Instrument</h4>
                  <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={instruments.filter(i => i.pnl > 0).slice(0, 5).map(i => ({
                      name: i.instrument,
                      value: Math.abs(i.pnl)
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {instruments.filter(i => i.pnl > 0).slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
                  </ResponsiveContainer>
                </div>

            {/* Session Attribution */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">By Session</h4>
                  <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sessions.filter(s => s.pnl > 0).map(s => ({
                      name: s.session,
                      value: Math.abs(s.pnl)
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sessions.filter(s => s.pnl > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              💡 <strong>Insight:</strong> Focus your energy on the strategies, instruments, and sessions that generate the most profit. These are your edge!
            </p>
              </div>
            </div>

        {/* Risk/Reward Distribution */}
        {rrDistribution.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Risk:Reward Distribution</h3>
                <InfoTooltip 
                  title="Risk:Reward Ratio" 
                  description="Shows how many trades you took at different risk:reward ratios. Higher RR ratios (2:1, 3:1+) mean you're risking less to gain more. Aim for trades with RR ratios of 2:1 or higher for better profitability."
                />
              </div>
                  <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rrDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="range" stroke="#6B7280" tick={{fontSize: 12}} />
                  <YAxis stroke="#6B7280" tick={{fontSize: 12}} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#EC4899" name="Trades" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">R-Multiple Distribution</h3>
                <InfoTooltip 
                  title="R-Multiples" 
                  description="R-multiple measures profit/loss in terms of your initial risk. 1R = your initial risk amount. A trade with +2R means you made 2x your risk. This helps normalize results across different position sizes. Positive R values indicate wins, negative indicate losses."
                />
              </div>
                  <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rMultiples}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="range" stroke="#6B7280" tick={{fontSize: 11}} />
                  <YAxis stroke="#6B7280" tick={{fontSize: 12}} />
                  <Tooltip formatter={(value) => [value, 'Trades']} />
                  <Bar dataKey="count" fill="#06B6D4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
        )}

        {/* Execution Scores */}
        {executionScores.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Execution Score Trend</h3>
              <InfoTooltip 
                title="Execution Quality" 
                description="Tracks how well you executed each trade (1-10 scale). Shows your last 30 trades. Look for consistency and improvement over time. Scores below 5 indicate poor execution (emotions, plan deviation), while 8+ indicates excellent execution."
              />
                  </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={executionScores.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="tradeNumber" 
                  stroke="#6B7280" 
                  tick={{fontSize: 12}}
                  label={{ value: 'Trade Number', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  domain={[0, 10]} 
                  stroke="#6B7280" 
                  tick={{fontSize: 12}}
                  label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name, props) => {
                    if (name === 'score') return [value, 'Execution Score'];
                    return [value, name];
                  }}
                  labelFormatter={(value) => `Trade #${value}`}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8B5CF6" 
                  strokeWidth={2} 
                  name="Execution Score"
                  dot={{ fill: '#8B5CF6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
                  </div>
        )}

        {/* Drawdown Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-gray-900">Drawdown Analysis</h3>
              <InfoTooltip 
                title="Drawdown Tracking" 
                description="Measures the decline from your equity peak to trough. Shows how much you're down from your highest account balance. Lower drawdowns indicate better risk management. Max drawdown is the worst peak-to-trough decline you've experienced."
              />
                  </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-xs text-gray-600">Max Drawdown</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(drawdown.maxDrawdown)}</p>
                  </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Max DD %</p>
                <p className="text-lg font-bold text-red-600">{drawdown.maxDrawdownPercent.toFixed(2)}%</p>
                </div>
              </div>
            </div>
                <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={drawdown.data}>
                    <defs>
                <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280" 
                tick={{fontSize: 12}}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#6B7280" tick={{fontSize: 12}} />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Drawdown']}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px'
                }}
              />
                    <Area 
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="#EF4444" 
                strokeWidth={2}
                      fillOpacity={1}
                fill="url(#colorDD)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
        </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics; 
