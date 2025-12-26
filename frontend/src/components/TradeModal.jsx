import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhotoIcon, CheckIcon, ExclamationTriangleIcon,  ChevronRightIcon,   StarIcon, ClockIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon, ArrowRightIcon, ClipboardDocumentCheckIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline';
import { tradesAPI, formatCurrency, formatDate, checklistAPI } from '../utils/api';
import { useNotifications } from './Notifications';
import InstrumentIcon from './shared/InstrumentIcon';
import TradeChecklistExecutor from './TradeChecklistExecutor';
import ScreenshotManager from './ScreenshotManager';


// Predefined emotion options
const EMOTION_OPTIONS = [
  'Confident', 'Anxious', 'Fearful', 'Greedy', 'Disciplined', 'Impatient', 
  'Excited', 'Frustrated', 'Calm', 'Nervous', 'Aggressive', 'Cautious',
  'Overconfident', 'Hesitant', 'Focused', 'Distracted', 'Euphoric', 'Regretful'
];

// Limited pair options as requested
const PAIR_OPTIONS = ['XAUUSD', 'BTCUSD', 'EURUSD'];

const TradeModal = ({ isOpen, onClose, selectedDate, userId, onTradeAdded, editTrade = null, checklistData = null }) => {
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(editTrade ? 1 : 0); // 0: checklist, 1: trade form
  const [availableChecklists, setAvailableChecklists] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [checklistResult, setChecklistResult] = useState(checklistData || null);
  const [showChecklistExecutor, setShowChecklistExecutor] = useState(false);
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
    pipes: '0',
    isBacktest: false,
    reasonForTrade: '',
    emotions: [],
    customEmotion: '',
    lessonLearned: '',
    additionalNotes: ''
  });
  
  const [screenshots, setScreenshots] = useState([]);
  const [existingTrades, setExistingTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});;

  const { success, error, warning } = useNotifications();

  const isEditMode = !!editTrade;

  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchExistingTrades();
      if (isEditMode && editTrade) {
        populateFormForEdit();
        setCurrentStep(1); // Skip checklist for edit mode
      } else {
        resetForm();
        fetchAvailableChecklists();
        setCurrentStep(0); // Start with checklist for new trades
        // Auto-fill trade number for new trades
        if (userId) {
          fetchTradeCount();
        }
      }
    }
  }, [isOpen, selectedDate, userId, editTrade, isEditMode]);

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
      pipes: editTrade.pipes || '0',
      isBacktest: editTrade.isBacktest || false,
      reasonForTrade: editTrade.reasonForTrade || '',
      emotions: existingEmotions,
      customEmotion: '',
      lessonLearned: editTrade.lessonLearned || '',
      additionalNotes: editTrade.additionalNotes || editTrade.notes || ''
    });
    
    // Load existing screenshots
    if (editTrade.screenshots && editTrade.screenshots.length > 0) {
      const formattedScreenshots = editTrade.screenshots.map(screenshot => ({
        id: screenshot._id,
        imageUrl: screenshot.imageUrl || screenshot.url,
        publicId: screenshot.publicId,
        label: screenshot.label || '',
        description: screenshot.description || '',
        borderColor: screenshot.borderColor || '#3B82F6',
        isNew: false,
        isExisting: true
      }));
      setScreenshots(formattedScreenshots);
    } else if (editTrade.screenshotUrl) {
      // Handle old single screenshot format
      setScreenshots([{
        id: 'legacy',
        imageUrl: editTrade.screenshotUrl,
        publicId: editTrade.screenshotPublicId || '',
        label: 'Trade Screenshot',
        description: '',
        borderColor: '#3B82F6',
        isNew: false,
        isExisting: true
      }]);
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

  const fetchAvailableChecklists = async () => {
    try {
      const response = await checklistAPI.getChecklists(userId, { isActive: true });
      setAvailableChecklists(response.checklists || []);
    } catch (err) {
      console.error('Error fetching checklists:', err);
    }
  };

  const handleChecklistSelect = (checklist) => {
    setSelectedChecklist(checklist);
    setShowChecklistExecutor(true);
  };

  const handleChecklistComplete = (result) => {
    setChecklistResult(result);
    setShowChecklistExecutor(false);
    setSelectedChecklist(null);
    setCurrentStep(1); // Move to trade form
    success('Pre-trade checklist completed! Now enter your trade details.');
  };

  const handleChecklistClose = () => {
    setShowChecklistExecutor(false);
    setSelectedChecklist(null);
  };

  const handleSkipChecklist = () => {
    if (window.confirm('Are you sure you want to skip the checklist? This may lead to lower quality trades.')) {
      setCurrentStep(1);
      warning('Checklist skipped. Consider using a checklist for better trade quality.');
    }
  };

  const goBackToChecklist = () => {
    setCurrentStep(0);
    setChecklistResult(null);
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
      pipes: '0',
      isBacktest: false,
      reasonForTrade: '',
      emotions: [],
      customEmotion: '',
      lessonLearned: '',
      additionalNotes: ''
    });
    setScreenshots([]);
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

  // Screenshot management now handled by ScreenshotManager component

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      
      // Build FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add all form fields
      formDataToSend.append('userId', userId);
      formDataToSend.append('date', selectedDate.toISOString());
      formDataToSend.append('emotions', formData.emotions.join(', '));
      
      // Add all other fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '' && key !== 'emotions') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Map fields for backward compatibility
      formDataToSend.append('instrument', formData.tradePair || '');
      if (formData.positionSize) {
        formDataToSend.append('lotSize', formData.positionSize);
      }
      if (formData.tradeOutcome) {
        formDataToSend.append('result', formData.tradeOutcome.toLowerCase());
      }
      formDataToSend.append('notes', formData.additionalNotes || '');
      
      // Add pre-trade checklist data if available
      if (checklistResult) {
        formDataToSend.append('preTradeChecklist', JSON.stringify({
          checklistId: checklistResult.checklistId,
          checklistName: checklistResult.checklistName,
          completionPercentage: checklistResult.completionPercentage,
          qualityScore: checklistResult.qualityScore,
          setupQuality: checklistResult.setupQuality,
          items: checklistResult.items,
          overallNotes: checklistResult.overallNotes
        }));
      }

      // Handle screenshots
      const newScreenshots = screenshots.filter(s => s.isNew && s.file);
      const existingScreenshots = screenshots.filter(s => s.isExisting);

      if (isEditMode) {
        // For edit mode: track removals and updates
        const originalScreenshots = editTrade.screenshots || [];
        const removedIds = originalScreenshots
          .filter(orig => {
            if (!orig || !orig._id) return false;
            return !existingScreenshots.find(ex => ex.id === orig._id.toString());
          })
          .map(s => s._id.toString())
          .filter(id => id); // Remove any undefined/null values
        
        if (removedIds.length > 0) {
          formDataToSend.append('removeScreenshots', JSON.stringify(removedIds));
        }

        // Track metadata updates for existing screenshots
        const updates = existingScreenshots.map(s => ({
          id: s.id,
          label: s.label,
          description: s.description,
          borderColor: s.borderColor
        }));
        
        if (updates.length > 0) {
          formDataToSend.append('updateScreenshots', JSON.stringify(updates));
        }
      }

      // Add new screenshot files
      newScreenshots.forEach(screenshot => {
        formDataToSend.append('screenshots', screenshot.file);
      });

      // Add screenshot metadata for new screenshots
      if (newScreenshots.length > 0) {
        const screenshotMetadata = newScreenshots.map(s => ({
          label: s.label,
          description: s.description,
          borderColor: s.borderColor
        }));
        formDataToSend.append('screenshotMetadata', JSON.stringify(screenshotMetadata));
      }

      // Make API call with FormData
      const url = isEditMode 
        ? `${API_BASE_URL}/trades/${editTrade._id}` 
        : `${API_BASE_URL}/trades`;
      
      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} trade`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const savedTrade = await response.json();
      
      // Save checklist result to database if we have one (for new trades)
      if (!isEditMode && checklistResult && savedTrade.trade) {
        try {
          const checklistResultData = {
            userId,
            tradeId: savedTrade.trade._id,
            checklistId: checklistResult.checklistId,
            items: checklistResult.items,
            overallNotes: checklistResult.overallNotes,
            qualityScore: checklistResult.qualityScore,
            isCompleted: true
          };
          await checklistAPI.saveChecklistResult(checklistResultData);
        } catch (checklistErr) {
          console.error('Error saving checklist result:', checklistErr);
          warning('Trade saved but checklist result could not be saved.');
        }
      }
      
      success(`Trade ${isEditMode ? 'updated' : 'created'} successfully!`);
      
      // Clear sessionStorage if trade was created from checklist
      if (!isEditMode && checklistResult) {
        sessionStorage.removeItem('preTradeChecklistResult');
      }
      
      // Refresh existing trades and notify parent
      await fetchExistingTrades();
      if (onTradeAdded) onTradeAdded();
      
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error submitting trade:', err);
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
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
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
                              <span className="font-medium text-gray-900">
                                <InstrumentIcon instrument={trade.tradePair || trade.instrument} />
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getResultColor(trade.tradeOutcome || trade.result)}`}>
                                {(trade.tradeOutcome || trade.result)?.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>{trade.direction} • {trade.positionSize || trade.lotSize}</div>
                              <div className="flex items-center justify-between">
                                <div className={`font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {trade.pnl ? formatCurrency(trade.pnl) : 'N/A'}
                                </div>
                                {trade.pipes && trade.pipes !== '0' && trade.pipes !== '0' && (
                                  <span className={`text-xs px-1 py-0.5 rounded ${trade.pipes.startsWith('-') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {trade.pipes.startsWith('-') ? '' : '+'}{trade.pipes}p
                                  </span>
                                )}
                                {trade.isBacktest && (
                                  <span className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-800">
                                    BT
                                  </span>
                                )}
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
                      <div className="flex items-center space-x-4">
                        <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                          {isEditMode ? 'Edit Trade' : 
                           currentStep === 0 ? 'Pre-Trade Setup' : 
                           `Trade Entry for ${selectedDate?.toISOString().split('T')[0]}`}
                        </Dialog.Title>
                        {!isEditMode && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs ${currentStep === 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                              1. Checklist
                            </span>
                            <ChevronRightIcon className="w-4 h-4" />
                            <span className={`px-2 py-1 rounded-full text-xs ${currentStep === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                              2. Trade Details
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleClose}
                        disabled={submitting}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Step Content */}
                    {currentStep === 0 && !isEditMode ? (
                      /* Pre-Trade Checklist Step */
                      <div className="px-6 py-8">
                        <div className="text-center mb-8">
                          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
                            <ClipboardDocumentCheckIcon className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Pre-Trade Checklist
                          </h3>
                        
                        </div>

                        {availableChecklists.length === 0 ? (
                          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                            <ClipboardDocumentCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">No Checklists Available</h4>
                            <p className="text-gray-600 mb-6">Create your first trading checklist to get started</p>
                            <button
                              onClick={handleClose}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                              Close & Create Checklist
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-80 overflow-y-auto">
                            {availableChecklists.map((checklist) => (
                              <div
                                key={checklist._id}
                                className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                                onClick={() => handleChecklistSelect(checklist)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                                        {checklist.name}
                                      </h4>
                                      {checklist.isDefault && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                          <StarIcon className="w-3 h-3 mr-1" />
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 mb-4 leading-relaxed">{checklist.description}</p>
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-1.5">
                                        <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm font-medium text-gray-700">
                                          {checklist.totalSteps} steps
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <ClockIcon className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-gray-600">
                                          ~{Math.ceil(checklist.totalSteps * 1.5)} min
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 ml-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                      <ChevronRightIcon className="w-6 h-6 text-blue-600" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-200">
                          <button
                            onClick={handleSkipChecklist}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 font-medium"
                          >
                            <XMarkIcon className="w-4 h-4 mr-1" />
                            Skip checklist & continue
                          </button>
                          <button
                            onClick={handleClose}
                            className="btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Trade Details Step */
                      <div>
                        {/* Pre-Trade Checklist Data Display */}
                        {checklistResult && (
                          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-blue-900">
                                Pre-Trade Checklist Completed
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  checklistResult.setupQuality === 'excellent' ? 'bg-green-100 text-green-800' :
                                  checklistResult.setupQuality === 'good' ? 'bg-blue-100 text-blue-800' :
                                  checklistResult.setupQuality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                  checklistResult.setupQuality === 'poor' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {checklistResult.setupQuality} quality
                                </span>
                                <button
                                  onClick={goBackToChecklist}
                                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                                >
                                  Change
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-blue-700 font-medium">Checklist:</span>
                                <p className="text-blue-900">{checklistResult.checklistName}</p>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Completion:</span>
                                <p className="text-blue-900">{checklistResult.completionPercentage}%</p>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Quality Score:</span>
                                <p className="text-blue-900">{checklistResult.qualityScore || 'N/A'}/10</p>
                              </div>
                              <div>
                                <span className="text-blue-700 font-medium">Items:</span>
                                <p className="text-blue-900">{checklistResult.items?.length || 0} completed</p>
                              </div>
                            </div>
                            {checklistResult.overallNotes && (
                              <div className="mt-3">
                                <span className="text-blue-700 font-medium text-sm">Notes:</span>
                                <p className="text-blue-900 text-sm mt-1">{checklistResult.overallNotes}</p>
                              </div>
                            )}
                          </div>
                        )}

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

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pipes
                          </label>
                          <input
                            type="text"
                            name="pipes"
                            value={formData.pipes}
                            onChange={handleInputChange}
                            className="form-input"
                            placeholder="e.g., -10, 0, 10, +5"
                          />
                        </div>

                        <div className="flex items-center">
                          <div className="flex items-center h-5">
                            <input
                              id="isBacktest"
                              name="isBacktest"
                              type="checkbox"
                              checked={formData.isBacktest}
                              onChange={(e) => setFormData(prev => ({ ...prev, isBacktest: e.target.checked }))}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="isBacktest" className="font-medium text-gray-700">
                              Backtest Trade
                            </label>
                            <p className="text-gray-500 text-xs">This trade won't affect real stats</p>
                          </div>
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
                      {/* Multiple Trade Screenshots */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trade Screenshots (up to 10)
                        </label>
                        <ScreenshotManager
                          screenshots={screenshots}
                          onScreenshotsChange={setScreenshots}
                          maxScreenshots={10}
                        />
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
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        {/* Checklist Executor Modal */}
        {showChecklistExecutor && selectedChecklist && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <TradeChecklistExecutor
                userId={userId}
                tradeId={null} // No trade ID yet - will be created after checklist
                checklistId={selectedChecklist._id}
                initialChecklist={selectedChecklist}
                onComplete={handleChecklistComplete}
                onClose={handleChecklistClose}
                isPreTrade={true}
              />
            </div>
          </div>
        )}
      </Dialog>
    </Transition>
  );
};

export default TradeModal; 