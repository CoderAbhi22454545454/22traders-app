import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrophyIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const BacktestGoalCards = ({ userId, limit = 3, showAll = false }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchGoals();
    }
  }, [userId]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      // Only fetch active overall goals for dashboard (not master card specific)
      const response = await fetch(`${API_BASE_URL}/backtest-goals?userId=${userId}&status=active&scope=overall`);
      const data = await response.json();
      
      if (data.success) {
        // Sort by progress percentage (ascending - most urgent first)
        const sortedGoals = (data.goals || [])
          .filter(g => g.status === 'active')
          .sort((a, b) => {
            const aProgress = (a.progress || a.currentProgress || 0) / (a.target || 1);
            const bProgress = (b.progress || b.currentProgress || 0) / (b.target || 1);
            return aProgress - bProgress; // Lower progress first
          });
        
        setGoals(showAll ? sortedGoals : sortedGoals.slice(0, limit));
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
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
      trades: 'Trades',
      winRate: 'Win Rate',
      pnl: 'P&L',
      custom: 'Custom'
    };
    return labels[type] || type;
  };

  const getTimePeriodLabel = (period) => {
    const labels = {
      none: 'No Limit',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
      custom: 'Custom'
    };
    return labels[period] || period;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-2">No active backtest goals</p>
        <Link
          to="/backtests"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          Create a goal →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const { progress, target, percentage, displayValue } = formatProgress(goal);
          const isCompleted = goal.isCompleted || percentage >= 100;
          const isNearCompletion = percentage >= 75 && percentage < 100;

          return (
            <div
              key={goal._id}
              className={`bg-white rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                isCompleted
                  ? 'border-green-500 bg-green-50'
                  : isNearCompletion
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                    {goal.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {getGoalTypeLabel(goal.goalType)}
                    </span>
                    {goal.timePeriod !== 'none' && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {getTimePeriodLabel(goal.timePeriod)}
                      </span>
                    )}
                  </div>
                </div>
                {isCompleted && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-gray-900">
                    {displayValue} / {goal.goalType === 'winRate' ? `${target}%` : goal.goalType === 'pnl' ? `$${target}` : target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isCompleted
                        ? 'bg-green-500'
                        : isNearCompletion
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>{percentage.toFixed(1)}% Complete</span>
                  {goal.scope === 'masterCard' && (
                    <span className="text-orange-600">MC Goal</span>
                  )}
                </div>
              </div>

              {goal.milestones && goal.milestones.length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-600 mb-1">Milestones</div>
                  <div className="flex items-center gap-2">
                    {goal.milestones.slice(0, 3).map((milestone, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1 text-xs ${
                          milestone.achieved ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        {milestone.achieved ? (
                          <CheckCircleIcon className="h-3 w-3" />
                        ) : (
                          <ClockIcon className="h-3 w-3" />
                        )}
                        <span>{milestone.target}</span>
                      </div>
                    ))}
                    {goal.milestones.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{goal.milestones.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {isCompleted && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-green-700 font-semibold">
                    <TrophyIcon className="h-4 w-4" />
                    <span>Goal Achieved!</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!showAll && goals.length >= limit && (
        <div className="text-center">
          <Link
            to="/backtests"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View All Goals →
          </Link>
        </div>
      )}
    </div>
  );
};

export default BacktestGoalCards;

