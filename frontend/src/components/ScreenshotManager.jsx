import React, { useState, useEffect } from 'react';
import { 
  PhotoIcon, 
  XMarkIcon,
  CheckIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const ScreenshotManager = ({ 
  screenshots, 
  onScreenshotsChange,
  maxScreenshots = 10
}) => {
  const [currentUpload, setCurrentUpload] = useState(null);
  const [currentLabel, setCurrentLabel] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [currentBorderColor, setCurrentBorderColor] = useState('#3B82F6');
  const [selectedImageView, setSelectedImageView] = useState(null);

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`File size exceeds 10MB limit. Selected file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      e.target.value = ''; // Reset input
      return;
    }
    
    setCurrentUpload({
      file,
      preview: URL.createObjectURL(file)
    });
  };

  const generateUniqueId = () => {
    return `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`;
  };

  const handleSaveScreenshot = () => {
    if (!currentUpload) return;

    const newScreenshot = {
      id: generateUniqueId(),
      file: currentUpload.file,
      preview: currentUpload.preview,
      label: currentLabel,
      description: currentDescription,
      borderColor: currentBorderColor,
      isNew: true
    };

    onScreenshotsChange([...screenshots, newScreenshot]);

    // Reset form
    setCurrentUpload(null);
    setCurrentLabel('');
    setCurrentDescription('');
    setCurrentBorderColor('#3B82F6');
  };

  const handleCancelUpload = () => {
    if (currentUpload?.preview) {
      URL.revokeObjectURL(currentUpload.preview);
    }
    setCurrentUpload(null);
    setCurrentLabel('');
    setCurrentDescription('');
    setCurrentBorderColor('#3B82F6');
  };

  const removeScreenshot = (id) => {
    const screenshot = screenshots.find(s => s.id === id);
    if (screenshot?.preview) {
      URL.revokeObjectURL(screenshot.preview);
    }
    onScreenshotsChange(screenshots.filter(s => s.id !== id));
  };

  const updateScreenshot = (id, field, value) => {
    const updated = screenshots.map(screenshot => 
      screenshot.id === id 
        ? { ...screenshot, [field]: value }
        : screenshot
    );
    onScreenshotsChange(updated);
  };

  const canAddMore = screenshots.length < maxScreenshots;

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (currentUpload?.preview) {
        URL.revokeObjectURL(currentUpload.preview);
      }
      screenshots.forEach(screenshot => {
        if (screenshot.preview) {
          URL.revokeObjectURL(screenshot.preview);
        }
      });
    };
  }, [currentUpload, screenshots]);

  return (
    <div className="space-y-4">
      {/* Saved Screenshots Grid */}
      {screenshots.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <PhotoIcon className="h-5 w-5" />
            Saved Screenshots ({screenshots.length}/{maxScreenshots})
          </h4>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {screenshots.map((screenshot) => (
              <div 
                key={screenshot.id} 
                className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => setSelectedImageView(screenshot)}
                  style={{ borderBottom: `4px solid ${screenshot.borderColor}` }}
                >
                  <img
                    src={screenshot.preview || screenshot.imageUrl}
                    alt={screenshot.label || 'Screenshot'}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                      Click to view
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeScreenshot(screenshot.id);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  <input
                    type="text"
                    value={screenshot.label || ''}
                    onChange={(e) => updateScreenshot(screenshot.id, 'label', e.target.value)}
                    placeholder="Label (e.g., Entry Point)"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    value={screenshot.description || ''}
                    onChange={(e) => updateScreenshot(screenshot.id, 'description', e.target.value)}
                    placeholder="Description..."
                    rows={2}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => updateScreenshot(screenshot.id, 'borderColor', color.value)}
                        className={`
                          w-6 h-6 rounded border-2 transition-all
                          ${screenshot.borderColor === color.value 
                            ? 'border-gray-900 scale-110' 
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Screenshot Section */}
      {canAddMore && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          {!currentUpload ? (
            <label className="cursor-pointer block">
              <div className="text-center">
                <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-600">
                  Add Screenshot
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click to upload • PNG, JPG, GIF, WebP up to 10MB
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {screenshots.length} / {maxScreenshots} screenshots
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {/* Image Preview */}
                <div 
                  className="flex-shrink-0 w-40 h-40 rounded-lg overflow-hidden relative"
                  style={{ borderBottom: `4px solid ${currentBorderColor}` }}
                >
                  <img
                    src={currentUpload.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label (Heading)
                    </label>
                    <input
                      type="text"
                      value={currentLabel}
                      onChange={(e) => setCurrentLabel(e.target.value)}
                      placeholder="e.g., Entry Point, Setup, Exit"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={currentDescription}
                      onChange={(e) => setCurrentDescription(e.target.value)}
                      placeholder="Describe what this screenshot shows..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Border Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setCurrentBorderColor(color.value)}
                          className={`
                            w-8 h-8 rounded-md border-2 transition-all
                            ${currentBorderColor === color.value 
                              ? 'border-gray-900 scale-110' 
                              : 'border-gray-300 hover:border-gray-400'
                            }
                          `}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                      <input
                        type="color"
                        value={currentBorderColor}
                        onChange={(e) => setCurrentBorderColor(e.target.value)}
                        className="w-8 h-8 rounded-md border-2 border-gray-300 cursor-pointer"
                        title="Custom color"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveScreenshot}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <CheckIcon className="h-4 w-4" />
                  Save Screenshot
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Max Limit Warning */}
      {!canAddMore && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Maximum {maxScreenshots} screenshots reached. Remove a screenshot to add more.
          </p>
        </div>
      )}

      {/* Image View Modal */}
      {selectedImageView && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" 
          onClick={() => setSelectedImageView(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImageView(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            {selectedImageView.label && (
              <div 
                className="absolute -top-10 left-0 px-3 py-1 rounded text-white text-sm font-medium"
                style={{ backgroundColor: selectedImageView.borderColor }}
              >
                {selectedImageView.label}
              </div>
            )}
            <img
              src={selectedImageView.preview || selectedImageView.imageUrl}
              alt={selectedImageView.label || 'Screenshot'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              style={{ borderBottom: `6px solid ${selectedImageView.borderColor}` }}
            />
            {selectedImageView.description && (
              <div className="mt-3 bg-black bg-opacity-75 text-white p-3 rounded-md max-w-2xl">
                <p className="text-sm">{selectedImageView.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotManager;

