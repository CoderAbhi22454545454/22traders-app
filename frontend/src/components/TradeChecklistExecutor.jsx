import React, { useState, useEffect } from 'react';
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
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const TradeChecklistExecutor = ({ 
  userId, 
  tradeId, 
  checklistId, 
  onComplete, 
  onClose,
  initialChecklist = null 
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
        tradeId,
        checklistId,
        items,
        overallNotes,
        qualityScore,
        isCompleted: true
      };

      await checklistAPI.saveChecklistResult(resultData);
      
      if (onComplete) {
        onComplete({
          checklistId,
          checklistName: checklist.name,
          completionPercentage: calculateCompletionPercentage(),
          qualityScore,
          setupQuality: assessSetupQuality()
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to save checklist result');
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
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {checklist.items.length}
          </span>
          <span className="text-sm text-gray-500">
            {completionPercentage}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 overflow-x-auto">
          {checklist.items.map((item, index) => (
            <button
              key={item._id}
              onClick={() => goToStep(index)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                index === currentStep
                  ? 'bg-blue-600 text-white'
                  : responses[item._id]?.isCompleted
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
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
              <span className="flex items-center gap-1">
                <DocumentTextIcon className="w-4 h-4" />
                {currentItem.inputType}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setup Quality Score (1-10)
              </label>
              <select
                value={qualityScore || ''}
                onChange={(e) => setQualityScore(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a score</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                  <option key={score} value={score}>{score}</option>
                ))}
              </select>
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
              Complete Checklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Checklist Item Input Component
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
            {item.options && item.options.length > 0 && (
              <div className="space-y-2">
                {item.options.map((option, index) => (
                  <label key={index} className="flex items-center">
                    <input
                      type={item.inputType === 'radio' ? 'radio' : 'checkbox'}
                      name={`option-${item._id}`}
                      value={option.value}
                      checked={response.value === option.value}
                      onChange={(e) => handleInputChange('value', e.target.value)}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
            <textarea
              value={response.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add notes..."
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

export default TradeChecklistExecutor; 