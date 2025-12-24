import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, ScatterChart, Scatter
} from 'recharts';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const MasterCardAnalytics = ({ userId }) => {
  const { id } = useParams();
  const [masterCard, setMasterCard] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [instrumentTimeframe, setInstrumentTimeframe] = useState('all');

  useEffect(() => {
    if (userId && id) {
      fetchMasterCard();
      fetchAnalytics();
    }
  }, [userId, id]);

  const fetchMasterCard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/master-cards/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setMasterCard(data.masterCard);
      }
    } catch (err) {
      console.error('Error fetching master card:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/backtests/analytics/comprehensive?userId=${userId}&masterCardId=${id}`);
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData || !analyticsData.overview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600 mb-4">{error || 'Create some backtests to see analytics'}</p>
          <Link
            to={`/backtests/master/${id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Master Card
          </Link>
        </div>
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={`/backtests/master/${id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Master Card
          </Link>
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: masterCard?.color || '#3B82F6' }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Analytics: {masterCard?.name || 'Master Card'}
                </h1>
                <p className="text-gray-600">Comprehensive analytics for this master card</p>
              </div>
              <button
                onClick={fetchAnalytics}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
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

        {/* Equity Curve */}
        {equityCurve && equityCurve.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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

        {/* Instrument Performance */}
        {instrumentPerformance && instrumentPerformance.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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

        {/* Pattern Performance */}
        {performance && performance.patternPerformance && performance.patternPerformance.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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

        {/* Custom Labels Usage */}
        {labelUsage && labelUsage.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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

        {/* Best & Worst Trades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  );
};

export default MasterCardAnalytics;








