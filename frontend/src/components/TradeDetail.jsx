import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  PhotoIcon,
  ChartBarIcon,
  ClockIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  LightBulbIcon,
  HeartIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { tradesAPI, formatCurrency, formatDateTime, checklistAPI } from '../utils/api';
import { useNotifications } from './Notifications';
import InstrumentIcon from './shared/InstrumentIcon';

const TradeDetail = ({ userId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [checklistResult, setChecklistResult] = useState(null);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const { success, error } = useNotifications();

  useEffect(() => {
    // Fetch both trade and checklist data in parallel
    Promise.all([fetchTrade(), fetchChecklistResult()]);
  }, [id]);

  const fetchTrade = async () => {
    try {
      setLoading(true);
      const response = await tradesAPI.getTradeById(id);
      setTrade(response.trade);
    } catch (err) {
      console.error('Error fetching trade:', err);
      error('Failed to fetch trade details');
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklistResult = async () => {
    try {
      setChecklistLoading(true);
      const response = await checklistAPI.getTradeChecklistResult(id);
      if (response.result) {
        setChecklistResult(response.result);
      }
    } catch (err) {
      // Silent fail if no checklist found
      console.log('No checklist result found for this trade');
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this trade? This action cannot be undone.')) {
      try {
        await tradesAPI.deleteTrade(id);
        success('Trade deleted successfully!');
        navigate('/trades');
      } catch (err) {
        console.error('Error deleting trade:', err);
        error('Failed to delete trade');
      }
    }
  };

  const getResultColor = (result) => {
    const r = result?.toLowerCase();
    if (r === 'win') return 'bg-green-500';
    if (r === 'loss') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getResultTextColor = (result) => {
    const r = result?.toLowerCase();
    if (r === 'win') return 'text-green-600';
    if (r === 'loss') return 'text-red-600';
    return 'text-gray-600';
  };

  const getResultBadgeColor = (result) => {
    const r = result?.toLowerCase();
    if (r === 'win') return 'bg-green-100 text-green-800 border-green-200';
    if (r === 'loss') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const openImageModal = (screenshot) => {
    setSelectedImage(screenshot);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading trade details...</p>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Trade not found</p>
          <button
            onClick={() => navigate('/trades')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Trades
          </button>
        </div>
      </div>
    );
  }

  const result = trade.result || trade.tradeOutcome?.toLowerCase() || 
    (trade.pnl > 0 ? 'win' : trade.pnl < 0 ? 'loss' : 'be');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/trades')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Trade #{trade.tradeNumber || 'N/A'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDateTime(trade.date)}
                  {trade.isBacktest && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                      Backtest
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-6 py-2 rounded-full font-semibold text-lg border-2 ${getResultBadgeColor(result)}`}>
                {result === 'win' ? '✓ Win' : result === 'loss' ? '✗ Loss' : '− Break Even'}
              </span>
              <button
                onClick={() => navigate(`/trade/${id}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trade Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <ChartBarIcon className="h-6 w-6 mr-2 text-blue-600" />
                Trade Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">Instrument</p>
                  <p className="text-lg font-bold text-gray-900">
                    <InstrumentIcon instrument={trade.instrument || trade.tradePair} />
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-600 font-medium mb-1">Direction</p>
                  <p className="text-lg font-bold text-gray-900 flex items-center">
                    {trade.direction === 'Long' ? (
                      <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-5 w-5 text-red-600 mr-1" />
                    )}
                    {trade.direction || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">Strategy</p>
                  <p className="text-lg font-bold text-gray-900">{trade.strategy || 'N/A'}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-600 font-medium mb-1">Session</p>
                  <p className="text-lg font-bold text-gray-900">{trade.session || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Price & Execution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <CurrencyDollarIcon className="h-6 w-6 mr-2 text-green-600" />
                Price & Execution
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Entry Price</p>
                  <p className="text-2xl font-bold text-gray-900">{trade.entryPrice || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Exit Price</p>
                  <p className="text-2xl font-bold text-gray-900">{trade.exitPrice || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Position Size</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {trade.positionSize || trade.lotSize || 'N/A'}
                  </p>
                </div>
                {trade.stopLoss && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Stop Loss</p>
                    <p className="text-2xl font-bold text-red-600">{trade.stopLoss}</p>
                  </div>
                )}
                {trade.takeProfit && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Take Profit</p>
                    <p className="text-2xl font-bold text-green-600">{trade.takeProfit}</p>
                  </div>
                )}
                {trade.tradeDuration && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Duration</p>
                    <p className="text-2xl font-bold text-gray-900">{trade.tradeDuration}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <TrophyIcon className="h-6 w-6 mr-2 text-yellow-500" />
                Performance Metrics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg border-2 ${
                  trade.pnl >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <p className="text-xs font-medium mb-1 text-gray-600">Profit & Loss</p>
                  <p className={`text-3xl font-bold ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(trade.pnl || 0)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">Pipes/Pips</p>
                  <p className="text-3xl font-bold text-gray-900">{trade.pipes || '0'}</p>
                </div>
                {trade.riskReward && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium mb-1">Risk:Reward</p>
                    <p className="text-3xl font-bold text-gray-900">{trade.riskReward}</p>
                  </div>
                )}
                {trade.executionScore && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-600 font-medium mb-1">Execution Score</p>
                    <p className="text-3xl font-bold text-gray-900">{trade.executionScore}/10</p>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis & Notes */}
            {(trade.reasonForTrade || trade.emotions || trade.lessonLearned || trade.notes || trade.additionalNotes) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  Analysis & Notes
                </h2>
                <div className="space-y-4">
                  {trade.reasonForTrade && (
                      <div className="p-4 border-b border-gray-500">
                      <div className="flex items-center mb-2">
                        <LightBulbIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="font-semibold text-gray-900 pb-2">Reason for Trade</h3>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{trade.reasonForTrade}</p>
                    </div>
                  )}
                  {trade.emotions && (
                    <div className="p-4 border-b border-gray-500">
                      <div className="flex items-center mb-3">
                        <HeartIcon className="h-5 w-5 text-purple-600 mr-2" />
                        <h3 className="font-semibold text-gray-900">Emotions & Psychology</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trade.emotions.split(',').map((emotion, index) => {
                          const trimmedEmotion = emotion.trim();
                          if (!trimmedEmotion) return null;
                          
                          // Color coding for different emotions
                          const getEmotionColor = (em) => {
                            const lower = em.toLowerCase();
                            if (lower.includes('confident') || lower.includes('disciplined') || lower.includes('calm') || lower.includes('focused')) {
                              return 'bg-green-100 text-green-800 border-green-300';
                            }
                            if (lower.includes('anxious') || lower.includes('fearful') || lower.includes('nervous') || lower.includes('stressed')) {
                              return 'bg-red-100 text-red-800 border-red-300';
                            }
                            if (lower.includes('greedy') || lower.includes('fomo') || lower.includes('revenge')) {
                              return 'bg-orange-100 text-orange-800 border-orange-300';
                            }
                            if (lower.includes('impatient') || lower.includes('frustrated') || lower.includes('bored')) {
                              return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                            }
                            if (lower.includes('excited') || lower.includes('optimistic') || lower.includes('hopeful')) {
                              return 'bg-blue-100 text-blue-800 border-blue-300';
                            }
                            return 'bg-purple-100 text-purple-800 border-purple-300';
                          };
                          
                          return (
                            <span
                              key={index}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 ${getEmotionColor(trimmedEmotion)}`}
                            >
                              {trimmedEmotion}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {trade.lessonLearned && (
                    <div className="p-4 border-b border-gray-500">
                      <div className="flex items-center mb-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="font-semibold text-gray-900 pb-2">Lessons Learned</h3>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{trade.lessonLearned}</p>
                    </div>
                  )}
                  {trade.notes && (
                    <div className="p-4 border-b border-gray-500">
                      <div className="flex items-center mb-2">
                        <DocumentTextIcon className="h-5 w-5 text-yellow-600 mr-2" />
                        <h3 className="font-semibold text-gray-900">Notes</h3>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{trade.notes}</p>
                    </div>
                  )}
                  {trade.additionalNotes && (
                    <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-500">
                      <div className="flex items-center mb-2">
                        <DocumentTextIcon className="h-5 w-5 text-gray-600 mr-2" />
                        <h3 className="font-semibold text-gray-900">Additional Notes</h3>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{trade.additionalNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pre-Trade Checklist */}
            {checklistResult && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircleIcon className="h-6 w-6 mr-2 text-blue-600" />
                  Pre-Trade Analysis
                  <span className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold ${
                    checklistResult.setupQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                    checklistResult.setupQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                    checklistResult.setupQuality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                    checklistResult.setupQuality === 'poor' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {checklistResult.setupQuality?.toUpperCase() || 'N/A'} QUALITY
                  </span>
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center mb-2">
                      <DocumentTextIcon className="h-4 w-4 text-blue-600 mr-2" />
                      <p className="text-xs text-gray-600 font-medium">Checklist</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{checklistResult.checklistName || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center mb-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                      <p className="text-xs text-gray-600 font-medium">Completion</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold text-green-600">{checklistResult.completionPercentage || 0}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${checklistResult.completionPercentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center mb-2">
                      <StarIcon className="h-4 w-4 text-yellow-600 mr-2" />
                      <p className="text-xs text-gray-600 font-medium">Quality Score</p>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{checklistResult.qualityScore || 'N/A'}<span className="text-sm text-gray-500">/10</span></p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center mb-2">
                      <ClockIcon className="h-4 w-4 text-purple-600 mr-2" />
                      <p className="text-xs text-gray-600 font-medium">Completed</p>
                    </div>
                    <p className="text-xs font-medium text-gray-900">
                      {checklistResult.completedAt 
                        ? new Date(checklistResult.completedAt).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {checklistResult.completedAt 
                        ? new Date(checklistResult.completedAt).toLocaleTimeString()
                        : ''
                      }
                    </p>
                  </div>
                </div>

                {/* Checklist Items */}
                {checklistResult.items && checklistResult.items.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="text-lg font-semibold text-gray-900">Checklist Items</h4>
                      <span className="ml-2 text-sm text-gray-500">
                        ({checklistResult.items.filter(item => item.isCompleted).length}/{checklistResult.items.length} completed)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {checklistResult.items.map((item, index) => (
                        <div key={index} className={`p-4 rounded-lg border-2 transition-all ${
                          item.isCompleted 
                            ? 'bg-green-50 border-green-300 shadow-sm' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {item.isCompleted ? (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                  <CheckCircleIcon className="w-4 h-4 text-white" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-gray-300 rounded-full border-2 border-gray-400"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 mb-1">{item.title}</p>
                              {item.value && (
                                <div className="mb-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                    {typeof item.value === 'object' ? JSON.stringify(item.value) : item.value}
                                  </span>
                                </div>
                              )}
                              {item.notes && (
                                <p className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 mt-1">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overall Notes */}
                {checklistResult.overallNotes && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center mb-3">
                      <DocumentTextIcon className="h-5 w-5 text-gray-600 mr-2" />
                      <p className="text-sm font-semibold text-gray-900">Analysis Notes</p>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{checklistResult.overallNotes}</p>
                  </div>
                )}

                {checklistLoading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Trade #</span>
                  <span className="text-sm font-bold text-gray-900">{trade.tradeNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="text-sm font-bold text-gray-900">{new Date(trade.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Time</span>
                  <span className="text-sm font-bold text-gray-900">{new Date(trade.date).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className={`text-sm font-bold ${trade.isBacktest ? 'text-purple-600' : 'text-blue-600'}`}>
                    {trade.isBacktest ? 'Backtest' : 'Live'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-xs text-gray-500">{new Date(trade.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Screenshots */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <PhotoIcon className="h-5 w-5 mr-2 text-gray-600" />
                Screenshots
                {trade.screenshots?.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">({trade.screenshots.length})</span>
                )}
              </h3>
              
              {trade.screenshots && trade.screenshots.length > 0 ? (
                <div className="space-y-3">
                  {trade.screenshots.map((screenshot, idx) => (
                    <div 
                      key={screenshot._id || idx}
                      className="border-2 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                      style={{ borderBottomWidth: '4px', borderBottomColor: screenshot.borderColor || '#3B82F6' }}
                      onClick={() => openImageModal(screenshot)}
                    >
                      {screenshot.label && (
                        <div className="bg-gray-50 px-3 py-2 border-b">
                          <p className="text-xs font-semibold text-gray-900">{screenshot.label}</p>
                        </div>
                      )}
                      <img
                        src={screenshot.imageUrl || screenshot.url}
                        alt={screenshot.label || 'Trade screenshot'}
                        className="w-full h-32 object-cover hover:opacity-90 transition-opacity"
                      />
                      {screenshot.description && (
                        <div className="bg-gray-50 px-3 py-2 border-t">
                          <p className="text-xs text-gray-600 line-clamp-2">{screenshot.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : trade.screenshotUrl ? (
                <div 
                  className="border-2 border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => openImageModal({ imageUrl: trade.screenshotUrl, label: 'Trade Screenshot' })}
                >
                  <img
                    src={trade.screenshotUrl}
                    alt="Trade screenshot"
                    className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <PhotoIcon className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">No screenshots</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-8"
          onClick={closeImageModal}
        >
          <div className="max-w-7xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.imageUrl || selectedImage.url}
              alt={selectedImage.label || 'Trade screenshot'}
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-2xl mb-4"
              style={{ borderBottom: `4px solid ${selectedImage.borderColor || '#3B82F6'}` }}
            />
            {(selectedImage.label || selectedImage.description) && (
              <div className="bg-white rounded-lg p-4">
                {selectedImage.label && (
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedImage.label}</h3>
                )}
                {selectedImage.description && (
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedImage.description}</p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default TradeDetail;
