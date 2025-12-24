import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  TrophyIcon,
  CalendarIcon,
  ChartBarIcon,
  TargetIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const BacktestGoalManager = ({ userId, masterCardId = null, onGoalUpdate }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(`goals-collapsed-${masterCardId || 'overall'}`);
    return saved === 'true';
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target: '',
    goalType: 'trades',
    scope: masterCardId ? 'masterCard' : 'overall',
    timePeriod: 'none',
    startDate: '',
    endDate: '',
    milestones: [],
    status: 'active'
  });
  const [milestoneInput, setMilestoneInput] = useState({ target: '', label: '' });

  // Memoize fetchGoals to prevent unnecessary re-renders
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ userId });
      
      if (masterCardId) {
        // Fetch goals for specific master card
        params.append('masterCardId', masterCardId);
        params.append('scope', 'masterCard');
      } else {
        // Fetch only overall goals (not master card specific)
        params.append('scope', 'overall');
      }
      
      const response = await fetch(`${API_BASE_URL}/backtest-goals?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, masterCardId]);

  // Track if component has mounted to prevent double fetch on initial load
  const hasMountedRef = useRef(false);
  const refreshTimeoutRef = useRef(null);

  // Initial fetch and when userId/masterCardId changes
  useEffect(() => {
    if (userId) {
      if (!hasMountedRef.current) {
        // First mount - fetch immediately
        hasMountedRef.current = true;
        fetchGoals();
      } else {
        // Subsequent changes - debounce to avoid rapid refetches
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = setTimeout(() => {
          fetchGoals();
        }, 300);
      }
    }
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [userId, masterCardId, fetchGoals]);

  // Refresh goals when page becomes visible or when backtests are updated
  useEffect(() => {
    // Only set up listeners after initial mount to prevent double fetch
    if (!hasMountedRef.current) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && userId) {
        // Clear any pending refresh
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        // Debounce refresh to avoid multiple calls
        refreshTimeoutRef.current = setTimeout(() => {
          fetchGoals();
        }, 500);
      }
    };

    // Listen for custom event when backtests are updated
    const handleBacktestsUpdated = () => {
      if (userId) {
        // Clear any pending refresh
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        // Small delay to ensure backend has finished processing
        refreshTimeoutRef.current = setTimeout(() => {
          fetchGoals();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('backtestsUpdated', handleBacktestsUpdated);
    
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('backtestsUpdated', handleBacktestsUpdated);
    };
  }, [userId, fetchGoals]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const goalData = {
        ...formData,
        userId,
        masterCardId: formData.scope === 'masterCard' ? masterCardId : undefined,
        target: parseFloat(formData.target),
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined
      };

      const url = editingGoal
        ? `${API_BASE_URL}/backtest-goals/${editingGoal._id}`
        : `${API_BASE_URL}/backtest-goals`;
      
      const method = editingGoal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowModal(false);
        setEditingGoal(null);
        resetForm();
        fetchGoals();
        if (onGoalUpdate) onGoalUpdate();
      } else {
        alert(data.message || 'Failed to save goal');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Error saving goal');
    }
  };

  const handleDelete = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/backtest-goals/${goalId}?userId=${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        fetchGoals();
        if (onGoalUpdate) onGoalUpdate();
      } else {
        alert(data.message || 'Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Error deleting goal');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title || '',
      description: goal.description || '',
      target: goal.target || '',
      goalType: goal.goalType || 'trades',
      scope: goal.scope || (masterCardId ? 'masterCard' : 'overall'),
      timePeriod: goal.timePeriod || 'none',
      startDate: goal.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : '',
      endDate: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
      milestones: goal.milestones || [],
      status: goal.status || 'active'
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      target: '',
      goalType: 'trades',
      scope: masterCardId ? 'masterCard' : 'overall',
      timePeriod: 'none',
      startDate: '',
      endDate: '',
      milestones: [],
      status: 'active'
    });
    setMilestoneInput({ target: '', label: '' });
    setEditingGoal(null);
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(`goals-collapsed-${masterCardId || 'overall'}`, newState.toString());
  };

  const addMilestone = () => {
    if (!milestoneInput.target || parseFloat(milestoneInput.target) <= 0) return;
    
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        {
          target: parseFloat(milestoneInput.target),
          label: milestoneInput.label || `Milestone ${formData.milestones.length + 1}`,
          achieved: false
        }
      ]
    });
    setMilestoneInput({ target: '', label: '' });
  };

  const removeMilestone = (index) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index)
    });
  };

  const formatProgress = (goal) => {
    const progress = goal.progress || goal.currentProgress || 0;
    const target = goal.target || 1;
    const percentage = Math.min((progress / target) * 100, 100);
    
    let displayValue = progress;
    if (goal.goalType === 'winRate') {
      displayValue = `${progress.toFixed(1)}%`;
    } else if (goal.goalType === 'pnl') {
      displayValue = `$${progress.toFixed(2)}`;
    }
    
    return { progress, target, percentage, displayValue };
  };

  const getGoalTypeLabel = (type) => {
    const labels = {
      trades: 'Number of Trades',
      winRate: 'Win Rate (%)',
      pnl: 'Total P&L ($)',
      custom: 'Custom Metric'
    };
    return labels[type] || type;
  };

  const getTimePeriodLabel = (period) => {
    const labels = {
      none: 'No Time Limit',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
      custom: 'Custom Range'
    };
    return labels[period] || period;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={toggleCollapse}
          className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
        >
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Backtest Goals {goals.length > 0 && `(${goals.length})`}
          </h3>
          {isCollapsed ? (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchGoals}
            disabled={loading}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            title="Refresh goals"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {!isCollapsed && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              New Goal
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && goals.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No goals set yet</p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            Create Your First Goal
          </button>
        </div>
      ) : !isCollapsed && goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const { progress, target, percentage, displayValue } = formatProgress(goal);
            const isCompleted = goal.isCompleted || goal.status === 'completed';

            return (
              <div
                key={goal._id}
                className={`bg-white rounded-lg border-2 p-4 ${
                  isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {getGoalTypeLabel(goal.goalType)}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {getTimePeriodLabel(goal.timePeriod)}
                      </span>
                      {goal.scope === 'masterCard' && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                          Master Card
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal._id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">
                      {displayValue} / {goal.goalType === 'winRate' ? `${target}%` : goal.goalType === 'pnl' ? `$${target}` : target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {percentage.toFixed(1)}% Complete
                  </div>
                </div>

                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-600 mb-2">Milestones</div>
                    <div className="space-y-1">
                      {goal.milestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className={milestone.achieved ? 'line-through text-gray-400' : 'text-gray-600'}>
                            {milestone.label || `Milestone ${idx + 1}`}: {milestone.target}
                          </span>
                          {milestone.achieved && (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-sm text-green-700">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="font-semibold">Goal Achieved!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Type *
                  </label>
                  <select
                    value={formData.goalType}
                    onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="trades">Number of Trades</option>
                    <option value="winRate">Win Rate (%)</option>
                    <option value="pnl">Total P&L ($)</option>
                    <option value="custom">Custom Metric</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target *
                  </label>
                  <input
                    type="number"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    min="1"
                    step={formData.goalType === 'winRate' || formData.goalType === 'pnl' ? '0.01' : '1'}
                  />
                </div>
              </div>

              {!masterCardId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scope *
                  </label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="overall">Overall (All Master Cards)</option>
                    <option value="masterCard" disabled>Master Card Specific (Select from Master Card page)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Period
                </label>
                <select
                  value={formData.timePeriod}
                  onChange={(e) => setFormData({ ...formData, timePeriod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="none">No Time Limit</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {formData.timePeriod === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={formData.startDate}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Milestones (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Target value"
                    value={milestoneInput.target}
                    onChange={(e) => setMilestoneInput({ ...milestoneInput, target: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                  <input
                    type="text"
                    placeholder="Label (optional)"
                    value={milestoneInput.label}
                    onChange={(e) => setMilestoneInput({ ...milestoneInput, label: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={100}
                  />
                  <button
                    type="button"
                    onClick={addMilestone}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {formData.milestones.length > 0 && (
                  <div className="space-y-1">
                    {formData.milestones.map((milestone, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">
                          {milestone.label}: {milestone.target}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMilestone(idx)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestGoalManager;

