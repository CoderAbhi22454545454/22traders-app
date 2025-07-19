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
  BoltIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Dashboard = ({ userId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [timeRange, setTimeRange] = useState('all'); // all, 7d, 10d, 1m, 2m, 3m, 6m, 1y, custom
  
  // New state for custom date filters
  const [filterMode, setFilterMode] = useState('preset'); // 'preset' or 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    startDate: '',
    endDate: '',
    mode: 'preset'
  });
  
  // New state for client-side filtering
  const [allTrades, setAllTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [filteredStats, setFilteredStats] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tradesPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch all data once on component mount
  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId]);

  // Apply filters when filter parameters change
  useEffect(() => {
    console.log('🔄 Filter useEffect triggered:', {
      timeRange,
      customStartDate,
      customEndDate,
      filterMode,
      allTradesCount: allTrades.length
    });
    
    // Reset to first page when filters change
    setCurrentPage(1);
    
    if (allTrades.length > 0) {
      applyClientSideFilters();
    }
  }, [timeRange, customStartDate, customEndDate, filterMode, allTrades]);

  // Update pagination when current page changes
  useEffect(() => {
    if (filteredTrades.length > 0) {
      const startIndex = (currentPage - 1) * tradesPerPage;
      const endIndex = startIndex + tradesPerPage;
      const paginatedTrades = filteredTrades.slice(startIndex, endIndex);
      setRecentTrades(paginatedTrades);
      
      console.log('📄 Pagination updated:', {
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        paginatedTradesCount: paginatedTrades.length
      });
    }
  }, [currentPage, filteredTrades, tradesPerPage, totalPages]);

  // Fetch all data once (no filtering parameters)
  const fetchAllData = async () => {
    console.log('📊 Starting fetchAllData for userId:', userId);
    
    setLoading(true);
    try {
      // Fetch all trades without any filtering
      const tradesData = await tradesAPI.getAllTrades({
        userId,
        page: 1,
        limit: 1000 // Get a large number of trades
      });
      
      console.log('📋 All Trades Fetched:', {
        tradesCount: tradesData?.trades?.length,
        totalPages: tradesData?.totalPages,
        currentPage: tradesData?.currentPage,
        firstTrade: tradesData?.trades?.[0],
        lastTrade: tradesData?.trades?.[tradesData?.trades?.length - 1]
      });
      
      setAllTrades(tradesData.trades || []);
      
    } catch (error) {
      console.error('❌ Error fetching all data:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering function
  const applyClientSideFilters = () => {
    console.log('🔍 Starting client-side filtering with:', {
      filterMode,
      timeRange,
      customStartDate,
      customEndDate,
      allTradesCount: allTrades.length,
      isAllTime: timeRange === 'all' && filterMode === 'preset'
    });

    if (allTrades.length === 0) {
      console.log('⚠️ No trades to filter');
      return;
    }

    let filtered = [...allTrades];
    let dateRange = getDateRange();

    if (dateRange) {
      console.log('📅 Applying date filter:', dateRange);
      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= dateRange.startDate && tradeDate <= dateRange.endDate;
      });
    } else {
      console.log('📅 No date filter applied - showing all trades');
    }

    console.log('✅ Filtered trades:', {
      originalCount: allTrades.length,
      filteredCount: filtered.length,
      dateRange: dateRange || 'All Time',
      totalPages: Math.ceil(filtered.length / tradesPerPage),
      currentPage: currentPage
    });

    setFilteredTrades(filtered);
    
    // Calculate pagination
    const totalPagesCount = Math.ceil(filtered.length / tradesPerPage);
    setTotalPages(totalPagesCount);
    
    // Reset to first page if current page exceeds total pages
    const validCurrentPage = currentPage > totalPagesCount ? 1 : currentPage;
    if (validCurrentPage !== currentPage) {
      setCurrentPage(validCurrentPage);
    }
    
    // Get paginated trades
    const startIndex = (validCurrentPage - 1) * tradesPerPage;
    const endIndex = startIndex + tradesPerPage;
    const paginatedTrades = filtered.slice(startIndex, endIndex);
    
    setRecentTrades(paginatedTrades);
    
    // Calculate stats for filtered data
    const calculatedStats = calculateStats(filtered);
    setFilteredStats(calculatedStats);
    setStats(calculatedStats);
  };

  // Get date range based on current filter mode
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (filterMode === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: new Date(customStartDate),
        endDate: new Date(customEndDate + 'T23:59:59.999Z') // End of day
      };
    }

    if (filterMode === 'preset') {
      // Handle "All Time" case - no date filtering
      if (timeRange === 'all') {
        return null;
      }
      
      let startDate = new Date(today);
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(today.getDate() - 7);
          break;
        case '10d':
          startDate.setDate(today.getDate() - 10);
          break;
        case '1m':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case '2m':
          startDate.setMonth(today.getMonth() - 2);
          break;
        case '3m':
          startDate.setMonth(today.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(today.getMonth() - 6);
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
    }

    return null;
  };

  // Calculate stats from filtered trades
  const calculateStats = (trades) => {
    console.log('📊 Calculating stats for', trades.length, 'trades');
    
    if (trades.length === 0) {
      return {
        overview: {
          totalTrades: 0,
          winRate: 0,
          totalPnL: 0,
          avgExecutionScore: 0,
          bestInstrument: 'N/A',
          maxWinStreak: 0,
          avgRiskReward: 'N/A',
          profitableDays: 0,
          lossDays: 0
        }
      };
    }

    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => trade.result === 'win').length;
    const winRate = Math.round((winningTrades / totalTrades) * 100);
    
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    const avgExecutionScore = trades.reduce((sum, trade) => sum + (trade.executionScore || 0), 0) / totalTrades;
    
    // Find best instrument
    const instrumentPnL = {};
    trades.forEach(trade => {
      if (!instrumentPnL[trade.instrument]) {
        instrumentPnL[trade.instrument] = 0;
      }
      instrumentPnL[trade.instrument] += trade.pnl || 0;
    });
    
    const bestInstrument = Object.keys(instrumentPnL).reduce((best, instrument) => 
      instrumentPnL[instrument] > (instrumentPnL[best] || -Infinity) ? instrument : best
    , 'N/A');

    // Calculate win streak
    let maxWinStreak = 0;
    let currentStreak = 0;
    
    trades.forEach(trade => {
      if (trade.result === 'win') {
        currentStreak++;
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Calculate daily P&L for profitable/loss days
    const dailyPnL = {};
    trades.forEach(trade => {
      const dateKey = new Date(trade.date).toDateString();
      if (!dailyPnL[dateKey]) {
        dailyPnL[dateKey] = 0;
      }
      dailyPnL[dateKey] += trade.pnl || 0;
    });

    const profitableDays = Object.values(dailyPnL).filter(pnl => pnl > 0).length;
    const lossDays = Object.values(dailyPnL).filter(pnl => pnl < 0).length;

    const calculatedStats = {
      overview: {
        totalTrades,
        winRate,
        totalPnL,
        avgExecutionScore,
        bestInstrument,
        maxWinStreak,
        avgRiskReward: 'N/A', // Can be calculated if risk/reward data is available
        profitableDays,
        lossDays
      }
    };

    console.log('📊 Calculated stats:', calculatedStats);
    return calculatedStats;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleTradeAdded = () => {
    fetchAllData(); // Refresh all data
  };

  // Handle filter application
  const applyFilters = () => {
    console.log('🔄 Apply Filters called with tempFilters:', tempFilters);
    
    if (tempFilters.mode === 'custom') {
      if (!tempFilters.startDate || !tempFilters.endDate) {
        console.log('❌ Missing dates for custom filter');
        alert('Please select both start and end dates');
        return;
      }
      if (new Date(tempFilters.startDate) > new Date(tempFilters.endDate)) {
        console.log('❌ Invalid date range - start date after end date');
        alert('Start date must be before end date');
        return;
      }
      
      console.log('✅ Applying custom date range:', {
        startDate: tempFilters.startDate,
        endDate: tempFilters.endDate
      });
      
      setCustomStartDate(tempFilters.startDate);
      setCustomEndDate(tempFilters.endDate);
      setFilterMode('custom');
    } else {
      console.log('✅ Applying preset filter mode');
      setFilterMode('preset');
    }
    setShowFilters(false);
  };

  // Handle filter reset
  const resetFilters = () => {
    console.log('🔄 Reset Filters called');
    setFilterMode('preset');
    setTimeRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setTempFilters({
      startDate: '',
      endDate: '',
      mode: 'preset'
    });
    setShowFilters(false);
    console.log('✅ Filters reset to default state');
  };

  // Get current filter description
  const getFilterDescription = () => {
    if (filterMode === 'custom' && customStartDate && customEndDate) {
      return `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
    }
    return timeRangeOptions.find(opt => opt.value === timeRange)?.label || 'All Time';
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

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showPages = 5; // Show 5 page numbers
      
      let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
      let endPage = Math.min(totalPages, startPage + showPages - 1);
      
      // Adjust start page if we're near the end
      if (endPage - startPage + 1 < showPages) {
        startPage = Math.max(1, endPage - showPages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-500">
          <span>
            Showing {((currentPage - 1) * tradesPerPage) + 1} to {Math.min(currentPage * tradesPerPage, filteredTrades.length)} of {filteredTrades.length} trades
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 text-sm border rounded ${
              currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          
          {/* Page Numbers */}
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 py-1 text-sm border rounded ${
                currentPage === pageNum
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          ))}
          
          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 text-sm border rounded ${
              currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

  // Time range options configuration
  const timeRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: '7 Days' },
    { value: '10d', label: '10 Days' },
    { value: '1m', label: '1 Month' },
    { value: '2m', label: '2 Months' },
    { value: '3m', label: '3 Months' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' }
  ];

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
              {/* Enhanced Filter Controls */}
              <div className="flex items-center space-x-2">
                {/* Quick Time Range Selector (only show in preset mode) */}
                {filterMode === 'preset' && (
                  <div className="relative">
                    <select
                      value={timeRange}
                      onChange={(e) => {
                        console.log('⏰ Time range changed from', timeRange, 'to', e.target.value);
                        setTimeRange(e.target.value);
                      }}
                      className={`form-input py-2 px-3 pr-8 text-sm rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      {timeRangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Advanced Filters Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg border transition-colors ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${showFilters ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filters
                  {(filterMode === 'custom' || showFilters) && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {filterMode === 'custom' ? 'Custom' : 'Active'}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
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
          
          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Date Filters
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className={`p-1 rounded-md hover:bg-gray-200 ${darkMode ? 'hover:bg-gray-700' : ''}`}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filter Mode Toggle */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Filter Type
                  </label>
                  <select
                    value={tempFilters.mode}
                    onChange={(e) => setTempFilters({...tempFilters, mode: e.target.value})}
                    className={`form-input w-full py-2 px-3 text-sm rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="preset">Quick Ranges</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {/* Custom Date Range Fields */}
                {tempFilters.mode === 'custom' && (
                  <>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={tempFilters.startDate}
                        onChange={(e) => setTempFilters({...tempFilters, startDate: e.target.value})}
                        className={`form-input w-full py-2 px-3 text-sm rounded-lg border ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        End Date
                      </label>
                      <input
                        type="date"
                        value={tempFilters.endDate}
                        onChange={(e) => setTempFilters({...tempFilters, endDate: e.target.value})}
                        className={`form-input w-full py-2 px-3 text-sm rounded-lg border ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex items-end space-x-2">
                  <button
                    onClick={applyFilters}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={resetFilters}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Current Filter Indicator */}
          <div className="mt-3 flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-blue-100 text-blue-800'
            }`}>
              <CalendarDaysIcon className="h-3 w-3 mr-1" />
              {filterMode === 'custom' ? 'Custom Range: ' : 'Showing data for: '}
              {getFilterDescription()}
            </span>
            
            {/* Stats Summary */}
            {stats && (
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>{stats.overview.totalTrades} trades</span>
                <span className={stats.overview.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(stats.overview.totalPnL)} P&L
                </span>
                <span>{stats.overview.winRate}% win rate</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0 space-y-6">
          
          {/* Key Performance Indicators */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6 w-full">
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
                title="Best Instrument"
                value={stats.overview.bestInstrument || 'N/A'}
                color="success"
              />
              <StatCard
                title="Win Streak"
                value={stats.overview.maxWinStreak || 0}
                color="success"
                icon={FireIcon}
              />
              <StatCard
                title="Risk:Reward"
                value={stats.overview.avgRiskReward || 'N/A'}
                color="primary"
              />
            </div>
          )}

          {/* Enhanced Filter Summary */}
          {stats && (
            <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800' : 'bg-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-blue-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} mr-3`}>
                    <ChartBarIcon className={`h-5 w-5 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                      Performance Summary
                    </h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                      {getFilterDescription()} • {stats.overview.totalTrades} trades • {formatCurrency(stats.overview.totalPnL)} P&L
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    stats.overview.winRate >= 60 ? 'bg-green-100 text-green-800' : 
                    stats.overview.winRate >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {stats.overview.winRate}% Win Rate
                  </span>
                  {filterMode === 'custom' && (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
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
                {/* <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Trading Calendar</h2>
                  <p className="text-sm text-gray-600">Click on any date to add a trade</p>
                </div> */}
                <div className=" calendar-container">
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
                  <h3 className="text-lg font-semibold text-gray-900">All Trades</h3>
                  <p className="text-sm text-gray-600">
                    {filteredTrades.length > 0 ? (
                      <>
                        Showing {filteredTrades.length} trades
                        {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                      </>
                    ) : (
                      'No trades found'
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {tradesPerPage} per page
                  </span>
                  <Link 
                    to="/trades" 
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    View all trades →
                  </Link>
                </div>
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
            
            {/* Pagination Controls */}
            {recentTrades.length > 0 && <PaginationControls />}
            
            {/* Empty State */}
            {filteredTrades.length === 0 && (
              <div className="px-6 py-12 text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No trades found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {allTrades.length === 0 
                    ? 'Get started by adding your first trade.'
                    : 'No trades match your current filter. Try adjusting your date range.'
                  }
                </p>
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