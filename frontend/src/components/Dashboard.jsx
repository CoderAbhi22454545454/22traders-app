import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import CalendarView from './CalendarView';
import TradeModal from './TradeModal';
import TradeScreenshot from './TradeScreenshot';
import DashboardLayoutManager, { DashboardCustomizeButton } from './DashboardLayoutManager';
import { tradesAPI, formatCurrency } from '../utils/api';
import { journalApi } from '../utils/journalApi';
import bitcoinIcon from '../assets/bitcoin.png';
import goldIcon from '../assets/gold.png';
import BacktestGoalCards from './BacktestGoalCards';
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
  PencilSquareIcon,
  TrophyIcon
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

  // Dashboard layout state
  const [isLayoutManagerOpen, setIsLayoutManagerOpen] = useState(false);
  const [dashboardSections, setDashboardSections] = useState(() => {
    if (userId) {
      const saved = localStorage.getItem(`dashboard-layout-${userId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error('Error loading saved layout:', error);
        }
      }
    }
    return [
      { id: 'today-performance', name: "Today's Performance", enabled: true },
      { id: 'trading-calendar', name: 'Trading Calendar', enabled: true },
      { id: 'risk-alerts', name: 'Risk Alerts', enabled: true },
      { id: 'quick-actions', name: 'Quick Actions', enabled: true },
      { id: 'context-row', name: 'Context Row (Streak, Checklist, Session)', enabled: true },
      { id: 'performance-overview', name: 'Performance Overview', enabled: true },
      { id: 'key-metrics', name: 'Key Metrics', enabled: true },
      { id: 'recent-journal', name: 'Recent Journal Entries', enabled: true },
      { id: 'backtest-goals', name: 'Backtest Goals Progress', enabled: true },
    ];
  });

  // New Phase 1 & 2 state
  const [todayStats, setTodayStats] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem(`daily-goal-${userId}`);
    return saved ? JSON.parse(saved) : { target: 200, enabled: true };
  });
  const [riskLimits, setRiskLimits] = useState(() => {
    const saved = localStorage.getItem(`risk-limits-${userId}`);
    return saved ? JSON.parse(saved) : {
      maxDailyLoss: 200,
      maxTradesPerDay: 8,
      enabled: true
    };
  });
  const [tradingChecklist, setTradingChecklist] = useState(() => {
    const saved = localStorage.getItem(`trading-checklist-${userId}-${new Date().toDateString()}`);
    return saved ? JSON.parse(saved) : {
      marketAnalysis: false,
      strategyDefined: false,
      rulesReviewed: false,
      preTradeChecklist: false,
      endOfDayReview: false
    };
  });
  const [currentSession, setCurrentSession] = useState('Unknown');
  const [insights, setInsights] = useState([]);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalTarget, setGoalTarget] = useState('');

  // Fetch all data once on component mount
  useEffect(() => {
    if (userId) {
      fetchAllData();
    }
  }, [userId]);

  // Save goals and limits to localStorage
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`daily-goal-${userId}`, JSON.stringify(dailyGoal));
    }
  }, [dailyGoal, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`risk-limits-${userId}`, JSON.stringify(riskLimits));
    }
  }, [riskLimits, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`trading-checklist-${userId}-${new Date().toDateString()}`, JSON.stringify(tradingChecklist));
    }
  }, [tradingChecklist, userId]);

  // Calculate today's stats and current session
  useEffect(() => {
    if (allTrades.length > 0) {
      calculateTodayStats();
      updateCurrentSession();
    }
  }, [allTrades]);

  // Generate smart insights after todayStats is calculated
  useEffect(() => {
    if (allTrades.length > 0 && todayStats !== null) {
      generateSmartInsights();
    }
  }, [allTrades, todayStats, currentSession, riskLimits]);

  // Update session every minute
  useEffect(() => {
    const interval = setInterval(updateCurrentSession, 60000);
    return () => clearInterval(interval);
  }, []);

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

  // Helper function to get relative time (e.g., "2 hours ago", "Just now")
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    
    // For older entries, show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

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

  // Fetch journal entries with real-time updates
  const fetchJournalEntries = async (forceRefresh = false) => {
    console.log('📝 Starting fetchJournalEntries for userId:', userId, 'forceRefresh:', forceRefresh);
    
    setJournalLoading(true);
    try {
      const response = await journalApi.getJournalEntries({
        page: 1,
        limit: 20, // Fetch more entries to sort by updatedAt
        sortBy: '-updatedAt' // Sort by most recently modified (updatedAt descending)
      }, forceRefresh); // Pass forceRefresh to bypass cache if needed
      
      if (response.success) {
        console.log('📝 Journal Entries Fetched:', {
          entriesCount: response.data.entries?.length,
          entries: response.data.entries,
          fromCache: response.fromCache || false
        });
        
        // Sort by updatedAt (most recently modified) on frontend as well
        // Fallback to createdAt if updatedAt doesn't exist
        const sortedEntries = (response.data.entries || []).sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA; // Descending order (newest first)
        });
        
        // Take only the top 5 most recently modified
        setJournalEntries(sortedEntries.slice(0, 5));
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

  // Real-time polling for journal entries (every 30 seconds)
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchJournalEntries();

    // Set up polling interval
    const pollInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing journal entries...');
      fetchJournalEntries(false); // Use cache if available, but check for updates
    }, 30000); // Every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, [userId]);

  // Refresh journal entries when page becomes visible or window regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        console.log('👁️ Page visible - refreshing journal entries');
        fetchJournalEntries(true); // Force refresh when page becomes visible
      }
    };

    const handleFocus = () => {
      if (userId) {
        console.log('🎯 Window focused - refreshing journal entries');
        fetchJournalEntries(true); // Force refresh when window regains focus
      }
    };

    // Listen for storage events (when journal entries are updated in another tab)
    const handleStorageChange = (e) => {
      if (e.key && e.key.includes('journal') && userId) {
        console.log('💾 Storage change detected - refreshing journal entries');
        fetchJournalEntries(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userId]);

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
    const winningTrades = trades.filter(trade => getTradeResult(trade) === 'win').length;
    const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;
    
    const totalPnL = trades.reduce((sum, trade) => sum + (parseFloat(trade.pnl) || 0), 0);
    
    const tradesWithScore = trades.filter(t => t.executionScore);
    const avgExecutionScore = tradesWithScore.length > 0 
      ? tradesWithScore.reduce((sum, trade) => sum + (parseFloat(trade.executionScore) || 0), 0) / tradesWithScore.length
      : 0;
    
    // Find best instrument
    const instrumentPnL = {};
    trades.forEach(trade => {
      const inst = trade.instrument || 'Unknown';
      if (!instrumentPnL[inst]) {
        instrumentPnL[inst] = 0;
      }
      instrumentPnL[inst] += parseFloat(trade.pnl) || 0;
    });
    
    const bestInstrument = Object.keys(instrumentPnL).reduce((best, instrument) => 
      instrumentPnL[instrument] > (instrumentPnL[best] || -Infinity) ? instrument : best
    , 'N/A');

    // Calculate win streak
    let maxWinStreak = 0;
    let currentStreak = 0;
    
    // Sort trades chronologically for streak calculation
    const sortedTradesForStreak = [...trades].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() === dateB.getTime()) {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return dateA - dateB;
    });
    
    sortedTradesForStreak.forEach(trade => {
      const result = getTradeResult(trade);
      if (result === 'win') {
        currentStreak++;
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else if (result === 'loss' || result === 'be') {
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

  // Calculate today's statistics
  // Helper function to get trade result (handles both result and tradeOutcome fields)
  const getTradeResult = (trade) => {
    if (trade.result) {
      return trade.result.toLowerCase();
    }
    if (trade.tradeOutcome) {
      const outcome = trade.tradeOutcome.toLowerCase();
      if (outcome === 'win') return 'win';
      if (outcome === 'loss') return 'loss';
      if (outcome === 'break even' || outcome === 'be') return 'be';
    }
    // If PnL is available, determine from that
    if (trade.pnl !== undefined && trade.pnl !== null) {
      if (trade.pnl > 0) return 'win';
      if (trade.pnl < 0) return 'loss';
      return 'be';
    }
    return null;
  };

  const calculateTodayStats = () => {
    const today = new Date().toDateString();
    const todayTrades = allTrades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.toDateString() === today;
    });
    
    if (todayTrades.length === 0) {
      setTodayStats({
        trades: 0,
        wins: 0,
        losses: 0,
        pnl: 0,
        winRate: 0,
        currentStreak: 0,
        streakType: 'none'
      });
      return;
    }

    const wins = todayTrades.filter(t => getTradeResult(t) === 'win').length;
    const losses = todayTrades.filter(t => getTradeResult(t) === 'loss').length;
    const pnl = todayTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    const winRate = todayTrades.length > 0 ? Math.round((wins / todayTrades.length) * 100) : 0;

    // Calculate current streak - sort chronologically (oldest to newest) to get proper streak
    let currentStreak = 0;
    let streakType = 'none';
    
    // Sort all trades chronologically (oldest first)
    const sortedTrades = [...allTrades].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() === dateB.getTime()) {
        // If same date, use createdAt as tiebreaker
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return dateA - dateB;
    });
    
    if (sortedTrades.length > 0) {
      // Start from the most recent trade and work backwards
      const reversedTrades = [...sortedTrades].reverse();
      const lastTrade = reversedTrades[0];
      const lastResult = getTradeResult(lastTrade);
      
      if (lastResult && lastResult !== 'be') {
        streakType = lastResult === 'win' ? 'win' : 'loss';
        
        // Count consecutive trades with same result from most recent backwards
        for (const trade of reversedTrades) {
          const tradeResult = getTradeResult(trade);
          if (tradeResult === lastResult) {
            currentStreak++;
          } else if (tradeResult === 'be') {
            // Break even doesn't break the streak, but doesn't count either
            continue;
          } else {
            break;
          }
        }
      }
    }

    setTodayStats({
      trades: todayTrades.length,
      wins,
      losses,
      pnl,
      winRate,
      currentStreak,
      streakType
    });
  };

  // Determine current trading session
  const updateCurrentSession = () => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    
    // Session times (UTC)
    // Sydney: 22:00-07:00 UTC
    // Tokyo: 00:00-09:00 UTC
    // London: 08:00-16:00 UTC
    // New York: 13:00-22:00 UTC
    
    if (utcHour >= 13 && utcHour < 22) {
      setCurrentSession('New York');
    } else if (utcHour >= 8 && utcHour < 16) {
      setCurrentSession('London');
    } else if ((utcHour >= 0 && utcHour < 9) || utcHour === 23) {
      setCurrentSession('Tokyo');
    } else if (utcHour >= 22 || utcHour < 7) {
      setCurrentSession('Sydney');
    } else {
      setCurrentSession('Off Hours');
    }
  };

  // Generate smart insights
  const generateSmartInsights = () => {
    if (allTrades.length === 0) {
      setInsights([]);
      return;
    }

    const newInsights = [];
    const today = new Date().toDateString();
    const todayTrades = allTrades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.toDateString() === today;
    });

    // Check if trading in best session (by PnL)
    const sessionStats = {};
    allTrades.forEach(trade => {
      const session = trade.session || 'Unknown';
      if (!sessionStats[session]) {
        sessionStats[session] = { wins: 0, total: 0, pnl: 0 };
      }
      sessionStats[session].total++;
      sessionStats[session].pnl += parseFloat(trade.pnl) || 0;
      if (getTradeResult(trade) === 'win') sessionStats[session].wins++;
    });

    const bestSession = Object.entries(sessionStats)
      .filter(([_, stats]) => stats.total >= 5) // Only consider sessions with at least 5 trades
      .sort((a, b) => b[1].pnl - a[1].pnl)[0];

    if (bestSession && bestSession[0] === currentSession && bestSession[1].pnl > 0) {
      newInsights.push({
        type: 'success',
        icon: '✅',
        message: `Trading in your best session (${currentSession}) - ${formatCurrency(bestSession[1].pnl)} total P&L`
      });
    }

    // Streak warning - use todayStats if available
    if (todayStats && todayStats.currentStreak > 0) {
      if (todayStats.currentStreak >= 3 && todayStats.streakType === 'win') {
        newInsights.push({
          type: 'warning',
          icon: '⚠️',
          message: `${todayStats.currentStreak} consecutive wins - stay disciplined on next trade`
        });
      } else if (todayStats.currentStreak >= 3 && todayStats.streakType === 'loss') {
        newInsights.push({
          type: 'danger',
          icon: '🛑',
          message: `${todayStats.currentStreak} consecutive losses - consider stopping for today`
        });
      }
    }

    // Best instrument this week (by win rate, minimum 3 trades)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekTrades = allTrades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate >= weekAgo;
    });
    
    if (weekTrades.length > 0) {
      const instrumentStats = {};
      weekTrades.forEach(trade => {
        const inst = trade.instrument || 'Unknown';
        if (!instrumentStats[inst]) {
          instrumentStats[inst] = { wins: 0, total: 0, pnl: 0 };
        }
        instrumentStats[inst].total++;
        instrumentStats[inst].pnl += parseFloat(trade.pnl) || 0;
        if (getTradeResult(trade) === 'win') instrumentStats[inst].wins++;
      });

      const bestInstrument = Object.entries(instrumentStats)
        .filter(([_, stats]) => stats.total >= 3)
        .sort((a, b) => {
          // Sort by win rate first, then by PnL
          const winRateA = a[1].wins / a[1].total;
          const winRateB = b[1].wins / b[1].total;
          if (Math.abs(winRateA - winRateB) < 0.1) {
            return b[1].pnl - a[1].pnl;
          }
          return winRateB - winRateA;
        })[0];

      if (bestInstrument) {
        const winRate = Math.round((bestInstrument[1].wins / bestInstrument[1].total) * 100);
        if (winRate >= 60 && bestInstrument[1].pnl > 0) {
          newInsights.push({
            type: 'info',
            icon: '📊',
            message: `${bestInstrument[0]}: ${winRate}% win rate, ${formatCurrency(bestInstrument[1].pnl)} P&L this week`
          });
        }
      }
    }

    // Risk limit warnings
    if (todayStats && riskLimits.enabled) {
      const dailyLoss = Math.abs(Math.min(todayStats.pnl, 0));
      if (dailyLoss > 0 && dailyLoss >= riskLimits.maxDailyLoss * 0.8) {
        newInsights.push({
          type: 'danger',
          icon: '🚨',
          message: `Daily loss at ${((dailyLoss / riskLimits.maxDailyLoss) * 100).toFixed(0)}% of limit (${formatCurrency(dailyLoss)}/${formatCurrency(riskLimits.maxDailyLoss)})`
        });
      }

      if (todayTrades.length >= riskLimits.maxTradesPerDay * 0.8) {
        newInsights.push({
          type: 'warning',
          icon: '⚡',
          message: `${todayTrades.length}/${riskLimits.maxTradesPerDay} trades today - approaching limit`
        });
      }
    }

    // Today's performance insight
    if (todayStats && todayTrades.length > 0) {
      if (todayStats.winRate >= 70 && todayStats.pnl > 0) {
        newInsights.push({
          type: 'success',
          icon: '🎯',
          message: `Great day! ${todayStats.winRate}% win rate, ${formatCurrency(todayStats.pnl)} P&L`
        });
      } else if (todayStats.winRate < 30 && todayStats.pnl < 0 && todayTrades.length >= 3) {
        newInsights.push({
          type: 'warning',
          icon: '📉',
          message: `Low win rate today (${todayStats.winRate}%) - review your strategy`
        });
      }
    }

    setInsights(newInsights);
  };

  // Toggle checklist item
  const toggleChecklistItem = (item) => {
    setTradingChecklist(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  // Handle daily goal setting
  const handleSetDailyGoal = () => {
    const target = parseFloat(goalTarget);
    if (target > 0) {
      setDailyGoal({
        target: target,
        enabled: true
      });
      setIsEditingGoal(false);
      setGoalTarget('');
    }
  };

  const handleEditGoal = () => {
    setGoalTarget(dailyGoal.target.toString());
    setIsEditingGoal(true);
  };

  const handleCancelEdit = () => {
    setIsEditingGoal(false);
    setGoalTarget('');
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

  // Handler for layout save
  const handleLayoutSave = (newSections) => {
    setDashboardSections(newSections);
    // Layout is already saved to localStorage in DashboardLayoutManager
    // Just update state to trigger re-render
  };

  // Helper function to get section component by ID
  const getSectionComponent = (sectionId) => {
    const section = dashboardSections.find(s => s.id === sectionId);
    if (!section || !section.enabled) return null;

    switch (sectionId) {
      case 'today-performance':
        return todayStats ? (
          <div key={sectionId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <h3 className="text-2xl font-bold text-gray-900">Today's Performance</h3>
              </div>
              <div className="text-right bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Active Session</div>
                <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {currentSession}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1 font-medium">Trades</div>
                <div className="text-2xl font-bold text-gray-900">{todayStats.trades}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {todayStats.wins}W • {todayStats.losses}L
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1 font-medium">P&L</div>
                <div className={`text-2xl font-bold ${todayStats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(todayStats.pnl)}
                </div>
                <div className="text-xs text-gray-500 mt-1">{todayStats.winRate}% Win Rate</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1 font-medium">Streak</div>
                <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                  {todayStats.streakType === 'win' && '🔥'}
                  {todayStats.streakType === 'loss' && '❄️'}
                  {todayStats.currentStreak}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {todayStats.streakType === 'win' && 'Wins'}
                  {todayStats.streakType === 'loss' && 'Losses'}
                  {todayStats.streakType === 'none' && 'No streak'}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1 font-medium">vs Yesterday</div>
                <div className="text-2xl font-bold">
                  {(() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayTrades = allTrades.filter(
                      t => new Date(t.date).toDateString() === yesterday.toDateString()
                    );
                    const yesterdayPnL = yesterdayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
                    const diff = todayStats.pnl - yesterdayPnL;
                    return (
                      <span className={diff >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                      </span>
                    );
                  })()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Change</div>
              </div>
            </div>
          </div>
        ) : null;

      case 'trading-calendar':
        return (
          <div key={sectionId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-gray-600" />
                Trading Calendar
              </h3>
              <p className="text-sm text-gray-600 mt-1">Click any date to add a trade</p>
            </div>
            <div className="calendar-container p-4">
              <CalendarView onDateClick={handleDateClick} selectedDate={selectedDate} userId={userId} />
            </div>
          </div>
        );

      case 'risk-alerts':
        return riskLimits.enabled && todayStats ? (() => {
          const alerts = [];
          const dailyLoss = Math.abs(Math.min(todayStats.pnl, 0));
          
          if (dailyLoss >= riskLimits.maxDailyLoss * 0.9) {
            alerts.push({
              level: 'danger',
              icon: '🔴',
              message: `Daily loss limit: ${formatCurrency(dailyLoss)}/${formatCurrency(riskLimits.maxDailyLoss)} (${((dailyLoss/riskLimits.maxDailyLoss)*100).toFixed(0)}%)`,
              action: 'STOP TRADING'
            });
          } else if (dailyLoss >= riskLimits.maxDailyLoss * 0.7) {
            alerts.push({
              level: 'warning',
              icon: '🟡',
              message: `Approaching daily loss limit: ${formatCurrency(dailyLoss)}/${formatCurrency(riskLimits.maxDailyLoss)}`,
              action: 'Trade carefully'
            });
          }

          if (todayStats.trades >= riskLimits.maxTradesPerDay) {
            alerts.push({
              level: 'danger',
              icon: '🔴',
              message: `Max trades reached: ${todayStats.trades}/${riskLimits.maxTradesPerDay}`,
              action: 'STOP TRADING'
            });
          } else if (todayStats.trades >= riskLimits.maxTradesPerDay * 0.8) {
            alerts.push({
              level: 'warning',
              icon: '🟡',
              message: `${todayStats.trades}/${riskLimits.maxTradesPerDay} trades today`,
              action: 'Limit approaching'
            });
          }

          if (todayStats.currentStreak >= 3 && todayStats.streakType === 'loss') {
            alerts.push({
              level: 'danger',
              icon: '🛑',
              message: `${todayStats.currentStreak} consecutive losses`,
              action: 'Take a break'
            });
          }

          if (alerts.length === 0 && todayStats.trades > 0) {
            alerts.push({
              level: 'success',
              icon: '🟢',
              message: 'Risk under control',
              action: 'Keep it up!'
            });
          }

          if (alerts.length === 0) return null;

          return (
            <div key={sectionId} className="space-y-3">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 flex items-center justify-between border ${
                    alert.level === 'danger'
                      ? 'bg-red-50 border-red-200'
                      : alert.level === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{alert.icon}</span>
                    <div>
                      <div className={`font-semibold ${
                        alert.level === 'danger'
                          ? 'text-red-900'
                          : alert.level === 'warning'
                          ? 'text-yellow-900'
                          : 'text-green-900'
                      }`}>
                        {alert.message}
                      </div>
                      <div className={`text-sm mt-1 ${
                        alert.level === 'danger'
                          ? 'text-red-700'
                          : alert.level === 'warning'
                          ? 'text-yellow-700'
                          : 'text-green-700'
                      }`}>
                        {alert.action}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })() : null;

      case 'quick-actions':
        return (
          <div key={sectionId} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Actions Hub */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BoltIcon className="h-5 w-5 text-gray-600" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Trade
                </button>
                <Link
                  to="/journal/new"
                  className="flex items-center justify-center px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  Journal
                </Link>
                <Link
                  to="/analytics"
                  className="flex items-center justify-center px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 text-sm font-medium"
                >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
                <button
                  onClick={() => fetchAllData(true)}
                  className="flex items-center justify-center px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 text-sm font-medium"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Last Trade Recap */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-purple-600" />
                Last Trade
              </h3>
              {(() => {
                const lastTrade = allTrades[0];
                if (!lastTrade) {
                  return (
                    <div className="text-center py-8">
                      <ChartBarIcon className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No trades yet</p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Add your first trade →
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-900 text-lg">{lastTrade.instrument}</span>
                      {(() => {
                        const result = getTradeResult(lastTrade);
                        return (
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            result === 'win'
                              ? 'bg-green-100 text-green-800'
                              : result === 'loss'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result ? result.toUpperCase() : 'N/A'} {result === 'win' ? '✅' : result === 'loss' ? '❌' : '➖'}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">P&L</div>
                        <div className={`text-xl font-bold ${lastTrade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(lastTrade.pnl)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Direction</div>
                        <div className="text-lg font-semibold text-gray-900">{lastTrade.direction}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        {(() => {
                          const tradeTime = new Date(lastTrade.date);
                          const now = new Date();
                          const diffMs = now - tradeTime;
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMins / 60);
                          
                          if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
                          if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
                          return tradeTime.toLocaleDateString();
                        })()}
                      </div>
                      <Link
                        to={`/trade/${lastTrade._id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Active Goals Tracker */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  🎯 Active Goals
                </h3>
                {dailyGoal.enabled && !isEditingGoal && (
                  <button
                    onClick={handleEditGoal}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingGoal ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Target ($)
                    </label>
                    <input
                      type="number"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                      placeholder="Enter target amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSetDailyGoal}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : dailyGoal.enabled && todayStats ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-gray-600 font-medium">Daily Target</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(todayStats.pnl)}/{formatCurrency(dailyGoal.target)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          todayStats.pnl >= dailyGoal.target ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min((todayStats.pnl / dailyGoal.target) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {((todayStats.pnl / dailyGoal.target) * 100).toFixed(0)}% Complete
                      </span>
                      {todayStats.pnl >= dailyGoal.target && (
                        <span className="text-xs font-semibold text-green-600">✅ Achieved!</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Target ($)
                    </label>
                    <input
                      type="number"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                      placeholder="Enter target amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <button
                    onClick={handleSetDailyGoal}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Set Daily Goal
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'context-row':
        return (
          <div key={sectionId} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Streak Tracker */}
            {todayStats && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  🔥 Streak Tracker
                </h3>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 mb-2 font-medium">Current Streak</div>
                    <div className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
                      {todayStats.streakType === 'win' && '🔥'}
                      {todayStats.streakType === 'loss' && '❄️'}
                      {todayStats.currentStreak}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {todayStats.streakType === 'win' && 'Consecutive wins'}
                      {todayStats.streakType === 'loss' && 'Consecutive losses'}
                      {todayStats.streakType === 'none' && 'No active streak'}
                    </div>
                  </div>
          {stats && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Best Streak</span>
                        <span className="font-semibold text-gray-900">🏆 {stats.overview.maxWinStreak} wins</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trading Checklist */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                ✅ Today's Checklist
              </h3>
              <div className="space-y-2">
                {[
                  { key: 'marketAnalysis', label: 'Market analysis done', icon: '📊' },
                  { key: 'strategyDefined', label: 'Strategy defined', icon: '🎯' },
                  { key: 'rulesReviewed', label: 'Reviewed rules', icon: '📋' },
                  { key: 'preTradeChecklist', label: 'Pre-trade checklist', icon: '✓' },
                  { key: 'endOfDayReview', label: 'End-of-day review', icon: '📝' }
                ].map(item => (
                  <label
                    key={item.key}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={tradingChecklist[item.key]}
                      onChange={() => toggleChecklistItem(item.key)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm mr-1">{item.icon}</span>
                    <span className={`text-sm flex-1 ${tradingChecklist[item.key] ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Object.values(tradingChecklist).filter(Boolean).length}/5 Completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(Object.values(tradingChecklist).filter(Boolean).length / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Market Session Clock */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🌍 Market Session
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Active Session</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      LIVE
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">{currentSession}</div>
                </div>
                {(() => {
                  const sessionTrades = allTrades.filter(t => t.session === currentSession);
                  if (sessionTrades.length === 0) {
                    return (
                      <div className="text-sm text-gray-500 text-center py-2">
                        No historical data
                      </div>
                    );
                  }
                  const sessionWins = sessionTrades.filter(t => getTradeResult(t) === 'win').length;
                  const sessionWR = sessionTrades.length > 0 ? Math.round((sessionWins / sessionTrades.length) * 100) : 0;
                  const sessionPnL = sessionTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
                  const avgPnL = sessionTrades.length > 0 ? sessionPnL / sessionTrades.length : 0;

                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Win Rate</span>
                        <span className={`font-semibold ${sessionWR >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                          {sessionWR}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Avg P&L</span>
                        <span className={`font-semibold ${avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(avgPnL)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Total Trades</span>
                        <span className="font-semibold text-gray-900">{sessionTrades.length}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );

      case 'performance-overview':
        return stats && todayStats ? (
          <div key={sectionId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📈 Performance Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-2 font-medium">Win Rate</div>
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {todayStats.winRate}%
                </div>
                <div className="text-xs text-gray-500">vs {stats.overview.winRate}% all-time</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-2 font-medium">Today's P&L</div>
                <div className={`text-xl font-bold mb-1 ${todayStats.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(todayStats.pnl)}
                </div>
                <div className="text-xs text-gray-500">{todayStats.trades} trades today</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-2 font-medium">Best Instrument</div>
                <div className="text-lg font-bold text-gray-900 truncate mb-1">
                  {stats.overview.bestInstrument || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">Top performer</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-2 font-medium">Execution Score</div>
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {stats.overview.avgExecutionScore.toFixed(1)}/10
                </div>
                <div className="text-xs text-gray-500">Average quality</div>
              </div>
            </div>
          </div>
        ) : null;

      case 'key-metrics':
        return stats ? (
          <div key={sectionId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-gray-600" />
              Key Metrics
            </h3>
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
              />
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
          </div>
        ) : null;

      case 'recent-journal':
        return (
          <div key={sectionId} className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpenIcon className="h-5 w-5 text-purple-600" />
              </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recent Journal Entries</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {journalLoading ? 'Updating...' : `Last updated: ${new Date().toLocaleTimeString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchJournalEntries(true)}
                    disabled={journalLoading}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh entries"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${journalLoading ? 'animate-spin' : ''}`} />
                  </button>
              <Link 
                to="/journal" 
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
              >
                    View all →
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-4">
              {journalLoading && journalEntries.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                      <div className="flex space-x-2">
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : journalEntries.length > 0 ? (
                <div className="space-y-3">
                  {journalEntries.map((entry, index) => {
                    const isNew = index === 0 && (() => {
                      const entryDate = new Date(entry.updatedAt || entry.createdAt);
                      const now = new Date();
                      const diffMins = (now - entryDate) / 60000;
                      return diffMins < 10;
                    })();

                    return (
                    <Link
                      key={entry._id}
                      to={`/journal/${entry._id}`}
                        className={`block border rounded-lg p-4 hover:shadow-md transition-all ${
                          isNew 
                            ? 'border-purple-300 bg-purple-50 hover:bg-purple-100' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                          {entry.title || 'Untitled Entry'}
                        </h4>
                              {isNew && (
                                <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-semibold rounded-full animate-pulse">
                                  NEW
                                </span>
                              )}
                              {entry.isFavorite && (
                                <span className="text-red-500" title="Favorite">
                                  ⭐
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                              {getCleanPreviewText(entry.content, 120) || 'No content preview available...'}
                        </p>
                            
                            <div className="flex items-center flex-wrap gap-2 mt-3">
                            {/* Tags */}
                              {entry.tags && entry.tags.length > 0 && (
                                <>
                                  {entry.tags.slice(0, 3).map((tag) => (
                            <span 
                              key={tag} 
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-200"
                            >
                              #{tag}
                            </span>
                          ))}
                                  {entry.tags.length > 3 && (
                                    <span className="text-xs text-gray-500 font-medium">
                                      +{entry.tags.length - 3} more
                            </span>
                                  )}
                                </>
                          )}
                            
                              {/* Rich Indicators */}
                              <div className="flex items-center gap-3 ml-auto">
                            {entry.hasDrawing && (
                                <div className="flex items-center text-xs text-gray-600 bg-green-50 px-2 py-1 rounded-full">
                                  <PencilSquareIcon className="h-3 w-3 mr-1 text-green-600" />
                                Chart
                              </div>
                            )}
                            {entry.linkedTrades && entry.linkedTrades.length > 0 && (
                                <div className="flex items-center text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded-full">
                                  <ChartBarIcon className="h-3 w-3 mr-1 text-blue-600" />
                                  {entry.linkedTrades.length} {entry.linkedTrades.length === 1 ? 'trade' : 'trades'}
                              </div>
                            )}
                              </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end flex-shrink-0">
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            {getRelativeTime(entry.updatedAt || entry.createdAt)}
                      </div>
                          {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
                            <div className="text-xs text-gray-400" title={`Created: ${new Date(entry.createdAt).toLocaleString()}`}>
                              Edited
                            </div>
                          )}
                      </div>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpenIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">No journal entries yet</h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                    Start documenting your trading journey, insights, and lessons learned
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Link
                      to="/journal/new"
                      className="btn-primary text-sm px-4 py-2"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create First Entry
                    </Link>
                    <button
                      onClick={() => fetchJournalEntries(true)}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      <ArrowPathIcon className="h-4 w-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'backtest-goals':
        return (
          <div key={sectionId} className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <TrophyIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Backtest Goals Progress</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Track your backtesting achievements</p>
                  </div>
                </div>
                <Link
                  to="/backtests"
                  className="text-sm font-medium text-yellow-600 hover:text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-50 transition-colors"
                >
                  Manage Goals →
                </Link>
              </div>
            </div>
            <div className="p-4">
              <BacktestGoalCards userId={userId} limit={3} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
        {/* Render sections in saved order */}
        {dashboardSections
          .filter(section => section.enabled)
          .map(section => getSectionComponent(section.id))
          .filter(component => component !== null)}
      </main>

      {/* Floating Customize Button */}
      <DashboardCustomizeButton onClick={() => setIsLayoutManagerOpen(true)} />

      {/* Layout Manager Panel */}
      <DashboardLayoutManager
        userId={userId}
        isOpen={isLayoutManagerOpen}
        onClose={() => setIsLayoutManagerOpen(false)}
        onSave={handleLayoutSave}
      />

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
