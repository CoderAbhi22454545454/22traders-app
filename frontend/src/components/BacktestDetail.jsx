import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  PencilIcon, 
  TrashIcon, 
  PhotoIcon,
  TagIcon,
  ChartBarIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const BacktestDetail = ({ userId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [backtest, setBacktest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Format text with line breaks and bullet points
  const formatText = (text) => {
    if (!text) return null;
    
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if line starts with bullet point markers
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        return (
          <div key={index} className="flex gap-2 mb-1">
            <span className="text-gray-400 select-none">•</span>
            <span>{trimmedLine.substring(2)}</span>
          </div>
        );
      }
      
      // Regular line
      return trimmedLine ? (
        <div key={index} className="mb-1">{trimmedLine}</div>
      ) : (
        <div key={index} className="h-2"></div>
      );
    });
  };

  useEffect(() => {
    fetchBacktest();
  }, [id]);

  const fetchBacktest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/backtests/${id}`);
      if (!response.ok) throw new Error('Failed to fetch backtest');
      
      const data = await response.json();
      setBacktest(data.backtest);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this backtest?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/backtests/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete backtest');
      
      navigate('/backtests');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClone = () => {
    // Store the backtest data in sessionStorage to pre-fill the form
    const cloneData = {
      ...backtest,
      // Clear fields that shouldn't be copied
      _id: undefined,
      date: new Date().toISOString().split('T')[0],
      tradeNumber: '',
      entryPrice: '',
      exitPrice: '',
      stopLoss: '',
      takeProfit: '',
      pnl: '',
      result: '',
      screenshots: [], // Don't copy screenshots
      createdAt: undefined,
      updatedAt: undefined
    };
    
    sessionStorage.setItem('cloneBacktest', JSON.stringify(cloneData));
    navigate(`/backtests/new${backtest.masterCardId ? `?masterCardId=${backtest.masterCardId}` : ''}`);
  };

  const deleteScreenshot = async (screenshotId) => {
    if (!window.confirm('Are you sure you want to delete this screenshot?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/backtests/${id}/screenshots/${screenshotId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete screenshot');
      
      // Refresh backtest data
      fetchBacktest();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatChip = (chip) => (
    <span
      key={`${chip.name}-${chip.value}`}
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading backtest...</p>
        </div>
      </div>
    );
  }

  if (error || !backtest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Error</h3>
          <p className="text-gray-600">{error || 'Backtest not found'}</p>
          <button
            onClick={() => navigate('/backtests')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Backtests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          {/* Back Navigation */}
          <Link
            to="/backtests"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Backtests
          </Link>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              {/* Result Indicator */}
              <div className={`p-3 rounded-xl ${
                backtest.result === 'win' ? 'bg-green-100' : 
                backtest.result === 'loss' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                {backtest.result === 'win' ? (
                  <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                ) : backtest.result === 'loss' ? (
                  <ArrowTrendingDownIcon className="h-8 w-8 text-red-600" />
                ) : (
                  <ChartBarIcon className="h-8 w-8 text-yellow-600" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {backtest.tradeNumber || `Backtest #${backtest._id.slice(-6)}`}
                </h1>
                <p className="mt-1 text-gray-600">
                  {backtest.instrument || backtest.tradePair} • {new Date(backtest.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClone}
                className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
              >
                <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                Clone
              </button>
              <Link
                to={`/backtests/${backtest._id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Quick Stats Row - Enhanced */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <div className={`shadow rounded-lg p-4 border-l-4 ${
            backtest.pnl >= 0 
              ? 'bg-gradient-to-br from-green-50 to-white border-green-500' 
              : 'bg-gradient-to-br from-red-50 to-white border-red-500'
          }`}>
            <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide">P&L</dt>
            <dd className={`mt-2 text-2xl font-bold ${
              backtest.pnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${backtest.pnl?.toFixed(2) || '0.00'}
            </dd>
          </div>

          <div className={`shadow rounded-lg p-4 border-l-4 ${
            backtest.result === 'win' 
              ? 'bg-gradient-to-br from-green-50 to-white border-green-500'
              : backtest.result === 'loss'
              ? 'bg-gradient-to-br from-red-50 to-white border-red-500'
              : 'bg-gradient-to-br from-gray-50 to-white border-gray-400'
          }`}>
            <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide">Result</dt>
            <dd className="mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                backtest.result === 'win' 
                  ? 'bg-green-100 text-green-700'
                  : backtest.result === 'loss'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {backtest.result?.toUpperCase() || 'N/A'}
              </span>
            </dd>
          </div>

          {backtest.confidence && (
            <div className="bg-gradient-to-br from-blue-50 to-white shadow rounded-lg p-4 border-l-4 border-blue-500">
              <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide">Confidence</dt>
              <dd className="mt-2 text-2xl font-bold text-blue-600">
                {backtest.confidence}/10
              </dd>
            </div>
          )}

          <div className="bg-gradient-to-br from-indigo-50 to-white shadow rounded-lg p-4 border-l-4 border-indigo-500">
            <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide">Screenshots</dt>
            <dd className="mt-2 text-2xl font-bold text-indigo-600">
              {backtest.screenshots?.length || 0}
            </dd>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-white shadow rounded-lg p-4 border-l-4 border-amber-500">
            <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide">Labels</dt>
            <dd className="mt-2 text-2xl font-bold text-amber-600">
              {backtest.customChips?.length || 0}
            </dd>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white shadow rounded-lg p-4 border-l-4 border-gray-400">
            <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide">Created</dt>
            <dd className="mt-2 text-sm font-semibold text-gray-700">
              {new Date(backtest.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </div>

        {/* Single Column Layout */}
        <div className="space-y-4">
          {/* Trade Summary */}
          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Trade Summary</h3>
            
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {backtest.direction && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Direction</dt>
                  <dd className={`mt-1 text-sm font-medium ${
                    backtest.direction === 'Long' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {backtest.direction}
                  </dd>
                </div>
              )}

              {backtest.entryPrice && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Entry Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">{backtest.entryPrice}</dd>
                </div>
              )}

              {backtest.exitPrice && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Exit Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">{backtest.exitPrice}</dd>
                </div>
              )}

              {backtest.stopLoss && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Stop Loss</dt>
                  <dd className="mt-1 text-sm text-gray-900">{backtest.stopLoss}</dd>
                </div>
              )}

              {backtest.takeProfit && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Take Profit</dt>
                  <dd className="mt-1 text-sm text-gray-900">{backtest.takeProfit}</dd>
                </div>
              )}

              {backtest.lotSize && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lot Size</dt>
                  <dd className="mt-1 text-sm text-gray-900">{backtest.lotSize}</dd>
                </div>
              )}

              {backtest.riskReward && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Risk:Reward</dt>
                  <dd className="mt-1 text-sm text-gray-900">{backtest.riskReward}</dd>
                </div>
              )}

              {backtest.positionSize && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Position Size</dt>
                  <dd className="mt-1 text-sm text-gray-900">{backtest.positionSize}</dd>
                </div>
              )}
            </div>

            {/* Custom Labels Inline */}
            {backtest.customChips && backtest.customChips.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {backtest.customChips.map((chip, index) => formatChip(chip))}
                </div>
              </div>
            )}
          </div>

          {/* Screenshots - Full Width */}
          {backtest.screenshots && backtest.screenshots.length > 0 && (
            <div className="bg-white shadow rounded-lg p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <PhotoIcon className="h-5 w-5 text-blue-600" />
                Trade Screenshots ({backtest.screenshots.length})
              </h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {backtest.screenshots.map((screenshot) => (
                  <div 
                    key={screenshot._id} 
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => setSelectedImage(screenshot)}
                      style={{ borderBottom: `4px solid ${screenshot.borderColor || '#3B82F6'}` }}
                    >
                      <img
                        src={screenshot.imageUrl || screenshot.url}
                        alt={screenshot.label || 'Screenshot'}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          Click to enlarge
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      {screenshot.label && (
                        <h4 className="font-semibold text-gray-900 mb-1 truncate">
                          {screenshot.label}
                        </h4>
                      )}
                      {screenshot.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {screenshot.description}
                        </p>
                      )}
                      {!screenshot.label && !screenshot.description && (
                        <p className="text-xs text-gray-400 italic">No description</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis */}
          <div className="bg-white shadow rounded-lg p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Analysis & Insights</h3>
              
              <div className="space-y-4">
                {(backtest.patternIdentified || backtest.marketCondition || backtest.confidence) && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {backtest.patternIdentified && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Pattern</dt>
                        <dd className="mt-1 text-sm text-gray-900">{backtest.patternIdentified}</dd>
                      </div>
                    )}
                    {backtest.marketCondition && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Market Condition</dt>
                        <dd className="mt-1 text-sm text-gray-900 capitalize">{backtest.marketCondition}</dd>
                      </div>
                    )}
                    {backtest.confidence && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Confidence</dt>
                        <dd className="mt-1 text-sm text-gray-900">{backtest.confidence}/10</dd>
                      </div>
                    )}
                  </div>
                )}

                {backtest.reasonForEntry && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">Reason for Entry</dt>
                    <dd className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md border-l-4 border-blue-500">
                      {formatText(backtest.reasonForEntry)}
                    </dd>
                  </div>
                )}

                {backtest.reasonForExit && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">Reason for Exit</dt>
                    <dd className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md border-l-4 border-purple-500">
                      {formatText(backtest.reasonForExit)}
                    </dd>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {backtest.whatWorked && (
                    <div>
                      <dt className="text-sm font-medium text-green-600 mb-2">✓ What Worked</dt>
                      <dd className="text-sm text-gray-900 bg-green-50 p-4 rounded-md border-l-4 border-green-500">
                        {formatText(backtest.whatWorked)}
                      </dd>
                    </div>
                  )}

                  {backtest.whatDidntWork && (
                    <div>
                      <dt className="text-sm font-medium text-red-600 mb-2">✗ What Didn't Work</dt>
                      <dd className="text-sm text-gray-900 bg-red-50 p-4 rounded-md border-l-4 border-red-500">
                        {formatText(backtest.whatDidntWork)}
                      </dd>
                    </div>
                  )}
                </div>

                {backtest.improvementAreas && (
                  <div>
                    <dt className="text-sm font-medium text-blue-600 mb-2">💡 Improvement Areas</dt>
                    <dd className="text-sm text-gray-900 bg-blue-50 p-4 rounded-md border-l-4 border-blue-500">
                      {formatText(backtest.improvementAreas)}
                    </dd>
                  </div>
                )}

                {backtest.backtestNotes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">📝 Additional Notes</dt>
                    <dd className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md border-l-4 border-gray-400">
                      {formatText(backtest.backtestNotes)}
                    </dd>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Image Modal - High Quality Lightbox */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
            <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white text-3xl font-bold hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center z-10"
              >
                ✕
              </button>
              
              {/* Image Label Badge */}
              {selectedImage.label && (
                <div 
                  className="absolute -top-12 left-0 text-white px-4 py-2 rounded-md text-sm font-medium"
                  style={{ backgroundColor: selectedImage.borderColor || '#3B82F6' }}
                >
                  {selectedImage.label}
                </div>
              )}
              
              {/* High Quality Image */}
              <img
                src={selectedImage.imageUrl || selectedImage.url}
                alt={selectedImage.label || 'Screenshot'}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                style={{ 
                  imageRendering: 'high-quality',
                  borderBottom: `6px solid ${selectedImage.borderColor || '#3B82F6'}`
                }}
              />
              
              {/* Description */}
              {selectedImage.description && (
                <div className="mt-4 max-w-2xl bg-black bg-opacity-75 text-white p-4 rounded-md">
                  <p className="text-sm">{selectedImage.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BacktestDetail;
