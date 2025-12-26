import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  PlusIcon, 
  XMarkIcon, 
  PhotoIcon,
  TagIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import BacktestTemplateManager from './BacktestTemplateManager';
import ScreenshotManager from './ScreenshotManager';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const NewBacktest = ({ userId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [masterCards, setMasterCards] = useState([]);
  
  // Template states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('custom');

  // Form data
  const [formData, setFormData] = useState({
    masterCardId: searchParams.get('masterCardId') || '',
    date: new Date().toISOString().split('T')[0],
    tradeNumber: '',
    instrument: '',
    tradePair: '',
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    takeProfit: '',
    pnl: '',
    result: '',
    direction: '',
    lotSize: '',
    positionSize: '',
    riskReward: '',
    patternIdentified: '',
    marketCondition: '',
    confidence: '',
    reasonForEntry: '',
    reasonForExit: '',
    whatWorked: '',
    whatDidntWork: '',
    improvementAreas: '',
    backtestNotes: ''
  });

  // Custom chips state
  const [customChips, setCustomChips] = useState([]);
  const [newChip, setNewChip] = useState({
    name: '',
    value: '',
    color: '#3B82F6',
    category: 'custom'
  });
  const [existingChips, setExistingChips] = useState([]);

  // Screenshots state - array of screenshot objects
  const [screenshots, setScreenshots] = useState([]);

  // Fetch master cards and existing chips
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      // Fetch master cards
      try {
        const masterCardsResponse = await fetch(`${API_BASE_URL}/master-cards?userId=${userId}`);
        if (masterCardsResponse.ok) {
          const masterCardsData = await masterCardsResponse.json();
          if (masterCardsData.success) {
            setMasterCards(masterCardsData.masterCards || []);
          }
        }
      } catch (err) {
        console.error('Error fetching master cards:', err);
      }

      // Fetch existing chips
      try {
        const response = await fetch(`${API_BASE_URL}/backtests/chips?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setExistingChips(data.chips || []);
        } else {
          console.log('No existing chips found or server error');
          setExistingChips([]);
        }
      } catch (err) {
        console.error('Error fetching existing chips:', err);
        setExistingChips([]);
      }

      // Check for clone data in sessionStorage
      const cloneData = sessionStorage.getItem('cloneBacktest');
      if (cloneData) {
        try {
          const parsedData = JSON.parse(cloneData);
          setFormData(prev => ({
            ...prev,
            ...parsedData,
            masterCardId: searchParams.get('masterCardId') || parsedData.masterCardId || '',
            date: new Date().toISOString().split('T')[0]
          }));
          
          if (parsedData.customChips) {
            setCustomChips(parsedData.customChips);
          }
          
          // Clear the clone data
          sessionStorage.removeItem('cloneBacktest');
        } catch (err) {
          console.error('Error parsing clone data:', err);
        }
      }
    };

    fetchData();
  }, [userId, searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-adjust PnL sign based on result
    if (name === 'result') {
      setFormData(prev => {
        const updatedData = { ...prev, [name]: value };
        
        // If result is "loss" and PnL is positive, make it negative
        if (value === 'loss' && prev.pnl && parseFloat(prev.pnl) > 0) {
          updatedData.pnl = (-Math.abs(parseFloat(prev.pnl))).toString();
        }
        // If result is "win" and PnL is negative, make it positive
        else if (value === 'win' && prev.pnl && parseFloat(prev.pnl) < 0) {
          updatedData.pnl = Math.abs(parseFloat(prev.pnl)).toString();
        }
        
        return updatedData;
      });
    } 
    // When PnL is entered/changed, auto-adjust sign based on current result
    else if (name === 'pnl') {
      setFormData(prev => {
        const numValue = parseFloat(value);
        let adjustedValue = value;
        
        // If result is "loss", ensure PnL is negative
        if (prev.result === 'loss' && numValue > 0) {
          adjustedValue = (-Math.abs(numValue)).toString();
        }
        // If result is "win", ensure PnL is positive
        else if (prev.result === 'win' && numValue < 0) {
          adjustedValue = Math.abs(numValue).toString();
        }
        
        return { ...prev, [name]: adjustedValue };
      });
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Custom chip management
  const addCustomChip = () => {
    if (newChip.name && newChip.value) {
      setCustomChips(prev => [...prev, { ...newChip, id: Date.now() }]);
      setNewChip({ name: '', value: '', color: '#3B82F6', category: 'custom' });
    }
  };

  const removeCustomChip = (chipId) => {
    setCustomChips(prev => prev.filter(chip => chip.id !== chipId));
  };

  const addExistingChip = (chip) => {
    const exists = customChips.some(c => c.name === chip.name && c.value === chip.value);
    if (!exists) {
      setCustomChips(prev => [...prev, { ...chip, id: Date.now() }]);
    }
  };

  // Screenshot management - now handled by MultipleScreenshotUploader component
  const handleScreenshotsChange = (newScreenshots) => {
    setScreenshots(newScreenshots);
  };

  // Handle template selection
  const handleTemplateSelect = (templateData) => {
    // Apply template data to form
    setFormData(prev => ({
      ...prev,
      ...templateData,
      // Preserve masterCardId and date
      masterCardId: prev.masterCardId,
      date: prev.date,
      // Don't copy price/pnl data
      entryPrice: '',
      exitPrice: '',
      stopLoss: '',
      takeProfit: '',
      pnl: '',
      result: ''
    }));

    // Apply custom chips from template
    if (templateData.customChips && templateData.customChips.length > 0) {
      setCustomChips(templateData.customChips);
    }
  };

  // Save current form as template
  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      // Build template data, only including non-empty fields
      const templateData = {};
      
      if (formData.instrument) templateData.instrument = formData.instrument;
      if (formData.tradePair) templateData.tradePair = formData.tradePair;
      if (formData.direction) templateData.direction = formData.direction;
      if (formData.lotSize) templateData.lotSize = formData.lotSize;
      if (formData.positionSize) templateData.positionSize = formData.positionSize;
      if (formData.riskReward) templateData.riskReward = formData.riskReward;
      if (formData.patternIdentified) templateData.patternIdentified = formData.patternIdentified;
      if (formData.marketCondition) templateData.marketCondition = formData.marketCondition;
      if (formData.confidence) templateData.confidence = formData.confidence;
      if (formData.reasonForEntry) templateData.reasonForEntry = formData.reasonForEntry;
      if (formData.reasonForExit) templateData.reasonForExit = formData.reasonForExit;
      if (formData.whatWorked) templateData.whatWorked = formData.whatWorked;
      if (formData.whatDidntWork) templateData.whatDidntWork = formData.whatDidntWork;
      if (formData.improvementAreas) templateData.improvementAreas = formData.improvementAreas;
      if (formData.backtestNotes) templateData.backtestNotes = formData.backtestNotes;
      if (customChips && customChips.length > 0) templateData.customChips = customChips;

      const response = await fetch(`${API_BASE_URL}/backtest-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: templateName,
          description: templateDescription,
          category: templateCategory,
          templateData
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowSaveTemplateModal(false);
        setTemplateName('');
        setTemplateDescription('');
        setTemplateCategory('custom');
        alert('Template saved successfully!');
      } else {
        alert(data.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.masterCardId) {
      setError('Master Card is required');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      
      // Add basic form data
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      formDataToSend.append('userId', userId);
      formDataToSend.append('customChips', JSON.stringify(customChips));

      // Add screenshots and their metadata (up to 10)
      const screenshotMetadata = [];
      const filesToUpload = [];
      
      console.log('📸 Screenshots to upload:', screenshots);
      
      screenshots.forEach((screenshot) => {
        if (screenshot.file) {
          filesToUpload.push(screenshot.file);
          screenshotMetadata.push({
            label: screenshot.label || '',
            description: screenshot.description || '',
            borderColor: screenshot.borderColor || '#3B82F6'
          });
        }
      });

      // Add files in order to match metadata array
      filesToUpload.forEach(file => {
        formDataToSend.append('screenshots', file);
      });

      console.log('📸 Screenshot Metadata being sent:', screenshotMetadata);

      if (screenshotMetadata.length > 0) {
        formDataToSend.append('screenshotMetadata', JSON.stringify(screenshotMetadata));
      }

      const response = await fetch(`${API_BASE_URL}/backtests`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create backtest';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSuccess(true);
      setTimeout(() => {
        // Navigate to the master card detail page
        if (formData.masterCardId) {
          navigate(`/backtests/master/${formData.masterCardId}`);
        } else {
          navigate('/backtests');
        }
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chipColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <SparklesIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Backtest Created!</h3>
          <p className="mt-1 text-sm text-gray-500">Redirecting to backtests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-1 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Backtest</h1>
              <p className="mt-1 text-gray-600">Create a detailed backtest with custom labels and analysis</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
                Use Template
              </button>
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BookmarkIcon className="h-5 w-5" />
                Save as Template
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Trade Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Trade Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Master Card * <span className="text-red-500">(Required)</span>
                </label>
                <select
                  name="masterCardId"
                  value={formData.masterCardId}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm bg-white"
                >
                  <option value="">Select a Master Card</option>
                  {masterCards.map((card) => (
                    <option key={card._id} value={card._id}>
                      {card.name} {card.strategy && `(${card.strategy})`}
                    </option>
                  ))}
                </select>
                {masterCards.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    No master cards found. <Link to="/backtests" className="text-blue-600 hover:underline">Create one first</Link>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trade Number</label>
                <input
                  type="text"
                  name="tradeNumber"
                  value={formData.tradeNumber}
                  onChange={handleInputChange}
                  placeholder="BT-001"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instrument/Pair</label>
                <input
                  type="text"
                  name="tradePair"
                  value={formData.tradePair}
                  onChange={handleInputChange}
                  placeholder="EURUSD"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                <select
                  name="direction"
                  value={formData.direction}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm bg-white"
                >
                  <option value="">Select direction</option>
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entry Price</label>
                <input
                  type="number"
                  step="0.00001"
                  name="entryPrice"
                  value={formData.entryPrice}
                  onChange={handleInputChange}
                  placeholder="1.2345"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exit Price</label>
                <input
                  type="number"
                  step="0.00001"
                  name="exitPrice"
                  value={formData.exitPrice}
                  onChange={handleInputChange}
                  placeholder="1.2400"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss</label>
                <input
                  type="number"
                  step="0.00001"
                  name="stopLoss"
                  value={formData.stopLoss}
                  onChange={handleInputChange}
                  placeholder="1.2300"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Take Profit</label>
                <input
                  type="number"
                  step="0.00001"
                  name="takeProfit"
                  value={formData.takeProfit}
                  onChange={handleInputChange}
                  placeholder="1.2450"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">P&L</label>
                <input
                  type="number"
                  step="0.01"
                  name="pnl"
                  value={formData.pnl}
                  onChange={handleInputChange}
                  placeholder="100.50"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
                <select
                  name="result"
                  value={formData.result}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm bg-white"
                >
                  <option value="">Select result</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                  <option value="be">Break Even</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lot Size</label>
                <input
                  type="number"
                  step="0.01"
                  name="lotSize"
                  value={formData.lotSize}
                  onChange={handleInputChange}
                  placeholder="0.10"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position Size</label>
                <input
                  type="text"
                  name="positionSize"
                  value={formData.positionSize}
                  onChange={handleInputChange}
                  placeholder="$1000"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risk:Reward</label>
                <input
                  type="text"
                  name="riskReward"
                  value={formData.riskReward}
                  onChange={handleInputChange}
                  placeholder="1:2"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Pattern & Confidence */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pattern & Confidence</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pattern Identified</label>
                <input
                  type="text"
                  name="patternIdentified"
                  value={formData.patternIdentified}
                  onChange={handleInputChange}
                  placeholder="e.g., Double Bottom, Head & Shoulders"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confidence Level (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  name="confidence"
                  value={formData.confidence}
                  onChange={handleInputChange}
                  placeholder="7"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Market Condition</label>
                <select
                  name="marketCondition"
                  value={formData.marketCondition}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm bg-white"
                >
                  <option value="">Select condition</option>
                  <option value="trending">Trending</option>
                  <option value="ranging">Ranging</option>
                  <option value="volatile">Volatile</option>
                  <option value="calm">Calm</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Labels */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Labels & Tags</h3>
            
            {/* Existing Chips */}
            {existingChips.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Add from Previous</h4>
                <div className="flex flex-wrap gap-2">
                  {existingChips.slice(0, 10).map((chip, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addExistingChip(chip)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-gray-300 hover:bg-gray-50"
                      style={{ 
                        borderColor: chip.color + '40',
                        color: chip.color
                      }}
                    >
                      <PlusIcon className="w-3 h-3 mr-1" />
                      {chip.name}: {chip.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Chip */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Label Name</label>
                <input
                  type="text"
                  value={newChip.name}
                  onChange={(e) => setNewChip(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Label name"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Value</label>
                <input
                  type="text"
                  value={newChip.value}
                  onChange={(e) => setNewChip(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Label value"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newChip.category}
                  onChange={(e) => setNewChip(prev => ({ ...prev, category: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm bg-white"
                >
                  <option value="custom">Custom</option>
                  <option value="strategy">Strategy</option>
                  <option value="timeframe">Timeframe</option>
                  <option value="session">Session</option>
                  <option value="pattern">Pattern</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="mt-1 flex space-x-1">
                  {chipColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewChip(prev => ({ ...prev, color }))}
                      className={`w-6 h-6 rounded-full border-2 ${newChip.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={addCustomChip}
              disabled={!newChip.name || !newChip.value}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Label
            </button>

            {/* Current Chips */}
            {customChips.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Labels</h4>
                <div className="flex flex-wrap gap-2">
                  {customChips.map((chip) => (
                    <span
                      key={chip.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: chip.color + '20', 
                        color: chip.color,
                        border: `1px solid ${chip.color}40`
                      }}
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      {chip.name}: {chip.value}
                      <button
                        type="button"
                        onClick={() => removeCustomChip(chip.id)}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black hover:bg-opacity-10"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Screenshots - Save One at a Time */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <PhotoIcon className="h-6 w-6 text-blue-600" />
              Trade Screenshots
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Add screenshots one at a time. Each screenshot can have a label, description, and border color.
            </p>
            
            <ScreenshotManager
              screenshots={screenshots}
              onScreenshotsChange={handleScreenshotsChange}
              maxScreenshots={10}
            />
          </div>

          {/* Analysis */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What Worked</label>
                <textarea
                  name="whatWorked"
                  value={formData.whatWorked}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe what went well in this trade..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400 resize-none"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What Didn't Work</label>
                <textarea
                  name="whatDidntWork"
                  value={formData.whatDidntWork}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe what could be improved..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Entry</label>
                <textarea
                  name="reasonForEntry"
                  value={formData.reasonForEntry}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Why did you enter this trade?"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason for Exit</label>
                <textarea
                  name="reasonForExit"
                  value={formData.reasonForExit}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Why did you exit this trade?"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Improvement Areas</label>
                <textarea
                  name="improvementAreas"
                  value={formData.improvementAreas}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Areas for future improvement..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  name="backtestNotes"
                  value={formData.backtestNotes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Any additional observations or notes..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/backtests')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Backtest'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Template Manager Modal */}
      <BacktestTemplateManager
        userId={userId}
        showModal={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Save as Template</h3>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., My Swing Trade Setup"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe this template..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="custom">Custom</option>
                  <option value="swing">Swing Trading</option>
                  <option value="scalping">Scalping</option>
                  <option value="breakout">Breakout</option>
                  <option value="reversal">Reversal</option>
                  <option value="trend-following">Trend Following</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAsTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewBacktest;
