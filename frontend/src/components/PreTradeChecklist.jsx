import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checklistAPI } from '../utils/api';
import TradeChecklistExecutor from './TradeChecklistExecutor';
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

  // Cleanup sessionStorage on unmount if stale
  useEffect(() => {
    return () => {
      const stored = sessionStorage.getItem('preTradeChecklistResult');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Clear if older than 1 hour
          if (parsed.completedAt && new Date() - new Date(parsed.completedAt) > 3600000) {
            sessionStorage.removeItem('preTradeChecklistResult');
          }
        } catch (e) {
          // Invalid JSON, remove it
          sessionStorage.removeItem('preTradeChecklistResult');
        }
      }
    };
  }, []);

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

export default PreTradeChecklist;
