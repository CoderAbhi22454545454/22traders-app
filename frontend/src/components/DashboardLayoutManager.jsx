import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
  CheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// Default section order
const DEFAULT_SECTIONS = [
  { id: 'today-performance', name: "Today's Performance", enabled: true },
  { id: 'trading-calendar', name: 'Trading Calendar', enabled: true },
  { id: 'risk-alerts', name: 'Risk Alerts', enabled: true },
  { id: 'quick-actions', name: 'Quick Actions', enabled: true },
  { id: 'context-row', name: 'Context Row (Streak, Checklist, Session)', enabled: true },
  { id: 'performance-overview', name: 'Performance Overview', enabled: true },
  { id: 'key-metrics', name: 'Key Metrics', enabled: true },
  { id: 'recent-journal', name: 'Recent Journal Entries', enabled: true },
];

// Sortable item component
const SortableItem = ({ id, name, enabled, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white rounded-lg border ${
        isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200'
      } ${!enabled ? 'opacity-50' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded transition-colors"
        title="Drag to reorder"
      >
        <Bars3Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{name}</div>
        <div className="text-xs text-gray-500">
          {enabled ? 'Visible' : 'Hidden'}
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={() => onToggle(id)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
};

// Main DashboardLayoutManager component
const DashboardLayoutManager = ({ userId, isOpen, onClose, onSave }) => {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load saved layout on mount
  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`dashboard-layout-${userId}`);
      if (saved) {
        try {
          const savedSections = JSON.parse(saved);
          setSections(savedSections);
        } catch (error) {
          console.error('Error loading saved layout:', error);
        }
      }
    }
  }, [userId]);

  // Load layout when panel opens
  useEffect(() => {
    if (isOpen && userId) {
      const saved = localStorage.getItem(`dashboard-layout-${userId}`);
      if (saved) {
        try {
          const savedSections = JSON.parse(saved);
          setSections(savedSections);
          setHasChanges(false);
        } catch (error) {
          console.error('Error loading saved layout:', error);
        }
      } else {
        setSections(DEFAULT_SECTIONS);
        setHasChanges(false);
      }
    }
  }, [isOpen, userId]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newSections = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newSections;
      });
    }
  };

  const handleToggle = (id) => {
    setSections((items) => {
      const newSections = items.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      );
      setHasChanges(true);
      return newSections;
    });
  };

  const handleSave = () => {
    if (userId) {
      localStorage.setItem(`dashboard-layout-${userId}`, JSON.stringify(sections));
      setHasChanges(false);
      if (onSave) {
        onSave(sections);
      }
    }
  };

  const handleReset = () => {
    setSections(DEFAULT_SECTIONS);
    setHasChanges(true);
  };

  const handleResetAndSave = () => {
    setSections(DEFAULT_SECTIONS);
    setHasChanges(false);
    if (userId) {
      localStorage.removeItem(`dashboard-layout-${userId}`);
      if (onSave) {
        onSave(DEFAULT_SECTIONS);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Customize Dashboard
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Drag to reorder sections
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
              title="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Reorder sections by dragging them. Toggle visibility with the switch.
              </p>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sections.map((section) => (
                    <SortableItem
                      key={section.id}
                      id={section.id}
                      name={section.name}
                      enabled={section.enabled}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-3">
            {hasChanges && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                You have unsaved changes
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <CheckIcon className="h-5 w-5" />
                Save Layout
              </button>
              <button
                onClick={handleResetAndSave}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                title="Reset to default"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Floating button component
export const DashboardCustomizeButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed right-6 bottom-6 z-30 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110 active:scale-95 group"
      title="Customize Dashboard Layout"
      aria-label="Customize Dashboard Layout"
    >
      <Cog6ToothIcon className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
    </button>
  );
};

export default DashboardLayoutManager;








