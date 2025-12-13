import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PlusIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  TagIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import InstrumentIcon from './shared/InstrumentIcon';
import BacktestGoalManager from './BacktestGoalManager';
import MasterCardQuickStats from './MasterCardQuickStats';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const MasterCardDetail = ({ userId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [masterCard, setMasterCard] = useState(null);
  const [backtests, setBacktests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (userId && id) {
      fetchMasterCard();
      fetchBacktests();
      fetchAnalytics();
    }
  }, [userId, id]);

  // Refresh when component becomes visible (e.g., navigating back from creating a trade)
  useEffect(() => {
    const handleFocus = () => {
      if (userId && id) {
        fetchBacktests();
        fetchAnalytics();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userId, id]);

  const fetchMasterCard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/master-cards/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setMasterCard(data.masterCard);
      } else {
        setError(data.message || 'Failed to fetch master card');
      }
    } catch (err) {
      console.error('Error fetching master card:', err);
      setError('Failed to fetch master card');
    }
  };

  const fetchBacktests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/backtests?userId=${userId}&masterCardId=${id}`);
      const data = await response.json();
      
      // Backend returns { backtests, pagination, statistics }
      // Check for both response formats for compatibility
      if (data.success && data.backtests) {
        setBacktests(data.backtests || []);
      } else if (data.backtests) {
        setBacktests(data.backtests || []);
      }
      
      // Trigger goal refresh after fetching backtests
      // This ensures goals update when backtests change
      window.dispatchEvent(new CustomEvent('backtestsUpdated'));
    } catch (err) {
      console.error('Error fetching backtests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/master-cards/${id}/analytics`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleDeleteBacktest = async (backtestId) => {
    if (!window.confirm('Are you sure you want to delete this backtest?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/backtests/${backtestId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchBacktests();
        fetchAnalytics();
      } else {
        alert(data.message || 'Failed to delete backtest');
      }
    } catch (err) {
      console.error('Error deleting backtest:', err);
      alert('Failed to delete backtest');
    }
  };

  const handleEditName = () => {
    setEditedName(masterCard.name);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      alert('Name cannot be empty');
      return;
    }

    setSavingName(true);
    try {
      const response = await fetch(`${API_BASE_URL}/master-cards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMasterCard({ ...masterCard, name: editedName.trim() });
        setIsEditingName(false);
      } else {
        alert(data.message || 'Failed to update master card name');
      }
    } catch (err) {
      console.error('Error updating master card name:', err);
      alert('Failed to update master card name');
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const formatChip = (chip, index) => (
    <span
      key={index}
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: chip.color ? `${chip.color}20` : '#3B82F620',
        color: chip.color || '#3B82F6'
      }}
    >
      {chip.name}: {chip.value}
    </span>
  );

  const getTradeResult = (backtest) => {
    if (backtest.result) return backtest.result;
    if (backtest.pnl > 0) return 'win';
    if (backtest.pnl < 0) return 'loss';
    return 'be';
  };

  const filteredBacktests = backtests.filter(backtest => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (backtest.tradePair || backtest.instrument || '').toLowerCase().includes(search) ||
      (backtest.patternIdentified || '').toLowerCase().includes(search) ||
      (backtest.backtestNotes || '').toLowerCase().includes(search) ||
      (backtest.marketCondition || '').toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading master card...</p>
        </div>
      </div>
    );
  }

  if (error || !masterCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Master card not found'}</p>
          <Link
            to="/backtests"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Master Cards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/backtests"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Master Cards
          </Link>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: masterCard.color || '#3B82F6' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="flex-1 text-3xl font-bold text-gray-900 border-2 border-blue-500 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') handleCancelEditName();
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Save"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleCancelEditName}
                      disabled={savingName}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{masterCard.name}</h1>
                    <button
                      onClick={handleEditName}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit name"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
                {masterCard.description && (
                  <p className="text-gray-600 mb-4">{masterCard.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {masterCard.strategy && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Strategy: {masterCard.strategy}
                    </span>
                  )}
                  {masterCard.timeframe && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      Timeframe: {masterCard.timeframe}
                    </span>
                  )}
                  {masterCard.pattern && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      Pattern: {masterCard.pattern}
                    </span>
                  )}
                </div>
              </div>
              <Link
                to={`/backtests/new?masterCardId=${id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                Add Trade
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics Summary */}
        {analytics && analytics.overview && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalTrades || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">{parseFloat(analytics.overview.winRate || 0).toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total P&L</p>
              <p className={`text-2xl font-bold ${(analytics.overview.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${parseFloat(analytics.overview.totalPnL || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Avg P&L</p>
              <p className={`text-2xl font-bold ${(analytics.overview.avgPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${parseFloat(analytics.overview.avgPnL || 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Goal Manager Section */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <BacktestGoalManager 
            userId={userId} 
            masterCardId={id}
            onGoalUpdate={() => {
              // Refresh analytics when goals are updated
              fetchAnalytics();
            }}
          />
        </div>

        {/* Quick Stats Cards */}
        {backtests.length > 0 && (
          <div className="mb-6">
            <MasterCardQuickStats backtests={backtests} />
          </div>
        )}

        {/* Search and View Mode */}
        <div className="mb-6 bg-white rounded-lg shadow p-4 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Backtests List */}
        {filteredBacktests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trades Yet</h3>
            <p className="text-gray-600 mb-6">Add your first trade to this master card</p>
            <Link
              to={`/backtests/new?masterCardId=${id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add Trade
            </Link>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBacktests.map((backtest) => (
              <div
                key={backtest._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <Link to={`/backtests/${backtest._id}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <InstrumentIcon instrument={backtest.tradePair || backtest.instrument} />
                          <h3 className="font-semibold text-gray-900">
                            {backtest.tradePair || backtest.instrument || 'N/A'}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(backtest.date || backtest.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          getTradeResult(backtest) === 'win'
                            ? 'bg-green-100 text-green-800'
                            : getTradeResult(backtest) === 'loss'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {getTradeResult(backtest).toUpperCase()}
                      </span>
                    </div>

                    {backtest.pnl !== undefined && (
                      <div className="mb-3">
                        <p className={`text-2xl font-bold ${
                          backtest.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${backtest.pnl.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Additional Trade Details */}
                    <div className="space-y-2 mb-4">
                      {backtest.direction && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Direction:</span>
                          <span className={`font-medium ${
                            backtest.direction === 'Long' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {backtest.direction}
                          </span>
                        </div>
                      )}
                      
                      {(backtest.entryPrice || backtest.exitPrice) && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Entry/Exit:</span>
                          <span className="font-medium text-gray-900">
                            {backtest.entryPrice ? backtest.entryPrice.toFixed(5) : 'N/A'} / {backtest.exitPrice ? backtest.exitPrice.toFixed(5) : 'N/A'}
                          </span>
                        </div>
                      )}

                      {backtest.confidence && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-medium text-gray-900">{backtest.confidence}/10</span>
                        </div>
                      )}

                      {backtest.marketCondition && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Market:</span>
                          <span className="font-medium text-gray-900 capitalize">{backtest.marketCondition}</span>
                        </div>
                      )}

                      {backtest.riskReward && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Risk:Reward:</span>
                          <span className="font-medium text-gray-900">{backtest.riskReward}</span>
                        </div>
                      )}
                    </div>

                    {backtest.patternIdentified && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Pattern:</span> {backtest.patternIdentified}
                        </p>
                      </div>
                    )}

                    {backtest.customChips && backtest.customChips.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {backtest.customChips.slice(0, 3).map((chip, idx) => formatChip(chip, idx))}
                        {backtest.customChips.length > 3 && (
                          <span className="text-xs text-gray-500">+{backtest.customChips.length - 3} more</span>
                        )}
                      </div>
                    )}

                    {backtest.screenshots && backtest.screenshots.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <PhotoIcon className="h-4 w-4 mr-1" />
                        {backtest.screenshots.length} screenshot{backtest.screenshots.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="px-6 pb-4 flex gap-2">
                  <Link
                    to={`/backtests/${backtest._id}`}
                    className="flex-1 text-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    View
                  </Link>
                  <Link
                    to={`/backtests/${backtest._id}/edit`}
                    className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteBacktest(backtest._id);
                    }}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pair</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBacktests.map((backtest) => (
                    <tr key={backtest._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(backtest.date || backtest.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {backtest.tradePair || backtest.instrument || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {backtest.direction || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            getTradeResult(backtest) === 'win'
                              ? 'bg-green-100 text-green-800'
                              : getTradeResult(backtest) === 'loss'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {getTradeResult(backtest).toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        (backtest.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${(backtest.pnl || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {backtest.patternIdentified || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Link
                            to={`/backtests/${backtest._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                          <Link
                            to={`/backtests/${backtest._id}/edit`}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteBacktest(backtest._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterCardDetail;

