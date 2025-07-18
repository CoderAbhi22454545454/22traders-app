import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { tradesAPI } from '../utils/api';
import { useNotifications } from './Notifications';

const TradeScreenshot = ({ trade, onScreenshotDeleted, showDeleteButton = true }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error } = useNotifications();

  const handleDeleteScreenshot = async () => {
    if (!window.confirm('Are you sure you want to delete this screenshot?')) return;

    setIsDeleting(true);
    try {
      await tradesAPI.deleteScreenshot(trade._id);
      success('Screenshot deleted successfully');
      if (onScreenshotDeleted) onScreenshotDeleted();
    } catch (err) {
      error('Failed to delete screenshot');
    } finally {
      setIsDeleting(false);
    }
  };

  const getImageFormat = () => {
    if (trade.screenshotMetadata && trade.screenshotMetadata.mimetype) {
      return trade.screenshotMetadata.mimetype.split('/')[1]?.toUpperCase();
    }
    if (trade.screenshotUrl && trade.screenshotUrl.startsWith('data:')) {
      const mimeMatch = trade.screenshotUrl.match(/^data:([^;]+);base64,/);
      if (mimeMatch && mimeMatch[1]) {
        return mimeMatch[1].split('/')[1]?.toUpperCase();
      }
    }
    return 'Unknown';
  };

  const getImageSize_bytes = () => {
    if (trade.screenshotMetadata && trade.screenshotMetadata.size) {
      const bytes = trade.screenshotMetadata.size;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    // For Base64, we can estimate size from the string length
    if (trade.screenshotUrl && trade.screenshotUrl.startsWith('data:')) {
      const base64Part = trade.screenshotUrl.split(',')[1];
      if (base64Part) {
        const bytes = (base64Part.length * 3) / 4; // Base64 to bytes conversion
        if (bytes < 1024) return `${Math.round(bytes)} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      }
    }
    return 'Unknown';
  };

  const getUploadDate = () => {
    if (trade.screenshotMetadata && trade.screenshotMetadata.uploadDate) {
      return new Date(trade.screenshotMetadata.uploadDate).toLocaleDateString();
    }
    return 'Unknown';
  };

  if (!trade.screenshotUrl) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No screenshot available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative group">
        <div className="relative overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
          <img
            src={trade.screenshotUrl}
            alt={`Trade screenshot for ${trade.tradePair || trade.instrument}`}
            className="w-full h-48 object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
            onClick={() => setIsFullscreen(true)}
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
              <button
                onClick={() => setIsFullscreen(true)}
                className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                title="View fullscreen"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
              
              {showDeleteButton && (
                <button
                  onClick={handleDeleteScreenshot}
                  disabled={isDeleting}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
                  title="Delete screenshot"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Image info badge */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
            {getImageFormat()} • {getImageSize_bytes()}
          </div>
        </div>
        
        {/* Image metadata */}
        <div className="mt-2 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>Format: {getImageFormat()}</span>
            <span>Size: {getImageSize_bytes()}</span>
          </div>
          {trade.screenshotMetadata && trade.screenshotMetadata.uploadDate && (
            <div className="text-xs text-gray-500 mt-1">
              Uploaded: {getUploadDate()}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      <Transition appear show={isFullscreen} as={React.Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsFullscreen(false)}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-90" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative max-w-7xl max-h-[90vh] overflow-hidden">
                  {/* Close button */}
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                  
                  {/* Image */}
                  <img
                    src={trade.screenshotUrl}
                    alt={`Trade screenshot for ${trade.tradePair || trade.instrument}`}
                    className="max-w-full max-h-[90vh] object-contain"
                  />
                  
                  {/* Image info */}
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">{trade.tradePair || trade.instrument}</div>
                      <div className="text-gray-300">
                        {getImageFormat()} • {getImageSize_bytes()}
                      </div>
                      {trade.screenshotMetadata && trade.screenshotMetadata.uploadDate && (
                        <div className="text-xs text-gray-400 mt-1">
                          Uploaded: {getUploadDate()}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default TradeScreenshot; 