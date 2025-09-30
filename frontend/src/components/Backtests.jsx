import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  FunnelIcon, 
  ChartBarIcon,
  PhotoIcon,
  TagIcon,
  CalendarIcon,
  TrendingDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Navigate } from 'react-router-dom';
import InstrumentIcon from './shared/InstrumentIcon';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Backtests = ({ userId }) => {
  const navigate = useNavigate();
  const [backtests, setBacktests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    timeRange: '',
    pattern: '',
    marketCondition: '',
    chipName: '',
    chipValue: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    patterns: [],
    marketConditions: [],
    instruments: [],
    chipsByCategory: {}
  });
  const [showFilters, setShowFilters] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBacktests: 0
  });
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'

  // Fetch backtests
  const fetchBacktests = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        userId,
        page: page.toString(),
        limit: '10',
        ...filters
      });

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          queryParams.delete(key);
        }
      });

      const response = await fetch(`${API_BASE_URL}/backtests?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch backtests');
      
      const data = await response.json();
      setBacktests(data.backtests);
      setStatistics(data.statistics);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/backtests/filters?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch filter options');
      
      const data = await response.json();
      setFilterOptions(data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  useEffect(() => {
    fetchBacktests();
    fetchFilterOptions();
  }, [userId, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      timeRange: '',
      pattern: '',
      marketCondition: '',
      chipName: '',
      chipValue: ''
    });
  };

  const formatChip = (chip) => (
    <span
      key={`${chip.name}-${chip.value}`}
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: chip.color + '20', 
        color: chip.color,
        border: `1px solid ${chip.color}40`
      }}
    >
      <TagIcon className="w-3 h-3 mr-1" />
      {chip.name}: {chip.value}
    </span>
  );

  if (loading && backtests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading backtests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-1 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Backtests</h1>
              <p className="mt-1 text-gray-600">Analyze your trading performance and patterns</p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/backtests/patterns"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                <div className="flex items-center">
                  <span className="text-xs text-blue-600 font-medium">View Details →</span>
                </div>
              </Link>
              <button
                onClick={() => navigate('/backtests/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Backtest
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Total Backtests */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Backtests</dt>
                      <dd className="text-lg font-semibold text-gray-900">{statistics.totalBacktests}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total P&L */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className={`h-6 w-6 ${statistics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total P&L</dt>
                      <dd className={`text-lg font-semibold ${statistics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${statistics.totalPnL?.toFixed(2) || '0.00'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Win Rate</dt>
                      <dd className="text-lg font-semibold text-gray-900">{statistics.winRate}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Avg Confidence */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Confidence</dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {statistics.avgConfidence?.toFixed(1) || 'N/A'}/10
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Backtests List */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Recent Backtests</h3>
                  <p className="mt-1 text-sm text-gray-600">Your latest backtest analyses</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'cards'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Card View"
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="List View"
                  >
                    <ListBulletIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {backtests.length === 0 ? (
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No backtests found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first backtest.</p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/backtests/new')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Backtest
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {backtests.map((backtest) => (
                      <BacktestCard key={backtest._id} backtest={backtest} formatChip={formatChip} />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="col-span-1">Status</div>
                      <div className="col-span-2">Trade Pair</div>
                      <div className="col-span-1">Direction</div>
                      <div className="col-span-1">Result</div>
                      <div className="col-span-2">Pattern</div>
                      <div className="col-span-2">Market</div>
                      <div className="col-span-1">Confidence</div>
                      <div className="col-span-1">Screenshots</div>
                      <div className="col-span-1">Date</div>
                    </div>
                    
                    {/* Table Body */}
                    <div>
                      {backtests.map((backtest) => (
                        <Link key={backtest._id} to={`/backtests/${backtest._id}`}>
                          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 items-center">
                            {/* Status Indicator */}
                            <div className="col-span-1">
                              <div className={`w-3 h-3 rounded-full ${
                                backtest.result === 'win' ? 'bg-green-400' :
                                backtest.result === 'loss' ? 'bg-red-400' : 'bg-yellow-400'
                              }`}></div>
                            </div>
                            
                            {/* Trade Pair */}
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {backtest.tradePair || backtest.instrument}
                              </p>
                            </div>
                            
                            {/* Direction */}
                            <div className="col-span-1">
                              <span className="text-sm text-gray-600 capitalize">
                                {backtest.direction}
                              </span>
                            </div>
                            
                            {/* Result */}
                            <div className="col-span-1">
                              <span className={`px-2 py-1 inline-flex text-xs font-medium rounded-full ${
                                backtest.result === 'win' ? 'bg-green-100 text-green-800' :
                                backtest.result === 'loss' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {backtest.result?.toUpperCase()}
                              </span>
                            </div>
                            
                            {/* Pattern */}
                            <div className="col-span-2">
                              <span className="text-sm text-gray-600">
                                {backtest.patternIdentified || 'N/A'}
                              </span>
                            </div>
                            
                            {/* Market Condition */}
                            <div className="col-span-2">
                              <span className="text-sm text-gray-600 capitalize">
                                {backtest.marketCondition || 'N/A'}
                              </span>
                            </div>
                            
                            {/* Confidence */}
                            <div className="col-span-1">
                              <span className="text-sm text-gray-600">
                                {backtest.confidence ? `${backtest.confidence}/10` : 'N/A'}
                              </span>
                            </div>
                            
                            {/* Screenshots */}
                            <div className="col-span-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <PhotoIcon className="h-4 w-4 mr-1" />
                                <span>{backtest.screenshots?.length || 0}</span>
                              </div>
                            </div>
                            
                            {/* Date */}
                            <div className="col-span-1">
                              <span className="text-sm text-gray-600">
                                {new Date(backtest.date || backtest.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Custom Chips Row */}
                          {backtest.customChips && backtest.customChips.length > 0 && (
                            <div className="px-6 pb-3 -mt-1">
                              <div className="flex flex-wrap gap-2">
                                {backtest.customChips.slice(0, 5).map(formatChip)}
                                {backtest.customChips.length > 5 && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    +{backtest.customChips.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => fetchBacktests(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchBacktests(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                      <span className="font-medium">{pagination.totalPages}</span> ({pagination.totalBacktests} total)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => fetchBacktests(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchBacktests(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

// Backtest Card Component
const BacktestCard = ({ backtest, formatChip }) => {
  const isProfitable = backtest.pnl >= 0;
  const resultColor = backtest.result === 'win' ? 'text-green-600' : 
                     backtest.result === 'loss' ? 'text-red-600' : 'text-yellow-600';
  
  const openImageLightbox = (imageUrl, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4';
    modal.onclick = () => modal.remove();
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'max-w-[95vw] max-h-[95vh] object-contain';
    img.style.imageRendering = 'high-quality';
    img.onclick = (e) => e.stopPropagation();
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.className = 'absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center';
    closeBtn.onclick = () => modal.remove();
    
    modal.appendChild(img);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
  };
  
  return (
    <Link to={`/backtests/${backtest._id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              isProfitable ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isProfitable ? (
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                <InstrumentIcon instrument={backtest.instrument || backtest.tradePair} />
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(backtest.date || backtest.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${
              isProfitable ? 'text-green-600' : 'text-red-600'
            }`}>
              ${backtest.pnl?.toFixed(2) || '0.00'}
            </div>
            <div className={`text-sm font-medium ${resultColor}`}>
              {backtest.result?.toUpperCase() || 'N/A'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {backtest.direction && (
            <div className="flex items-center space-x-2">
              <ArrowTrendingUpIcon className={`h-4 w-4 ${
                backtest.direction === 'Long' ? 'text-blue-500' : 'text-purple-500'
              }`} />
              <span className="text-sm text-gray-600">
                {backtest.direction}{backtest.lotSize ? ` • ${backtest.lotSize} lots` : ''}
              </span>
            </div>
          )}
          {backtest.patternIdentified && (
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 truncate">
                {backtest.patternIdentified}
              </span>
            </div>
          )}
          {backtest.marketCondition && (
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 capitalize">
                {backtest.marketCondition}
              </span>
            </div>
          )}
          {backtest.confidence && (
            <div className="flex items-center space-x-2">
              <StarIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600">
                {backtest.confidence}/10
              </span>
            </div>
          )}
        </div>

        {backtest.backtestNotes && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg line-clamp-2">
              {backtest.backtestNotes}
            </p>
          </div>
        )}

        {backtest.screenshots && backtest.screenshots.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-2">
              {backtest.screenshots.slice(0, 3).map((screenshot, idx) => (
                <img
                  key={idx}
                  src={screenshot.url}
                  alt={screenshot.description || `Screenshot ${idx + 1}`}
                  className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ imageRendering: 'high-quality' }}
                  onClick={(e) => openImageLightbox(screenshot.url, e)}
                />
              ))}
            </div>
            {backtest.screenshots.length > 3 && (
              <p className="text-xs text-gray-500 mt-2">
                +{backtest.screenshots.length - 3} more screenshots
              </p>
            )}
          </div>
        )}

        {backtest.customChips && backtest.customChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {backtest.customChips.slice(0, 3).map(formatChip)}
            {backtest.customChips.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{backtest.customChips.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Trade #{backtest.tradeNumber || 'N/A'}
          </div>
          <div className="flex items-center space-x-2">
            <PhotoIcon className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              {backtest.screenshots?.length || 0} screenshots
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Backtests;
