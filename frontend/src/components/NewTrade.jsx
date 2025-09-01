import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TradeModal from './TradeModal';
import { useNotifications } from './Notifications';

const NewTrade = ({ userId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [checklistData, setChecklistData] = useState(null);
  const { success } = useNotifications();

  useEffect(() => {
    // Check if we have checklist data from the pre-trade checklist
    const preTradeData = sessionStorage.getItem('preTradeChecklistResult');
    if (preTradeData) {
      try {
        const parsedData = JSON.parse(preTradeData);
        setChecklistData(parsedData);
        success('Pre-trade checklist completed! Now enter your trade details.');
      } catch (error) {
        console.error('Error parsing checklist data:', error);
      }
    }

    // Check if we have data from navigation state
    if (location.state?.checklistResult) {
      setChecklistData(location.state.checklistResult);
      success('Pre-trade checklist completed! Now enter your trade details.');
    }

    // If user skipped checklist, show a warning
    if (location.state?.skippedChecklist) {
      success('Trade entry mode - no checklist completed.');
    }
  }, [location.state, success]);

  const handleClose = () => {
    // Clear checklist data from session storage
    sessionStorage.removeItem('preTradeChecklistResult');
    navigate('/dashboard');
  };

  const handleTradeAdded = (trade) => {
    // Clear checklist data from session storage
    sessionStorage.removeItem('preTradeChecklistResult');
    
    // Save checklist result to database if we have checklist data
    if (checklistData) {
      saveChecklistResult(trade._id);
    }
    
    success('Trade added successfully!');
    navigate('/dashboard');
  };

  const saveChecklistResult = async (tradeId) => {
    try {
      const { checklistAPI } = await import('../utils/api');
      
      const resultData = {
        userId,
        tradeId,
        checklistId: checklistData.checklistId,
        items: checklistData.items || [],
        overallNotes: checklistData.overallNotes || '',
        qualityScore: checklistData.qualityScore,
        isCompleted: true
      };

      await checklistAPI.saveChecklistResult(resultData);
      console.log('Checklist result saved successfully');
    } catch (error) {
      console.error('Error saving checklist result:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Trade Entry</h1>
              <p className="text-gray-600">
                {checklistData 
                  ? `Following ${checklistData.checklistName} checklist (${checklistData.completionPercentage}% complete)`
                  : 'Enter your trade details'
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Trade Modal */}
      <TradeModal
        isOpen={isModalOpen}
        onClose={handleClose}
        selectedDate={new Date()}
        userId={userId}
        onTradeAdded={handleTradeAdded}
        checklistData={checklistData}
      />
    </div>
  );
};

export default NewTrade; 