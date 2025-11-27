import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tradesAPI, formatCurrency } from '../utils/api';
import InstrumentIcon from './shared/InstrumentIcon';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  FunnelIcon,
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  ClockIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  FireIcon
} from '@heroicons/react/24/outline';

const Trades = ({ userId }) => {
  const [allTrades, setAllTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tradesPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    customDateFrom: '',
    customDateTo: '',
    result: 'all',
    instrument: 'all',
    strategy: 'all',
    direction: 'all',
    tradeType: 'all', // 'all', 'real', 'backtest'
    preTradeChecklist: 'all', // 'all', 'completed', 'skipped', 'excellent', 'good', 'fair', 'poor', 'terrible'
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  // View state
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'notebook'
  const [notebookPage, setNotebookPage] = useState(1); // Current page in notebook view

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

  // Fetch all trades once on component mount
  useEffect(() => {
    if (userId) {
      fetchAllTrades();
    }
  }, [userId]);

  // Apply filters when filter parameters change
  useEffect(() => {
    console.log('🔄 Trades filters changed:', filters);
    if (allTrades.length > 0) {
      applyFilters();
    }
  }, [filters, allTrades, searchTerm]);

  // Update pagination when filtered trades change
  useEffect(() => {
    if (filteredTrades.length > 0) {
      const totalPagesCount = Math.ceil(filteredTrades.length / tradesPerPage);
      setTotalPages(totalPagesCount);
      
      // Reset to first page if current page exceeds total pages
      if (currentPage > totalPagesCount) {
        setCurrentPage(1);
      }
      
      // Reset notebook page if it exceeds available trades
      if (notebookPage > filteredTrades.length) {
        setNotebookPage(1);
      }
    }
  }, [filteredTrades, tradesPerPage, currentPage, notebookPage]);

  // Reset notebook page when switching to notebook view or when filters change
  useEffect(() => {
    if (viewMode === 'notebook' && filteredTrades.length > 0) {
      setNotebookPage(1);
    }
  }, [viewMode, filters]);

  // Keyboard navigation for notebook view
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (viewMode === 'notebook' && filteredTrades.length > 0) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPreviousPage();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToNextPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewMode, notebookPage, filteredTrades.length]);

  const fetchAllTrades = async (forceRefresh = false) => {
    console.log('📊 Fetching all trades with cache...', 'forceRefresh:', forceRefresh);
    setLoading(true);
    setError(null);
    
    try {
      // Use caching unless force refresh is requested
      const tradesData = await tradesAPI.getAllTrades({
        userId,
        page: 1,
        limit: 1000
      }, !forceRefresh, 10 * 60 * 1000); // 10 minute cache TTL, disable cache if force refresh
      
      console.log('📋 All trades fetched:', {
        tradesCount: tradesData?.trades?.length,
        fromCache: tradesData.fromCache || false,
        cacheType: tradesData.cacheType || 'network',
        firstTrade: tradesData?.trades?.[0]
      });
      
      setAllTrades(tradesData.trades || []);
      
    } catch (error) {
      console.error('❌ Error fetching trades:', error);
      setError(error.message || 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  // Listen for cache updates
  useEffect(() => {
    const handleCacheUpdate = (event) => {
      const { cacheKey, data } = event.detail;
      console.log('[Trades] Cache update received:', cacheKey);
      
      // Check if this cache update affects our trades
      if (cacheKey.includes('/api/trades') && data?.trades) {
        console.log('[Trades] Updating trades from cache update');
        setAllTrades(data.trades);
      }
    };

    window.addEventListener('apiCacheUpdate', handleCacheUpdate);
    return () => window.removeEventListener('apiCacheUpdate', handleCacheUpdate);
  }, []);

  const applyFilters = () => {
    console.log('🔍 Applying filters to trades:', filters);
    
    let filtered = [...allTrades];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(trade => {
        return (
          trade.tradeNumber?.toLowerCase().includes(term) ||
          trade.instrument?.toLowerCase().includes(term) ||
          trade.strategy?.toLowerCase().includes(term) ||
          trade.notes?.toLowerCase().includes(term) ||
          trade.reasonForTrade?.toLowerCase().includes(term) ||
          trade.lessonLearned?.toLowerCase().includes(term) ||
          trade.emotions?.toLowerCase().includes(term)
        );
      });
    }

    // Date range filter
    if (filters.dateRange === 'custom' && filters.customDateFrom && filters.customDateTo) {
      const startDate = new Date(filters.customDateFrom);
      const endDate = new Date(filters.customDateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= startDate && tradeDate <= endDate;
      });
    } else if (filters.dateRange !== 'all') {
      const dateRange = getDateRange(filters.dateRange);
      if (dateRange) {
        filtered = filtered.filter(trade => {
          const tradeDate = new Date(trade.date);
          return tradeDate >= dateRange.startDate && tradeDate <= dateRange.endDate;
        });
      }
    }

    // Result filter
    if (filters.result !== 'all') {
      filtered = filtered.filter(trade => getTradeResult(trade) === filters.result);
    }

    // Instrument filter
    if (filters.instrument !== 'all') {
      filtered = filtered.filter(trade => trade.instrument === filters.instrument);
    }

    // Strategy filter
    if (filters.strategy !== 'all') {
      filtered = filtered.filter(trade => trade.strategy === filters.strategy);
    }

    // Direction filter
    if (filters.direction !== 'all') {
      filtered = filtered.filter(trade => trade.direction === filters.direction);
    }

    // Trade type filter (real vs backtest)
    if (filters.tradeType !== 'all') {
      if (filters.tradeType === 'real') {
        filtered = filtered.filter(trade => !trade.isBacktest);
      } else if (filters.tradeType === 'backtest') {
        filtered = filtered.filter(trade => trade.isBacktest);
      }
    }

    // Pre-trade checklist filter
    if (filters.preTradeChecklist !== 'all') {
      if (filters.preTradeChecklist === 'completed') {
        filtered = filtered.filter(trade => trade.preTradeChecklist && trade.preTradeChecklist.checklistId);
      } else if (filters.preTradeChecklist === 'skipped') {
        filtered = filtered.filter(trade => !trade.preTradeChecklist || !trade.preTradeChecklist.checklistId);
      } else {
        // Filter by setup quality
        filtered = filtered.filter(trade => 
          trade.preTradeChecklist && 
          trade.preTradeChecklist.setupQuality === filters.preTradeChecklist
        );
      }
    }

    // Sort trades
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'pnl':
          aValue = a.pnl || 0;
          bValue = b.pnl || 0;
          break;
        case 'executionScore':
          aValue = a.executionScore || 0;
          bValue = b.executionScore || 0;
          break;
        case 'lotSize':
          aValue = a.lotSize || 0;
          bValue = b.lotSize || 0;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }
      
      if (filters.sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    console.log('✅ Trades filtered and sorted:', {
      originalCount: allTrades.length,
      filteredCount: filtered.length,
      filters
    });

    setFilteredTrades(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getDateRange = (dateRange) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate = new Date(today);
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(today);
        break;
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
      endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
    };
  };

  // Calculate stats from filtered trades
  const calculateStats = () => {
    if (filteredTrades.length === 0) {
      return {
        totalTrades: 0,
        totalPnL: 0,
        winRate: 0,
        avgPnL: 0,
        wins: 0,
        losses: 0,
        bestTrade: null,
        worstTrade: null,
        totalLots: 0,
        avgExecutionScore: 0
      };
    }

    const wins = filteredTrades.filter(t => getTradeResult(t) === 'win').length;
    const losses = filteredTrades.filter(t => getTradeResult(t) === 'loss').length;
    const totalPnL = filteredTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    const avgPnL = totalPnL / filteredTrades.length;
    const winRate = filteredTrades.length > 0 ? Math.round((wins / filteredTrades.length) * 100) : 0;
    
    const bestTrade = [...filteredTrades].sort((a, b) => (parseFloat(b.pnl) || 0) - (parseFloat(a.pnl) || 0))[0];
    const worstTrade = [...filteredTrades].sort((a, b) => (parseFloat(a.pnl) || 0) - (parseFloat(b.pnl) || 0))[0];
    
    const totalLots = filteredTrades.reduce((sum, t) => sum + (parseFloat(t.lotSize) || 0), 0);
    
    const tradesWithScore = filteredTrades.filter(t => t.executionScore);
    const avgExecutionScore = tradesWithScore.length > 0
      ? tradesWithScore.reduce((sum, t) => sum + (parseFloat(t.executionScore) || 0), 0) / tradesWithScore.length
      : 0;

    return {
      totalTrades: filteredTrades.length,
      totalPnL,
      winRate,
      avgPnL,
      wins,
      losses,
      bestTrade,
      worstTrade,
      totalLots,
      avgExecutionScore: Math.round(avgExecutionScore * 10) / 10
    };
  };

  const stats = calculateStats();

  const resetFilters = () => {
    setFilters({
      dateRange: 'all',
      customDateFrom: '',
      customDateTo: '',
      result: 'all',
      instrument: 'all',
      strategy: 'all',
      direction: 'all',
      tradeType: 'all',
      preTradeChecklist: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setSearchTerm('');
    setShowFilters(false);
  };

  // Get unique values for filter options
  const getUniqueValues = (field) => {
    const values = [...new Set(allTrades.map(trade => trade[field]).filter(Boolean))];
    return values.sort();
  };

  // Get paginated trades
  const getPaginatedTrades = () => {
    const startIndex = (currentPage - 1) * tradesPerPage;
    const endIndex = startIndex + tradesPerPage;
    return filteredTrades.slice(startIndex, endIndex);
  };

  // Notebook view helpers
  const getCurrentNotebookTrade = () => {
    return filteredTrades[notebookPage - 1];
  };

  const goToNotebookPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= filteredTrades.length) {
      setNotebookPage(pageNum);
    }
  };

  const goToPreviousPage = () => {
    if (notebookPage > 1) {
      setNotebookPage(notebookPage - 1);
    }
  };

  const goToNextPage = () => {
    if (notebookPage < filteredTrades.length) {
      setNotebookPage(notebookPage + 1);
    }
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showPages = 5;
      
      let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
      let endPage = Math.min(totalPages, startPage + showPages - 1);
      
      if (endPage - startPage + 1 < showPages) {
        startPage = Math.max(1, endPage - showPages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center text-sm text-gray-500">
          <span>
            Showing {((currentPage - 1) * tradesPerPage) + 1} to {Math.min(currentPage * tradesPerPage, filteredTrades.length)} of {filteredTrades.length} trades
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
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

  const TradeCard = ({ trade }) => {
    const tradeResult = getTradeResult(trade);
    const isProfitable = trade.pnl >= 0;
    const resultColor = tradeResult === 'win' ? 'text-green-600' : 
                       tradeResult === 'loss' ? 'text-red-600' : 'text-yellow-600';
    const resultBg = tradeResult === 'win' ? 'bg-green-50 border-green-200' : 
                     tradeResult === 'loss' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200';
    
    return (
      <div className={`bg-white rounded-xl shadow-sm border-2 ${resultBg} p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${isProfitable ? 'bg-gradient-to-br from-green-100 to-green-200' : 'bg-gradient-to-br from-red-100 to-red-200'} shadow-sm`}>
              {isProfitable ? (
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-700" />
              ) : (
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-700" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <InstrumentIcon instrument={trade.instrument} />
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                {new Date(trade.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end space-x-2 mb-1">
              <div className={`text-2xl font-bold ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(trade.pnl)}
              </div>
              {trade.pipes && trade.pipes !== '0' && trade.pipes !== '0' && (
                <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${trade.pipes.startsWith('-') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {trade.pipes.startsWith('-') ? '' : '+'}{trade.pipes}p
                </span>
              )}
            </div>
            <div className="flex items-center justify-end space-x-2">
              <div className={`text-sm font-bold px-2 py-1 rounded-lg ${resultColor} bg-opacity-10`}>
                {tradeResult ? tradeResult.toUpperCase() : 'N/A'}
              </div>
              {trade.isBacktest && (
                <span className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold">
                  BT
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
            <ArrowUpIcon className={`h-5 w-5 ${trade.direction === 'Long' ? 'text-blue-600' : 'text-purple-600'}`} />
            <div>
              <div className="text-xs text-gray-500">Direction</div>
              <div className="text-sm font-semibold text-gray-900">
                {trade.direction} • {trade.lotSize} lots
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
            {trade.executionScore ? (
              <>
                <StarIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-xs text-gray-500">Execution</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {trade.executionScore}/10
                  </div>
                </div>
              </>
            ) : trade.entryPrice ? (
              <>
                <BanknotesIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-xs text-gray-500">Entry Price</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {trade.entryPrice}
                  </div>
                </div>
              </>
            ) : (
              <>
                <BanknotesIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Trade #</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {trade.tradeNumber || 'N/A'}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
            <ChartBarIcon className="h-5 w-5 text-indigo-600" />
            <div>
              <div className="text-xs text-gray-500">Strategy</div>
              <div className="text-sm font-semibold text-gray-900 truncate">
                {trade.strategy || 'N/A'}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
            {trade.session ? (
              <>
                <ClockIcon className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-xs text-gray-500">Session</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {trade.session}
                  </div>
                </div>
              </>
            ) : trade.riskReward ? (
              <>
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-xs text-gray-500">Risk/Reward</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {trade.riskReward}
                  </div>
                </div>
              </>
            ) : trade.exitPrice ? (
              <>
                <BanknotesIcon className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-xs text-gray-500">Exit Price</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {trade.exitPrice}
                  </div>
                </div>
              </>
            ) : (
              <>
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {trade.notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border-l-4 border-gray-300 line-clamp-2">
              {trade.notes}
            </p>
          </div>
        )}

        {trade.screenshotUrl && (
          <div className="mb-4">
            <img
              src={trade.screenshotUrl}
              alt="Trade screenshot"
              className="w-full h-32 object-cover rounded-lg cursor-pointer border-2 border-gray-200 hover:border-blue-400 transition-all"
              onClick={() => {
                // Open fullscreen view
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 backdrop-blur-sm';
                modal.onclick = () => modal.remove();
                
                const img = document.createElement('img');
                img.src = trade.screenshotUrl;
                img.className = 'max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl';
                
                const closeButton = document.createElement('button');
                closeButton.innerHTML = '×';
                closeButton.className = 'absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors z-10';
                closeButton.onclick = () => modal.remove();
                
                modal.appendChild(img);
                modal.appendChild(closeButton);
                document.body.appendChild(modal);
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 font-medium">
            Trade #{trade.tradeNumber || 'N/A'}
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to={`/trade/${trade._id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline transition-colors"
            >
              View Details →
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const NotebookView = () => {
    const currentTrade = getCurrentNotebookTrade();
    
    if (!currentTrade) {
      return (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No trades to display</h3>
        </div>
      );
    }

    const tradeResult = getTradeResult(currentTrade);
    const isProfitable = currentTrade.pnl >= 0;
    const resultColor = tradeResult === 'win' ? 'text-green-600' : 
                       tradeResult === 'loss' ? 'text-red-600' : 'text-yellow-600';

    return (
      <div className="notebook-container ">
        {/* Notebook Page - Expanded for full details */}
        <div className="notebook-page bg-white border border-gray-200 rounded-lg mx-auto max-w-6xl min-h-[800px] py-4 px-8 relative transform transition-all duration-300 hover:shadow-3xl" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)'
        }}>
          {/* Notebook Lines - Removed */}

          {/* Trade Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${isProfitable ? 'bg-green-100' : 'bg-red-100'}`}>
                  {isProfitable ? (
                    <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    <InstrumentIcon instrument={currentTrade.instrument} />
                    {currentTrade.tradePair && currentTrade.tradePair !== currentTrade.instrument && (
                      <span className="text-lg text-gray-600 ml-2">({currentTrade.tradePair})</span>
                    )}
                  </h2>
                  <p className="text-lg text-gray-600">
                    {new Date(currentTrade.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end space-x-3 mb-2">
                  <div className={`text-3xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(currentTrade.pnl)}
                  </div>
                  {currentTrade.pipes && currentTrade.pipes !== '0' && currentTrade.pipes !== '0' && (
                    <span className={`text-sm px-2 py-1 rounded ${currentTrade.pipes.startsWith('-') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {currentTrade.pipes.startsWith('-') ? '' : '+'}{currentTrade.pipes}p
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <div className={`text-lg font-medium ${resultColor}`}>
                    {tradeResult ? tradeResult.toUpperCase() : 'N/A'}
                  </div>
                  {currentTrade.isBacktest && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      BT
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trade Summary Cards */}
            {/* <div className="grid grid-cols-4 gap-3 mb-6 p-0 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {currentTrade.entryPrice || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">Entry Price</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {currentTrade.exitPrice || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">Exit Price</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {currentTrade.riskReward || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">Risk/Reward</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {currentTrade.executionScore || 'N/A'}/10
                </div>
                <div className="text-xs text-gray-500">Execution Score</div>
              </div>
            </div> */}

            {/* Comprehensive Trade Details */}
            <div className="space-y-6 mb-6">
              {/* Primary Trade Info */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to white">
                    <ArrowUpIcon className={`h-6 w-6 ${currentTrade.direction === 'Long' ? 'text-blue-500' : 'text-purple-500'}`} />
                    <div>
                      <div className="text-sm text-gray-500">Direction & Position</div>
                      <div className="text-lg font-semibold">
                        {currentTrade.direction} • {currentTrade.lotSize} lots
                        {currentTrade.positionSize && (
                          <div className="text-sm text-gray-600">Size: {currentTrade.positionSize}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-white ">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Strategy</div>
                      <div className="text-lg font-semibold">
                        {currentTrade.strategy || 'N/A'}
                      </div>
                    </div>
                  </div>

                 

                  {currentTrade.tradePair && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to white">
                      <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-600">P</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Trade Pair</div>
                        <div className="text-lg font-semibold">{currentTrade.tradePair}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to white">
                <ClockIcon className="h-6 w-6 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Session</div>
                      <div className="text-lg font-semibold">
                        {currentTrade.session || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to white">
                    <BanknotesIcon className="h-6 w-6 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Trade Number</div>
                      <div className="text-lg font-semibold">
                        #{currentTrade.tradeNumber || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {currentTrade.tradeDuration && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to white">
                      <div className="h-6 w-6 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-600">D</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Trade Duration</div>
                        <div className="text-lg font-semibold">
                          {currentTrade.tradeDuration}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTrade.riskReward && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to white">
                      <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-yellow-600">R</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Risk/Reward</div>
                        <div className="text-lg font-semibold">
                          {currentTrade.riskReward}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTrade.pipes && currentTrade.pipes !== '0' && currentTrade.pipes !== '0' && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to white">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${currentTrade.pipes.startsWith('-') ? 'bg-red-100' : 'bg-green-100'}`}>
                        <span className={`text-xs font-bold ${currentTrade.pipes.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>Pipes</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Pipes</div>
                        <div className={`text-lg font-semibold ${currentTrade.pipes.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                          {currentTrade.pipes.startsWith('-') ? '' : '+'}{currentTrade.pipes}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {currentTrade.entryPrice && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to white">
                      <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">E</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Entry Price</div>
                        <div className="text-lg font-semibold">
                          {currentTrade.entryPrice}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTrade.exitPrice && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to white">
                      <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-red-600">X</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Exit Price</div>
                        <div className="text-lg font-semibold">
                          {currentTrade.exitPrice}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTrade.stopLoss && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to white">
                      <div className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-600">SL</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Stop Loss</div>
                        <div className="text-lg font-semibold">
                          {currentTrade.stopLoss}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentTrade.takeProfit && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to white">
                      <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">TP</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Take Profit</div>
                        <div className="text-lg font-semibold">
                          {currentTrade.takeProfit}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Trade Outcome Section */}
              {/* {currentTrade.tradeOutcome && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-full ${
                      currentTrade.tradeOutcome === 'Win' ? 'bg-green-100' :
                      currentTrade.tradeOutcome === 'Loss' ? 'bg-red-100' : 'bg-yellow-100'
                    }`}>
                      <span className={`text-lg font-bold ${
                        currentTrade.tradeOutcome === 'Win' ? 'text-green-600' :
                        currentTrade.tradeOutcome === 'Loss' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {currentTrade.tradeOutcome === 'Win' ? '✓' : 
                         currentTrade.tradeOutcome === 'Loss' ? '✗' : '~'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Trade Outcome</div>
                      <div className={`text-lg font-bold ${
                        currentTrade.tradeOutcome === 'Win' ? 'text-green-600' :
                        currentTrade.tradeOutcome === 'Loss' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {currentTrade.tradeOutcome}
                      </div>
                    </div>
                  </div>
                </div>
              )} */}
            </div>

            {/* Reason for Trade Section */}
            {currentTrade.reasonForTrade && (
              <div className="mb-5 border-t border-gray-200 pt-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <ChartBarIcon className="h-4 w-4 mr-2 text-blue-600" />
                  Reason for Trade
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4 rounded-lg shadow-sm">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                    {currentTrade.reasonForTrade}
                  </p>
                </div>
              </div>
            )}

            {/* Emotions Section */}
            {currentTrade.emotions && (
              <div className="mb-5 border-t border-gray-200 pt-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="h-4 w-4 mr-2 text-purple-600">❤️</div>
                  Emotions & Psychology
                </h3>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400 p-4 rounded-lg shadow-sm">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                    {currentTrade.emotions}
                  </p>
                </div>
              </div>
            )}

            {/* Notes Section */}
            {currentTrade.notes && (
              <div className="mb-5 border-t border-gray-200 pt-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <PencilIcon className="h-4 w-4 mr-2 text-gray-600" />
                  Trade Notes & Analysis
                </h3>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                    {currentTrade.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Additional Notes Section */}
            {currentTrade.additionalNotes && (
              <div className="mb-5 border-t border-gray-200 pt-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="h-4 w-4 mr-2 text-gray-600">📝</div>
                  Additional Notes
                </h3>
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400 p-4 rounded-lg shadow-sm">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                    {currentTrade.additionalNotes}
                  </p>
                </div>
              </div>
            )}

            {/* Lesson Learned Section */}
            {currentTrade.lessonLearned && (
              <div className="mb-5 border-t border-gray-200 pt-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="h-4 w-4 mr-2 text-green-600">🎓</div>
                  Lessons Learned
                </h3>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-4 rounded-lg shadow-sm">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
                    {currentTrade.lessonLearned}
                  </p>
                </div>
              </div>
            )}

            {/* Screenshot Section */}
            {currentTrade.screenshotUrl && (
              <div className="mb-5 border-t border-gray-200 pt-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <EyeIcon className="h-4 w-4 mr-2 text-gray-600" />
                  Trade Chart & Screenshot
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <img
                    src={currentTrade.screenshotUrl}
                    alt="Trade screenshot"
                    className="w-full max-h-60 object-contain rounded-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => {
                      // Open fullscreen view
                      const modal = document.createElement('div');
                      modal.className = 'fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 backdrop-blur-sm';
                      modal.onclick = () => modal.remove();
                      
                      const img = document.createElement('img');
                      img.src = currentTrade.screenshotUrl;
                      img.className = 'max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl';
                      
                      const closeButton = document.createElement('button');
                      closeButton.innerHTML = '×';
                      closeButton.className = 'absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors';
                      closeButton.onclick = () => modal.remove();
                      
                      modal.appendChild(img);
                      modal.appendChild(closeButton);
                      document.body.appendChild(modal);
                    }}
                  />
                  <div className="mt-3 text-center text-xs text-gray-500">
                    Click to view in fullscreen
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 flex items-center space-x-4">
              <Link
                to={`/trade/${currentTrade._id}`}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Trade
              </Link>
              <div className="text-xs text-gray-500">
                Trade ID: {currentTrade._id?.slice(-8) || 'N/A'}
              </div>
            </div>
          </div>
        </div>

                 {/* Navigation Controls */}
         <div className="flex items-center justify-between mt-6 max-w-6xl mx-auto">
           <button
             onClick={goToPreviousPage}
             disabled={notebookPage === 1}
             className={`flex items-center px-6 py-3 rounded-lg border transition-all duration-200 ${
               notebookPage === 1 
                 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                 : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
             }`}
           >
             <ChevronLeftIcon className="h-5 w-5 mr-2" />
             Previous
           </button>

           <div className="text-center">
             <div className="text-lg font-medium text-gray-900">
               Page {notebookPage} of {filteredTrades.length}
             </div>
             <div className="text-sm text-gray-500">
               {currentTrade.instrument} • {new Date(currentTrade.date).toLocaleDateString()}
             </div>
             <div className="text-xs text-gray-400 mt-1">
               Use ← → arrow keys to navigate
             </div>
           </div>

           <button
             onClick={goToNextPage}
             disabled={notebookPage === filteredTrades.length}
             className={`flex items-center px-6 py-3 rounded-lg border transition-all duration-200 ${
               notebookPage === filteredTrades.length 
                 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                 : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
             }`}
           >
             Next
             <ChevronRightIcon className="h-5 w-5 ml-2" />
           </button>
         </div>

                 {/* Enhanced Page Preview Strip */}
         <div className="mt-12 max-w-6xl mx-auto">
           <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl shadow-lg border p-6">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                 <BookOpenIcon className="h-5 w-5 mr-2 text-blue-600" />
                 Trade Journal Pages
               </h4>
               <div className="text-sm text-gray-500">
                 {filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'} total
               </div>
             </div>
             <div className="flex space-x-3 overflow-x-auto pb-3 pr-2 p-2"
                  style={{ 
                    scrollbarWidth: 'thin', 
                    scrollbarColor: '#9ca3af #f3f4f6',
                    scrollBehavior: 'smooth'
                  }}>
              {filteredTrades.map((trade, index) => {
                const pageNum = index + 1;
                const isCurrentPage = pageNum === notebookPage;
                const tradePnl = trade.pnl >= 0;
                const tradeResult = getTradeResult(trade);
                
                return (
                  <div
                    key={trade._id}
                    className="relative group flex-shrink-0"
                  >
                                                              <button
                       onClick={() => goToNotebookPage(pageNum)}
                       className={`w-20 h-24 border-2 rounded-lg transition-all duration-200 ${
                         isCurrentPage 
                           ? 'border-blue-500 shadow-lg scale-110 ring-2 ring-blue-200' 
                           : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-105'
                       } ${tradePnl ? 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-150' : 'bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-150'}`}
                       title={`Page ${pageNum}: ${trade.instrument} - ${formatCurrency(trade.pnl)}`}
                     >
                       <div className="p-2 h-full flex flex-col justify-between">
                         <div className="flex items-center justify-between w-full">
                           <div className="text-xs font-bold text-gray-700 bg-white rounded px-1">
                             {pageNum}
                           </div>
                           <div className={`text-xs font-bold ${tradePnl ? 'text-green-600' : 'text-red-600'}`}>
                             {tradeResult === 'win' ? '✓' : tradeResult === 'loss' ? '✗' : '~'}
                           </div>
                         </div>
                         
                         <div className="text-center flex-1 flex flex-col justify-center">
                           <div className="text-xs font-bold text-gray-800 truncate mb-1">
                             {trade.instrument}
                           </div>
                           <div className="text-xs text-gray-600 mb-1">
                             {new Date(trade.date).toLocaleDateString('en-US', { 
                               month: 'short', 
                               day: 'numeric' 
                             })}
                           </div>
                                                       <div className={`text-xs font-bold ${tradePnl ? 'text-green-600' : 'text-red-600'}`}>
                             {Math.abs(trade.pnl) >= 1000 
                               ? `${trade.pnl >= 0 ? '+' : '-'}$${(Math.abs(trade.pnl) / 1000).toFixed(1)}k`
                               : `${trade.pnl >= 0 ? '+' : ''}${formatCurrency(trade.pnl)}`}
                           </div>
                         </div>
                       </div>
                     </button>
                    
                                         {/* Enhanced Tooltip */}
                     <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
                       <div className="bg-gray-900 text-white text-sm rounded-lg py-4 px-5 shadow-2xl border border-gray-700" style={{ minWidth: '220px' }}>
                         <div className="flex items-center justify-between mb-3">
                           <div className="font-bold text-white text-lg">
                             {trade.instrument}
                             {trade.tradePair && trade.tradePair !== trade.instrument && (
                               <div className="text-xs text-gray-300">{trade.tradePair}</div>
                             )}
                           </div>
                           <div className={`text-xs px-2 py-1 rounded-full font-bold ${
                             tradeResult === 'win' ? 'bg-green-600 text-white' : 
                             tradeResult === 'loss' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                           }`}>
                             {tradeResult ? tradeResult.toUpperCase() : 'N/A'}
                           </div>
                         </div>
                         
                         <div className="space-y-2">
                           <div className="flex justify-between">
                             <span className="text-gray-300">Date:</span>
                             <span className="text-white font-medium">
                               {new Date(trade.date).toLocaleDateString('en-US', {
                                 month: 'short',
                                 day: 'numeric',
                                 year: '2-digit'
                               })}
                             </span>
                           </div>
                           
                           <div className="flex justify-between">
                             <span className="text-gray-300">P&L:</span>
                             <span className={`font-bold ${tradePnl ? 'text-green-400' : 'text-red-400'}`}>
                               {formatCurrency(trade.pnl)}
                             </span>
                           </div>
                           
                           <div className="flex justify-between">
                             <span className="text-gray-300">Position:</span>
                             <span className="text-white font-medium">
                               {trade.direction} • {trade.lotSize} lots
                             </span>
                           </div>
                           
                           {trade.strategy && (
                             <div className="flex justify-between">
                               <span className="text-gray-300">Strategy:</span>
                               <span className="text-white font-medium truncate ml-2" style={{ maxWidth: '100px' }}>
                                 {trade.strategy}
                               </span>
                             </div>
                           )}
                           
                           {trade.session && (
                             <div className="flex justify-between">
                               <span className="text-gray-300">Session:</span>
                               <span className="text-white font-medium">
                                 {trade.session}
                               </span>
                             </div>
                           )}
                           
                           {trade.riskReward && (
                             <div className="flex justify-between">
                               <span className="text-gray-300">R:R:</span>
                               <span className="text-blue-400 font-bold">
                                 {trade.riskReward}
                               </span>
                             </div>
                           )}
                           
                           {trade.executionScore && (
                             <div className="flex justify-between">
                               <span className="text-gray-300">Score:</span>
                               <span className="text-yellow-400 font-bold">
                                 {trade.executionScore}/10
                               </span>
                             </div>
                           )}
                         </div>
                         
                         <div className="mt-3 pt-2 border-t border-gray-700 text-xs text-gray-400 text-center">
                           Page {pageNum} • Click to view full details
                         </div>
                       </div>
                       <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading trades...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <ChartBarIcon className="w-16 h-16 mx-auto mb-4" />
          </div>
          <div className="text-lg text-gray-800 mb-2">Error Loading Trades</div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Trades</h1>
              <p className="mt-1 text-sm text-gray-600">
                {filteredTrades.length > 0 ? (
                  <>
                    Showing {filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'}
                    {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                  </>
                ) : (
                  'No trades found'
                )}
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md lg:ml-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search trades, notes, instruments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Toggle Buttons */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    viewMode === 'cards' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Squares2X2Icon className="h-4 w-4 mr-2" />
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('notebook')}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    viewMode === 'notebook' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  Notebook
                </button>
              </div>

              {/* Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 py-2 text-sm rounded-lg border transition-colors ${
                  showFilters ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
                {Object.values(filters).some(filter => filter !== 'all' && filter !== 'date' && filter !== 'desc') && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => fetchAllTrades(true)}
                disabled={loading}
                className="flex items-center px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                title="Refresh trades (bypass cache)"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Add Trade Button */}
              <Link
                to="/pre-trade-checklist"
                className="btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Trade
              </Link>
            </div>
          </div>
          
          {/* Active Filter Chips */}
          {(Object.values(filters).some(f => f !== 'all' && f !== 'date' && f !== 'desc' && f !== '') || searchTerm) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-2 hover:text-blue-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.dateRange !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Date: {filters.dateRange === 'custom' ? `${filters.customDateFrom} to ${filters.customDateTo}` : filters.dateRange}
                </span>
              )}
              {filters.result !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Result: {filters.result}
                </span>
              )}
              {filters.instrument !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Instrument: {filters.instrument}
                </span>
              )}
              {filters.strategy !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Strategy: {filters.strategy}
                </span>
              )}
              {filters.direction !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Direction: {filters.direction}
                </span>
              )}
              {filters.tradeType !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Type: {filters.tradeType}
                </span>
              )}
              {filters.preTradeChecklist !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Checklist: {filters.preTradeChecklist}
                </span>
              )}
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 rounded-md hover:bg-gray-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="1y">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  
                  {/* Custom Date Range Inputs */}
                  {filters.dateRange === 'custom' && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="date"
                        value={filters.customDateFrom}
                        onChange={(e) => setFilters({...filters, customDateFrom: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={filters.customDateTo}
                        onChange={(e) => setFilters({...filters, customDateTo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="To"
                      />
                    </div>
                  )}
                </div>

                {/* Result Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Result
                  </label>
                  <select
                    value={filters.result}
                    onChange={(e) => setFilters({...filters, result: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Results</option>
                    <option value="win">Wins</option>
                    <option value="loss">Losses</option>
                    <option value="be">Breakeven</option>
                  </select>
                </div>

                {/* Instrument Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instrument
                  </label>
                  <select
                    value={filters.instrument}
                    onChange={(e) => setFilters({...filters, instrument: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Instruments</option>
                    {getUniqueValues('instrument').map(instrument => (
                      <option key={instrument} value={instrument}>{instrument}</option>
                    ))}
                  </select>
                </div>

                {/* Strategy Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strategy
                  </label>
                  <select
                    value={filters.strategy}
                    onChange={(e) => setFilters({...filters, strategy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Strategies</option>
                    {getUniqueValues('strategy').map(strategy => (
                      <option key={strategy} value={strategy}>{strategy}</option>
                    ))}
                  </select>
                </div>

                {/* Direction Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Direction
                  </label>
                  <select
                    value={filters.direction}
                    onChange={(e) => setFilters({...filters, direction: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Directions</option>
                    <option value="Long">Long</option>
                    <option value="Short">Short</option>
                  </select>
                </div>

                {/* Trade Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trade Type
                  </label>
                  <select
                    value={filters.tradeType}
                    onChange={(e) => setFilters({...filters, tradeType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Trades</option>
                    <option value="real">Real Trades</option>
                    <option value="backtest">Backtest Trades</option>
                  </select>
                </div>

                {/* Pre-Trade Checklist Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <ClipboardDocumentCheckIcon className="w-4 h-4 text-blue-500" />
                      Pre-Trade Analysis
                    </span>
                  </label>
                  <select
                    value={filters.preTradeChecklist}
                    onChange={(e) => setFilters({...filters, preTradeChecklist: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="all">All Trades</option>
                    <option value="completed">With Checklist</option>
                    <option value="skipped">Without Checklist</option>
                    <optgroup label="By Quality">
                      <option value="excellent">Excellent Setup</option>
                      <option value="good">Good Setup</option>
                      <option value="fair">Fair Setup</option>
                      <option value="poor">Poor Setup</option>
                      <option value="terrible">Terrible Setup</option>
                    </optgroup>
                  </select>
                </div>

                {/* Sort By Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="date">Date</option>
                    <option value="pnl">P&L</option>
                    <option value="executionScore">Execution Score</option>
                    <option value="lotSize">Lot Size</option>
                  </select>
                </div>

                {/* Sort Order Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm border border-gray-300"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className={`${viewMode === 'notebook' ? 'max-w-none' : 'max-w-7xl'} mx-auto py-6 sm:px-6 lg:px-8`}>
        <div className="px-4 py-4 sm:px-0">
          
          {/* Quick Stats Dashboard */}
          {filteredTrades.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Trades</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalTrades}</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      {stats.wins}W • {stats.losses}L
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total P&L</p>
                    <p className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.totalPnL)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      Avg: {formatCurrency(stats.avgPnL)}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Win Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.winRate}%</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      {stats.wins} wins of {stats.totalTrades}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FireIcon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Execution</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.avgExecutionScore}/10</p>
                    <p className="text-xs text-gray-500 mt-2 font-medium">
                      {stats.totalLots.toFixed(1)} total lots
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <StarIcon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content based on view mode */}
          {filteredTrades.length > 0 ? (
            <>
              {viewMode === 'cards' ? (
                <>
                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getPaginatedTrades().map((trade) => (
                      <TradeCard key={trade._id} trade={trade} />
                    ))}
                  </div>

                  {/* Pagination */}
                  <PaginationControls />
                </>
              ) : (
                /* Enhanced Notebook View */
                <div className="notebook-view-container">
                  <NotebookView />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {allTrades.length === 0 ? 'No trades yet' : 'No trades match your filters'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {allTrades.length === 0 
                  ? 'Get started by adding your first trade.'
                  : 'Try adjusting your filters to see more trades.'
                }
              </p>
              <div className="mt-6">
                {allTrades.length === 0 ? (
                  <Link
                    to="/dashboard"
                    className="btn-primary"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Your First Trade
                  </Link>
                ) : (
                  <button
                    onClick={resetFilters}
                    className="btn-secondary"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Trades; 