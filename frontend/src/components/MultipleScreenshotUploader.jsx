import React, { useState } from 'react';
import { 
  PhotoIcon, 
  XMarkIcon, 
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const MultipleScreenshotUploader = ({ 
  screenshots, 
  onScreenshotsChange,
  maxScreenshots = 10
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    addScreenshots(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    addScreenshots(files);
  };

  const addScreenshots = (files) => {
    const remainingSlots = maxScreenshots - screenshots.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newScreenshots = filesToAdd.map(file => ({
      id: `new-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      label: '',
      description: '',
      borderColor: '#3B82F6',
      isNew: true
    }));

    onScreenshotsChange([...screenshots, ...newScreenshots]);
  };

  const updateScreenshot = (id, field, value) => {
    const updated = screenshots.map(screenshot => 
      screenshot.id === id 
        ? { ...screenshot, [field]: value }
        : screenshot
    );
    onScreenshotsChange(updated);
  };

  const removeScreenshot = (id) => {
    // Revoke object URL if it's a new screenshot
    const screenshot = screenshots.find(s => s.id === id);
    if (screenshot?.preview) {
      URL.revokeObjectURL(screenshot.preview);
    }
    onScreenshotsChange(screenshots.filter(s => s.id !== id));
  };

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' }
  ];

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {screenshots.length < maxScreenshots && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
          `}
        >
          <label className="cursor-pointer">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>
              {' '}or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF, WebP up to 10MB each
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {screenshots.length} / {maxScreenshots} screenshots
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Screenshot List */}
      {screenshots.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <PhotoIcon className="h-5 w-5" />
            Screenshots ({screenshots.length}/{maxScreenshots})
          </h4>
          
          {screenshots.map((screenshot, index) => (
            <div 
              key={screenshot.id} 
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex gap-4">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  <div 
                    className="w-32 h-32 rounded-lg overflow-hidden relative"
                    style={{ borderBottom: `4px solid ${screenshot.borderColor}` }}
                  >
                    <img
                      src={screenshot.preview || screenshot.imageUrl}
                      alt={screenshot.label || `Screenshot ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(screenshot.id)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Screenshot Metadata */}
                <div className="flex-1 space-y-3">
                  {/* Label Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label (Heading)
                    </label>
                    <input
                      type="text"
                      value={screenshot.label || ''}
                      onChange={(e) => updateScreenshot(screenshot.id, 'label', e.target.value)}
                      placeholder="e.g., Entry Point, Before Entry, Exit Strategy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Description Textarea */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={screenshot.description || ''}
                      onChange={(e) => updateScreenshot(screenshot.id, 'description', e.target.value)}
                      placeholder="Describe what this screenshot shows..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Border Color Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Border Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => updateScreenshot(screenshot.id, 'borderColor', color.value)}
                          className={`
                            w-8 h-8 rounded-md border-2 transition-all
                            ${screenshot.borderColor === color.value 
                              ? 'border-gray-900 scale-110' 
                              : 'border-gray-300 hover:border-gray-400'
                            }
                          `}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                      {/* Custom color input */}
                      <input
                        type="color"
                        value={screenshot.borderColor}
                        onChange={(e) => updateScreenshot(screenshot.id, 'borderColor', e.target.value)}
                        className="w-8 h-8 rounded-md border-2 border-gray-300 cursor-pointer"
                        title="Custom color"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Max Limit Warning */}
      {screenshots.length >= maxScreenshots && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Maximum {maxScreenshots} screenshots reached. Remove a screenshot to add more.
          </p>
        </div>
      )}
    </div>
  );
};

export default MultipleScreenshotUploader;

