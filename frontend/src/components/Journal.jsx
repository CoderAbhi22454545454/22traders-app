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
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [category, setCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const entriesPerPage = 20;

  // Helper function to get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    let dateFrom, dateTo;

    switch(dateFilter) {
      case 'today':
        dateFrom = new Date(now.setHours(0, 0, 0, 0));
        dateTo = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        dateFrom = weekStart;
        dateTo = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'custom':
        dateFrom = customDateFrom ? new Date(customDateFrom) : undefined;
        dateTo = customDateTo ? new Date(customDateTo) : undefined;
        break;
      default:
        dateFrom = undefined;
        dateTo = undefined;
    }

    return { dateFrom, dateTo };
  };

  // Fetch journal entries with pagination
  const fetchJournalEntries = async (page = 1, reset = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const { dateFrom, dateTo } = getDateRange();
      
      const options = {
        userId,
        page,
        limit: entriesPerPage,
        sortBy: sortBy === 'recent' ? '-createdAt' : 
                sortBy === 'oldest' ? 'createdAt' :
                sortBy === 'favorites' ? '-isFavorite' :
                sortBy === 'profitable' ? '-pnl' :
                sortBy === 'title' ? 'title' : '-createdAt',
        mood: filterTag !== 'all' ? filterTag : undefined,
        category: category !== 'all' ? category : undefined,
        search: searchTerm || undefined,
        dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
        dateTo: dateTo ? dateTo.toISOString() : undefined
      };

      const response = await journalApi.getJournalEntries(options);
      
      if (response.success) {
        const fetchedEntries = response.data.entries || [];
        
        // Debug: Log entry structure
        if (fetchedEntries.length > 0) {
          console.log('📝 Journal Entries Sample:', {
            firstEntry: fetchedEntries[0],
            totalEntries: fetchedEntries.length,
            hasPnL: fetchedEntries.filter(e => e.pnl !== null && e.pnl !== undefined).length,
            hasFavorites: fetchedEntries.filter(e => e.isFavorite).length,
            hasDrawings: fetchedEntries.filter(e => e.hasDrawing).length
          });
        }
        
        if (reset) {
          setEntries(fetchedEntries);
        } else {
          setEntries(prev => [...prev, ...fetchedEntries]);
        }
        
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
          setTotalEntries(response.data.pagination.totalEntries);
          setHasMore(response.data.pagination.hasNext);
          setCurrentPage(response.data.pagination.currentPage);
        } else {
          setTotalEntries(response.data.totalEntries || fetchedEntries.length || 0);
          setHasMore(false);
        }
      } else {
        setError(response.message || 'Failed to fetch journal entries');
        setEntries([]);
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      setError('Failed to load journal entries. Please try again.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch entries when filters change
  useEffect(() => {
    if (userId) {
      setCurrentPage(1);
      fetchJournalEntries(1, true);
    }
  }, [sortBy, filterTag, category, dateFilter, customDateFrom, customDateTo, searchTerm, userId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userId) {
        setCurrentPage(1);
        fetchJournalEntries(1, true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  // Format currency helper
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

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

  const allTags = [...new Set(entries.flatMap(entry => entry.tags || []))];
  
  // Calculate stats from current page entries
  const totalPnL = entries.reduce((sum, entry) => {
    const pnl = entry.pnl;
    if (pnl !== null && pnl !== undefined && !isNaN(pnl)) {
      return sum + parseFloat(pnl);
    }
    return sum;
  }, 0);
  
  const entriesWithPnL = entries.filter(e => {
    const pnl = e.pnl;
    return pnl !== null && pnl !== undefined && !isNaN(pnl);
  }).length;
  
  const totalWords = entries.reduce((sum, entry) => sum + (parseInt(entry.wordCount) || 0), 0);
  const totalReadingTime = entries.reduce((sum, entry) => sum + (parseInt(entry.readingTime) || 0), 0);
  const favoritesCount = entries.filter(e => e.isFavorite === true).length;
  const chartsCount = entries.filter(e => e.hasDrawing === true).length;

  if (loading && entries.length === 0) {
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpenIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Trading Journal
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Document insights • Track progress • Master your trading psychology
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-600" />
                  <span className={`font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalPnL)}
                  </span>
                  <span className="text-gray-500">P&L</span>
                </div>
              </div>
              
              <Link
                to="/journal/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              
              <div className="flex items-center space-x-2 flex-wrap">
                {/* Quick Date Filters */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                  <button
                    onClick={() => setDateFilter('all')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      dateFilter === 'all' 
                        ? 'bg-blue-600 text-white font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setDateFilter('today')}
                    className={`px-3 py-2 text-sm border-l border-gray-300 transition-colors ${
                      dateFilter === 'today' 
                        ? 'bg-blue-600 text-white font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateFilter('week')}
                    className={`px-3 py-2 text-sm border-l border-gray-300 transition-colors ${
                      dateFilter === 'week' 
                        ? 'bg-blue-600 text-white font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setDateFilter('month')}
                    className={`px-3 py-2 text-sm border-l border-gray-300 transition-colors ${
                      dateFilter === 'month' 
                        ? 'bg-blue-600 text-white font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Month
                  </button>
                </div>

                {/* Custom Date Range (shown when custom is selected) */}
                {dateFilter === 'custom' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="From"
                    />
                    <span className="text-gray-500 text-sm">to</span>
                    <input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="To"
                    />
                  </div>
                )}

                {/* Category Filter */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm shadow-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="analysis">Analysis</option>
                  <option value="psychology">Psychology</option>
                  <option value="strategy">Strategy</option>
                  <option value="review">Review</option>
                  <option value="lesson">Lesson</option>
                  <option value="idea">Idea</option>
                  <option value="other">Other</option>
                </select>

                {/* Mood Filter */}
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm shadow-sm"
                >
                  <option value="all">All Moods</option>
                  <option value="confident">Confident</option>
                  <option value="reflective">Reflective</option>
                  <option value="analytical">Analytical</option>
                  <option value="excited">Excited</option>
                  <option value="calm">Calm</option>
                  <option value="frustrated">Frustrated</option>
                  <option value="neutral">Neutral</option>
                </select>
                
                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm shadow-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="favorites">Favorites</option>
                  <option value="profitable">Most Profitable</option>
                  <option value="title">Alphabetical</option>
                </select>
                
                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    title="Grid view"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm border-l border-gray-300 transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    title="List view"
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Date Range Toggle */}
            {dateFilter !== 'custom' && (
              <button
                onClick={() => setDateFilter('custom')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
              >
                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                Custom Date Range
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Enhanced Stats with Trading Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Total Entries</p>
                <p className="text-3xl font-bold text-blue-900">{totalEntries}</p>
                <p className="text-xs text-blue-600 mt-2 font-medium">Showing {entries.length} on this page</p>
              </div>
              <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpenIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
          
          {/* <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-200 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Journal P&L</p>
                <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(totalPnL)}
                </p>
                <p className="text-xs text-green-600 mt-2 font-medium">
                  {entriesWithPnL > 0 ? `${entriesWithPnL} ${entriesWithPnL === 1 ? 'entry' : 'entries'} with P&L` : 'No P&L data'}
                </p>
              </div>
              <div className="h-14 w-14 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                <CurrencyDollarIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div> */}
          
          <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg border border-purple-200 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Reading Time</p>
                <p className="text-3xl font-bold text-purple-900">{totalReadingTime || 0}</p>
                <p className="text-xs text-purple-600 mt-2 font-medium">
                  {totalWords > 0 ? `${totalWords.toLocaleString()} words` : 'No content'}
                </p>
              </div>
              <div className="h-14 w-14 bg-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpenIcon className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>
          
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading journal entries</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => fetchJournalEntries(1, true)}
                  className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Try again →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Entries with Enhanced Trading UI */}
        {!loading && entries.length === 0 && !error ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
              <BookOpenIcon className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No journal entries found</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchTerm || filterTag !== 'all' || category !== 'all' || dateFilter !== 'all'
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
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {entries.map((entry) => (
              <div
                key={entry._id || entry.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-blue-400 transition-all duration-200 overflow-hidden group"
              >
                <div className="p-6">
                  {/* Header with P&L indicator */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {entry.title}
                        </h3>
                        {(entry.pnl !== null && entry.pnl !== undefined && !isNaN(entry.pnl)) && (
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap flex-shrink-0 ${
                            parseFloat(entry.pnl) >= 0 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {formatCurrency(entry.pnl)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-3 text-xs text-gray-600">
                        <div className="flex items-center space-x-1.5 bg-gray-50 px-2 py-1 rounded-md">
                          <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-500" />
                          <span className="font-medium">{new Date(entry.date || entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 bg-gray-50 px-2 py-1 rounded-md">
                          {getMoodIcon(entry.mood)}
                          <span className="capitalize font-medium">{entry.mood || 'neutral'}</span>
                        </div>
                        {entry.instruments && entry.instruments.length > 0 && (
                          <div className="flex items-center space-x-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                            <CurrencyDollarIcon className="h-3.5 w-3.5 text-blue-600" />
                            <span className="font-semibold text-blue-700">{entry.instruments.slice(0, 2).join(', ')}{entry.instruments.length > 2 ? '...' : ''}</span>
                          </div>
                        )}
                        {entry.readingTime && (
                          <div className="flex items-center space-x-1.5 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                            <BookOpenIcon className="h-3.5 w-3.5 text-purple-600" />
                            <span className="font-medium text-purple-700">{entry.readingTime} min</span>
                          </div>
                        )}
                        {entry.views !== undefined && entry.views > 0 && (
                          <div className="flex items-center space-x-1.5 bg-gray-50 px-2 py-1 rounded-md">
                            <EyeIcon className="h-3.5 w-3.5 text-gray-500" />
                            <span className="font-medium">{entry.views}</span>
                          </div>
                        )}
                        {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
                          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md border border-blue-100">✏️ Edited</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleFavorite(entry._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-4 p-1 rounded-lg hover:bg-red-50"
                      title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {entry.isFavorite ? (
                        <HeartSolid className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {getCleanPreviewText(entry.content, 150) || 'No content preview available...'}
                  </p>

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {entry.tags.slice(0, 5).map((tag, idx) => (
                        <span
                          key={tag || idx}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          #{tag}
                        </span>
                      ))}
                      {entry.tags.length > 5 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{entry.tags.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Features */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center flex-wrap gap-2 text-xs">
                      {entry.hasDrawing && (
                        <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg border border-green-200">
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                          <span className="font-medium">Chart</span>
                        </span>
                      )}
                      {entry.category && (
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                          entry.category === 'analysis' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          entry.category === 'psychology' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                          entry.category === 'strategy' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          entry.category === 'review' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          entry.category === 'lesson' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          entry.category === 'idea' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                        </span>
                      )}
                      {entry.template && entry.template !== 'custom' && (
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-200">
                          {entry.template.replace(/-/g, ' ')}
                        </span>
                      )}
                    </div>
                    
                    {/* Linked Trades Details */}
                    {entry.linkedTrades && entry.linkedTrades.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 space-y-2 border border-blue-200">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-blue-900 mb-2">
                          <ChartBarIcon className="h-4 w-4 text-blue-600" />
                          <span>Linked Trades ({entry.linkedTrades.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {entry.linkedTrades.slice(0, 3).map((trade, idx) => (
                            <Link
                              key={trade._id || idx}
                              to={`/trade/${trade._id}`}
                              className="flex items-center justify-between text-xs hover:bg-white rounded-md px-2.5 py-1.5 transition-colors border border-blue-100"
                            >
                              <span className="font-semibold text-gray-800">
                                {trade.instrument || 'Trade'}
                              </span>
                              <span className={`font-bold ${
                                (trade.pnl || 0) >= 0 ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {formatCurrency(trade.pnl)}
                              </span>
                            </Link>
                          ))}
                          {entry.linkedTrades.length > 3 && (
                            <div className="text-xs text-blue-600 text-center pt-1 font-medium">
                              +{entry.linkedTrades.length - 3} more trades
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Link
                      to={`/journal/${entry._id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1.5" />
                      Read Entry
                    </Link>
                    
                    <div className="flex items-center space-x-1">
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{((currentPage - 1) * entriesPerPage) + 1}</span> to <span className="font-medium">{Math.min(currentPage * entriesPerPage, totalEntries)}</span> of <span className="font-medium">{totalEntries}</span> entries
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchJournalEntries(currentPage - 1, true)}
                    disabled={currentPage === 1 || loading}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      currentPage === 1 || loading
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchJournalEntries(pageNum, true)}
                          disabled={loading}
                          className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => fetchJournalEntries(currentPage + 1, true)}
                    disabled={currentPage >= totalPages || loading}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      currentPage >= totalPages || loading
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Journal; 