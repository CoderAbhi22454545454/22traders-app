import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checklistAPI } from '../utils/api';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  StarIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const PreTradeChecklist = ({ userId, onChecklistComplete }) => {
  const [checklists, setChecklists] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [showExecutor, setShowExecutor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchChecklists();
    }
  }, [userId]);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const response = await checklistAPI.getChecklists(userId, { isActive: true });
      setChecklists(response.checklists || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch checklists');
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistSelect = (checklist) => {
    setSelectedChecklist(checklist);
    setShowExecutor(true);
  };

  const handleChecklistComplete = (result) => {
    setShowExecutor(false);
    setSelectedChecklist(null);
    
    // Store checklist result in sessionStorage for trade entry
    sessionStorage.setItem('preTradeChecklistResult', JSON.stringify({
      checklistId: result.checklistId,
      checklistName: result.checklistName,
      completionPercentage: result.completionPercentage,
      qualityScore: result.qualityScore,
      setupQuality: result.setupQuality,
      completedAt: new Date().toISOString()
    }));

    // Navigate to trade entry with checklist data
    navigate('/trades/new', { 
      state: { 
        fromChecklist: true,
        checklistResult: result 
      } 
    });
  };

  const handleChecklistClose = () => {
    setShowExecutor(false);
    setSelectedChecklist(null);
  };

  const handleSkipChecklist = () => {
    if (window.confirm('Are you sure you want to skip the checklist? This may lead to lower quality trades.')) {
      navigate('/trades/new', { 
        state: { 
          fromChecklist: false,
          skippedChecklist: true 
        } 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading checklists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchChecklists}
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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pre-Trade Checklist</h1>
              <p className="text-gray-600">Complete your setup checklist before entering trade details</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Introduction */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-600 mr-3 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  Quality Control Checkpoint
                </h2>
                <p className="text-blue-800 mb-4">
                  Before entering your trade details, complete a setup checklist to ensure you're following your trading rules and maintaining discipline.
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">Benefits:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ensures consistent trade setup process</li>
                    <li>• Prevents emotional trading decisions</li>
                    <li>• Improves trade quality and success rate</li>
                    <li>• Creates detailed setup documentation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Available Checklists */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Setup Checklist</h2>
            
            {checklists.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <ClipboardDocumentCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Checklists Available</h3>
                <p className="text-gray-600 mb-6">
                  You need to create checklists first to use the pre-trade quality control system.
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => navigate('/checklists')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Checklist
                  </button>
                  <button
                    onClick={handleSkipChecklist}
                    className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Skip for Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {checklists.map((checklist) => (
                  <div
                    key={checklist._id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleChecklistSelect(checklist)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {checklist.name}
                          </h3>
                          {checklist.isDefault && (
                            <StarIcon className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          checklist.category === 'scalping' ? 'bg-red-100 text-red-800' :
                          checklist.category === 'day-trading' ? 'bg-blue-100 text-blue-800' :
                          checklist.category === 'swing-trading' ? 'bg-green-100 text-green-800' :
                          checklist.category === 'position-trading' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {checklist.category.replace('-', ' ')}
                        </span>
                      </div>
                      <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                    </div>

                    {checklist.description && (
                      <p className="text-gray-600 text-sm mb-4">
                        {checklist.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <ChartBarIcon className="w-4 h-4" />
                        <span>{checklist.totalSteps} steps</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TagIcon className="w-4 h-4" />
                        <span>{checklist.requiredSteps} required</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Click to start checklist
                      </span>
                      {checklist.isDefault && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skip Option */}
            {checklists.length > 0 && (
              <div className="mt-8 text-center">
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-gray-600 mb-4">
                    Don't want to use a checklist for this trade?
                  </p>
                  <button
                    onClick={handleSkipChecklist}
                    className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Skip Checklist & Enter Trade
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Checklist Executor Modal */}
      {showExecutor && selectedChecklist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
    </div>
  );
};

// Modified TradeChecklistExecutor for pre-trade use
const TradeChecklistExecutor = ({ 
  userId, 
  tradeId, 
  checklistId, 
  onComplete, 
  onClose,
  initialChecklist = null,
  isPreTrade = false
}) => {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(!initialChecklist);
  const [error, setError] = useState(null);
  const [overallNotes, setOverallNotes] = useState('');
  const [qualityScore, setQualityScore] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (!initialChecklist && checklistId) {
      fetchChecklist();
    }
  }, [checklistId, initialChecklist]);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const response = await checklistAPI.getChecklist(checklistId);
      setChecklist(response.checklist);
      
      // Initialize responses
      const initialResponses = {};
      response.checklist.items.forEach(item => {
        initialResponses[item._id] = {
          isCompleted: false,
          value: null,
          notes: ''
        };
      });
      setResponses(initialResponses);
    } catch (err) {
      setError(err.message || 'Failed to fetch checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleStepResponse = (itemId, response) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: response
    }));
  };

  const goToNextStep = () => {
    if (currentStep < checklist.items.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowSummary(true);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const handleComplete = async () => {
    try {
      const items = Object.entries(responses).map(([itemId, response]) => ({
        itemId,
        title: checklist.items.find(item => item._id === itemId)?.title || '',
        isCompleted: response.isCompleted,
        value: response.value,
        notes: response.notes,
        order: checklist.items.find(item => item._id === itemId)?.order || 1
      }));

      const resultData = {
        userId,
        checklistId,
        items,
        overallNotes,
        qualityScore,
        isCompleted: true,
        isPreTrade: true // Mark as pre-trade checklist
      };

      // For pre-trade, we don't save to database yet - just pass the result
      if (onComplete) {
        onComplete({
          checklistId,
          checklistName: checklist.name,
          completionPercentage: calculateCompletionPercentage(),
          qualityScore,
          setupQuality: assessSetupQuality(),
          items: items,
          overallNotes,
          isPreTrade: true
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to complete checklist');
    }
  };

  const calculateCompletionPercentage = () => {
    const completedItems = Object.values(responses).filter(r => r.isCompleted).length;
    return Math.round((completedItems / checklist.items.length) * 100);
  };

  const assessSetupQuality = () => {
    const completionPercentage = calculateCompletionPercentage();
    const requiredItems = checklist.items.filter(item => item.isRequired);
    const completedRequired = requiredItems.filter(item => 
      responses[item._id]?.isCompleted
    ).length;

    if (completionPercentage >= 90 && completedRequired === requiredItems.length) {
      return 'excellent';
    } else if (completionPercentage >= 75 && completedRequired === requiredItems.length) {
      return 'good';
    } else if (completionPercentage >= 60) {
      return 'fair';
    } else if (completionPercentage >= 40) {
      return 'poor';
    } else {
      return 'terrible';
    }
  };

  const getQualityColor = (quality) => {
    const colors = {
      'excellent': 'text-green-600 bg-green-100',
      'good': 'text-blue-600 bg-blue-100',
      'fair': 'text-yellow-600 bg-yellow-100',
      'poor': 'text-orange-600 bg-orange-100',
      'terrible': 'text-red-600 bg-red-100'
    };
    return colors[quality] || colors.fair;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No checklist found</p>
      </div>
    );
  }

  const currentItem = checklist.items[currentStep];
  const currentResponse = responses[currentItem?._id] || { isCompleted: false, value: null, notes: '' };
  const completionPercentage = calculateCompletionPercentage();
  const setupQuality = assessSetupQuality();

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{checklist.name}</h2>
            <p className="text-gray-600">{checklist.description}</p>
            {isPreTrade && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Pre-Trade Setup
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Question {currentStep + 1}
            </div>
            <span className="text-blue-800 font-medium">
              of {checklist.items.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-700 font-medium">
              {completionPercentage}% Complete
            </span>
            <div className="w-16 bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {!showSummary ? (
        /* Current Step */
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                {currentItem.title}
              </h3>
              {currentItem.isRequired && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  Required
                </span>
              )}
            </div>
            {currentItem.description && (
              <p className="text-gray-600 mb-4">{currentItem.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <ChartBarIcon className="w-4 h-4" />
                {currentItem.category.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Step Input */}
          <ChecklistItemInput
            item={currentItem}
            response={currentResponse}
            onChange={(response) => handleStepResponse(currentItem._id, response)}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-2" />
              Previous
            </button>
            <button
              onClick={goToNextStep}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {currentStep === checklist.items.length - 1 ? 'Review' : 'Next'}
              <ChevronRightIcon className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      ) : (
        /* Summary View */
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Checklist Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                <div className="text-sm text-gray-600">Completion</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(responses).filter(r => r.isCompleted).length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold capitalize ${getQualityColor(setupQuality).split(' ')[0]}`}>
                  {setupQuality}
                </div>
                <div className="text-sm text-gray-600">Quality</div>
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Items Review</h4>
            <div className="space-y-2">
              {checklist.items.map((item, index) => {
                const response = responses[item._id];
                return (
                  <div key={item._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {response?.isCompleted ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium">{index + 1}. {item.title}</span>
                    </div>
                    {response?.notes && (
                      <span className="text-sm text-gray-600 ml-4">
                        "{response.notes}"
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Inputs */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Notes
              </label>
              <textarea
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any overall notes about this trade setup..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSummary(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Back to Checklist
            </button>
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Complete & Enter Trade
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Checklist Item Input Component (same as before)
const ChecklistItemInput = ({ item, response, onChange }) => {
  const handleInputChange = (field, value) => {
    onChange({
      ...response,
      [field]: value
    });
  };

  const renderInput = () => {
    switch (item.inputType) {
      case 'checkbox':
        return (
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={response.isCompleted}
                onChange={(e) => handleInputChange('isCompleted', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700">
                {response.isCompleted ? 'Completed' : 'Mark as completed'}
              </span>
            </label>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={response.isCompleted}
                onChange={(e) => handleInputChange('isCompleted', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700">Completed</span>
            </label>
            <textarea
              value={response.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add notes or details..."
            />
          </div>
        );

      case 'number':
        return (
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={response.isCompleted}
                onChange={(e) => handleInputChange('isCompleted', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700">Completed</span>
            </label>
            <input
              type="number"
              value={response.value || ''}
              onChange={(e) => handleInputChange('value', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a number..."
            />
            <textarea
              value={response.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add notes..."
            />
          </div>
        );

      case 'select':
      case 'radio':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Select your answer:</h4>
              <div className="space-y-3">
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  response.value === 'Yes' 
                    ? 'border-green-500 bg-green-50 shadow-sm ring-1 ring-green-200' 
                    : 'border-gray-200 hover:bg-green-50 hover:border-green-300'
                }`}>
                  <input
                    type="radio"
                    name={`option-${item._id}`}
                    value="Yes"
                    checked={response.value === 'Yes'}
                    onChange={(e) => {
                      handleInputChange('value', e.target.value);
                      handleInputChange('isCompleted', true);
                    }}
                    className="border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
                  />
                  <span className={`ml-3 font-medium transition-colors ${
                    response.value === 'Yes' ? 'text-green-700' : 'text-gray-900'
                  }`}>Yes</span>
                  {response.value === 'Yes' && (
                    <CheckIcon className="w-4 h-4 text-green-600 ml-auto" />
                  )}
                </label>
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                  response.value === 'No' 
                    ? 'border-red-500 bg-red-50 shadow-sm ring-1 ring-red-200' 
                    : 'border-gray-200 hover:bg-red-50 hover:border-red-300'
                }`}>
                  <input
                    type="radio"
                    name={`option-${item._id}`}
                    value="No"
                    checked={response.value === 'No'}
                    onChange={(e) => {
                      handleInputChange('value', e.target.value);
                      handleInputChange('isCompleted', true);
                    }}
                    className="border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <span className={`ml-3 font-medium transition-colors ${
                    response.value === 'No' ? 'text-red-700' : 'text-gray-900'
                  }`}>No</span>
                  {response.value === 'No' && (
                    <XMarkIcon className="w-4 h-4 text-red-600 ml-auto" />
                  )}
                </label>
              </div>
            </div>
            <textarea
              value={response.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add notes (optional)..."
            />
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={response.isCompleted}
                onChange={(e) => handleInputChange('isCompleted', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-gray-700">
                {response.isCompleted ? 'Completed' : 'Mark as completed'}
              </span>
            </label>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderInput()}
    </div>
  );
};

export default PreTradeChecklist; 