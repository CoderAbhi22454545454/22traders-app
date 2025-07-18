import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import CalendarView from './CalendarView';
import TradeModal from './TradeModal';
import TradeScreenshot from './TradeScreenshot';
import { tradesAPI, formatCurrency } from '../utils/api';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FireIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const Dashboard = ({ userId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, 1y

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, tradesData] = await Promise.all([
        tradesAPI.getComprehensiveStats(userId),
        tradesAPI.getAllTrades({ userId, page: 1, limit: 10 })
      ]);
      setStats(statsData);
      setRecentTrades(tradesData.trades || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleTradeAdded = () => {
    fetchData();
  };

  const StatCard = ({ title, value, color = 'primary', subtitle = null, icon: Icon, trend = null }) => {
    const getColorClasses = (color) => {
      const colors = {
        primary: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-900',
        success: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-900',
        danger: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 text-red-900',
        warning: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-900',
        purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-900'
      };
      return colors[color] || colors.primary;
    };

    return (
      <div className={`stat-card ${getColorClasses(color)} group cursor-pointer transform hover:scale-105`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-600 mb-1 truncate">{title}</p>
              {Icon && <Icon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />}
            </div>
            <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
            {subtitle && (
              <div className="flex items-center mt-1">
                <p className="text-xs text-gray-500 truncate">{subtitle}</p>
                {trend && (
                  <span className={`ml-2 flex items-center text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend > 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                    {Math.abs(trend)}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const QuickActions = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary justify-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Trade
        </button>
        <button className="btn-secondary justify-center">
          <ChartBarIcon className="h-4 w-4 mr-2" />
          Analytics
        </button>
        <button className="btn-secondary justify-center">
          <CurrencyDollarIcon className="h-4 w-4 mr-2" />
          Reports
        </button>
        <button className="btn-secondary justify-center">
          <EyeIcon className="h-4 w-4 mr-2" />
          Review
        </button>
      </div>
    </div>
  );

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Enhanced Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Trading Dashboard
              </h1>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Track your trading performance and analyze your strategies
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="form-input py-2 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {darkMode ? '🌞' : '🌙'}
              </button>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Trade
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0 space-y-6">
          
          {/* Key Performance Indicators */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-7 w-full">
              <StatCard
                title="Total Trades"
                value={stats.overview.totalTrades}
                color="primary"
                icon={ChartBarIcon}
                trend={12}
              />
                             <StatCard
                 title="Win Rate"
                 value={`${stats.overview.winRate}%`}
                 color={stats.overview.winRate >= 60 ? 'success' : stats.overview.winRate >= 40 ? 'warning' : 'danger'}
                 icon={stats.overview.winRate >= 60 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
                 trend={stats.overview.winRate >= 60 ? 5 : -3}
               />
              <StatCard
                title="Total P&L"
                value={formatCurrency(stats.overview.totalPnL)}
                color={stats.overview.totalPnL >= 0 ? 'success' : 'danger'}
                icon={CurrencyDollarIcon}
                trend={stats.overview.totalPnL >= 0 ? 8 : -5}
              />
              <StatCard
                title="Execution Score"
                value={`${stats.overview.avgExecutionScore.toFixed(1)}/10`}
                color="purple"
                icon={BoltIcon}
              />
    
              <StatCard
                title="Best Instrument"
                value={stats.overview.bestInstrument}
                color="success"
              />
              <StatCard
                title="Win Streak"
                value={stats.overview.maxWinStreak}
                color="success"
                icon={FireIcon}
              />
              <StatCard
                title="Risk:Reward"
                value={stats.overview.avgRiskReward}
                color="primary"
              />
            </div>
          )}

          {/* Main Content Grid */}
          <div className="">
            
            {/* Left Column - Charts */}
            <div className="">
              
              {/* P&L Chart */}
              {/* {stats && (
                <div className="chart-container">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">P&L Performance</h3>
                    <div className="flex space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ↗ Profitable Days: {stats.overview.profitableDays || 0}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ↘ Loss Days: {stats.overview.lossDays || 0}
                      </span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stats.overview.dailyPnL || []}>
                      <defs>
                        <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'P&L']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="pnl" 
                        stroke="#10B981" 
                        fillOpacity={1}
                        fill="url(#colorPnL)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )} */}

              {/* Trading Calendar */}
              <div className="bg-white shadow-sm rounded-xl border border-gray-200 w-full">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Trading Calendar</h2>
                  <p className="text-sm text-gray-600">Click on any date to add a trade</p>
                </div>
                <div className="p-6 calendar-container">
                  <CalendarView onDateClick={handleDateClick} selectedDate={selectedDate} userId={userId} />
                </div>
              </div>
            </div>

            {/* Right Column - Quick Actions & Stats */}
      
          </div>

          {/* Recent Trades Table */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Trades</h3>
                  <p className="text-sm text-gray-600">Your latest trading activity</p>
                </div>
                <Link 
                  to="/trades" 
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  View all trades →
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instrument</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Screenshot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTrades.map((trade) => (
                    <tr key={trade._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(trade.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trade.instrument}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          trade.direction === 'Long' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trade.lotSize}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(trade.pnl)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          trade.result === 'win' 
                            ? 'bg-green-100 text-green-800'
                            : trade.result === 'loss'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {trade.result.toUpperCase()}
                        </span>
                      </td>
                     
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-16 h-10">
                          {trade.screenshotUrl ? (
                            <img
                              src={trade.screenshotUrl}
                              alt="Trade screenshot"
                              className="w-full h-full object-cover rounded border border-gray-200 cursor-pointer"
                              onClick={() => {
                                // Open fullscreen view
                                const modal = document.createElement('div');
                                modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50';
                                modal.onclick = () => modal.remove();
                                
                                const img = document.createElement('img');
                                img.src = trade.screenshotUrl;
                                img.className = 'max-w-[90vw] max-h-[90vh] object-contain';
                                
                                modal.appendChild(img);
                                document.body.appendChild(modal);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-400">No image</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/trade/${trade._id}`}
                          className="text-purple-600 hover:text-blue-500 transition-colors btn-tertiary"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recentTrades.length === 0 && (
              <div className="px-6 py-12 text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No trades yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding your first trade.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add your first trade
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Trade Modal */}
      <TradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        userId={userId}
        onTradeAdded={handleTradeAdded}
      />
    </div>
  );
};

export default Dashboard; 