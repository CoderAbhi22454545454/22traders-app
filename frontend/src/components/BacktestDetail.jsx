import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PencilIcon, 
  TrashIcon, 
  PhotoIcon,
  TagIcon,
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ChartBarIcon,
  XMarkIcon
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {backtest.tradeNumber || `Backtest #${backtest._id.slice(-6)}`}
              </h1>
              <p className="mt-2 text-gray-600">
                {backtest.instrument || backtest.tradePair} • {new Date(backtest.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
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

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
          <div className="bg-white shadow rounded-lg p-3">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">P&L</dt>
            <dd className={`mt-1.5 text-lg font-bold ${
              backtest.pnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${backtest.pnl?.toFixed(2) || '0.00'}
            </dd>
          </div>

          <div className="bg-white shadow rounded-lg p-3">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Result</dt>
            <dd className="mt-1.5">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                backtest.result === 'win' 
                  ? 'bg-green-100 text-green-800'
                  : backtest.result === 'loss'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {backtest.result?.toUpperCase() || 'N/A'}
              </span>
            </dd>
          </div>

          {backtest.confidence && (
            <div className="bg-white shadow rounded-lg p-3">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confidence</dt>
              <dd className="mt-1.5 text-lg font-bold text-gray-900">
                {backtest.confidence}/10
              </dd>
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-3">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Screenshots</dt>
            <dd className="mt-1.5 text-lg font-bold text-gray-900">
              {backtest.screenshots?.length || 0}
            </dd>
          </div>

          <div className="bg-white shadow rounded-lg p-3">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Labels</dt>
            <dd className="mt-1.5 text-lg font-bold text-gray-900">
              {backtest.customChips?.length || 0}
            </dd>
          </div>

          <div className="bg-white shadow rounded-lg p-3">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</dt>
            <dd className="mt-1.5 text-sm font-medium text-gray-900">
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
          </div>

          {/* Custom Labels and Screenshots Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Custom Chips */}
            {backtest.customChips && backtest.customChips.length > 0 && (
              <div className="bg-white shadow rounded-lg p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Custom Labels</h3>
                <div className="flex flex-wrap gap-3">
                  {backtest.customChips.map((chip, index) => formatChip(chip))}
                </div>
              </div>
            )}

            {/* Screenshots */}
            {backtest.screenshots && backtest.screenshots.length > 0 && (
              <div className="bg-white shadow rounded-lg p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Trade Screenshots</h3>
                <div className={`grid gap-3 ${
                  backtest.screenshots.length === 1 
                    ? 'grid-cols-1' 
                    : backtest.screenshots.length === 2 
                    ? 'grid-cols-2' 
                    : 'grid-cols-2 sm:grid-cols-3'
                }`}>
                  {backtest.screenshots.map((screenshot) => (
                    <div key={screenshot._id} className="space-y-2">
                      <div className="relative">
                        <img
                          src={screenshot.url}
                          alt={`${screenshot.type} screenshot`}
                          className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90"
                          style={{ imageRendering: 'high-quality' }}
                          onClick={() => setSelectedImage(screenshot)}
                        />
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-black bg-opacity-75 text-white">
                            {screenshot.type.charAt(0).toUpperCase() + screenshot.type.slice(1)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this screenshot? This action cannot be undone.')) {
                              deleteScreenshot(screenshot._id);
                            }
                          }}
                          className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white hover:bg-red-700"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      {screenshot.description && (
                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                          {screenshot.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
                    <dt className="text-sm font-medium text-gray-500">Reason for Entry</dt>
                    <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {backtest.reasonForEntry}
                    </dd>
                  </div>
                )}

                {backtest.reasonForExit && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Reason for Exit</dt>
                    <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {backtest.reasonForExit}
                    </dd>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {backtest.whatWorked && (
                    <div>
                      <dt className="text-sm font-medium text-green-600">What Worked</dt>
                      <dd className="mt-1 text-sm text-gray-900 bg-green-50 p-3 rounded-md">
                        {backtest.whatWorked}
                      </dd>
                    </div>
                  )}

                  {backtest.whatDidntWork && (
                    <div>
                      <dt className="text-sm font-medium text-red-600">What Didn't Work</dt>
                      <dd className="mt-1 text-sm text-gray-900 bg-red-50 p-3 rounded-md">
                        {backtest.whatDidntWork}
                      </dd>
                    </div>
                  )}
                </div>

                {backtest.improvementAreas && (
                  <div>
                    <dt className="text-sm font-medium text-blue-600">Improvement Areas</dt>
                    <dd className="mt-1 text-sm text-gray-900 bg-blue-50 p-3 rounded-md">
                      {backtest.improvementAreas}
                    </dd>
                  </div>
                )}

                {backtest.backtestNotes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {backtest.backtestNotes}
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
              
              {/* Image Type Badge */}
              <div className="absolute -top-12 left-0 bg-black bg-opacity-75 text-white px-4 py-2 rounded-md text-sm font-medium capitalize">
                {selectedImage.type} Screenshot
              </div>
              
              {/* High Quality Image */}
              <img
                src={selectedImage.url}
                alt={`${selectedImage.type} screenshot`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
                style={{ imageRendering: 'high-quality' }}
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
