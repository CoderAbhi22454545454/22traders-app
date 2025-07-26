import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { journalApi } from '../utils/journalApi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import TextAlign from '@tiptap/extension-text-align';
import HardBreak from '@tiptap/extension-hard-break';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import DrawingCanvas from './DrawingCanvas';
import JournalTemplates from './JournalTemplates';
import TradingSymbolSelector from './TradingSymbolSelector';
import { 
  BookOpenIcon,
  PencilSquareIcon,
  PhotoIcon,
  LinkIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  ChatBubbleBottomCenterTextIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  SparklesIcon,
  ChartBarIcon,
  TagIcon,
  CalendarDaysIcon,
  HeartIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  FireIcon,
  LightBulbIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  MinusIcon,
  PlusIcon,
  SwatchIcon,
  ArrowDownIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

const JournalEntry = ({ userId, mode = 'view' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [linkedTrades, setLinkedTrades] = useState([]);
  const [availableTrades, setAvailableTrades] = useState([]);
  const [showTradeSelector, setShowTradeSelector] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSymbolSelector, setShowSymbolSelector] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [mood, setMood] = useState('neutral');
  const [isFavorite, setIsFavorite] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Rich text editor with enhanced formatting options
  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({
        openOnClick: false,
      }),
      Image,
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Strike,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      HardBreak,
      HorizontalRule,
      Subscript,
      Superscript,
    ],
    content: '',
    editable: mode !== 'view',
    editorProps: {
      attributes: {
        class: 'journal-editor-content prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  // Sample data (replace with API calls)
  const sampleEntry = {
    id: '1',
    title: 'EUR/USD Breakout Analysis - Major Support Break',
    content: '<h2>📊 Market Overview</h2><p><strong>EUR/USD</strong> showed strong bullish momentum today with a clean breakout above the 1.0850 resistance level. The breakout was confirmed with increased volume and RSI momentum showing continuation potential.</p><h3>🔍 Technical Analysis</h3><ul><li><strong>Resistance Broken:</strong> 1.0850 (now becomes support)</li><li><strong>Next Target:</strong> 1.0920 psychological level</li><li><strong>Stop Loss:</strong> Below 1.0820 (30 pips risk)</li><li><strong>RSI:</strong> 65 - showing momentum but not overbought</li></ul><p>🎯 <strong>Setup:</strong> Entered long at 1.0855 with 30-pip stop and 60-pip target (1:2 R/R)</p><h3>💡 Key Lessons</h3><p>Patience paid off waiting for the proper breakout confirmation rather than jumping in early. The volume spike was the key confirmation signal.</p>',
    date: '2024-01-15',
    tags: ['eur-usd', 'breakout', 'technical', 'bullish', 'momentum'],
    mood: 'confident',
    isFavorite: true,
    hasDrawing: true,
    drawingData: null,
    linkedTrades: ['trade-123', 'trade-124'],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:22:00Z'
  };

  const sampleTrades = [
    { id: 'trade-123', instrument: 'EUR/USD', date: '2024-01-15', pnl: 150, result: 'win' },
    { id: 'trade-124', instrument: 'EUR/USD', date: '2024-01-15', pnl: -75, result: 'loss' },
    { id: 'trade-125', instrument: 'GBP/USD', date: '2024-01-15', pnl: 200, result: 'win' },
    { id: 'trade-126', instrument: 'Gold', date: '2024-01-14', pnl: 300, result: 'win' },
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load available trades first
        console.log('🔄 Loading available trades for journal linking...');
        const trades = await journalApi.getAvailableTrades();
        console.log('✅ Loaded trades:', trades);
        setAvailableTrades(trades);

        if (id && id !== 'new') {
          // Load existing entry
          const entryData = await journalApi.getJournalEntry(id);
          setEntry(entryData);
          setTitle(entryData.title);
          setTags(entryData.tags || []);
          setMood(entryData.mood);
          setIsFavorite(entryData.isFavorite);
          setDate(entryData.date);
          setLinkedTrades(entryData.linkedTrades?.map(trade => trade._id || trade) || []);
          
          if (editor) {
            editor.commands.setContent(entryData.content);
          }
        }
      } catch (error) {
        console.error('Failed to load journal entry or trades:', error);
        // Only fallback for journal entry data, not trades
        if (id && id !== 'new') {
          setEntry(sampleEntry);
          setTitle(sampleEntry.title);
          setTags(sampleEntry.tags);
          setMood(sampleEntry.mood);
          setIsFavorite(sampleEntry.isFavorite);
          setDate(sampleEntry.date);
          setLinkedTrades(sampleEntry.linkedTrades);
          
          if (editor) {
            editor.commands.setContent(sampleEntry.content);
          }
        }
        // Don't fallback to sample trades - let it remain empty if API fails
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, editor]);

  const moodOptions = [
    { value: 'confident', label: 'Confident', icon: FireIcon, color: 'text-green-500' },
    { value: 'reflective', label: 'Reflective', icon: LightBulbIcon, color: 'text-blue-500' },
    { value: 'analytical', label: 'Analytical', icon: ChartBarIcon, color: 'text-purple-500' },
    { value: 'excited', label: 'Excited', icon: SparklesIcon, color: 'text-yellow-500' },
    { value: 'calm', label: 'Calm', icon: AcademicCapIcon, color: 'text-indigo-500' },
    { value: 'frustrated', label: 'Frustrated', icon: XMarkIcon, color: 'text-red-500' },
  ];

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Validate entry data
      const entryData = {
        title,
        content: editor?.getHTML() || '',
        tags,
        mood,
        isFavorite,
        date,
        linkedTrades,
        hasDrawing: showDrawing,
        category: 'other', // Default category
        template: 'custom',
        drawingData: null, // Will be populated by DrawingCanvas
      };

      const validation = journalApi.validateEntryData(entryData);
      if (!validation.isValid) {
        alert('Please fix the following errors:\n' + validation.errors.join('\n'));
        setSaving(false);
        return;
      }

      let savedEntry;
      if (id && id !== 'new') {
        // Update existing entry
        savedEntry = await journalApi.updateJournalEntry(id, entryData);
        console.log('Entry updated successfully:', savedEntry);
      } else {
        // Create new entry
        savedEntry = await journalApi.createJournalEntry(entryData);
        console.log('Entry created successfully:', savedEntry);
      }

      setSaving(false);
      navigate('/journal');
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      alert('Failed to save journal entry. Please try again.');
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags([...tags, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleTradeLink = (tradeId) => {
    setLinkedTrades(prev => 
      prev.includes(tradeId)
        ? prev.filter(id => id !== tradeId)
        : [...prev, tradeId]
    );
  };

  const handleTemplateSelect = (templateData) => {
    setTitle(templateData.title);
    setTags(templateData.tags);
    setMood(templateData.mood || 'neutral');
    
    if (editor) {
      editor.commands.setContent(templateData.content);
    }
  };

  const handleSymbolInsert = (symbolText) => {
    if (editor) {
      editor.commands.insertContent(symbolText + ' ');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
          <div className="text-lg text-gray-600">Loading journal entry...</div>
        </div>
      </div>
    );
  }

  const isEditing = mode === 'edit' || id === 'new';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/journal"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {id === 'new' ? 'New Trading Journal Entry' : isEditing ? 'Edit Entry' : 'Journal Entry'}
                </h1>
                <p className="text-sm text-gray-600">
                  {isEditing ? 'Document your trading insights and analysis' : 'Reading mode'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="btn-secondary flex items-center"
                  >
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Templates
                  </button>
                  <button
                    onClick={() => navigate('/journal')}
                    className="btn-secondary"
                    disabled={saving}
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Save Entry
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to={`/journal/${id}/edit`}
                    className="btn-secondary"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {isFavorite ? (
                      <HeartSolid className="h-6 w-6 text-red-500" />
                    ) : (
                      <HeartIcon className="h-6 w-6" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title and Basic Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Entry title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-2xl font-bold border-none outline-none focus:ring-0 p-0 placeholder-gray-400 bg-transparent"
                  />
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 font-medium">Mood:</span>
                      <select
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {moodOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>{new Date(date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {moodOptions.find(m => m.value === mood)?.icon && (
                        React.createElement(moodOptions.find(m => m.value === mood).icon, {
                          className: `h-4 w-4 ${moodOptions.find(m => m.value === mood).color}`
                        })
                      )}
                      <span className="capitalize">{mood}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Editor Toolbar (only in edit mode) */}
            {isEditing && editor && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Trading-Specific Quick Actions */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 mr-2">Trading Tools:</span>
                    <button
                      onClick={() => setShowSymbolSelector(true)}
                      className="flex items-center px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                      Symbols
                    </button>
                    <button
                      onClick={() => editor.commands.insertContent('📊 **Market Analysis:** ')}
                      className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Analysis
                    </button>
                    <button
                      onClick={() => editor.commands.insertContent('🎯 **Trade Setup:** ')}
                      className="px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      Setup
                    </button>
                    <button
                      onClick={() => editor.commands.insertContent('💡 **Key Lesson:** ')}
                      className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                    >
                      Lesson
                    </button>
                    <button
                      onClick={() => editor.commands.insertContent('⚠️ **Risk Management:** ')}
                      className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Risk
                    </button>
                  </div>
                </div>
                
                {/* Main Formatting Toolbar */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex flex-wrap items-center gap-1">
                    {/* Text Formatting */}
                    <div className="flex items-center bg-gray-50 rounded-lg p-1">
                      <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Bold (Ctrl+B)"
                      >
                        <BoldIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Italic (Ctrl+I)"
                      >
                        <ItalicIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('underline') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Underline (Ctrl+U)"
                      >
                        <UnderlineIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('strike') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Strikethrough"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 mx-2"></div>

                    {/* Text Alignment */}
                    <div className="flex items-center bg-gray-50 rounded-lg p-1">
                      <button
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Align Left"
                      >
                        <Bars3BottomLeftIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Align Center"
                      >
                        <Bars3Icon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Align Right"
                      >
                        <Bars3BottomRightIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 mx-2"></div>

                    {/* Lists and Structure */}
                    <div className="flex items-center bg-gray-50 rounded-lg p-1">
                      <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('bulletList') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Bullet List"
                      >
                        <ListBulletIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('orderedList') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Numbered List"
                      >
                        <NumberedListIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('blockquote') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Blockquote"
                      >
                        <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 mx-2"></div>

                    {/* Special Characters */}
                    <div className="flex items-center bg-gray-50 rounded-lg p-1">
                      <button
                        onClick={() => editor.chain().focus().toggleSubscript().run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('subscript') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Subscript"
                      >
                        <span className="text-xs font-semibold">X₂</span>
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().toggleSuperscript().run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('superscript') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Superscript"
                      >
                        <span className="text-xs font-semibold">X²</span>
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Horizontal Line"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().setHardBreak().run()}
                        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Line Break"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 mx-2"></div>

                    {/* Text Styling */}
                    <div className="flex items-center bg-gray-50 rounded-lg p-1">
                      <button
                        onClick={() => {
                          const url = window.prompt('Enter URL:');
                          if (url) {
                            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                          }
                        }}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('link') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Add Link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('highlight') ? 'bg-yellow-100 text-yellow-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Highlight"
                      >
                        <PaintBrushIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        className={`p-2 rounded-md transition-colors ${editor.isActive('code') ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Inline Code"
                      >
                        <CodeBracketIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 mx-2"></div>

                    {/* Special Actions */}
                    <div className="flex items-center bg-gray-50 rounded-lg p-1">
                      <button
                        onClick={() => setShowDrawing(!showDrawing)}
                        className={`p-2 rounded-md flex items-center transition-colors ${showDrawing ? 'bg-green-100 text-green-600' : 'text-gray-600 hover:bg-gray-100'}`}
                        title="Chart Analysis"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Heading and Text Size Controls */}
                <div className="px-4 py-3 bg-gray-50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 mr-2">Text Style:</span>
                    
                    {/* Heading Buttons */}
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                      H1
                    </button>
                    
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                      H2
                    </button>
                    
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-purple-100 text-purple-700 font-bold' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                      H3
                    </button>
                    
                    <button
                      onClick={() => editor.chain().focus().setParagraph().run()}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive('paragraph') ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                      P
                    </button>

                    <div className="w-px h-6 bg-gray-300 mx-2"></div>

                    {/* Quick Text Colors */}
                    <span className="text-sm font-medium text-gray-700 mr-2">Colors:</span>
                    
                    <button
                      onClick={() => editor.chain().focus().resetColor().run()}
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 bg-white hover:border-gray-400 transition-colors"
                      title="Default Color"
                    >
                      <span className="text-xs">A</span>
                    </button>
                    
                    <button
                      onClick={() => editor.chain().focus().setColor('#ef4444').run()}
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 bg-red-500 hover:border-red-400 transition-colors"
                      title="Red"
                    ></button>
                    
                    <button
                      onClick={() => editor.chain().focus().setColor('#3b82f6').run()}
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 bg-blue-500 hover:border-blue-400 transition-colors"
                      title="Blue"
                    ></button>
                    
                    <button
                      onClick={() => editor.chain().focus().setColor('#10b981').run()}
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 bg-green-500 hover:border-green-400 transition-colors"
                      title="Green"
                    ></button>
                    
                    <button
                      onClick={() => editor.chain().focus().setColor('#f59e0b').run()}
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 bg-yellow-500 hover:border-yellow-400 transition-colors"
                      title="Yellow"
                    ></button>
                    
                    <button
                      onClick={() => editor.chain().focus().setColor('#8b5cf6').run()}
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 bg-purple-500 hover:border-purple-400 transition-colors"
                      title="Purple"
                    ></button>

                    <div className="w-px h-6 bg-gray-300 mx-2"></div>

                    {/* Utility Actions */}
                    <span className="text-sm font-medium text-gray-700 mr-2">Actions:</span>
                    
                    <button
                      onClick={() => editor.chain().focus().clearContent().run()}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="Clear All Content"
                    >
                      Clear
                    </button>
                    
                    <button
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().undo()}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Undo (Ctrl+Z)"
                    >
                      Undo
                    </button>
                    
                    <button
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().redo()}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Redo (Ctrl+Y)"
                    >
                      Redo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Content Editor */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6">
                <EditorContent 
                  editor={editor} 
                  className="journal-entry-content prose prose-lg prose-purple max-w-none min-h-[500px] focus:outline-none"
                />
              </div>
            </div>

            {/* Drawing Canvas */}
            {showDrawing && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <PencilSquareIcon className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-900">Chart Analysis & Drawing</h3>
                </div>
                <DrawingCanvas />
              </div>
            )}
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <TagIcon className="h-4 w-4 mr-1 text-purple-600" />
                Tags
              </h3>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800"
                    >
                      #{tag}
                      {isEditing && (
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-purple-600 hover:text-purple-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                
                {isEditing && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Linked Trades */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <ChartBarIcon className="h-4 w-4 mr-1 text-blue-600" />
                  Linked Trades
                </h3>
                {isEditing && (
                  <button
                    onClick={() => setShowTradeSelector(!showTradeSelector)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {showTradeSelector ? 'Done' : 'Link Trades'}
                  </button>
                )}
              </div>

              {showTradeSelector && isEditing && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                  {availableTrades.map((trade) => (
                    <label key={trade._id || trade.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={linkedTrades.includes(trade._id || trade.id)}
                        onChange={() => toggleTradeLink(trade._id || trade.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs">
                        <span className="font-medium">{trade.instrument || trade.tradePair}</span> - {new Date(trade.date).toLocaleDateString()} 
                        <span className={`ml-1 ${(trade.pnl || trade.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({(trade.pnl || trade.profit) >= 0 ? '+' : ''}${trade.pnl || trade.profit || 0})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {linkedTrades.length === 0 ? (
                  <p className="text-xs text-gray-500">No linked trades</p>
                ) : (
                  linkedTrades.map((tradeId) => {
                    const trade = availableTrades.find(t => (t._id || t.id) === tradeId);
                    return trade ? (
                      <div key={tradeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs">
                          <div className="font-medium text-gray-900">{trade.instrument || trade.tradePair}</div>
                          <div className="text-gray-500">{new Date(trade.date).toLocaleDateString()}</div>
                        </div>
                        <div className={`text-xs font-medium px-2 py-1 rounded ${
                          (trade.pnl || trade.profit) >= 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {(trade.pnl || trade.profit) >= 0 ? '+' : ''}${trade.pnl || trade.profit || 0}
                        </div>
                      </div>
                    ) : null;
                  })
                )}
              </div>
            </div>

            {/* Entry Stats (view mode only) */}
            {!isEditing && entry && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Entry Statistics</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                  {entry.updatedAt !== entry.createdAt && (
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span>{new Date(entry.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Word Count:</span>
                    <span>{editor?.storage.characterCount?.words() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Characters:</span>
                    <span>{editor?.storage.characterCount?.characters() || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Templates Modal */}
      {showTemplates && (
        <JournalTemplates
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
      
      {/* Symbol Selector Modal */}
      {showSymbolSelector && (
        <TradingSymbolSelector
          onSymbolSelect={handleSymbolInsert}
          onClose={() => setShowSymbolSelector(false)}
        />
      )}
    </div>
  );
};

export default JournalEntry; 