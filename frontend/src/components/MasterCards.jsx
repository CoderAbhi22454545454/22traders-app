import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  FireIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import BacktestGoalManager from './BacktestGoalManager';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const MasterCards = ({ userId }) => {
  const navigate = useNavigate();
  const [masterCards, setMasterCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [combinedAnalytics, setCombinedAnalytics] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strategy: '',
    timeframe: '',
    pattern: '',
    color: '#3B82F6',
    tags: []
  });

  useEffect(() => {
    if (userId) {
      fetchMasterCards();
      fetchCombinedAnalytics();
    }
  }, [userId]);

  const fetchMasterCards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/master-cards?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setMasterCards(data.masterCards || []);
      } else {
        setError(data.message || 'Failed to fetch master cards');
      }
    } catch (err) {
      console.error('Error fetching master cards:', err);
      setError('Failed to fetch master cards');
    } finally {
      setLoading(false);
    }
  };

  const fetchCombinedAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/master-cards/analytics/combined?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setCombinedAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching combined analytics:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/master-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          description: '',
          strategy: '',
          timeframe: '',
          pattern: '',
          color: '#3B82F6',
          tags: []
        });
        fetchMasterCards();
        fetchCombinedAnalytics();
      } else {
        alert(data.message || 'Failed to create master card');
      }
    } catch (err) {
      console.error('Error creating master card:', err);
      alert('Failed to create master card');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/master-cards/${editingCard._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setEditingCard(null);
        setFormData({
          name: '',
          description: '',
          strategy: '',
          timeframe: '',
          pattern: '',
          color: '#3B82F6',
          tags: []
        });
        fetchMasterCards();
        fetchCombinedAnalytics();
      } else {
        alert(data.message || 'Failed to update master card');
      }
    } catch (err) {
      console.error('Error updating master card:', err);
      alert('Failed to update master card');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this master card and all its backtests?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/master-cards/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchMasterCards();
        fetchCombinedAnalytics();
      } else {
        alert(data.message || 'Failed to delete master card');
      }
    } catch (err) {
      console.error('Error deleting master card:', err);
      alert('Failed to delete master card');
    }
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      description: card.description || '',
      strategy: card.strategy || '',
      timeframe: card.timeframe || '',
      pattern: card.pattern || '',
      color: card.color || '#3B82F6',
      tags: card.tags || []
    });
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading master cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchMasterCards}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Backtest Master Cards</h1>
              <p className="mt-2 text-gray-600">Organize your backtests into strategies and patterns</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/backtests/analytics"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <ChartBarIcon className="h-5 w-5" />
                Analytics Dashboard
              </Link>
              <button
                onClick={() => {
                  setEditingCard(null);
                  setFormData({
                    name: '',
                    description: '',
                    strategy: '',
                    timeframe: '',
                    pattern: '',
                    color: '#3B82F6',
                    tags: []
                  });
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                New Master Card
              </button>
            </div>
          </div>
        </div>

        {/* Combined Analytics Summary */}
        {combinedAnalytics && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Combined Analytics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Master Cards</p>
                <p className="text-2xl font-bold text-gray-900">{combinedAnalytics.overview.totalMasterCards || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Trades</p>
                <p className="text-2xl font-bold text-gray-900">{combinedAnalytics.overview.totalTrades || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total P&L</p>
                <p className={`text-2xl font-bold ${(combinedAnalytics.overview.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${parseFloat(combinedAnalytics.overview.totalPnL || 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">{parseFloat(combinedAnalytics.overview.winRate || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Overall Goals Section */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <BacktestGoalManager 
            userId={userId} 
            masterCardId={null}
            onGoalUpdate={() => {
              fetchCombinedAnalytics();
            }}
          />
        </div>

        {/* Master Cards Grid */}
        {masterCards.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Master Cards Yet</h3>
            <p className="text-gray-600 mb-6">Create your first master card to start organizing backtests</p>
            <button
              onClick={() => {
                setEditingCard(null);
                setFormData({
                  name: '',
                  description: '',
                  strategy: '',
                  timeframe: '',
                  pattern: '',
                  color: '#3B82F6',
                  tags: []
                });
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Master Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {masterCards.map((card) => (
              <div
                key={card._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4"
                style={{ borderLeftColor: card.color || '#3B82F6' }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.name}</h3>
                      {card.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{card.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openEditModal(card)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(card._id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Strategy Info */}
                  {(card.strategy || card.timeframe || card.pattern) && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {card.strategy && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {card.strategy}
                        </span>
                      )}
                      {card.timeframe && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {card.timeframe}
                        </span>
                      )}
                      {card.pattern && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {card.pattern}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Statistics */}
                  {card.statistics && (
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Trades:</span>
                        <span className="font-medium text-gray-900">{card.statistics.totalTrades || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Win Rate:</span>
                        <span className="font-medium text-gray-900">{parseFloat(card.statistics.winRate || 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total P&L:</span>
                        <span className={`font-medium ${(card.statistics.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${parseFloat(card.statistics.totalPnL || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/backtests/master/${card._id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Trades
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/backtests/master/${card._id}/analytics`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      title="Analytics"
                    >
                      <ChartBarIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingCard ? 'Edit Master Card' : 'Create Master Card'}
              </h2>
              <form onSubmit={editingCard ? handleEdit : handleCreate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Breakout Strategy on 15 Min"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Optional description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Strategy
                      </label>
                      <input
                        type="text"
                        value={formData.strategy}
                        onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Breakout"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeframe
                      </label>
                      <input
                        type="text"
                        value={formData.timeframe}
                        onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 15 Min"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pattern
                    </label>
                    <input
                      type="text"
                      value={formData.pattern}
                      onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Bull Flag"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingCard ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingCard(null);
                      setFormData({
                        name: '',
                        description: '',
                        strategy: '',
                        timeframe: '',
                        pattern: '',
                        color: '#3B82F6',
                        tags: []
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterCards;

