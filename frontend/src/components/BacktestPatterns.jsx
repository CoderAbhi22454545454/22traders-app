import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon,
  TagIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const BacktestPatterns = ({ userId }) => {
  const [patterns, setPatterns] = useState([]);
  const [marketConditions, setMarketConditions] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    patterns: [],
    marketConditions: [],
    strategies: [],
    minWinRate: '',
    minTrades: '',
    sortBy: 'totalPnL'
  });

  useEffect(() => {
    fetchPatternAnalysis();
  }, [userId, activeFilters]);

  const fetchPatternAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/backtests/patterns?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch pattern analysis');
      
      const data = await response.json();
      
      // Apply filters
      let filteredPatterns = data.patterns;
      let filteredMarketConditions = data.marketConditions;
      let filteredStrategies = data.strategies;

      // Filter by minimum win rate
      if (activeFilters.minWinRate) {
        const minWinRate = parseFloat(activeFilters.minWinRate);
        filteredPatterns = filteredPatterns.filter(p => parseFloat(p.winRate) >= minWinRate);
        filteredMarketConditions = filteredMarketConditions.filter(m => parseFloat(m.winRate) >= minWinRate);
        filteredStrategies = filteredStrategies.filter(s => parseFloat(s.winRate) >= minWinRate);
      }

      // Filter by minimum trades
      if (activeFilters.minTrades) {
        const minTrades = parseInt(activeFilters.minTrades);
        filteredPatterns = filteredPatterns.filter(p => p.totalTrades >= minTrades);
        filteredMarketConditions = filteredMarketConditions.filter(m => m.totalTrades >= minTrades);
        filteredStrategies = filteredStrategies.filter(s => s.totalTrades >= minTrades);
      }

      // Sort results
      const sortField = activeFilters.sortBy;
      [filteredPatterns, filteredMarketConditions, filteredStrategies].forEach(arr => {
        arr.sort((a, b) => {
          if (sortField === 'winRate') return parseFloat(b.winRate) - parseFloat(a.winRate);
          if (sortField === 'totalTrades') return b.totalTrades - a.totalTrades;
          return b.totalPnL - a.totalPnL; // default to totalPnL
        });
      });

      setPatterns(filteredPatterns);
      setMarketConditions(filteredMarketConditions);
      setStrategies(filteredStrategies);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      patterns: [],
      marketConditions: [],
      strategies: [],
      minWinRate: '',
      minTrades: '',
      sortBy: 'totalPnL'
    });
  };

  const PatternCard = ({ title, items, icon: Icon, color }) => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {Icon && <Icon className={`h-5 w-5 mr-2 ${color}`} />}
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <span className="text-sm text-gray-500">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No data available</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {item.pattern || item.condition || item.strategy}
                  </h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Trades:</span> {item.totalTrades}
                    </div>
                    <div>
                      <span className="font-medium">Win Rate:</span> {item.winRate}%
                    </div>
                    <div>
                      <span className="font-medium">Total P&L:</span> 
                      <span className={item.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${item.totalPnL.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Avg P&L:</span> 
                      <span className={item.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${item.avgPnL.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.totalPnL >= 0 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.totalPnL >= 0 ? (
                      <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                    )}
                    {item.totalPnL >= 0 ? 'Profitable' : 'Loss'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pattern analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/backtests"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Backtests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Pattern Analysis</h1>
          <p className="mt-2 text-gray-600">Identify profitable patterns and strategies from your backtests</p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters & Sorting</h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Win Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={activeFilters.minWinRate}
                onChange={(e) => handleFilterChange('minWinRate', e.target.value)}
                placeholder="e.g., 60"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Min Trades</label>
              <input
                type="number"
                min="1"
                value={activeFilters.minTrades}
                onChange={(e) => handleFilterChange('minTrades', e.target.value)}
                placeholder="e.g., 5"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sort By</label>
              <select
                value={activeFilters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="totalPnL">Total P&L</option>
                <option value="winRate">Win Rate</option>
                <option value="totalTrades">Number of Trades</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Pattern Analysis Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <PatternCard
            title="Patterns"
            items={patterns}
            icon={ChartBarIcon}
            color="text-blue-500"
          />
          
          <PatternCard
            title="Market Conditions"
            items={marketConditions}
            icon={ChartBarIcon}
            color="text-green-500"
          />
          
          <PatternCard
            title="Strategies"
            items={strategies}
            icon={TagIcon}
            color="text-purple-500"
          />
        </div>

        {/* Summary Insights */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Best Performing Patterns */}
            <div>
              <h4 className="text-sm font-medium text-green-600 mb-3">Most Profitable Patterns</h4>
              <div className="space-y-2">
                {patterns.slice(0, 3).map((pattern, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                    <span className="text-sm font-medium text-gray-900">{pattern.pattern}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">${pattern.totalPnL.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{pattern.winRate}% win rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Worst Performing Patterns */}
            <div>
              <h4 className="text-sm font-medium text-red-600 mb-3">Least Profitable Patterns</h4>
              <div className="space-y-2">
                {patterns.slice(-3).reverse().map((pattern, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                    <span className="text-sm font-medium text-gray-900">{pattern.pattern}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">${pattern.totalPnL.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{pattern.winRate}% win rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestPatterns;
