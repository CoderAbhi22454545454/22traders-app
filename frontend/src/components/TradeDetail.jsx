import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tradesAPI, formatCurrency, formatDateTime } from '../utils/api';
import TradeScreenshot from './TradeScreenshot';

const TradeDetail = ({ userId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTrade();
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

  const handleCancelEdit = () => {
    setEditing(false);
    setEditData(trade);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await tradesAPI.updateTrade(id, editData);
      await fetchTrade();
      setEditing(false);
      alert('Trade updated successfully!');
    } catch (error) {
      console.error('Error updating trade:', error);
      alert('Failed to update trade');
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
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Date</h3>
                        <p className="mt-1 text-lg text-gray-900">{formatDateTime(trade.date)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Instrument</h3>
                        <p className="mt-1 text-lg text-gray-900">{trade.instrument}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Direction</h3>
                        <p className="mt-1 text-lg text-gray-900">{trade.direction}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Strategy</h3>
                        <p className="mt-1 text-lg text-gray-900">{trade.strategy}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Session</h3>
                        <p className="mt-1 text-lg text-gray-900">{trade.session}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Execution Score</h3>
                        <p className="mt-1 text-lg text-gray-900">{trade.executionScore}/10</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Entry Price</h3>
                        <p className="mt-1 text-lg text-gray-900">{trade.entryPrice}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Exit Price</h3>
                        <p className="mt-1 text-lg text-gray-900">{trade.exitPrice}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">P&L</h3>
                        <p className={`mt-1 text-lg font-semibold ${
                          trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(trade.pnl)}
                        </p>
                      </div>
                    </div>

                    {trade.emotions && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Emotions</h3>
                        <p className="mt-1 text-gray-900">{trade.emotions}</p>
                      </div>
                    )}

                    {trade.notes && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                        <p className="mt-1 text-gray-900">{trade.notes}</p>
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
        </div>
      </main>
    </div>
  );
};

export default TradeDetail; 