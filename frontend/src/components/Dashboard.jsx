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
import { journalApi } from '../utils/journalApi';
import bitcoinIcon from '../assets/bitcoin.png';
import goldIcon from '../assets/gold.png';
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
  XMarkIcon,
  ArrowPathIcon,
  BookOpenIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

// Helper component for instrument icons
const InstrumentIcon = ({ instrument }) => {
  const getIcon = () => {
    const normalizedInstrument = instrument.toLowerCase();
    if (normalizedInstrument.includes('btc') || normalizedInstrument.includes('bitcoin')) {
      return <img src={bitcoinIcon} alt="Bitcoin" className="w-5 h-5 inline-block mr-1" />;
    }
    if (normalizedInstrument.includes('gold') || normalizedInstrument.includes('xau')) {
      return <img src={goldIcon} alt="Gold" className="w-5 h-5 inline-block mr-1" />;
    }
    return null;
  };

  return (
    <span className="flex items-center">
      {getIcon()}
      {instrument}
    </span>
  );
};

const Dashboard = ({ userId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [timeRange, setTimeRange] = useState('all'); // all, 7d, 10d, 1m, 2m, 3m, 6m, 1y, custom
  const [tradeType, setTradeType] = useState('real'); // 'all', 'real', 'backtest'
  
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

  // Journal entries state
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);

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
      tradeType,
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
  }, [timeRange, tradeType, customStartDate, customEndDate, filterMode, allTrades]);

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

  // Helper function to strip HTML tags and get clean preview text
  const getCleanPreviewText = (htmlContent, maxLength = 100) => {
    if (!htmlContent || typeof htmlContent !== 'string') return '';
    
    // Remove HTML tags and replace common HTML entities
    let cleanText = htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace ampersands
      .replace(/&lt;/g, '<') // Replace less than
      .replace(/&gt;/g, '>') // Replace greater than
      .replace(/&quot;/g, '"') // Replace quotes
      .replace(/&#39;/g, "'") // Replace apostrophes
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing whitespace
    
    // Remove markdown-style formatting that might remain
    cleanText = cleanText
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/__(.*?)__/g, '$1') // Remove underline markdown
      .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough markdown
      .trim();
    
    // Truncate and add ellipsis if needed
    if (cleanText.length > maxLength) {
      return cleanText.substring(0, maxLength).trim() + '...';
    }
    
    return cleanText;
  };

  // Fetch journal entries
  const fetchJournalEntries = async (forceRefresh = false) => {
    console.log('📝 Starting fetchJournalEntries for userId:', userId, 'forceRefresh:', forceRefresh);
    
    setJournalLoading(true);
    try {
      const response = await journalApi.getJournalEntries({
        page: 1,
        limit: 5, // Get recent 5 entries for dashboard
        sortBy: 'recent'
      });
      
      if (response.success) {
        console.log('📝 Journal Entries Fetched:', {
          entriesCount: response.data.entries?.length,
          entries: response.data.entries
        });
        setJournalEntries(response.data.entries || []);
      } else {
        console.error('❌ Failed to fetch journal entries:', response.message);
        setJournalEntries([]);
      }
    } catch (error) {
      console.error('❌ Error fetching journal entries:', error);
      setJournalEntries([]);
    } finally {
      setJournalLoading(false);
    }
  };

  // Fetch all data once (no filtering parameters) with intelligent caching
  const fetchAllData = async (forceRefresh = false) => {
    console.log('📊 Starting fetchAllData for userId:', userId, 'forceRefresh:', forceRefresh);
    
    setLoading(true);
    try {
      // Fetch trades and journal entries in parallel
      const [tradesPromise, journalPromise] = await Promise.allSettled([
        tradesAPI.getAllTrades({
          userId,
          page: 1,
          limit: 1000 // Get a large number of trades
        }, !forceRefresh, 10 * 60 * 1000), // 10 minute cache TTL, disable cache if force refresh
        
        fetchJournalEntries(forceRefresh)
      ]);

      // Handle trades data
      if (tradesPromise.status === 'fulfilled') {
        const tradesData = tradesPromise.value;
        console.log('📋 All Trades Fetched:', {
          tradesCount: tradesData?.trades?.length,
          totalPages: tradesData?.totalPages,
          currentPage: tradesData?.currentPage,
          fromCache: tradesData.fromCache || false,
          cacheType: tradesData.cacheType || 'network',
          firstTrade: tradesData?.trades?.[0],
          lastTrade: tradesData?.trades?.[tradesData?.trades?.length - 1]
        });
        setAllTrades(tradesData.trades || []);
      } else {
        console.error('❌ Error fetching trades:', tradesPromise.reason);
      }

      // Journal entries are handled in fetchJournalEntries function
      
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

    // Apply trade type filter
    if (tradeType !== 'all') {
      console.log('🔄 Applying trade type filter:', tradeType);
      if (tradeType === 'real') {
        filtered = filtered.filter(trade => !trade.isBacktest);
      } else if (tradeType === 'backtest') {
        filtered = filtered.filter(trade => trade.isBacktest);
      }
    }

    console.log('✅ Filtered trades:', {
      originalCount: allTrades.length,
      filteredCount: filtered.length,
      dateRange: dateRange || 'All Time',
      tradeType: tradeType,
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

    // Calculate average Risk:Reward ratio
    const riskRewardRatios = trades
      .filter(trade => trade.riskReward && trade.riskReward !== '')
      .map(trade => {
        const ratio = trade.riskReward;
        if (typeof ratio === 'string' && ratio.includes(':')) {
          const [risk, reward] = ratio.split(':').map(Number);
          if (!isNaN(risk) && !isNaN(reward) && risk > 0) {
            return reward / risk;
          }
        }
        return null;
      })
      .filter(ratio => ratio !== null);

    const avgRiskReward = riskRewardRatios.length > 0 
      ? (() => {
          const avgRatio = riskRewardRatios.reduce((sum, ratio) => sum + ratio, 0) / riskRewardRatios.length;
          // Format as 1:X or X:1 depending on whether it's above or below 1
          if (avgRatio >= 1) {
            return `1:${avgRatio.toFixed(2)}`;
          } else {
            return `${(1/avgRatio).toFixed(2)}:1`;
          }
        })()
      : 'N/A';

    const calculatedStats = {
      overview: {
        totalTrades,
        winRate,
        totalPnL,
        avgExecutionScore,
        bestInstrument,
        maxWinStreak,
        avgRiskReward,
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
    fetchAllData(true); // Force refresh all data after adding trade
    fetchJournalEntries(true); // Also refresh journal entries
  };

  // Listen for cache updates and page visibility changes
  useEffect(() => {
    const handleCacheUpdate = (event) => {
      const { cacheKey, data } = event.detail;
      console.log('[Dashboard] Cache update received:', cacheKey);
      
      // Check if this cache update affects our trades
      if (cacheKey.includes('/api/trades') && data?.trades) {
        console.log('[Dashboard] Updating trades from cache update');
        setAllTrades(data.trades);
      }

      // Check if this cache update affects our journal entries
      if (cacheKey.includes('/api/journal') && data?.entries) {
        console.log('[Dashboard] Updating journal entries from cache update');
        setJournalEntries(data.entries);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        console.log('[Dashboard] Page became visible, refreshing journal entries');
        fetchJournalEntries(true); // Refresh journal entries when page becomes visible again
      }
    };

    window.addEventListener('apiCacheUpdate', handleCacheUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('apiCacheUpdate', handleCacheUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

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

  const StatCard = ({ title, value, color = 'default', subtitle = null, icon: Icon, trend = null, isInstrument = false }) => {
    const getColorClasses = (color) => {
      const colors = {
        default: 'bg-white border-gray-200',
        success: 'bg-white border-green-200',
        danger: 'bg-white border-red-200'
      };
      return colors[color] || colors.default;
    };

    return (
      <div className={`stat-card ${getColorClasses(color)} border rounded-lg p-4 hover:shadow-sm transition-shadow`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-lg font-bold text-gray-900">
              {isInstrument ? <InstrumentIcon instrument={value} /> : value}
            </p>
            {subtitle && (
              <div className="flex items-center mt-1">
                <p className="text-xs text-gray-500">{subtitle}</p>
                {trend && (
                  <span className={`ml-2 flex items-center text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend > 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                    {Math.abs(trend)}%
                  </span>
                )}
              </div>
            )}
          </div>
          {Icon && <Icon className="h-5 w-5 text-gray-400" />}
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
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Trading Dashboard</h1>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="form-input py-1.5 px-3 text-sm rounded border border-gray-300"
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={tradeType}
                onChange={(e) => setTradeType(e.target.value)}
                className="form-input py-1.5 px-3 text-sm rounded border border-gray-300"
              >
                <option value="real">Real Trades</option>
                <option value="backtest">Backtest</option>
                <option value="all">All Trades</option>
              </select>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-1.5 text-sm rounded border border-gray-300 bg-white"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                Filters
              </button>

              <button
                onClick={() => fetchAllData(true)}
                className="flex items-center px-3 py-1.5 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50"
                title="Refresh data (bypass cache)"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </button>
              
              {/* <Link
                to="/pre-trade-checklist"
                className="btn-primary py-1.5"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                New Trade
              </Link> */}
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 rounded border border-gray-200 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <select
                    value={tempFilters.mode}
                    onChange={(e) => setTempFilters({...tempFilters, mode: e.target.value})}
                    className="form-input w-full py-1.5 px-3 text-sm rounded border border-gray-300"
                  >
                    <option value="preset">Quick Ranges</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {tempFilters.mode === 'custom' && (
                  <>
                    <div>
                      <input
                        type="date"
                        value={tempFilters.startDate}
                        onChange={(e) => setTempFilters({...tempFilters, startDate: e.target.value})}
                        className="form-input w-full py-1.5 px-3 text-sm rounded border border-gray-300"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        value={tempFilters.endDate}
                        onChange={(e) => setTempFilters({...tempFilters, endDate: e.target.value})}
                        className="form-input w-full py-1.5 px-3 text-sm rounded border border-gray-300"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={applyFilters}
                    className="btn-primary text-sm px-4 py-1.5"
                  >
                    Apply
                  </button>
                  <button
                    onClick={resetFilters}
                    className="btn-secondary text-sm px-4 py-1.5"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Filter Summary with Cache Status */}
          {stats && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {getFilterDescription()} • {stats.overview.totalTrades} trades • {formatCurrency(stats.overview.totalPnL)} P&L
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  Win Rate: {stats.overview.winRate}%
                </span>
                {/* Simple cache indicator - just shows when data is from cache */}
                {typeof window !== 'undefined' && window.localStorage.getItem('showCacheStatus') === 'true' && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    📊 Cached Data
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Trades"
              value={stats.overview.totalTrades}
              icon={ChartBarIcon}
            />
            <StatCard
              title="Win Rate"
              value={`${stats.overview.winRate}%`}
              color={stats.overview.winRate >= 50 ? 'success' : 'danger'}
              icon={stats.overview.winRate >= 50 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
              style={{ gridArea: '1 / 2', borderBottom: '1px solid #ccc' }}
            />
            {/* <StatCard
              title="Total P&L"
              value={formatCurrency(stats.overview.totalPnL)}
              color={stats.overview.totalPnL >= 0 ? 'success' : 'danger'}
              icon={CurrencyDollarIcon}
            /> */}
            {/* <StatCard
              title="Best Instrument"
              value={stats.overview.bestInstrument || 'N/A'}
              isInstrument={true}
            /> */}
            <StatCard
              title="Win Streak"
              value={stats.overview.maxWinStreak || 0}
              icon={FireIcon}
            />
            <StatCard
              title="Risk:Reward"
              value={stats.overview.avgRiskReward || 'N/A'}
            />
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white shadow-sm rounded border border-gray-200">
          <div className="calendar-container">
            <CalendarView onDateClick={handleDateClick} selectedDate={selectedDate} userId={userId} />
          </div>
        </div>

        {/* Journal Preview Section */}
        <div className="bg-white shadow-sm rounded border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpenIcon className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-medium text-gray-900">Recent Journal Entries</h3>
              </div>
              <Link 
                to="/journal" 
                className="text-sm text-purple-600 hover:text-purple-500"
              >
                View all →
              </Link>
            </div>
          </div>

          <div className="p-4">
            {journalLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="flex space-x-2">
                      <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-5 bg-gray-200 rounded-full w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : journalEntries.length > 0 ? (
              <div className="space-y-3">
                {journalEntries.map((entry) => (
                  <Link
                    key={entry._id}
                    to={`/journal/${entry._id}`}
                    className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {entry.title || 'Untitled Entry'}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {getCleanPreviewText(entry.content, 80) || 'No content preview available...'}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {/* Tags */}
                          {entry.tags && entry.tags.slice(0, 2).map((tag) => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800"
                            >
                              #{tag}
                            </span>
                          ))}
                          {entry.tags && entry.tags.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{entry.tags.length - 2} more
                            </span>
                          )}
                          
                          {/* Indicators */}
                          <div className="flex items-center space-x-2 ml-auto">
                            {entry.hasDrawing && (
                              <div className="flex items-center text-xs text-gray-500">
                                <PencilSquareIcon className="h-3 w-3 mr-1 text-green-500" />
                                Chart
                              </div>
                            )}
                            {entry.linkedTrades && entry.linkedTrades.length > 0 && (
                              <div className="flex items-center text-xs text-gray-500">
                                <ChartBarIcon className="h-3 w-3 mr-1 text-blue-500" />
                                {entry.linkedTrades.length}
                              </div>
                            )}
                            {entry.isFavorite && (
                              <div className="text-red-500">
                                <BookOpenIcon className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-3 flex-shrink-0">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No journal entries yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start documenting your trading journey
                </p>
                <div className="mt-6">
                  <Link
                    to="/journal/new"
                    className="btn-primary text-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create First Entry
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Journal Actions */}
            {journalEntries.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">
                    📝 {journalEntries.length} recent entries
                  </span>
                  <span className="text-xs text-gray-600">•</span>
                  <span className="text-xs text-gray-600">
                    🎯 {journalEntries.filter(e => e.hasDrawing).length} with charts
                  </span>
                  <span className="text-xs text-gray-600">•</span>
                  <span className="text-xs text-gray-600">
                    ⭐ {journalEntries.filter(e => e.isFavorite).length} favorites
                  </span>
                </div>
                <Link
                  to="/journal/new"
                  className="btn-secondary text-xs"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  Quick Entry
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Trades Table */}
        <div className="bg-white shadow-sm rounded border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">All Trades</h3>
              <Link 
                to="/trades" 
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View all →
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
                      <InstrumentIcon instrument={trade.instrument} />
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
      </main>

      {/* Keep existing TradeModal component */}
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