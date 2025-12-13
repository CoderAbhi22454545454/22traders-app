import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, ScatterChart, Scatter
} from 'recharts';
import { 
  PlusIcon, 
  FunnelIcon, 
  ChartBarIcon,
  PhotoIcon,
  TagIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  FireIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import InstrumentIcon from './shared/InstrumentIcon';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Backtests = ({ userId }) => {
  const navigate = useNavigate();
  const [backtests, setBacktests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    timeRange: '',
    pattern: '',
    marketCondition: '',
    chipName: '',
    chipValue: '',
    result: '',
    minConfidence: '',
    maxConfidence: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    patterns: [],
    marketConditions: [],
    instruments: [],
    chipsByCategory: {}
  });
  const [showFilters, setShowFilters] = useState(false);
  const [statistics, setStatistics] = useState({
    totalBacktests: 0,
    totalPnL: 0,
    winRate: 0,
    avgConfidence: 0,
    winningTrades: 0,
    losingTrades: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBacktests: 0
  });
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const [activeTab, setActiveTab] = useState(() => {
    // Check if we're on the analytics route
    const path = window.location.pathname;
    return path.includes('/analytics') ? 'analytics' : 'list';
  }); // 'list', 'analytics', 'comparison'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [savedFilterPresets, setSavedFilterPresets] = useState(() => {
    const saved = localStorage.getItem('backtestFilterPresets');
    return saved ? JSON.parse(saved) : [];
  });

  // Filter backtests by search term
  const filteredBacktests = backtests.filter(backtest => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      backtest.tradePair?.toLowerCase().includes(term) ||
      backtest.instrument?.toLowerCase().includes(term) ||
      backtest.tradeNumber?.toLowerCase().includes(term) ||
      backtest.patternIdentified?.toLowerCase().includes(term) ||
      backtest.backtestNotes?.toLowerCase().includes(term) ||
      backtest.customChips?.some(chip => 
        chip.name?.toLowerCase().includes(term) || 
        chip.value?.toLowerCase().includes(term)
      )
    );
  });

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

  // Fetch comprehensive analytics
  const fetchAnalytics = async () => {
    if (!userId) return;
    
    setAnalyticsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        userId,
        ...(filters.timeRange && { timeRange: filters.timeRange }),
        ...(filters.pattern && { pattern: filters.pattern }),
        ...(filters.marketCondition && { marketCondition: filters.marketCondition }),
        ...(filters.result && { result: filters.result }),
        ...(filters.minConfidence && { minConfidence: filters.minConfidence }),
        ...(filters.maxConfidence && { maxConfidence: filters.maxConfidence })
      });

      const response = await fetch(`${API_BASE_URL}/backtests/analytics/comprehensive?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Set active tab based on URL on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/analytics')) {
      setActiveTab('analytics');
    }
  }, []);

  // Fetch analytics when tab changes to analytics
  useEffect(() => {
    if (activeTab === 'analytics' && userId) {
      fetchAnalytics();
    }
  }, [activeTab, userId, filters]);

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const queryParams = new URLSearchParams({
        userId,
        ...(filters.timeRange && { timeRange: filters.timeRange }),
        ...(filters.pattern && { pattern: filters.pattern }),
        ...(filters.marketCondition && { marketCondition: filters.marketCondition }),
        ...(filters.result && { result: filters.result }),
        ...(filters.minConfidence && { minConfidence: filters.minConfidence }),
        ...(filters.maxConfidence && { maxConfidence: filters.maxConfidence })
      });

      const response = await fetch(`${API_BASE_URL}/backtests/export/csv?${queryParams}`);
      if (!response.ok) throw new Error('Failed to export CSV');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backtests_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // Save filter preset
  const saveFilterPreset = () => {
    const presetName = prompt('Enter a name for this filter preset:');
    if (!presetName) return;
    
    const newPreset = {
      id: Date.now(),
      name: presetName,
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };
    
    const updated = [...savedFilterPresets, newPreset];
    setSavedFilterPresets(updated);
    localStorage.setItem('backtestFilterPresets', JSON.stringify(updated));
  };

  // Load filter preset
  const loadFilterPreset = (preset) => {
    setFilters(preset.filters);
  };

  // Delete filter preset
  const deleteFilterPreset = (presetId) => {
    const updated = savedFilterPresets.filter(p => p.id !== presetId);
    setSavedFilterPresets(updated);
    localStorage.setItem('backtestFilterPresets', JSON.stringify(updated));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      timeRange: '',
      pattern: '',
      marketCondition: '',
      chipName: '',
      chipValue: '',
      result: '',
      minConfidence: '',
      maxConfidence: ''
    });
    setSearchTerm('');
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
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Backtests</h1>
              <p className="mt-1 text-gray-600">
                {filteredBacktests.length} backtests • Analyze your trading performance
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search backtests, patterns, notes..."
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
            
            <div className="flex space-x-3">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm transition-colors ${
                  showFilters 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
                {Object.values(filters).some(f => f !== '') && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
              </button>
              
              {/* Refresh Button */}
              <button
                onClick={() => fetchBacktests(1)}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                title="Refresh backtests"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <Link
                to="/backtests/patterns"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Patterns
              </Link>
              <button
                onClick={() => navigate('/backtests/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Backtest
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Time Range</label>
                  <select
                    value={filters.timeRange}
                    onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="1m">Last Month</option>
                    <option value="3m">Last 3 Months</option>
                    <option value="6m">Last 6 Months</option>
                    <option value="1y">Last Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Pattern</label>
                  <select
                    value={filters.pattern}
                    onChange={(e) => handleFilterChange('pattern', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Patterns</option>
                    {filterOptions.patterns.map(pattern => (
                      <option key={pattern} value={pattern}>{pattern}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Market Condition</label>
                  <select
                    value={filters.marketCondition}
                    onChange={(e) => handleFilterChange('marketCondition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Conditions</option>
                    <option value="trending">Trending</option>
                    <option value="ranging">Ranging</option>
                    <option value="volatile">Volatile</option>
                    <option value="calm">Calm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Result</label>
                  <select
                    value={filters.result}
                    onChange={(e) => handleFilterChange('result', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Results</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="be">Break Even</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Confidence</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={filters.minConfidence}
                    onChange={(e) => handleFilterChange('minConfidence', e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Confidence</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={filters.maxConfidence}
                    onChange={(e) => handleFilterChange('maxConfidence', e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Label Name</label>
                  <input
                    type="text"
                    value={filters.chipName}
                    onChange={(e) => handleFilterChange('chipName', e.target.value)}
                    placeholder="Search labels..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Total Backtests */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Backtests</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics?.totalBacktests || 0}</p>
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    {statistics?.winningTrades || 0}W • {statistics?.losingTrades || 0}L
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Total P&L */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total P&L</p>
                  <p className={`text-3xl font-bold ${(statistics?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(statistics?.totalPnL || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    Avg: ${statistics?.totalBacktests > 0 ? ((statistics?.totalPnL || 0) / statistics.totalBacktests).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Win Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{statistics?.winRate || 0}%</p>
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    {statistics?.winningTrades || 0} wins of {statistics?.totalBacktests || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FireIcon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Avg Confidence */}
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Avg Confidence</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statistics?.avgConfidence ? statistics.avgConfidence.toFixed(1) : 'N/A'}/10
                  </p>
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    Trade setup quality
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <StarIcon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-1 inline-flex">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ListBulletIcon className="h-4 w-4 inline mr-2" />
              Backtests List
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChartBarIcon className="h-4 w-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'comparison'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4 inline mr-2" />
              Compare
            </button>
            <button
              onClick={exportToCSV}
              className="px-6 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              title="Export to CSV"
            >
              <ArrowDownTrayIcon className="h-4 w-4 inline mr-2" />
              Export CSV
            </button>
          </div>

          {/* Saved Filter Presets */}
          {savedFilterPresets.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 font-medium">Saved Filters:</span>
              {savedFilterPresets.map(preset => (
                <div key={preset.id} className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                  <button
                    onClick={() => loadFilterPreset(preset)}
                    className="text-sm text-gray-700 hover:text-blue-600"
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => deleteFilterPreset(preset.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={saveFilterPreset}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Save Current Filters
              </button>
            </div>
          )}

          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard 
              analyticsData={analyticsData} 
              loading={analyticsLoading}
              onRefresh={fetchAnalytics}
            />
          )}

          {/* Comparison Tab Content */}
          {activeTab === 'comparison' && (
            <ComparisonTool 
              backtests={filteredBacktests}
              selectedForComparison={selectedForComparison}
              setSelectedForComparison={setSelectedForComparison}
            />
          )}

          {/* Backtests List */}
          {activeTab === 'list' && (
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

            {filteredBacktests.length === 0 ? (
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
                    {filteredBacktests.map((backtest) => (
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
                      {filteredBacktests.map((backtest) => (
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
          )}
      </div>
    </div>
  );
};

// Analytics Dashboard Component
const AnalyticsDashboard = ({ analyticsData, loading, onRefresh }) => {
  // Hooks must be called at the top level, before any conditional returns
  const [instrumentTimeframe, setInstrumentTimeframe] = useState('all'); // 'all', '20', 'monthly'

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (!analyticsData || !analyticsData.overview) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600 mb-4">Create some backtests to see analytics</p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>
    );
  }

  const { 
    overview, 
    equityCurve, 
    pnlDistribution, 
    bestWorstTrades, 
    streaks, 
    timeAnalysis, 
    riskAnalysis, 
    insights, 
    performance,
    instrumentPerformance,
    directionPerformance,
    rrAnalysis,
    confidenceImpact,
    marketConditionPerformance,
    labelUsage,
    screenshotUsage,
    tradeQuality
  } = analyticsData;

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Summary Metrics - Top Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Summary Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Total Trades</div>
            <div className="text-2xl font-bold text-gray-900">{overview.totalTrades || 0}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-blue-600">{parseFloat(overview.winRate || 0).toFixed(1)}%</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Avg R:R</div>
            <div className="text-2xl font-bold text-gray-900">{parseFloat(overview.avgRiskReward || 0).toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Total P&L</div>
            <div className={`text-2xl font-bold ${(overview.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(parseFloat(overview.totalPnL || 0))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Avg P&L/Trade</div>
            <div className={`text-2xl font-bold ${(overview.avgPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(parseFloat(overview.avgPnL || 0))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Best Trade</div>
            <div className="text-xl font-bold text-green-600">
              {overview.bestTrade ? formatCurrency(overview.bestTrade.pnl) : 'N/A'}
            </div>
            {overview.bestTrade && (
              <div className="text-xs text-gray-500 mt-1">{overview.bestTrade.pair}</div>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Worst Trade</div>
            <div className="text-xl font-bold text-red-600">
              {overview.worstTrade ? formatCurrency(overview.worstTrade.pnl) : 'N/A'}
            </div>
            {overview.worstTrade && (
              <div className="text-xs text-gray-500 mt-1">{overview.worstTrade.pair}</div>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Most Traded Pair</div>
            <div className="text-xl font-bold text-gray-900">{overview.mostTradedPair || 'N/A'}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Avg Confidence</div>
            <div className="text-2xl font-bold text-gray-900">{parseFloat(overview.avgConfidence || 0).toFixed(1)}/10</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Most Used Pattern</div>
            <div className="text-lg font-bold text-gray-900 truncate" title={overview.mostUsedPattern}>
              {overview.mostUsedPattern || 'N/A'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Most Used Market</div>
            <div className="text-lg font-bold text-gray-900 capitalize">
              {overview.mostUsedMarketCondition || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Insights Panel */}
      {insights && insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center mb-4">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Smart Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={idx} className={`p-4 rounded-lg ${
                insight.type === 'success' ? 'bg-green-50 border border-green-200' :
                insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="font-semibold text-gray-900 mb-1">{insight.title}</div>
                <div className="text-sm text-gray-700">{insight.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Profit Factor</div>
          <div className="text-2xl font-bold text-gray-900">{overview.profitFactor || 'N/A'}</div>
          <div className="text-xs text-gray-500 mt-1">Total Wins / Total Losses</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Expectancy</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(parseFloat(overview.expectancy || 0))}</div>
          <div className="text-xs text-gray-500 mt-1">Expected value per trade</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Avg Win</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(parseFloat(overview.avgWin || 0))}</div>
          <div className="text-xs text-gray-500 mt-1">Average winning trade</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Avg Loss</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(parseFloat(overview.avgLoss || 0))}</div>
          <div className="text-xs text-gray-500 mt-1">Average losing trade</div>
        </div>
      </div>

      {/* Streaks */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Streak Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Current Streak</div>
            <div className="text-2xl font-bold text-gray-900">{streaks.current || 0}</div>
            <div className="text-xs text-gray-500 capitalize">{streaks.currentType || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Longest Win Streak</div>
            <div className="text-2xl font-bold text-green-600">{streaks.longestWin || 0}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Longest Loss Streak</div>
            <div className="text-2xl font-bold text-red-600">{streaks.longestLoss || 0}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">Max Drawdown</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(parseFloat(riskAnalysis.maxDrawdown || 0))}</div>
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      {equityCurve && equityCurve.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="tradeNumber" 
                label={{ value: 'Trade Number', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Cumulative P&L ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Trade #${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="cumulativePnL" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* P&L Distribution */}
      {pnlDistribution && pnlDistribution.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">P&L Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pnlDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Instrument Performance */}
      {instrumentPerformance && instrumentPerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Instrument Performance</h3>
            <select
              value={instrumentTimeframe}
              onChange={(e) => setInstrumentTimeframe(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="all">All Time</option>
              <option value="20">Last 20 Trades</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={instrumentPerformance.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pair" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value, name) => {
                if (name === 'totalPnL') return formatCurrency(value);
                if (name === 'winRate') return `${value.toFixed(1)}%`;
                return value;
              }} />
              <Legend />
              <Bar yAxisId="left" dataKey="totalPnL" fill="#10B981" name="Total P&L" />
              <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="#EF4444" name="Win Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Direction Performance */}
      {directionPerformance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Direction Performance - Win Rate</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Long', value: directionPerformance.Long?.winRate || 0, trades: directionPerformance.Long?.trades || 0 },
                    { name: 'Short', value: directionPerformance.Short?.winRate || 0, trades: directionPerformance.Short?.trades || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, trades }) => `${name}: ${value.toFixed(1)}% (${trades} trades)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Direction Performance - Avg P&L</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { direction: 'Long', avgPnL: directionPerformance.Long?.avgPnL || 0 },
                { direction: 'Short', avgPnL: directionPerformance.Short?.avgPnL || 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="direction" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="avgPnL" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* R:R Analysis */}
      {rrAnalysis && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk:Reward Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-2">R:R Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rrAnalysis.histogram}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rr" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">Avg R:R on Winning Trades</div>
                <div className="text-2xl font-bold text-green-600">{parseFloat(rrAnalysis.avgRRWins || 0).toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">Avg R:R on Losing Trades</div>
                <div className="text-2xl font-bold text-red-600">{parseFloat(rrAnalysis.avgRRLosses || 0).toFixed(2)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">Overall Avg R:R</div>
                <div className="text-2xl font-bold text-gray-900">{parseFloat(rrAnalysis.avgRiskReward || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confidence Level Impact */}
      {confidenceImpact && confidenceImpact.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Level Impact</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="confidence" 
                name="Confidence" 
                domain={[0, 11]}
                label={{ value: 'Confidence Level (1-10)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Average P&L ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value, name) => {
                  if (name === 'avgPnL') return formatCurrency(value);
                  if (name === 'winRate') return `${value.toFixed(1)}%`;
                  return value;
                }}
                labelFormatter={(label) => `Confidence: ${label}`}
              />
              <Scatter 
                name="Confidence vs P&L" 
                data={confidenceImpact} 
                fill="#3B82F6"
                dataKey="avgPnL"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Market Condition Performance */}
      {marketConditionPerformance && marketConditionPerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Condition Performance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={marketConditionPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="condition" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'avgPnL') return formatCurrency(value);
                  if (name === 'winRate') return `${value.toFixed(1)}%`;
                  return value;
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="avgPnL" fill="#10B981" name="Avg P&L" />
              <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="#EF4444" name="Win Rate %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Custom Labels Usage */}
      {labelUsage && labelUsage.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Most Used Labels</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage Count</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Win Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total P&L</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {labelUsage.map((label, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {label.name}: {label.value}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{label.usageCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{label.winRate.toFixed(1)}%</td>
                    <td className={`px-4 py-3 text-sm font-medium ${
                      label.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(label.totalPnL)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screenshot Usage */}
      {screenshotUsage && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Screenshot Usage</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">Trades with Screenshots</div>
              <div className="text-2xl font-bold text-gray-900">{screenshotUsage.totalTradesWithScreenshots || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Screenshots</div>
              <div className="text-2xl font-bold text-gray-900">{screenshotUsage.totalScreenshots || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">Before Trade</div>
              <div className="text-2xl font-bold text-blue-600">{screenshotUsage.before || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">Entry</div>
              <div className="text-2xl font-bold text-green-600">{screenshotUsage.entry || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">After Trade</div>
              <div className="text-2xl font-bold text-purple-600">{screenshotUsage.after || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Quality Insights */}
      {tradeQuality && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade Quality Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tradeQuality.whatWorked && tradeQuality.whatWorked.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-green-600 mb-3">What Worked - Top Keywords</h4>
                <div className="space-y-2">
                  {tradeQuality.whatWorked.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-green-50 rounded-lg p-2">
                      <span className="text-sm text-gray-700">{item.word}</span>
                      <span className="text-sm font-medium text-green-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tradeQuality.whatDidntWork && tradeQuality.whatDidntWork.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-red-600 mb-3">What Didn't Work - Top Keywords</h4>
                <div className="space-y-2">
                  {tradeQuality.whatDidntWork.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-red-50 rounded-lg p-2">
                      <span className="text-sm text-gray-700">{item.word}</span>
                      <span className="text-sm font-medium text-red-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tradeQuality.improvementAreas && tradeQuality.improvementAreas.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-blue-600 mb-3">Improvement Areas - Top Keywords</h4>
                <div className="space-y-2">
                  {tradeQuality.improvementAreas.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-blue-50 rounded-lg p-2">
                      <span className="text-sm text-gray-700">{item.word}</span>
                      <span className="text-sm font-medium text-blue-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tradeQuality.entryReasons && tradeQuality.entryReasons.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-purple-600 mb-3">Entry Reasons - Top Keywords</h4>
                <div className="space-y-2">
                  {tradeQuality.entryReasons.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-purple-50 rounded-lg p-2">
                      <span className="text-sm text-gray-700">{item.word}</span>
                      <span className="text-sm font-medium text-purple-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tradeQuality.exitReasons && tradeQuality.exitReasons.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-orange-600 mb-3">Exit Reasons - Top Keywords</h4>
                <div className="space-y-2">
                  {tradeQuality.exitReasons.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-orange-50 rounded-lg p-2">
                      <span className="text-sm text-gray-700">{item.word}</span>
                      <span className="text-sm font-medium text-orange-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pattern Performance */}
      {performance && performance.patternPerformance && performance.patternPerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Performance</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={performance.patternPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pattern" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="totalPnL" fill="#10B981" name="Total P&L" />
              <Line yAxisId="right" type="monotone" dataKey="winRate" stroke="#EF4444" name="Win Rate %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Time-Based Analysis */}
      {timeAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* By Hour */}
          {timeAnalysis.byHour && timeAnalysis.byHour.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Hour</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timeAnalysis.byHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="pnl" fill="#3B82F6" name="P&L" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By Day of Week */}
          {timeAnalysis.byDayOfWeek && timeAnalysis.byDayOfWeek.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Day</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timeAnalysis.byDayOfWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="pnl" fill="#10B981" name="P&L" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By Month */}
          {timeAnalysis.byMonth && timeAnalysis.byMonth.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Month</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timeAnalysis.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="pnl" fill="#8B5CF6" name="P&L" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Best & Worst Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Trades */}
        {bestWorstTrades.best && bestWorstTrades.best.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-green-600 mb-4">Top 5 Best Trades</h3>
            <div className="space-y-3">
              {bestWorstTrades.best.map((trade, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{trade.tradePair}</div>
                    <div className="text-sm text-gray-600">{trade.pattern} • {trade.marketCondition}</div>
                    <div className="text-xs text-gray-500">{new Date(trade.date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(trade.pnl)}</div>
                    <div className="text-xs text-gray-500">Conf: {trade.confidence || 'N/A'}/10</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Worst Trades */}
        {bestWorstTrades.worst && bestWorstTrades.worst.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Top 5 Worst Trades</h3>
            <div className="space-y-3">
              {bestWorstTrades.worst.map((trade, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{trade.tradePair}</div>
                    <div className="text-sm text-gray-600">{trade.pattern} • {trade.marketCondition}</div>
                    <div className="text-xs text-gray-500">{new Date(trade.date).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{formatCurrency(trade.pnl)}</div>
                    <div className="text-xs text-gray-500">Conf: {trade.confidence || 'N/A'}/10</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Comparison Tool Component
const ComparisonTool = ({ backtests, selectedForComparison, setSelectedForComparison }) => {
  const toggleSelection = (backtestId) => {
    if (selectedForComparison.includes(backtestId)) {
      setSelectedForComparison(selectedForComparison.filter(id => id !== backtestId));
    } else {
      if (selectedForComparison.length < 4) {
        setSelectedForComparison([...selectedForComparison, backtestId]);
      } else {
        alert('You can compare up to 4 backtests at once');
      }
    }
  };

  const clearSelection = () => {
    setSelectedForComparison([]);
  };

  const selectedBacktests = backtests.filter(b => selectedForComparison.includes(b._id));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Backtests to Compare (Max 4)</h3>
          {selectedForComparison.length > 0 && (
            <button
              onClick={clearSelection}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear Selection ({selectedForComparison.length})
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {backtests.slice(0, 20).map(backtest => (
            <div
              key={backtest._id}
              onClick={() => toggleSelection(backtest._id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedForComparison.includes(backtest._id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">{backtest.tradePair || backtest.instrument}</div>
                <div className={`text-sm font-bold ${
                  (backtest.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${(backtest.pnl || 0).toFixed(2)}
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {backtest.patternIdentified || 'No pattern'} • {new Date(backtest.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBacktests.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                  {selectedBacktests.map(bt => (
                    <th key={bt._id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {bt.tradePair || bt.instrument}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">P&L</td>
                  {selectedBacktests.map(bt => (
                    <td key={bt._id} className={`px-4 py-3 text-sm ${
                      (bt.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${(bt.pnl || 0).toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Result</td>
                  {selectedBacktests.map(bt => (
                    <td key={bt._id} className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {bt.result || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Pattern</td>
                  {selectedBacktests.map(bt => (
                    <td key={bt._id} className="px-4 py-3 text-sm text-gray-600">
                      {bt.patternIdentified || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Market Condition</td>
                  {selectedBacktests.map(bt => (
                    <td key={bt._id} className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {bt.marketCondition || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Confidence</td>
                  {selectedBacktests.map(bt => (
                    <td key={bt._id} className="px-4 py-3 text-sm text-gray-600">
                      {bt.confidence || 'N/A'}/10
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Risk:Reward</td>
                  {selectedBacktests.map(bt => (
                    <td key={bt._id} className="px-4 py-3 text-sm text-gray-600">
                      {bt.riskReward || 'N/A'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
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
