import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { journalApi } from '../utils/journalApi';
import { 
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  TagIcon,
  ChartBarIcon,
  LightBulbIcon,
  HeartIcon,
  FireIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid';

const Journal = ({ userId }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Enhanced sample journal entries with trading-specific content
  // Using useMemo to prevent recreation on every render
  const sampleEntries = React.useMemo(() => [
    {
      id: '1',
      title: 'EUR/USD Breakout Analysis',
      content: 'Strong bullish breakout above 1.0850 resistance. Volume confirmation and RSI showing momentum...',
      date: '2024-01-15',
      tags: ['eur-usd', 'breakout', 'technical', 'bullish'],
      mood: 'confident',
      isFavorite: true,
      hasDrawing: true,
      linkedTrades: ['trade-123', 'trade-124'],
      createdAt: '2024-01-15T10:30:00Z',
      pnl: 250,
      instrument: 'EUR/USD'
    },
    {
      id: '2',
      title: 'Psychology Check - Managing FOMO',
      content: 'Noticed strong FOMO when Gold broke higher. Practiced discipline by sticking to my plan instead of chasing...',
      date: '2024-01-14',
      tags: ['psychology', 'discipline', 'gold', 'fomo'],
      mood: 'reflective',
      isFavorite: false,
      hasDrawing: false,
      linkedTrades: [],
      createdAt: '2024-01-14T16:45:00Z',
      pnl: null,
      instrument: 'GOLD'
    },
    {
      id: '3',
      title: 'Weekly Performance Review',
      content: 'This week: 8 trades, 60% win rate, +$450 profit. Need to work on position sizing for better R:R...',
      date: '2024-01-13',
      tags: ['review', 'performance', 'weekly', 'statistics'],
      mood: 'analytical',
      isFavorite: true,
      hasDrawing: true,
      linkedTrades: ['trade-120', 'trade-121', 'trade-122'],
      createdAt: '2024-01-13T18:20:00Z',
      pnl: 450,
      instrument: 'Multiple'
    },
    {
      id: '4',
      title: 'GBP/USD Setup - Failed Trade Analysis',
      content: 'Entered long on GBP/USD but got stopped out. Market structure was weak, should have waited for confirmation...',
      date: '2024-01-12',
      tags: ['gbp-usd', 'loss', 'analysis', 'lesson'],
      mood: 'frustrated',
      isFavorite: false,
      hasDrawing: true,
      linkedTrades: ['trade-119'],
      createdAt: '2024-01-12T14:15:00Z',
      pnl: -85,
      instrument: 'GBP/USD'
    }
  ], []);

  useEffect(() => {
    const fetchJournalEntries = async () => {
      setLoading(true);
      try {
        const options = {
          page,
          limit,
          sortBy,
          mood: filterTag !== 'all' && entries.some(e => e.mood === filterTag) ? filterTag : undefined,
          search: searchTerm || undefined
        };

        const response = await journalApi.getJournalEntries(options);
        
        if (response.success) {
          setEntries(response.data.entries);
        } else {
          console.error('Failed to fetch journal entries');
          // Fallback to sample data if API fails
          setEntries(sampleEntries);
        }
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        // Fallback to sample data if API fails
        setEntries(sampleEntries);
      } finally {
        setLoading(false);
      }
    };

    fetchJournalEntries();
  }, [page, limit, sortBy, filterTag, searchTerm]);

  const getMoodIcon = (mood) => {
    const moodIcons = {
      confident: <FireIcon className="h-4 w-4 text-green-500" />,
      reflective: <LightBulbIcon className="h-4 w-4 text-blue-500" />,
      analytical: <ChartBarIcon className="h-4 w-4 text-purple-500" />,
      excited: <HeartSolid className="h-4 w-4 text-red-500" />,
      calm: <AcademicCapIcon className="h-4 w-4 text-indigo-500" />,
      frustrated: <SparklesIcon className="h-4 w-4 text-orange-500" />
    };
    return moodIcons[mood] || <LightBulbIcon className="h-4 w-4 text-gray-400" />;
  };

  const getMoodColor = (mood) => {
    const colors = {
      confident: 'bg-green-50 text-green-700 border-green-200',
      reflective: 'bg-blue-50 text-blue-700 border-blue-200',
      analytical: 'bg-purple-50 text-purple-700 border-purple-200',
      excited: 'bg-red-50 text-red-700 border-red-200',
      calm: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      frustrated: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return colors[mood] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterTag === 'all' || entry.tags.includes(filterTag);
    
    return matchesSearch && matchesFilter;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'favorites':
        return b.isFavorite - a.isFavorite;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'profitable':
        return (b.pnl || 0) - (a.pnl || 0);
      default:
        return 0;
    }
  });

  const toggleFavorite = async (entryId) => {
    try {
      const result = await journalApi.toggleFavorite(entryId);
      setEntries(entries.map(entry => 
        entry._id === entryId 
          ? { ...entry, isFavorite: result.isFavorite }
          : entry
      ));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('Failed to update favorite status. Please try again.');
    }
  };

  const deleteEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await journalApi.deleteJournalEntry(entryId);
        setEntries(entries.filter(entry => entry._id !== entryId));
      } catch (error) {
        console.error('Failed to delete entry:', error);
        alert('Failed to delete journal entry. Please try again.');
      }
    }
  };

  // Helper function to strip HTML tags and get clean preview text
  const getCleanPreviewText = (htmlContent, maxLength = 150) => {
    if (!htmlContent || typeof htmlContent !== 'string') return '';
    
    // Remove HTML tags and replace common HTML entities
    let cleanText = htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace ampersands
      .replace(/&lt;/g, '<') // Replace less than
      .replace(/&gt;/g, '>') // Replace greater than
      .replace(/&quot;/g, '"') // Replace quotes
      .replace(/&#39;/g, "'") // Replace apostrophes
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing whitespace
    
    // Remove markdown-style formatting that might remain
    cleanText = cleanText
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/__(.*?)__/g, '$1') // Remove underline markdown
      .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough markdown
      .trim();
    
    // Truncate and add ellipsis if needed
    if (cleanText.length > maxLength) {
      return cleanText.substring(0, maxLength).trim() + '...';
    }
    
    return cleanText;
  };

  const allTags = [...new Set(entries.flatMap(entry => entry.tags))];
  const totalPnL = entries.reduce((sum, entry) => sum + (entry.pnl || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
          <div className="text-lg text-gray-600">Loading your trading journal...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header with Trading Theme */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpenIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Trading Journal
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Document insights • Track progress • Master your trading psychology
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                  <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                  <span className={`font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL}
                  </span>
                  <span className="text-gray-500">P&L</span>
                </div>
              </div>
              
              <Link
                to="/journal/new"
                className="btn-primary flex items-center shadow-lg hover:shadow-xl transition-shadow"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Entry
              </Link>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search entries, tags, instruments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="favorites">Favorites</option>
                  <option value="profitable">Most Profitable</option>
                  <option value="title">Alphabetical</option>
                </select>
                
                <div className="flex border border-gray-300 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-3 text-sm transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-3 text-sm border-l border-gray-300 transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Enhanced Stats with Trading Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
              </div>
              <BookOpenIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Journal P&L</p>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Charts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {entries.filter(e => e.hasDrawing).length}
                </p>
              </div>
              <PencilSquareIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favorites</p>
                <p className="text-2xl font-bold text-gray-900">
                  {entries.filter(e => e.isFavorite).length}
                </p>
              </div>
              <HeartSolid className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Entries with Enhanced Trading UI */}
        {sortedEntries.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
              <BookOpenIcon className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No journal entries found</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchTerm || filterTag !== 'all' 
                ? 'Try adjusting your search or filter criteria to find more entries.'
                : 'Start documenting your trading journey by creating your first journal entry.'
              }
            </p>
            <Link
              to="/journal/new"
              className="btn-primary inline-flex items-center text-lg px-8 py-4"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create First Entry
            </Link>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* Header with P&L indicator */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {entry.title}
                        </h3>
                        {entry.pnl !== null && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            entry.pnl >= 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {entry.pnl >= 0 ? '+' : ''}${entry.pnl}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <CalendarDaysIcon className="h-4 w-4" />
                          <span>{new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getMoodIcon(entry.mood)}
                          <span className="capitalize">{entry.mood}</span>
                        </div>
                        {entry.instrument && (
                          <div className="flex items-center space-x-1">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            <span className="font-medium">{entry.instrument}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleFavorite(entry._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                    >
                      {entry.isFavorite ? (
                        <HeartSolid className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {getCleanPreviewText(entry.content, 150) || 'No content preview available...'}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      {entry.hasDrawing && (
                        <span className="flex items-center space-x-1">
                          <PencilSquareIcon className="h-4 w-4 text-green-500" />
                          <span>Chart Analysis</span>
                        </span>
                      )}
                      {entry.linkedTrades.length > 0 && (
                        <span className="flex items-center space-x-1">
                          <ChartBarIcon className="h-4 w-4 text-blue-500" />
                          <span>{entry.linkedTrades.length} trades</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Link
                      to={`/journal/${entry._id}`}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Read Entry
                    </Link>
                    
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/journal/${entry._id}/edit`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                        title="Edit entry"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteEntry(entry._id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete entry"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Journal; 