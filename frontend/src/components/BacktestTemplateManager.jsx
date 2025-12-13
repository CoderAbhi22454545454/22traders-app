import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  CheckIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const BacktestTemplateManager = ({ userId, onSelectTemplate, showModal, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (userId && showModal) {
      fetchTemplates();
    }
  }, [userId, showModal, selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ userId });
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      const response = await fetch(`${API_BASE_URL}/backtest-templates?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    try {
      // Increment usage count
      await fetch(`${API_BASE_URL}/backtest-templates/${template._id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (onSelectTemplate) {
        onSelectTemplate(template.templateData);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/backtest-templates/${templateId}?userId=${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        fetchTemplates();
      } else {
        alert(data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    }
  };

  const categories = [
    { value: 'all', label: 'All Templates', icon: '📋' },
    { value: 'swing', label: 'Swing Trading', icon: '📈' },
    { value: 'scalping', label: 'Scalping', icon: '⚡' },
    { value: 'breakout', label: 'Breakout', icon: '🚀' },
    { value: 'reversal', label: 'Reversal', icon: '🔄' },
    { value: 'trend-following', label: 'Trend Following', icon: '📊' },
    { value: 'custom', label: 'Custom', icon: '✨' }
  ];

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
            Backtest Templates
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Category Filter */}
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No templates found</p>
              <p className="text-sm text-gray-500">
                Create a template by clicking "Save as Template" when creating or editing a backtest
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template._id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        {template.isDefault && (
                          <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          {categories.find(c => c.value === template.category)?.label || template.category}
                        </span>
                        <span className="text-gray-500">
                          Used {template.usageCount || 0} times
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(template._id);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Template Preview */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Template includes:</div>
                    <div className="flex flex-wrap gap-2">
                      {template.templateData?.instrument && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          {template.templateData.instrument}
                        </span>
                      )}
                      {template.templateData?.direction && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                          {template.templateData.direction}
                        </span>
                      )}
                      {template.templateData?.patternIdentified && (
                        <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded">
                          {template.templateData.patternIdentified}
                        </span>
                      )}
                      {template.templateData?.customChips?.length > 0 && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                          {template.templateData.customChips.length} chips
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              💡 Tip: Templates help you quickly create similar backtests
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestTemplateManager;


