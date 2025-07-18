import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { analyticsAPI, formatCurrency, formatDate } from '../utils/api';
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
  const [advancedData, setAdvancedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: '30d',
    strategy: 'all',
    instrument: 'all',
    session: 'all'
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userId) {
      fetchAnalyticsData();
    }
  }, [userId, filters]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch basic analytics data
      const basicAnalytics = await analyticsAPI.getAnalytics(userId, filters);
      
      // Fetch advanced analytics data
      const advancedAnalytics = await analyticsAPI.getAdvancedAnalytics(userId, filters);
      
      // Transform data for charts
      const transformedData = transformAnalyticsData(basicAnalytics, advancedAnalytics);
      
      setAnalyticsData(transformedData);
      setAdvancedData(advancedAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const transformAnalyticsData = (basicData, advancedData) => {
    const { overview, strategies, sessions, instruments, monthlyData } = basicData;
    
    // Transform monthly data
    const monthlyPnL = monthlyData.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      pnl: item.pnl
    }));
    
    // Transform strategy data for pie chart
    const strategyBreakdown = strategies.map(strategy => ({
      name: strategy.name || 'Unknown',
      count: strategy.trades,
      pnl: strategy.totalPnL
    }));
    
    // Transform session data
    const sessionData = sessions.map(session => ({
      session: session.name || 'Unknown',
      pnl: session.totalPnL,
      trades: session.trades
    }));
    
    // Transform strategy win rates
    const strategyWinRates = strategies.map(strategy => ({
      strategy: strategy.name || 'Unknown',
      winRate: parseFloat(strategy.winRate) || 0
    }));
    
    // Transform instrument data
    const instrumentData = instruments.map(instrument => ({
      instrument: instrument.name || 'Unknown',
      totalPnL: instrument.totalPnL,
      trades: instrument.trades
    }));
    
    return {
      totalTrades: overview.totalTrades || 0,
      winRate: overview.winRate || 0,
      totalPnL: overview.totalPnL || 0,
      avgScore: overview.avgExecutionScore || 0,
      dailyPnL: advancedData.dailyPnL || [],
      strategyBreakdown,
      sessionData,
      strategyWinRates,
      monthlyData: monthlyPnL,
      instrumentData,
      riskRewardData: advancedData.riskRewardData || [],
      executionScores: advancedData.executionScores || [],
      dayOfWeekData: advancedData.dayOfWeekData || [],
      maxDrawdown: advancedData.maxDrawdown || 0,
      sharpeRatio: advancedData.sharpeRatio || 0,
      profitFactor: advancedData.profitFactor || 0,
      recoveryFactor: advancedData.recoveryFactor || 0,
      drawdownData: advancedData.drawdownData || [],
      pnlDistribution: advancedData.pnlDistribution || [],
      bestDay: overview.bestDay || 0,
      worstDay: overview.worstDay || 0,
      bestStrategy: overview.bestStrategy || 'N/A',
      worstStrategy: overview.worstStrategy || 'N/A',
      bestInstrument: overview.bestInstrument || 'N/A',
      worstInstrument: overview.worstInstrument || 'N/A',
      maxWinStreak: overview.maxWinStreak || 0,
      maxLossStreak: overview.maxLossStreak || 0
    };
  };

  const exportData = () => {
    if (!analyticsData) return;
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Metric,Value\n" +
      `Total Trades,${analyticsData.totalTrades}\n` +
      `Win Rate,${analyticsData.winRate}%\n` +
      `Total P&L,${analyticsData.totalPnL}\n` +
      `Average Score,${analyticsData.avgScore}\n` +
      `Best Day,${analyticsData.bestDay}\n` +
      `Worst Day,${analyticsData.worstDay}\n` +
      `Max Drawdown,${analyticsData.maxDrawdown}\n` +
      `Sharpe Ratio,${analyticsData.sharpeRatio}\n` +
      `Profit Factor,${analyticsData.profitFactor}\n` +
      `Recovery Factor,${analyticsData.recoveryFactor}`;
    
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
            onClick={fetchAnalyticsData}
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
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="all">All time</option>
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