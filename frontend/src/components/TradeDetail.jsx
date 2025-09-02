import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { XMarkIcon, PhotoIcon, ClipboardDocumentCheckIcon, DocumentTextIcon, ChartBarIcon, StarIcon, ClockIcon, CheckCircleIcon, CheckIcon } from '@heroicons/react/24/outline';
import { tradesAPI, formatCurrency, formatDateTime, checklistAPI } from '../utils/api';
import TradeScreenshot from './TradeScreenshot';
import { useNotifications } from './Notifications';
import InstrumentIcon from './shared/InstrumentIcon';
import ChecklistResults from './ChecklistResults';
import TradeChecklistExecutor from './TradeChecklistExecutor';

const TradeDetail = ({ userId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Image upload state
  const [newScreenshot, setNewScreenshot] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const { success, error } = useNotifications();

  // Checklist state
  const [showChecklistExecutor, setShowChecklistExecutor] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [availableChecklists, setAvailableChecklists] = useState([]);
  const [showChecklistSelector, setShowChecklistSelector] = useState(false);

  useEffect(() => {
    fetchTrade();
    fetchAvailableChecklists();
  }, [id]);

  const fetchTrade = async () => {
    try {
      setLoading(true);
      const response = await tradesAPI.getTradeById(id);
      setTrade(response.trade);
      setEditData(response.trade);
    } catch (error) {
      console.error('Error fetching trade:', error);
      alert('Failed to fetch trade details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };



  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Prepare data for update, including new screenshot if selected
      const updateData = { ...editData };
      if (newScreenshot) {
        updateData.screenshot = newScreenshot;
      }
      
      await tradesAPI.updateTrade(id, updateData);
      await fetchTrade();
      setEditing(false);
      
      // Clean up screenshot states
      if (newScreenshot) {
        setNewScreenshot(null);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
      
      success('Trade updated successfully!');
    } catch (err) {
      console.error('Error updating trade:', err);
      error('Failed to update trade');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this trade? This action cannot be undone.')) {
      try {
        await tradesAPI.deleteTrade(id);
        alert('Trade deleted successfully!');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting trade:', error);
        alert('Failed to delete trade');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        error('File size must be less than 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        error('Only image files are allowed');
        return;
      }
      
      setNewScreenshot(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      success('New screenshot selected');
    }
  };

  const removeNewScreenshot = () => {
    setNewScreenshot(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    success('New screenshot removed');
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditData(trade);
    // Clean up any new screenshot selection
    if (newScreenshot) {
      setNewScreenshot(null);
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  // Checklist methods
  const fetchAvailableChecklists = async () => {
    try {
      const response = await checklistAPI.getChecklists(userId, { isActive: true });
      setAvailableChecklists(response.checklists || []);
    } catch (err) {
      console.error('Error fetching checklists:', err);
    }
  };

  const handleStartChecklist = (checklist) => {
    setSelectedChecklist(checklist);
    setShowChecklistExecutor(true);
    setShowChecklistSelector(false);
  };

  const handleChecklistComplete = (result) => {
    setShowChecklistExecutor(false);
    setSelectedChecklist(null);
    success(`Checklist "${result.checklistName}" completed with ${result.completionPercentage}% completion!`);
    // Refresh the page to show the new checklist result
    window.location.reload();
  };

  const handleChecklistClose = () => {
    setShowChecklistExecutor(false);
    setSelectedChecklist(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading trade details...</div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Trade not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Trade Details</h1>
            </div>
            <div className="flex items-center space-x-4">
              {!editing ? (
                <>
                  <button
                    onClick={() => setShowChecklistSelector(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
                    Start Checklist
                  </button>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Trade
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete Trade
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Trade Info */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Trade Information</h2>
                
                {editing ? (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                          type="date"
                          value={editData.date ? new Date(editData.date).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Instrument</label>
                        <input
                          type="text"
                          value={editData.instrument || ''}
                          onChange={(e) => handleInputChange('instrument', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Direction</label>
                        <select
                          value={editData.direction || ''}
                          onChange={(e) => handleInputChange('direction', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select Direction</option>
                          <option value="Long">Long</option>
                          <option value="Short">Short</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Strategy</label>
                        <input
                          type="text"
                          value={editData.strategy || ''}
                          onChange={(e) => handleInputChange('strategy', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Session</label>
                        <select
                          value={editData.session || ''}
                          onChange={(e) => handleInputChange('session', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select Session</option>
                          <option value="London">London</option>
                          <option value="NY">NY</option>
                          <option value="Asian">Asian</option>
                          <option value="Overlap">Overlap</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Entry Price</label>
                        <input
                          type="number"
                          step="0.00001"
                          value={editData.entryPrice || ''}
                          onChange={(e) => handleInputChange('entryPrice', parseFloat(e.target.value))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Exit Price</label>
                        <input
                          type="number"
                          step="0.00001"
                          value={editData.exitPrice || ''}
                          onChange={(e) => handleInputChange('exitPrice', parseFloat(e.target.value))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">P&L</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editData.pnl || ''}
                          onChange={(e) => handleInputChange('pnl', parseFloat(e.target.value))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Result</label>
                        <select
                          value={editData.result || ''}
                          onChange={(e) => handleInputChange('result', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select Result</option>
                          <option value="win">Win</option>
                          <option value="loss">Loss</option>
                          <option value="be">Break Even</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Execution Score (1-10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editData.executionScore || ''}
                          onChange={(e) => handleInputChange('executionScore', parseInt(e.target.value))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emotions</label>
                      <textarea
                        value={editData.emotions || ''}
                        onChange={(e) => handleInputChange('emotions', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="How did you feel during this trade?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={editData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={4}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Additional notes about this trade..."
                      />
                    </div>

                    {/* Screenshot Update Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Update Screenshot
                      </label>
                      <div className="space-y-4">
                        {/* Current Screenshot */}
                        {trade.screenshotUrl && !previewUrl && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Current screenshot:</p>
                            <img
                              src={trade.screenshotUrl}
                              alt="Current trade screenshot"
                              className="h-32 w-auto rounded-lg border border-gray-300"
                            />
                          </div>
                        )}

                        {/* New Screenshot Preview */}
                        {previewUrl && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">New screenshot:</p>
                            <div className="relative inline-block">
                              <img
                                src={previewUrl}
                                alt="New screenshot preview"
                                className="h-32 w-auto rounded-lg border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={removeNewScreenshot}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Upload New Screenshot */}
                        <div className="mt-1 flex justify-center px-6 pt-4 pb-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                          <div className="space-y-1 text-center">
                            <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="screenshot-update"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                              >
                                <span>
                                  {previewUrl ? 'Change screenshot' : (trade.screenshotUrl ? 'Replace screenshot' : 'Upload screenshot')}
                                </span>
                                <input
                                  id="screenshot-update"
                                  name="screenshot"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-8">
                    {/* Basic Trade Info */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Trade Number</h4>
                          <p className="mt-1 text-lg text-gray-900">{trade.tradeNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Date</h4>
                          <p className="mt-1 text-lg text-gray-900">{formatDateTime(trade.date)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Instrument</h4>
                          <p className="mt-1 text-lg text-gray-900">
                            <InstrumentIcon instrument={trade.instrument} />
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Direction</h4>
                          <p className="mt-1 text-lg text-gray-900">{trade.direction}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Strategy</h4>
                          <p className="mt-1 text-lg text-gray-900">{trade.strategy}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Session</h4>
                          <p className="mt-1 text-lg text-gray-900">{trade.session}</p>
                        </div>
                      </div>
                    </div>

                    {/* Trade Execution */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                        Trade Execution
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Entry Price</h4>
                          <p className="mt-1 text-lg text-gray-900">{trade.entryPrice}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Exit Price</h4>
                          <p className="mt-1 text-lg text-gray-900">{trade.exitPrice}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Lot Size</h4>
                          <p className="mt-1 text-lg text-gray-900">{trade.lotSize || 'N/A'}</p>
                        </div>
                        {trade.stopLoss && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Stop Loss</h4>
                            <p className="mt-1 text-lg text-gray-900">{trade.stopLoss}</p>
                          </div>
                        )}
                        {trade.takeProfit && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Take Profit</h4>
                            <p className="mt-1 text-lg text-gray-900">{trade.takeProfit}</p>
                          </div>
                        )}
                        {trade.entryTime && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Entry Time</h4>
                            <p className="mt-1 text-lg text-gray-900">{trade.entryTime}</p>
                          </div>
                        )}
                        {trade.exitTime && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Exit Time</h4>
                            <p className="mt-1 text-lg text-gray-900">{trade.exitTime}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Results */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                        Financial Results
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">P&L</h4>
                          <p className={`mt-1 text-lg font-semibold ${
                            trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(trade.pnl)}
                          </p>
                        </div>
                        {trade.riskAmount && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Risk Amount</h4>
                            <p className="mt-1 text-lg text-gray-900">{formatCurrency(trade.riskAmount)}</p>
                          </div>
                        )}
                        {trade.rewardAmount && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Reward Amount</h4>
                            <p className="mt-1 text-lg text-gray-900">{formatCurrency(trade.rewardAmount)}</p>
                          </div>
                        )}
                        {trade.riskRewardRatio && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Risk:Reward Ratio</h4>
                            <p className="mt-1 text-lg text-gray-900">{trade.riskRewardRatio}</p>
                          </div>
                        )}
                        {trade.commission && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Commission</h4>
                            <p className="mt-1 text-lg text-gray-900">{formatCurrency(trade.commission)}</p>
                          </div>
                        )}
                        {trade.swap && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Swap</h4>
                            <p className="mt-1 text-lg text-gray-900">{formatCurrency(trade.swap)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                        Performance Metrics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Execution Score</h4>
                          <p className="mt-1 text-lg text-gray-900">{trade.executionScore}/10</p>
                        </div>
                        {trade.pips && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Pips</h4>
                            <p className="mt-1 text-lg text-gray-900">{trade.pips}</p>
                          </div>
                        )}
                        {trade.holdingTime && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Holding Time</h4>
                            <p className="mt-1 text-lg text-gray-900">{trade.holdingTime}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Market Analysis */}
                    {(trade.marketConditions || trade.reasonForTrade || trade.setupType) && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                          Market Analysis
                        </h3>
                        <div className="space-y-4">
                          {trade.reasonForTrade && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Reason for Trade</h4>
                              <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">{trade.reasonForTrade}</p>
                            </div>
                          )}
                          {trade.marketConditions && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Market Conditions</h4>
                              <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">{trade.marketConditions}</p>
                            </div>
                          )}
                          {trade.setupType && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Setup Type</h4>
                              <p className="mt-1 text-gray-900">{trade.setupType}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Trade Review */}
                    {(trade.whatWentWell || trade.whatCouldBeBetter || trade.lessonsLearned || trade.emotions || trade.notes) && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                          Trade Review
                        </h3>
                        <div className="space-y-4">
                          {trade.whatWentWell && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">What Went Well</h4>
                              <p className="mt-1 text-gray-900 bg-green-50 p-3 rounded-lg border border-green-200">{trade.whatWentWell}</p>
                            </div>
                          )}
                          {trade.whatCouldBeBetter && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">What Could Be Better</h4>
                              <p className="mt-1 text-gray-900 bg-yellow-50 p-3 rounded-lg border border-yellow-200">{trade.whatCouldBeBetter}</p>
                            </div>
                          )}
                          {trade.lessonsLearned && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Lessons Learned</h4>
                              <p className="mt-1 text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-200">{trade.lessonsLearned}</p>
                            </div>
                          )}
                          {trade.emotions && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Emotions</h4>
                              <p className="mt-1 text-gray-900 bg-purple-50 p-3 rounded-lg border border-purple-200">{trade.emotions}</p>
                            </div>
                          )}
                          {trade.notes && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Additional Notes</h4>
                              <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg">{trade.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Information */}
                    {(trade.brokerAccount || trade.platform || trade.tags) && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-2">
                          Additional Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {trade.brokerAccount && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Broker Account</h4>
                              <p className="mt-1 text-lg text-gray-900">{trade.brokerAccount}</p>
                            </div>
                          )}
                          {trade.platform && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Platform</h4>
                              <p className="mt-1 text-lg text-gray-900">{trade.platform}</p>
                            </div>
                          )}
                          {trade.tags && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Tags</h4>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {trade.tags.split(',').map((tag, index) => (
                                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Result Badge */}
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Trade Result</h3>
                <div className="text-center">
                  <span className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-medium ${
                    trade.result === 'win' 
                      ? 'bg-green-100 text-green-800' 
                      : trade.result === 'loss'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {trade.result === 'win' ? '✓ Win' : trade.result === 'loss' ? '✗ Loss' : '- Break Even'}
                  </span>
                </div>
              </div>

              {/* Screenshot */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Screenshot</h3>
                <TradeScreenshot 
                  trade={trade} 
                  onScreenshotDeleted={fetchTrade}
                  showDeleteButton={true}
                />
              </div>
            </div>
          </div>

          {/* Pre-Trade Checklist Section */}
          {trade.preTradeChecklist && (
            <div className="mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <ClipboardDocumentCheckIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Pre-Trade Analysis</h3>
                      <p className="text-sm text-gray-600">Setup quality assessment and checklist results</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                      trade.preTradeChecklist.setupQuality === 'excellent' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      trade.preTradeChecklist.setupQuality === 'good' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      trade.preTradeChecklist.setupQuality === 'fair' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      trade.preTradeChecklist.setupQuality === 'poor' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        trade.preTradeChecklist.setupQuality === 'excellent' ? 'bg-emerald-500' :
                        trade.preTradeChecklist.setupQuality === 'good' ? 'bg-blue-500' :
                        trade.preTradeChecklist.setupQuality === 'fair' ? 'bg-amber-500' :
                        trade.preTradeChecklist.setupQuality === 'poor' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}></div>
                      {trade.preTradeChecklist.setupQuality} quality
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                      <h4 className="text-sm font-medium text-gray-700">Checklist Used</h4>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{trade.preTradeChecklist.checklistName}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <ChartBarIcon className="w-4 h-4 text-green-500" />
                      <h4 className="text-sm font-medium text-gray-700">Completion Rate</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-gray-900">{trade.preTradeChecklist.completionPercentage}%</p>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${trade.preTradeChecklist.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <StarIcon className="w-4 h-4 text-amber-500" />
                      <h4 className="text-sm font-medium text-gray-700">Quality Score</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-gray-900">{trade.preTradeChecklist.qualityScore || 'N/A'}</p>
                      <span className="text-sm text-gray-500">/10</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <ClockIcon className="w-4 h-4 text-purple-500" />
                      <h4 className="text-sm font-medium text-gray-700">Completed</h4>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {trade.preTradeChecklist.completedAt 
                        ? new Date(trade.preTradeChecklist.completedAt).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {trade.preTradeChecklist.completedAt 
                        ? new Date(trade.preTradeChecklist.completedAt).toLocaleTimeString()
                        : ''
                      }
                    </p>
                  </div>
                </div>

                {/* Checklist Items */}
                {trade.preTradeChecklist.items && trade.preTradeChecklist.items.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                      <h4 className="text-lg font-semibold text-gray-900">Checklist Items</h4>
                      <span className="text-sm text-gray-500">
                        ({trade.preTradeChecklist.items.filter(item => item.isCompleted).length}/{trade.preTradeChecklist.items.length} completed)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trade.preTradeChecklist.items.map((item, index) => (
                        <div key={index} className={`relative p-4 rounded-lg border-2 transition-all ${
                          item.isCompleted 
                            ? 'bg-green-50 border-green-200 shadow-sm' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {item.isCompleted ? (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                  <CheckIcon className="w-4 h-4 text-white" />
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
                                <p className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
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
                {trade.preTradeChecklist.overallNotes && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                      <h4 className="text-lg font-semibold text-gray-900">Analysis Notes</h4>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{trade.preTradeChecklist.overallNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checklist Results Section */}
          <div className="mt-8">
            <ChecklistResults 
              userId={userId} 
              tradeId={id}
              onResultClick={(result) => {
                // Handle result click if needed
                console.log('Checklist result clicked:', result);
              }}
            />
          </div>
        </div>
      </main>

      {/* Checklist Selector Modal */}
      {showChecklistSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Checklist</h3>
              <button
                onClick={() => setShowChecklistSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {availableChecklists.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardDocumentCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No active checklists available.</p>
                <button
                  onClick={() => {
                    setShowChecklistSelector(false);
                    navigate('/checklists');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Checklist
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {availableChecklists.map((checklist) => (
                  <button
                    key={checklist._id}
                    onClick={() => handleStartChecklist(checklist)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{checklist.name}</h4>
                        <p className="text-sm text-gray-600">{checklist.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {checklist.totalSteps} steps
                          </span>
                          {checklist.isDefault && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checklist Executor Modal */}
      {showChecklistExecutor && selectedChecklist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TradeChecklistExecutor
              userId={userId}
              tradeId={id}
              checklistId={selectedChecklist._id}
              initialChecklist={selectedChecklist}
              onComplete={handleChecklistComplete}
              onClose={handleChecklistClose}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeDetail; 