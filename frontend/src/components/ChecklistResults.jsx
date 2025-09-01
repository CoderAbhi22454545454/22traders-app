import React, { useState, useEffect } from 'react';
import { checklistAPI } from '../utils/api';
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  StarIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const ChecklistResults = ({ userId, tradeId, onResultClick }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedResult, setExpandedResult] = useState(null);

  useEffect(() => {
    if (userId && tradeId) {
      fetchChecklistResults();
    }
  }, [userId, tradeId]);

  const fetchChecklistResults = async () => {
    try {
      setLoading(true);
      const response = await checklistAPI.getTradeChecklistResult(tradeId);
      if (response.result) {
        setResults([response.result]);
      } else {
        setResults([]);
      }
    } catch (err) {
      if (err.message !== 'No checklist result found for this trade') {
        setError(err.message || 'Failed to fetch checklist results');
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResult = async (resultId) => {
    if (window.confirm('Are you sure you want to delete this checklist result?')) {
      try {
        await checklistAPI.deleteChecklistResult(resultId);
        fetchChecklistResults();
      } catch (err) {
        setError(err.message || 'Failed to delete checklist result');
      }
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

  const getCategoryColor = (category) => {
    const colors = {
      'scalping': 'bg-red-100 text-red-800',
      'day-trading': 'bg-blue-100 text-blue-800',
      'swing-trading': 'bg-green-100 text-green-800',
      'position-trading': 'bg-purple-100 text-purple-800',
      'custom': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.custom;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600" />
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

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Checklist Results</h3>
        <p className="text-gray-600">
          No checklist was completed for this trade.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Trade Setup Checklist</h3>
      
      {results.map((result) => (
        <div key={result._id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">{result.checklistName}</h4>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(result.checklistId?.category || 'custom')}`}>
                  {result.checklistId?.category?.replace('-', ' ') || 'Custom'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpandedResult(expandedResult === result._id ? null : result._id)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  {expandedResult === result._id ? (
                    <ChevronUpIcon className="w-4 h-4" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                </button>
                {onResultClick && (
                  <button
                    onClick={() => onResultClick(result)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="View details"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteResult(result._id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete result"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{result.completionPercentage}%</div>
                <div className="text-sm text-gray-600">Completion</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {result.completedItems}/{result.totalItems}
                </div>
                <div className="text-sm text-gray-600">Items</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold capitalize ${getQualityColor(result.setupQuality || result.qualityAssessment).split(' ')[0]}`}>
                  {result.setupQuality || result.qualityAssessment || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Quality</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {result.qualityScore || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{result.completedItems} of {result.totalItems} items completed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${result.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Timestamps */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                <span>Started: {new Date(result.startedAt).toLocaleString()}</span>
              </div>
              {result.completedAt && (
                <div className="flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Completed: {new Date(result.completedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {expandedResult === result._id && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              {/* Overall Notes */}
              {result.overallNotes && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Overall Notes</h5>
                  <p className="text-gray-700 bg-white p-3 rounded-lg border">
                    {result.overallNotes}
                  </p>
                </div>
              )}

              {/* Items Details */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Checklist Items</h5>
                <div className="space-y-2">
                  {result.items.map((item, index) => (
                    <div key={item.itemId} className="bg-white p-3 rounded-lg border">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {item.isCompleted ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircleIcon className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {index + 1}. {item.title}
                            </span>
                          </div>
                          
                          {/* Item Details */}
                          <div className="space-y-1">
                            {item.value && (
                              <div className="text-sm">
                                <span className="text-gray-600">Value: </span>
                                <span className="font-medium text-gray-900">{item.value}</span>
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-sm">
                                <span className="text-gray-600">Notes: </span>
                                <span className="text-gray-900">"{item.notes}"</span>
                              </div>
                            )}
                            {item.completedAt && (
                              <div className="text-xs text-gray-500">
                                Completed: {new Date(item.completedAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Checklist Results List Component (for showing all results)
const ChecklistResultsList = ({ userId, filters = {} }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalResults: 0
  });

  useEffect(() => {
    if (userId) {
      fetchResults();
    }
  }, [userId, filters]);

  const fetchResults = async (page = 1) => {
    try {
      setLoading(true);
      const response = await checklistAPI.getAllChecklistResults(userId, {
        ...filters,
        page,
        limit: 10
      });
      setResults(response.results || []);
      setPagination(response.pagination || {});
    } catch (err) {
      setError(err.message || 'Failed to fetch checklist results');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    fetchResults(page);
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
      <div className="flex items-center justify-center py-8">
        <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600" />
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

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Checklist Results</h3>
        <p className="text-gray-600">
          No checklist results found for the selected criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Checklist Results</h3>
        <span className="text-sm text-gray-500">
          {pagination.totalResults} total results
        </span>
      </div>

      <div className="space-y-3">
        {results.map((result) => (
          <div key={result._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">{result.checklistName}</h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getQualityColor(result.setupQuality || result.qualityAssessment)}`}>
                    {result.setupQuality || result.qualityAssessment || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{result.tradeId?.instrument || 'N/A'}</span>
                  <span>{new Date(result.startedAt).toLocaleDateString()}</span>
                  <span>{result.completionPercentage}% complete</span>
                  {result.qualityScore && (
                    <span>Score: {result.qualityScore}/10</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {result.completedItems}/{result.totalItems}
                  </div>
                  <div className="text-xs text-gray-500">items</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export { ChecklistResults, ChecklistResultsList };
export default ChecklistResults; 