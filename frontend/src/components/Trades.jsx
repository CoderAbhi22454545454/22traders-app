import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tradesAPI, formatCurrency } from '../utils/api';
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
  ArrowTrendingDownIcon
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
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    result: 'all',
    instrument: 'all',
    strategy: 'all',
    direction: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  // View state
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

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
  }, [filters, allTrades]);

  // Update pagination when filtered trades change
  useEffect(() => {
    if (filteredTrades.length > 0) {
      const totalPagesCount = Math.ceil(filteredTrades.length / tradesPerPage);
      setTotalPages(totalPagesCount);
      
      // Reset to first page if current page exceeds total pages
      if (currentPage > totalPagesCount) {
        setCurrentPage(1);
      }
    }
  }, [filteredTrades, tradesPerPage, currentPage]);

  const fetchAllTrades = async () => {
    console.log('📊 Fetching all trades...');
    setLoading(true);
    setError(null);
    
    try {
      const tradesData = await tradesAPI.getAllTrades({
        userId,
        page: 1,
        limit: 1000
      });
      
      console.log('📋 All trades fetched:', {
        tradesCount: tradesData?.trades?.length,
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

  const applyFilters = () => {
    console.log('🔍 Applying filters to trades:', filters);
    
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

    // Result filter
    if (filters.result !== 'all') {
      filtered = filtered.filter(trade => trade.result === filters.result);
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

  const resetFilters = () => {
    setFilters({
      dateRange: 'all',
      result: 'all',
      instrument: 'all',
      strategy: 'all',
      direction: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    });
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
    const isProfitable = trade.pnl >= 0;
    const resultColor = trade.result === 'win' ? 'text-green-600' : 
                       trade.result === 'loss' ? 'text-red-600' : 'text-yellow-600';
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isProfitable ? 'bg-green-100' : 'bg-red-100'}`}>
              {isProfitable ? (
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{trade.instrument}</h3>
              <p className="text-sm text-gray-500">
                {new Date(trade.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(trade.pnl)}
            </div>
            <div className={`text-sm font-medium ${resultColor}`}>
              {trade.result?.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <ArrowUpIcon className={`h-4 w-4 ${trade.direction === 'Long' ? 'text-blue-500' : 'text-purple-500'}`} />
            <span className="text-sm text-gray-600">
              {trade.direction} • {trade.lotSize} lots
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <StarIcon className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600">
              Score: {trade.executionScore}/10
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {trade.strategy || 'N/A'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {trade.session || 'N/A'}
            </span>
          </div>
        </div>

        {trade.notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {trade.notes}
            </p>
          </div>
        )}

        {trade.screenshotUrl && (
          <div className="mb-4">
            <img
              src={trade.screenshotUrl}
              alt="Trade screenshot"
              className="w-full h-32 object-cover rounded-lg cursor-pointer"
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
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Trade #{trade.tradeNumber || 'N/A'}
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to={`/trade/${trade._id}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View Details
            </Link>
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Trades</h1>
              <p className="mt-1 text-sm text-gray-600">
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

              {/* Add Trade Button */}
              <Link
                to="/dashboard"
                className="btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Trade
              </Link>
            </div>
          </div>
          
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
                    className="form-input w-full"
                  >
                    <option value="all">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="1y">Last Year</option>
                  </select>
                </div>

                {/* Result Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Result
                  </label>
                  <select
                    value={filters.result}
                    onChange={(e) => setFilters({...filters, result: e.target.value})}
                    className="form-input w-full"
                  >
                    <option value="all">All Results</option>
                    <option value="win">Wins</option>
                    <option value="loss">Losses</option>
                    <option value="breakeven">Breakeven</option>
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
                    className="form-input w-full"
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
                    className="form-input w-full"
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
                    className="form-input w-full"
                  >
                    <option value="all">All Directions</option>
                    <option value="Long">Long</option>
                    <option value="Short">Short</option>
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
                    className="form-input w-full"
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
                    className="form-input w-full"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="btn-secondary w-full"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          
          {/* Trades Grid */}
          {filteredTrades.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPaginatedTrades().map((trade) => (
                  <TradeCard key={trade._id} trade={trade} />
                ))}
              </div>

              {/* Pagination */}
              <PaginationControls />
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