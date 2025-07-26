import React, { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import {
  PencilIcon,
  CursorArrowRaysIcon,
  Square3Stack3DIcon,
  EllipsisHorizontalCircleIcon,
  MinusIcon,
  ArrowUpIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  PhotoIcon,
  DocumentArrowDownIcon,
  PaintBrushIcon,
  SwatchIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const DrawingCanvas = ({ initialData = null, onDataChange = null, width = 800, height = 600 }) => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#3B82F6');
  const [brushSize, setBrushSize] = useState(2);
  const [fillColor, setFillColor] = useState('transparent');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Trading-specific tools
  const [showTradingTools, setShowTradingTools] = useState(false);

  const tools = [
    { id: 'select', name: 'Select', icon: CursorArrowRaysIcon, cursor: 'default' },
    { id: 'pen', name: 'Pen', icon: PencilIcon, cursor: 'crosshair' },
    { id: 'line', name: 'Line', icon: MinusIcon, cursor: 'crosshair' },
    { id: 'rectangle', name: 'Rectangle', icon: Square3Stack3DIcon, cursor: 'crosshair' },
    { id: 'circle', name: 'Circle', icon: EllipsisHorizontalCircleIcon, cursor: 'crosshair' },
    { id: 'arrow', name: 'Arrow', icon: ArrowUpIcon, cursor: 'crosshair' },
    { id: 'text', name: 'Text', icon: ChatBubbleLeftIcon, cursor: 'text' },
  ];

  const tradingTools = [
    { id: 'support', name: 'Support Line', color: '#10B981' },
    { id: 'resistance', name: 'Resistance Line', color: '#EF4444' },
    { id: 'trendline', name: 'Trend Line', color: '#3B82F6' },
    { id: 'fibonacci', name: 'Fibonacci', color: '#F59E0B' },
    { id: 'channel', name: 'Channel', color: '#8B5CF6' },
  ];

  const colorPresets = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#000000', '#6B7280', '#FFFFFF'
  ];

  useEffect(() => {
    if (canvasRef.current && !canvas) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: width,
        height: height,
        backgroundColor: '#FFFFFF',
        selection: selectedTool === 'select',
      });

      // Set up canvas events
      fabricCanvas.on('path:created', (e) => {
        if (onDataChange) {
          onDataChange(fabricCanvas.toJSON());
        }
      });

      fabricCanvas.on('object:added', (e) => {
        if (onDataChange) {
          onDataChange(fabricCanvas.toJSON());
        }
      });

      fabricCanvas.on('object:modified', (e) => {
        if (onDataChange) {
          onDataChange(fabricCanvas.toJSON());
        }
      });

      // Load initial data if provided
      if (initialData) {
        fabricCanvas.loadFromJSON(initialData, () => {
          fabricCanvas.renderAll();
        });
      }

      setCanvas(fabricCanvas);

      return () => {
        fabricCanvas.dispose();
      };
    }
  }, [canvasRef, width, height]);

  useEffect(() => {
    if (canvas) {
      canvas.selection = selectedTool === 'select';
      canvas.defaultCursor = tools.find(t => t.id === selectedTool)?.cursor || 'default';
      
      // Remove all event listeners first
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');

      if (selectedTool === 'pen') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushSize;
      } else {
        canvas.isDrawingMode = false;
        
        if (selectedTool !== 'select') {
          setupShapeDrawing();
        }
      }
    }
  }, [selectedTool, canvas, brushColor, brushSize]);

  const setupShapeDrawing = () => {
    let isDown = false;
    let origX, origY;
    let shape = null;

    canvas.on('mouse:down', (o) => {
      if (selectedTool === 'select') return;
      
      isDown = true;
      const pointer = canvas.getPointer(o.e);
      origX = pointer.x;
      origY = pointer.y;

      if (selectedTool === 'text') {
        const text = new fabric.IText('Click to edit', {
          left: origX,
          top: origY,
          fontFamily: 'Inter, sans-serif',
          fontSize: 16,
          fill: brushColor,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        return;
      }

      shape = createShape(selectedTool, origX, origY, 0, 0);
      if (shape) {
        canvas.add(shape);
      }
    });

    canvas.on('mouse:move', (o) => {
      if (!isDown || !shape || selectedTool === 'text') return;
      
      const pointer = canvas.getPointer(o.e);
      const width = pointer.x - origX;
      const height = pointer.y - origY;

      updateShape(shape, selectedTool, origX, origY, width, height);
      canvas.renderAll();
    });

    canvas.on('mouse:up', () => {
      isDown = false;
      shape = null;
    });
  };

  const createShape = (toolType, x, y, width, height) => {
    const commonProps = {
      left: x,
      top: y,
      stroke: brushColor,
      strokeWidth: brushSize,
      fill: fillColor === 'transparent' ? 'transparent' : fillColor,
      selectable: true,
    };

    switch (toolType) {
      case 'line':
        return new fabric.Line([x, y, x + width, y + height], {
          ...commonProps,
          fill: undefined,
        });
        
      case 'rectangle':
        return new fabric.Rect({
          ...commonProps,
          width: Math.abs(width),
          height: Math.abs(height),
        });
        
      case 'circle':
        return new fabric.Circle({
          ...commonProps,
          radius: Math.abs(width) / 2,
        });
        
      case 'arrow':
        const line = new fabric.Line([x, y, x + width, y + height], {
          ...commonProps,
          fill: undefined,
        });
        
        // Add arrowhead
        const angle = Math.atan2(height, width);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        const arrowHead1 = new fabric.Line([
          x + width,
          y + height,
          x + width - arrowLength * Math.cos(angle - arrowAngle),
          y + height - arrowLength * Math.sin(angle - arrowAngle)
        ], { ...commonProps, fill: undefined });
        
        const arrowHead2 = new fabric.Line([
          x + width,
          y + height,
          x + width - arrowLength * Math.cos(angle + arrowAngle),
          y + height - arrowLength * Math.sin(angle + arrowAngle)
        ], { ...commonProps, fill: undefined });
        
        const group = new fabric.Group([line, arrowHead1, arrowHead2], {
          left: x,
          top: y,
        });
        
        return group;
        
      default:
        return null;
    }
  };

  const updateShape = (shape, toolType, origX, origY, width, height) => {
    switch (toolType) {
      case 'line':
        shape.set({
          x2: origX + width,
          y2: origY + height,
        });
        break;
        
      case 'rectangle':
        shape.set({
          left: width < 0 ? origX + width : origX,
          top: height < 0 ? origY + height : origY,
          width: Math.abs(width),
          height: Math.abs(height),
        });
        break;
        
      case 'circle':
        const radius = Math.sqrt(width * width + height * height) / 2;
        shape.set({
          radius: radius,
          left: origX - radius,
          top: origY - radius,
        });
        break;
    }
  };

  const addTradingTool = (toolType) => {
    const tool = tradingTools.find(t => t.id === toolType);
    if (!tool) return;

    const y = height / 2;
    let shape;

    switch (toolType) {
      case 'support':
      case 'resistance':
      case 'trendline':
        shape = new fabric.Line([50, y, width - 50, y], {
          stroke: tool.color,
          strokeWidth: 2,
          selectable: true,
          strokeDashArray: toolType === 'support' ? [5, 5] : undefined,
        });
        break;
        
      case 'channel':
        const line1 = new fabric.Line([50, y - 30, width - 50, y - 30], {
          stroke: tool.color,
          strokeWidth: 2,
        });
        const line2 = new fabric.Line([50, y + 30, width - 50, y + 30], {
          stroke: tool.color,
          strokeWidth: 2,
        });
        shape = new fabric.Group([line1, line2], {
          left: 50,
          top: y - 30,
        });
        break;
        
      case 'fibonacci':
        const levels = [0, 23.6, 38.2, 50, 61.8, 100];
        const fibLines = levels.map((level, index) => {
          const yPos = y - 60 + (index * 24);
          return new fabric.Line([100, yPos, width - 100, yPos], {
            stroke: tool.color,
            strokeWidth: 1,
            opacity: 0.7,
          });
        });
        
        const fibText = levels.map((level, index) => {
          const yPos = y - 60 + (index * 24);
          return new fabric.Text(`${level}%`, {
            left: 105,
            top: yPos - 8,
            fontSize: 12,
            fill: tool.color,
            selectable: false,
          });
        });
        
        shape = new fabric.Group([...fibLines, ...fibText], {
          left: 100,
          top: y - 60,
        });
        break;
    }

    if (shape) {
      canvas.add(shape);
      canvas.renderAll();
    }
  };

  const clearCanvas = () => {
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#FFFFFF';
      canvas.renderAll();
    }
  };

  const undo = () => {
    // Simple undo - remove last object
    if (canvas && canvas.getObjects().length > 0) {
      const objects = canvas.getObjects();
      canvas.remove(objects[objects.length - 1]);
      canvas.renderAll();
    }
  };

  const deleteSelected = () => {
    if (canvas) {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  const downloadCanvas = () => {
    if (canvas) {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
      });
      
      const link = document.createElement('a');
      link.download = `trading-chart-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
    }
  };

  const loadImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fabric.Image.fromURL(e.target.result, (img) => {
          img.scaleToWidth(width * 0.8);
          img.scaleToHeight(height * 0.8);
          img.center();
          canvas.add(img);
          canvas.renderAll();
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900">Drawing Tools</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTradingTools(!showTradingTools)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Trading Tools
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="Settings"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Tools */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
                selectedTool === tool.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
              title={tool.name}
            >
              <tool.icon className="h-4 w-4 mr-1" />
              {tool.name}
            </button>
          ))}
        </div>

        {/* Trading Tools */}
        {showTradingTools && (
          <div className="mb-4 p-3 bg-white rounded border border-gray-200">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Trading Analysis Tools</h4>
            <div className="flex flex-wrap gap-2">
              {tradingTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => addTradingTool(tool.id)}
                  className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: tool.color, color: tool.color }}
                >
                  {tool.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-3 bg-white rounded border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Brush Color */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Stroke Color</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-8 h-8 rounded border border-gray-300 shadow-sm"
                    style={{ backgroundColor: brushColor }}
                  />
                  <div className="flex flex-wrap gap-1">
                    {colorPresets.slice(0, 6).map((color) => (
                      <button
                        key={color}
                        onClick={() => setBrushColor(color)}
                        className="w-5 h-5 rounded border border-gray-300 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Brush Size */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Stroke Width: {brushSize}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Fill Color */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Fill</label>
                <select
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="transparent">Transparent</option>
                  <option value="#3B82F6">Blue</option>
                  <option value="#EF4444">Red</option>
                  <option value="#10B981">Green</option>
                  <option value="#F59E0B">Yellow</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={undo}
              className="flex items-center px-3 py-1 text-xs text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              title="Undo"
            >
              <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
              Undo
            </button>
            
            <button
              onClick={deleteSelected}
              className="flex items-center px-3 py-1 text-xs text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
              title="Delete Selected"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </button>
            
            <button
              onClick={clearCanvas}
              className="flex items-center px-3 py-1 text-xs text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              title="Clear All"
            >
              Clear All
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <label className="flex items-center px-3 py-1 text-xs text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer">
              <PhotoIcon className="h-4 w-4 mr-1" />
              Load Image
              <input
                type="file"
                accept="image/*"
                onChange={loadImage}
                className="hidden"
              />
            </label>
            
            <button
              onClick={downloadCanvas}
              className="flex items-center px-3 py-1 text-xs text-blue-600 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 transition-colors"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="p-4 bg-gray-100">
        <div className="bg-white rounded shadow-sm" style={{ width: width, height: height, margin: '0 auto' }}>
          <canvas
            ref={canvasRef}
            className="border border-gray-200 rounded"
          />
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas; 