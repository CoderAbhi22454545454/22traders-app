import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  PlusIcon, 
  XMarkIcon, 
  PhotoIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const EditBacktest = ({ userId }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [masterCards, setMasterCards] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    masterCardId: '',
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

  // Screenshots state - existing screenshots and new ones
  const [existingScreenshots, setExistingScreenshots] = useState([]);
  const [screenshotsToRemove, setScreenshotsToRemove] = useState([]);
  const [newScreenshots, setNewScreenshots] = useState({
    before: { file: null, description: '' },
    entry: { file: null, description: '' },
    after: { file: null, description: '' }
  });

  // Fetch backtest data and master cards
  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !id) return;

      setLoading(true);
      try {
        // Fetch backtest
        const backtestResponse = await fetch(`${API_BASE_URL}/backtests/${id}`);
        if (!backtestResponse.ok) throw new Error('Failed to fetch backtest');
        
        const backtestData = await backtestResponse.json();
        const backtest = backtestData.backtest;
        
        // Populate form data
        setFormData({
          masterCardId: backtest.masterCardId?._id || backtest.masterCardId || '',
          date: backtest.date ? new Date(backtest.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          tradeNumber: backtest.tradeNumber || '',
          instrument: backtest.instrument || '',
          tradePair: backtest.tradePair || '',
          entryPrice: backtest.entryPrice || '',
          exitPrice: backtest.exitPrice || '',
          stopLoss: backtest.stopLoss || '',
          takeProfit: backtest.takeProfit || '',
          pnl: backtest.pnl || '',
          result: backtest.result || '',
          direction: backtest.direction || '',
          lotSize: backtest.lotSize || '',
          positionSize: backtest.positionSize || '',
          riskReward: backtest.riskReward || '',
          patternIdentified: backtest.patternIdentified || '',
          marketCondition: backtest.marketCondition || '',
          confidence: backtest.confidence || '',
          reasonForEntry: backtest.reasonForEntry || '',
          reasonForExit: backtest.reasonForExit || '',
          whatWorked: backtest.whatWorked || '',
          whatDidntWork: backtest.whatDidntWork || '',
          improvementAreas: backtest.improvementAreas || '',
          backtestNotes: backtest.backtestNotes || ''
        });

        // Set custom chips
        if (backtest.customChips && backtest.customChips.length > 0) {
          setCustomChips(backtest.customChips.map((chip, idx) => ({
            ...chip,
            id: chip._id || Date.now() + idx
          })));
        }

        // Set existing screenshots
        if (backtest.screenshots && backtest.screenshots.length > 0) {
          setExistingScreenshots(backtest.screenshots);
        }

        // Fetch master cards
        const masterCardsResponse = await fetch(`${API_BASE_URL}/master-cards?userId=${userId}`);
        if (masterCardsResponse.ok) {
          const masterCardsData = await masterCardsResponse.json();
          if (masterCardsData.success) {
            setMasterCards(masterCardsData.masterCards || []);
          }
        }

        // Fetch existing chips
        const chipsResponse = await fetch(`${API_BASE_URL}/backtests/chips?userId=${userId}`);
        if (chipsResponse.ok) {
          const chipsData = await chipsResponse.json();
          setExistingChips(chipsData.chips || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  // Screenshot management
  const handleNewScreenshotChange = (type, file) => {
    setNewScreenshots(prev => ({
      ...prev,
      [type]: { ...prev[type], file }
    }));
  };

  const handleNewScreenshotDescriptionChange = (type, description) => {
    setNewScreenshots(prev => ({
      ...prev,
      [type]: { ...prev[type], description }
    }));
  };

  const removeNewScreenshot = (type) => {
    setNewScreenshots(prev => ({
      ...prev,
      [type]: { file: null, description: '' }
    }));
  };

  const removeExistingScreenshot = (screenshotId) => {
    setScreenshotsToRemove(prev => [...prev, screenshotId]);
    setExistingScreenshots(prev => prev.filter(s => s._id !== screenshotId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      
      // Add basic form data
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      formDataToSend.append('customChips', JSON.stringify(customChips));

      // Handle screenshot removal
      if (screenshotsToRemove.length > 0) {
        formDataToSend.append('removeScreenshots', JSON.stringify(screenshotsToRemove));
      }

      // Add new screenshots and their metadata
      const screenshotTypes = [];
      const screenshotDescriptions = [];
      
      Object.keys(newScreenshots).forEach(type => {
        if (newScreenshots[type].file) {
          formDataToSend.append('screenshots', newScreenshots[type].file);
          screenshotTypes.push(type);
          screenshotDescriptions.push(newScreenshots[type].description);
        }
      });

      if (screenshotTypes.length > 0) {
        formDataToSend.append('screenshotTypes', JSON.stringify(screenshotTypes));
        formDataToSend.append('screenshotDescriptions', JSON.stringify(screenshotDescriptions));
      }

      const response = await fetch(`${API_BASE_URL}/backtests/${id}`, {
        method: 'PUT',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update backtest');
      }

      const result = await response.json();
      setSuccess(true);
      setTimeout(() => {
        // Navigate to the master card detail page or backtest detail
        if (formData.masterCardId) {
          navigate(`/backtests/master/${formData.masterCardId}`);
        } else {
          navigate(`/backtests/${id}`);
        }
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const chipColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <SparklesIcon className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Backtest Updated!</h3>
          <p className="mt-1 text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Reuse the same form structure as NewBacktest but with edit-specific changes
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-1 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Backtest</h1>
          <p className="mt-1 text-gray-600">Update your backtest details</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Trade Information - Same as NewBacktest */}
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

          {/* Pattern & Confidence - Same as NewBacktest */}
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

          {/* Custom Labels - Same as NewBacktest */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Labels & Tags</h3>
            
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

          {/* Screenshots - Show existing and allow adding new */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Screenshots</h3>
            
            {/* Existing Screenshots */}
            {existingScreenshots.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Existing Screenshots</h4>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {existingScreenshots.map((screenshot) => (
                    <div key={screenshot._id} className="space-y-2">
                      <div className="relative">
                        <img
                          src={screenshot.url}
                          alt={`${screenshot.type} screenshot`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingScreenshot(screenshot._id)}
                          className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white hover:bg-red-700"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-black bg-opacity-75 text-white">
                            {screenshot.type.charAt(0).toUpperCase() + screenshot.type.slice(1)}
                          </span>
                        </div>
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

            {/* New Screenshots */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Screenshots</h4>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {['before', 'entry', 'after'].map(type => (
                  <div key={type} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                      {type === 'before' ? 'Before Trade' : type === 'entry' ? 'Trade Entry' : 'After Trade'}
                    </h5>
                    
                    {newScreenshots[type].file ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(newScreenshots[type].file)}
                            alt={`${type} screenshot`}
                            className="w-full h-32 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewScreenshot(type)}
                            className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white hover:bg-red-700"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          placeholder={`Describe the ${type} screenshot...`}
                          value={newScreenshots[type].description}
                          onChange={(e) => handleNewScreenshotDescriptionChange(type, e.target.value)}
                          rows={3}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm placeholder-gray-400 resize-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="cursor-pointer">
                          <div className="border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400">
                            <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <span className="mt-2 block text-sm font-medium text-gray-600">
                              Upload {type} screenshot
                            </span>
                            <span className="block text-xs text-gray-500">PNG, JPG, GIF up to 10MB</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleNewScreenshotChange(type, e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis - Same as NewBacktest */}
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
              onClick={() => navigate(`/backtests/${id}`)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Backtest'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBacktest;





