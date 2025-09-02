import React, { useState, useEffect } from 'react';
import { checklistAPI } from '../utils/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CogIcon,
  StarIcon,
  ClockIcon,
  ChartBarIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const TradeChecklists = ({ userId }) => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, inactive, default

  useEffect(() => {
    if (userId) {
      fetchChecklists();
    }
  }, [userId]);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const response = await checklistAPI.getChecklists(userId);
      setChecklists(response.checklists || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch checklists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChecklist = () => {
    setSelectedChecklist(null);
    setShowCreateModal(true);
  };

  const handleEditChecklist = (checklist) => {
    setSelectedChecklist(checklist);
    setShowEditModal(true);
  };

  const handleDuplicateChecklist = async (checklistId) => {
    try {
      await checklistAPI.duplicateChecklist(checklistId);
      fetchChecklists();
    } catch (err) {
      setError(err.message || 'Failed to duplicate checklist');
    }
  };

  const handleDeleteChecklist = async (checklistId) => {
    if (window.confirm('Are you sure you want to delete this checklist?')) {
      try {
        await checklistAPI.deleteChecklist(checklistId);
        fetchChecklists();
      } catch (err) {
        setError(err.message || 'Failed to delete checklist');
      }
    }
  };

  const handleSaveChecklist = async (checklistData) => {
    try {
      if (selectedChecklist) {
        await checklistAPI.updateChecklist(selectedChecklist._id, checklistData);
      } else {
        await checklistAPI.createChecklist({ ...checklistData, userId });
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      fetchChecklists();
    } catch (err) {
      setError(err.message || 'Failed to save checklist');
    }
  };

  const filteredChecklists = checklists.filter(checklist => {
    switch (filter) {
      case 'active':
        return checklist.isActive;
      case 'inactive':
        return !checklist.isActive;
      case 'default':
        return checklist.isDefault;
      default:
        return true;
    }
  });

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
      <div className="flex items-center justify-center min-h-64">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trade Checklists</h1>
              <p className="text-gray-600">Manage your trading setup checklists</p>
            </div>
            <button
              onClick={handleCreateChecklist}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Checklist
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <XCircleIcon className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'active', 'inactive', 'default'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === filterOption
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
          </button>
        ))}
      </div>

      {/* Checklists Grid */}
      {filteredChecklists.length === 0 ? (
        <div className="text-center py-12">
          <CogIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No checklists found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? 'Create your first checklist to get started with quality trade setups.'
              : `No ${filter} checklists found.`
            }
          </p>
          {filter === 'all' && (
            <button
              onClick={handleCreateChecklist}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Checklist
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChecklists.map((checklist) => (
            <div
              key={checklist._id}
              className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow ${
                !checklist.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {checklist.name}
                      </h3>
                      {checklist.isDefault && (
                        <StarIcon className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(checklist.category)}`}>
                      {checklist.category.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {checklist.isActive ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>

                {/* Description */}
                {checklist.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {checklist.description}
                  </p>
                )}

                {/* Stats */}
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

                {/* Instruments & Strategies */}
                {(checklist.instruments?.length > 0 || checklist.strategies?.length > 0) && (
                  <div className="mb-4">
                    {checklist.instruments?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-500 mb-1">Instruments</p>
                        <div className="flex flex-wrap gap-1">
                          {checklist.instruments.slice(0, 3).map((instrument, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {instrument}
                            </span>
                          ))}
                          {checklist.instruments.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              +{checklist.instruments.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {checklist.strategies?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Strategies</p>
                        <div className="flex flex-wrap gap-1">
                          {checklist.strategies.slice(0, 2).map((strategy, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {strategy}
                            </span>
                          ))}
                          {checklist.strategies.length > 2 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              +{checklist.strategies.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditChecklist(checklist)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit checklist"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateChecklist(checklist._id)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Duplicate checklist"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteChecklist(checklist._id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete checklist"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(checklist.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

          </div>
        </div>
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <ChecklistModal
          checklist={selectedChecklist}
          onSave={handleSaveChecklist}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedChecklist(null);
          }}
        />
      )}
    </div>
  );
};

// Checklist Modal Component
const ChecklistModal = ({ checklist, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: checklist?.name || '',
    description: checklist?.description || '',
    category: checklist?.category || 'custom',
    isActive: checklist?.isActive !== false,
    isDefault: checklist?.isDefault || false,
    instruments: checklist?.instruments || [],
    strategies: checklist?.strategies || [],
    items: checklist?.items || []
  });
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    isRequired: false,
    category: 'custom',
    inputType: 'radio',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' }
    ]
  });
  const [showNewItemForm, setShowNewItemForm] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    if (newItem.title.trim()) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { ...newItem, order: prev.items.length + 1 }]
      }));
      setNewItem({
        title: '',
        description: '',
        isRequired: false,
        category: 'custom',
        inputType: 'radio',
        options: [
          { label: 'Yes', value: 'Yes' },
          { label: 'No', value: 'No' }
        ]
      });
      setShowNewItemForm(false);
    }
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleMoveItem = (index, direction) => {
    const newItems = [...formData.items];
    if (direction === 'up' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.items.length > 0) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {checklist ? 'Edit Checklist' : 'Create New Checklist'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Checklist Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter checklist name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="scalping">Scalping</option>
                <option value="day-trading">Day Trading</option>
                <option value="swing-trading">Swing Trading</option>
                <option value="position-trading">Position Trading</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your checklist..."
            />
          </div>

          {/* Settings */}
          <div className="flex items-center gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Set as Default</span>
            </label>
          </div>

          {/* Checklist Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Checklist Items</h3>
              <button
                type="button"
                onClick={() => setShowNewItemForm(true)}
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Item
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {index + 1}. {item.title}
                      </span>
                      {item.isRequired && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          Required
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronUpIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveItem(index, 'down')}
                      disabled={index === formData.items.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* New Item Form */}
            {showNewItemForm && (
              <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Title *
                    </label>
                    <input
                      type="text"
                      value={newItem.title}
                      onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter item title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="technical">Technical</option>
                      <option value="fundamental">Fundamental</option>
                      <option value="risk-management">Risk Management</option>
                      <option value="psychology">Psychology</option>
                      <option value="execution">Execution</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional description..."
                  />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newItem.isRequired}
                      onChange={(e) => setNewItem(prev => ({ ...prev, isRequired: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Required</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Response Type
                    </label>
                    <div className="px-3 py-1 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                      Yes/No Radio Buttons
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewItemForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || formData.items.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checklist ? 'Update Checklist' : 'Create Checklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeChecklists; 