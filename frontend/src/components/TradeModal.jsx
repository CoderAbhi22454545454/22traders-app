import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { tradesAPI, formatCurrency, formatDate } from '../utils/api';
import { useNotifications } from './Notifications';

// Predefined emotion options
const EMOTION_OPTIONS = [
  'Confident', 'Anxious', 'Fearful', 'Greedy', 'Disciplined', 'Impatient', 
  'Excited', 'Frustrated', 'Calm', 'Nervous', 'Aggressive', 'Cautious',
  'Overconfident', 'Hesitant', 'Focused', 'Distracted', 'Euphoric', 'Regretful'
];

// Limited pair options as requested
const PAIR_OPTIONS = ['XAUUSD', 'BTCUSD', 'EURUSD'];

const TradeModal = ({ isOpen, onClose, selectedDate, userId, onTradeAdded, editTrade = null }) => {
  const [formData, setFormData] = useState({
    tradeNumber: '',
    tradePair: '',
    direction: '',
    entryPrice: '',
    exitPrice: '',
    positionSize: '',
    stopLoss: '',
    takeProfit: '',
    riskReward: '1:1',
    strategy: '',
    tradeDuration: '',
    tradeOutcome: '',
    pnl: '',
    reasonForTrade: '',
    emotions: [],
    customEmotion: '',
    lessonLearned: '',
    additionalNotes: '',
    screenshot: null
  });
  
  const [existingTrades, setExistingTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState('');

  const { success, error, warning } = useNotifications();

  const isEditMode = !!editTrade;

  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchExistingTrades();
      if (isEditMode && editTrade) {
        populateFormForEdit();
      } else {
        resetForm();
        // Auto-fill trade number for new trades
        if (userId) {
          fetchTradeCount();
        }
      }
    }
  }, [isOpen, selectedDate, userId, editTrade]);

  const fetchTradeCount = async () => {
    if (!userId) return;
    
    try {
      // Use existing trades data if available, otherwise fetch from API
      if (existingTrades && existingTrades.length >= 0) {
        // Calculate next trade number based on existing trades
        const response = await tradesAPI.getComprehensiveStats(userId);
        const totalTrades = response.overview?.totalTrades || 0;
        setFormData(prev => ({
          ...prev,
          tradeNumber: (totalTrades + 1).toString()
        }));
      } else {
        // Fallback to count API
        const response = await tradesAPI.getTradeCount(userId);
        setFormData(prev => ({
          ...prev,
          tradeNumber: response.nextTradeNumber.toString()
        }));
      }
    } catch (error) {
      console.error('Error fetching trade count:', error);
      // Fallback to manual entry
      setFormData(prev => ({
        ...prev,
        tradeNumber: '1'
      }));
    }
  };

  const populateFormForEdit = () => {
    const existingEmotions = editTrade.emotions ? editTrade.emotions.split(',').map(e => e.trim()) : [];
    
    setFormData({
      tradeNumber: editTrade.tradeNumber || '',
      tradePair: editTrade.tradePair || editTrade.instrument || '',
      direction: editTrade.direction || '',
      entryPrice: editTrade.entryPrice || '',
      exitPrice: editTrade.exitPrice || '',
      positionSize: editTrade.positionSize || editTrade.lotSize?.toString() || '',
      stopLoss: editTrade.stopLoss || '',
      takeProfit: editTrade.takeProfit || '',
      riskReward: editTrade.riskReward || '1:1',
      strategy: editTrade.strategy || '',
      tradeDuration: editTrade.tradeDuration || '',
      tradeOutcome: editTrade.tradeOutcome || editTrade.result || '',
      pnl: editTrade.pnl?.toString() || '',
      reasonForTrade: editTrade.reasonForTrade || '',
      emotions: existingEmotions,
      customEmotion: '',
      lessonLearned: editTrade.lessonLearned || '',
      additionalNotes: editTrade.additionalNotes || editTrade.notes || '',
      screenshot: null
    });
    if (editTrade.screenshotUrl) {
      setPreviewUrl(editTrade.screenshotUrl);
    }
  };

  const fetchExistingTrades = async () => {
    if (!selectedDate || !userId) return;
    
    setLoading(true);
    try {
      const response = await tradesAPI.getTradesByDate(selectedDate, userId);
      setExistingTrades(response.trades || []);
    } catch (error) {
      console.error('Error fetching existing trades:', error);
      setExistingTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tradeNumber: '',
      tradePair: '',
      direction: '',
      entryPrice: '',
      exitPrice: '',
      positionSize: '',
      stopLoss: '',
      takeProfit: '',
      riskReward: '1:1',
      strategy: '',
      tradeDuration: '',
      tradeOutcome: '',
      pnl: '',
      reasonForTrade: '',
      emotions: [],
      customEmotion: '',
      lessonLearned: '',
      additionalNotes: '',
      screenshot: null
    });
    setPreviewUrl('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Since user requested not to make anything required, we'll skip validation for now
    // This can be updated later if needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEmotionToggle = (emotion) => {
    setFormData(prev => ({
      ...prev,
      emotions: prev.emotions.includes(emotion)
        ? prev.emotions.filter(e => e !== emotion)
        : [...prev.emotions, emotion]
    }));
  };

  const handleCustomEmotionAdd = () => {
    if (formData.customEmotion.trim() && !formData.emotions.includes(formData.customEmotion.trim())) {
      setFormData(prev => ({
        ...prev,
        emotions: [...prev.emotions, prev.customEmotion.trim()],
        customEmotion: ''
      }));
    }
  };

  const handleEmotionRemove = (emotion) => {
    setFormData(prev => ({
      ...prev,
      emotions: prev.emotions.filter(e => e !== emotion)
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        error('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        error('Only image files are allowed');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        screenshot: file
      }));
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      success('Screenshot uploaded successfully');
    }
  };

  const removeScreenshot = () => {
    setFormData(prev => ({
      ...prev,
      screenshot: null
    }));
    if (previewUrl && !previewUrl.startsWith('http')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    success('Screenshot removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      const tradeData = {
        ...formData,
        userId,
        date: selectedDate.toISOString(),
        emotions: formData.emotions.join(', '), // Convert array back to string
        // Convert numeric fields
        entryPrice: formData.entryPrice ? parseFloat(formData.entryPrice) : undefined,
        exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : undefined,
        stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
        takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : undefined,
        pnl: formData.pnl ? parseFloat(formData.pnl) : undefined,
        // Map new fields to old fields for backward compatibility
        instrument: formData.tradePair,
        lotSize: formData.positionSize ? parseFloat(formData.positionSize) : undefined,
        result: formData.tradeOutcome?.toLowerCase(),
        notes: formData.additionalNotes
      };

      let savedTrade;
      if (isEditMode) {
        savedTrade = await tradesAPI.updateTrade(editTrade._id, tradeData);
        success('Trade updated successfully!');
      } else {
        savedTrade = await tradesAPI.createTrade(tradeData);
        success('Trade created successfully!');
      }
      
      // Refresh existing trades and notify parent
      await fetchExistingTrades();
      if (onTradeAdded) onTradeAdded();
      
      resetForm();
      onClose();
    } catch (err) {
      error(err.message || `Failed to ${isEditMode ? 'update' : 'create'} trade`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const getResultColor = (result) => {
    switch (result?.toLowerCase()) {
      case 'win': return 'text-green-600 bg-green-50 border-green-200';
      case 'loss': return 'text-red-600 bg-red-50 border-red-200';
      case 'break even': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="flex">
                  {/* Left Sidebar - Existing Trades */}
                  <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatDate(selectedDate)}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {existingTrades.length} trades
                      </span>
                    </div>
                    
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="spinner"></div>
                      </div>
                    ) : existingTrades.length > 0 ? (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {existingTrades.map((trade) => (
                          <div
                            key={trade._id}
                            className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{trade.tradePair || trade.instrument}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getResultColor(trade.tradeOutcome || trade.result)}`}>
                                {(trade.tradeOutcome || trade.result)?.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>{trade.direction} • {trade.positionSize || trade.lotSize}</div>
                              <div className={`font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trade.pnl ? formatCurrency(trade.pnl) : 'N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No trades for this date</p>
                        <p className="text-sm text-gray-400 mt-1">Add your first trade!</p>
                      </div>
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                        {isEditMode ? 'Edit Trade' : `Trade Entry for ${selectedDate?.toISOString().split('T')[0]}`}
                      </Dialog.Title>
                      <button
                        onClick={handleClose}
                        disabled={submitting}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Basic Trade Information */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trade Number
                          </label>
                          <input
                            type="text"
                            name="tradeNumber"
                            value={formData.tradeNumber}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="Auto-filled"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trade Pair
                          </label>
                          <select
                            name="tradePair"
                            value={formData.tradePair}
                            onChange={handleInputChange}
                            className="form-input"
                          >
                            <option value="">Select Pair</option>
                            {PAIR_OPTIONS.map(pair => (
                              <option key={pair} value={pair}>{pair}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Direction
                          </label>
                          <select
                            name="direction"
                            value={formData.direction}
                            onChange={handleInputChange}
                            className="form-input"
                          >
                            <option value="">Select Direction</option>
                            <option value="Long">Long</option>
                            <option value="Short">Short</option>
                          </select>
                        </div>
                      </div>

                      {/* Price Information */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Entry Price
                          </label>
                          <input
                            type="number"
                            name="entryPrice"
                            value={formData.entryPrice}
                            onChange={handleInputChange}
                            step="0.0001"
                            min="0"
                            className="form-input"
                            placeholder="1.0925"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Exit Price
                          </label>
                          <input
                            type="number"
                            name="exitPrice"
                            value={formData.exitPrice}
                            onChange={handleInputChange}
                            step="0.0001"
                            min="0"
                            className="form-input"
                            placeholder="1.0950"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Position Size
                          </label>
                          <input
                            type="text"
                            name="positionSize"
                            value={formData.positionSize}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="0.10"
                          />
                        </div>
                      </div>

                      {/* Risk Management */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stop Loss
                          </label>
                          <input
                            type="number"
                            name="stopLoss"
                            value={formData.stopLoss}
                            onChange={handleInputChange}
                            step="0.0001"
                            min="0"
                            className="form-input"
                            placeholder="1.0900"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Take Profit
                          </label>
                          <input
                            type="number"
                            name="takeProfit"
                            value={formData.takeProfit}
                            onChange={handleInputChange}
                            step="0.0001"
                            min="0"
                            className="form-input"
                            placeholder="1.0975"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Risk Reward
                          </label>
                          <select
                            name="riskReward"
                            value={formData.riskReward}
                            onChange={handleInputChange}
                            className="form-input"
                          >
                            <option value="1:1">1:1</option>
                            <option value="1:2">1:2</option>
                            <option value="1:3">1:3</option>
                            <option value="1:4">1:4</option>
                            <option value="1:5">1:5</option>
                            <option value="2:1">2:1</option>
                            <option value="3:1">3:1</option>
                          </select>
                        </div>
                      </div>

                      {/* Strategy & Duration */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Strategy Used
                          </label>
                          <input
                            type="text"
                            name="strategy"
                            value={formData.strategy}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="e.g., Scalping, Swing, Breakout"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trade Duration
                          </label>
                          <input
                            type="text"
                            name="tradeDuration"
                            value={formData.tradeDuration}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="e.g., 5 minutes, 1 hour, 2 days"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trade Outcome
                          </label>
                          <select
                            name="tradeOutcome"
                            value={formData.tradeOutcome}
                            onChange={handleInputChange}
                            className="form-input"
                          >
                            <option value="">Select Outcome</option>
                            <option value="Win">Win</option>
                            <option value="Loss">Loss</option>
                            <option value="Break Even">Break Even</option>
                          </select>
                        </div>
                      </div>

                      {/* PnL Field */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Profit/Loss (PnL)
                          </label>
                          <input
                            type="number"
                            name="pnl"
                            value={formData.pnl}
                            onChange={handleInputChange}
                            step="0.01"
                            className="form-input"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Analysis Fields */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Trade
                          </label>
                          <textarea
                            name="reasonForTrade"
                            value={formData.reasonForTrade}
                            onChange={handleInputChange}
                            rows="2"
                            className="form-input"
                            placeholder="Why did you take this trade? What was your analysis?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Emotion/Psychology
                          </label>
                          
                          {/* Emotion Chips */}
                          <div className="flex flex-wrap gap-2 mb-2 max-h-20 overflow-y-auto">
                            {EMOTION_OPTIONS.map((emotion) => (
                              <button
                                key={emotion}
                                type="button"
                                onClick={() => handleEmotionToggle(emotion)}
                                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                  formData.emotions.includes(emotion)
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                {emotion}
                              </button>
                            ))}
                          </div>
                          
                          {/* Custom Emotion Input */}
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={formData.customEmotion}
                              onChange={(e) => setFormData(prev => ({ ...prev, customEmotion: e.target.value }))}
                              placeholder="Add custom emotion..."
                              className="flex-1 form-input text-sm"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCustomEmotionAdd();
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleCustomEmotionAdd}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            >
                              Add
                            </button>
                          </div>
                          
                          {/* Selected Emotions - Fixed height container */}
                          <div className="min-h-[2rem] max-h-16 overflow-y-auto">
                            {formData.emotions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {formData.emotions.map((emotion) => (
                                  <span
                                    key={emotion}
                                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {emotion}
                                    <button
                                      type="button"
                                      onClick={() => handleEmotionRemove(emotion)}
                                      className="ml-1 text-blue-600 hover:text-blue-800"
                                    >
                                      <XMarkIcon className="h-3 w-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 italic">Selected emotions will appear here</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lesson Learned
                          </label>
                          <textarea
                            name="lessonLearned"
                            value={formData.lessonLearned}
                            onChange={handleInputChange}
                            rows="2"
                            className="form-input"
                            placeholder="What did you learn from this trade? What would you do differently?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Notes
                          </label>
                          <textarea
                            name="additionalNotes"
                            value={formData.additionalNotes}
                            onChange={handleInputChange}
                            rows="2"
                            className="form-input"
                            placeholder="Any additional notes or observations..."
                          />
                        </div>
                      </div>

                      {/* Screenshot Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chart Screenshot
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-4 pb-4 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                          <div className="space-y-1 text-center">
                            {previewUrl ? (
                              <div className="relative">
                                <img
                                  src={previewUrl}
                                  alt="Screenshot preview"
                                  className="mx-auto h-24 w-auto rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={removeScreenshot}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <XMarkIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                  <label
                                    htmlFor="screenshot"
                                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                  >
                                    <span>Upload a screenshot</span>
                                    <input
                                      id="screenshot"
                                      name="screenshot"
                                      type="file"
                                      className="sr-only"
                                      accept="image/*"
                                      onChange={handleFileChange}
                                    />
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex items-center justify-end pt-4 border-t border-gray-200 space-x-3">
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={submitting}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                        
                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn-success"
                        >
                          {submitting ? (
                            <>
                              <div className="spinner w-4 h-4 mr-2"></div>
                              {isEditMode ? 'Updating...' : 'Saving...'}
                            </>
                          ) : (
                            isEditMode ? 'Update Trade' : 'Save Trade'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TradeModal; 