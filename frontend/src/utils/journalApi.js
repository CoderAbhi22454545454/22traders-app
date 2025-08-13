import { journalAPI, tradesAPI, apiRequest } from './api';

const BASE_PATH = '/journal';

// Get the current user ID (in a real app, this would come from auth context)
// For now, using a mock user ID that matches the imported sample trades
const MOCK_USER_ID = '6862699656a3ced7b36b132b';

export const journalApi = {
  // Get all journal entries with filtering and pagination
  async getJournalEntries(options = {}) {
    const {
      limit = 1000, // Increased default limit to show all entries
      sortBy = '-createdAt',
      mood,
      category,
      isFavorite,
      tags,
      search,
      dateFrom,
      dateTo,
      hasDrawing,
      template
    } = options;

    const params = {
      limit,
      sortBy
    };

    // Add optional filters
    if (mood) params.mood = mood;
    if (category) params.category = category;
    if (typeof isFavorite === 'boolean') params.isFavorite = isFavorite;
    if (tags && tags.length > 0) params.tags = tags;
    if (search) params.search = search;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (hasDrawing) params.hasDrawing = hasDrawing;
    if (template) params.template = template;

    try {
      const response = await journalAPI.getJournalEntries(MOCK_USER_ID, params);
      return response;
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
      throw error;
    }
  },

  // Get a specific journal entry by ID
  async getJournalEntry(entryId) {
    try {
      const response = await journalAPI.getJournalEntry(entryId, MOCK_USER_ID);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch journal entry:', error);
      throw error;
    }
  },

  // Create a new journal entry
  async createJournalEntry(entryData) {
    try {
      const data = {
        userId: MOCK_USER_ID,
        ...entryData
      };
      
      const response = await journalAPI.createJournalEntry(data);
      return response.data;
    } catch (error) {
      console.error('Failed to create journal entry:', error);
      throw error;
    }
  },

  // Update an existing journal entry
  async updateJournalEntry(entryId, entryData) {
    try {
      const data = {
        userId: MOCK_USER_ID,
        ...entryData
      };
      
      const response = await journalAPI.updateJournalEntry(entryId, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update journal entry:', error);
      throw error;
    }
  },

  // Delete a journal entry
  async deleteJournalEntry(entryId) {
    try {
      const response = await journalAPI.deleteJournalEntry(entryId, MOCK_USER_ID);
      return response;
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
      throw error;
    }
  },

  // Toggle favorite status
  async toggleFavorite(entryId) {
    try {
      const response = await journalAPI.toggleFavorite(entryId, MOCK_USER_ID);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  },

  // Get journal analytics
  async getAnalytics(dateFrom, dateTo) {
    try {
      const params = new URLSearchParams({ userId: MOCK_USER_ID });
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await apiRequest('GET', `${BASE_PATH}/analytics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw error;
    }
  },

  // Get all unique tags
  async getTags() {
    try {
      const params = new URLSearchParams({ userId: MOCK_USER_ID });
      const response = await apiRequest('GET', `${BASE_PATH}/tags?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      throw error;
    }
  },

  // Search journal entries
  async searchEntries(query, limit = 20) {
    try {
      const params = new URLSearchParams({ 
        userId: MOCK_USER_ID,
        limit: limit.toString()
      });
      const response = await apiRequest('GET', `${BASE_PATH}/search/${encodeURIComponent(query)}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search entries:', error);
      throw error;
    }
  },

  // Upload drawing for journal entry
  async uploadDrawing(entryId, drawingFile, drawingData = null) {
    try {
      const formData = new FormData();
      formData.append('drawing', drawingFile);
      formData.append('userId', MOCK_USER_ID);
      if (drawingData) {
        formData.append('drawingData', JSON.stringify(drawingData));
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}${BASE_PATH}/${entryId}/drawing`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to upload drawing:', error);
      throw error;
    }
  },

     // Helper function to get available trades for linking
  async getAvailableTrades() {
    try {
      // Use the existing trades API to get all trades for the user
      // Fix: Pass userId as an object parameter, not a direct parameter
      const response = await tradesAPI.getAllTrades({ userId: MOCK_USER_ID });
      console.log('📊 API Response for available trades:', response);
      return response.trades || [];
    } catch (error) {
      console.error('Failed to fetch available trades:', error);
      // Return empty array if trades API fails
      return [];
    }
  },

  // Helper function to format journal entry for display
  formatEntryForDisplay(entry) {
    return {
      ...entry,
      formattedDate: new Date(entry.date).toLocaleDateString(),
      formattedCreatedAt: new Date(entry.createdAt).toLocaleDateString(),
      formattedUpdatedAt: new Date(entry.updatedAt).toLocaleDateString(),
      tagsString: entry.tags ? entry.tags.join(', ') : '',
      linkedTradesCount: entry.linkedTrades ? entry.linkedTrades.length : 0,
      hasContent: entry.content && entry.content.trim().length > 0,
      excerpt: entry.content ? 
        entry.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 
        'No content available'
    };
  },

  // Helper function to validate journal entry data
  validateEntryData(entryData) {
    const errors = [];

    if (!entryData.title || entryData.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (entryData.title && entryData.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    if (!entryData.content || entryData.content.trim().length === 0) {
      errors.push('Content is required');
    }

    if (entryData.tags && entryData.tags.some(tag => tag.length > 50)) {
      errors.push('Tags must be less than 50 characters each');
    }

    const validMoods = ['confident', 'reflective', 'analytical', 'excited', 'calm', 'frustrated', 'neutral'];
    if (entryData.mood && !validMoods.includes(entryData.mood)) {
      errors.push('Invalid mood value');
    }

    const validCategories = ['analysis', 'psychology', 'strategy', 'review', 'lesson', 'idea', 'other'];
    if (entryData.category && !validCategories.includes(entryData.category)) {
      errors.push('Invalid category value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default journalApi; 