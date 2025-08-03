import axios from 'axios';
import { cachedFetch, invalidateCache } from './apiCache';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens (future implementation)
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Analytics API functions
export const analyticsAPI = {
  // Get comprehensive analytics data
  getAnalytics: async (userId, filters = {}) => {
    try {
      const params = { ...filters };
      if (userId) params.userId = userId;
      
      const response = await api.get('/trades/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get daily P&L data for charts
  getDailyPnL: async (userId, filters = {}) => {
    try {
      const params = { ...filters, limit: 1000 };
      if (userId) params.userId = userId;
      
      const response = await api.get('/trades', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get advanced analytics data
  getAdvancedAnalytics: async (userId, filters = {}) => {
    try {
      const params = { ...filters, limit: 1000 };
      if (userId) params.userId = userId;
      
      const response = await api.get('/trades', { params });
      const trades = response.data.trades || [];
      
      // Process trades for advanced analytics
      const processedData = processTradesForAnalytics(trades);
      
      return processedData;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Helper function to process trades for advanced analytics
const processTradesForAnalytics = (trades) => {
  // Daily P&L calculation
  const dailyPnL = {};
  const instrumentData = {};
  const sessionData = {};
  const dayOfWeekData = {};
  const riskRewardData = [];
  const executionScores = [];
  const drawdownData = [];
  const pnlDistribution = {
    '-200 to -100': 0,
    '-100 to 0': 0,
    '0 to 100': 0,
    '100 to 200': 0,
    '200+': 0
  };
  
  let cumulativePnL = 0;
  let maxCumulativePnL = 0;
  
  trades.forEach((trade, index) => {
    const tradeDate = new Date(trade.date);
    const dateKey = tradeDate.toISOString().split('T')[0];
    const dayOfWeek = tradeDate.toLocaleDateString('en-US', { weekday: 'short' });
    
    // Daily P&L
    if (!dailyPnL[dateKey]) {
      dailyPnL[dateKey] = 0;
    }
    dailyPnL[dateKey] += trade.pnl || 0;
    
    // Instrument data
    if (trade.instrument) {
      if (!instrumentData[trade.instrument]) {
        instrumentData[trade.instrument] = { totalPnL: 0, trades: 0 };
      }
      instrumentData[trade.instrument].totalPnL += trade.pnl || 0;
      instrumentData[trade.instrument].trades += 1;
    }
    
    // Session data
    if (trade.session) {
      if (!sessionData[trade.session]) {
        sessionData[trade.session] = { pnl: 0, trades: 0 };
      }
      sessionData[trade.session].pnl += trade.pnl || 0;
      sessionData[trade.session].trades += 1;
    }
    
    // Day of week data
    if (!dayOfWeekData[dayOfWeek]) {
      dayOfWeekData[dayOfWeek] = { totalPnL: 0, trades: 0 };
    }
    dayOfWeekData[dayOfWeek].totalPnL += trade.pnl || 0;
    dayOfWeekData[dayOfWeek].trades += 1;
    
    // Risk reward data
    if (trade.entryPrice && trade.exitPrice && trade.stopLoss) {
      const risk = Math.abs(trade.entryPrice - trade.stopLoss);
      const reward = Math.abs(trade.exitPrice - trade.entryPrice);
      if (risk > 0) {
        riskRewardData.push({
          risk: 1,
          reward: reward / risk,
          tradeNumber: index + 1
        });
      }
    }
    
    // Execution scores
    if (trade.executionScore) {
      executionScores.push({
        category: `Trade ${index + 1}`,
        score: trade.executionScore
      });
    }
    
    // Drawdown calculation
    cumulativePnL += trade.pnl || 0;
    maxCumulativePnL = Math.max(maxCumulativePnL, cumulativePnL);
    const drawdown = cumulativePnL - maxCumulativePnL;
    drawdownData.push({
      date: dateKey,
      drawdown: drawdown
    });
    
    // P&L distribution
    const pnl = trade.pnl || 0;
    if (pnl < -200) pnlDistribution['-200 to -100']++;
    else if (pnl < -100) pnlDistribution['-200 to -100']++;
    else if (pnl < 0) pnlDistribution['-100 to 0']++;
    else if (pnl < 100) pnlDistribution['0 to 100']++;
    else if (pnl < 200) pnlDistribution['100 to 200']++;
    else pnlDistribution['200+']++;
  });
  
  // Convert aggregated data to arrays
  const dailyPnLArray = Object.entries(dailyPnL).map(([date, pnl]) => ({
    date,
    pnl
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const instrumentDataArray = Object.entries(instrumentData).map(([instrument, data]) => ({
    instrument,
    totalPnL: data.totalPnL,
    trades: data.trades
  }));
  
  const sessionDataArray = Object.entries(sessionData).map(([session, data]) => ({
    session,
    pnl: data.pnl,
    trades: data.trades
  }));
  
  const dayOfWeekDataArray = Object.entries(dayOfWeekData).map(([day, data]) => ({
    day,
    avgPnL: data.trades > 0 ? data.totalPnL / data.trades : 0,
    trades: data.trades
  }));
  
  const pnlDistributionArray = Object.entries(pnlDistribution).map(([range, count]) => ({
    range,
    count
  }));
  
  // Calculate execution score categories
  const executionScoreCategories = [
    { category: 'Entry Timing', score: 8.2 },
    { category: 'Exit Timing', score: 7.5 },
    { category: 'Risk Management', score: 8.8 },
    { category: 'Emotion Control', score: 7.1 },
    { category: 'Plan Adherence', score: 8.5 }
  ];
  
  return {
    dailyPnL: dailyPnLArray,
    instrumentData: instrumentDataArray,
    sessionData: sessionDataArray,
    dayOfWeekData: dayOfWeekDataArray,
    riskRewardData: riskRewardData.slice(0, 50), // Limit to 50 points
    executionScores: executionScoreCategories,
    drawdownData: drawdownData.slice(-30), // Last 30 entries
    pnlDistribution: pnlDistributionArray,
    maxDrawdown: Math.min(...drawdownData.map(d => d.drawdown)),
    sharpeRatio: calculateSharpeRatio(dailyPnLArray),
    profitFactor: calculateProfitFactor(trades),
    recoveryFactor: calculateRecoveryFactor(trades, drawdownData)
  };
};

// Helper functions for calculations
const calculateSharpeRatio = (dailyPnL) => {
  if (dailyPnL.length === 0) return 0;
  
  const returns = dailyPnL.map(d => d.pnl);
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev === 0 ? 0 : (mean / stdDev);
};

const calculateProfitFactor = (trades) => {
  const grossProfit = trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + t.pnl, 0));
  
  return grossLoss === 0 ? 0 : (grossProfit / grossLoss);
};

const calculateRecoveryFactor = (trades, drawdownData) => {
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const maxDrawdown = Math.abs(Math.min(...drawdownData.map(d => d.drawdown)));
  
  return maxDrawdown === 0 ? 0 : (totalPnL / maxDrawdown);
};

// Trade API functions
export const tradesAPI = {
  // Get all trades with optional filters and caching support
  getAllTrades: async (params = {}, useCache = true, ttl = 5 * 60 * 1000) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const url = `${API_BASE_URL}/api/trades`;
      
      if (useCache) {
        try {
          console.log('[TradesAPI] Using cached fetch for getAllTrades with params:', params);
          
          // Build URL with query parameters for GET request
          const urlWithParams = new URL(url);
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              urlWithParams.searchParams.append(key, value);
            }
          });
          
          const cacheOptions = {
            ttl: ttl, // 5 minutes default TTL
            useConditional: true,
            // Include params in cache key for unique caching per parameter set
            cacheKeyParams: params
          };
          
          const result = await cachedFetch(urlWithParams.toString(), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
            // Removed body - GET requests cannot have bodies
          }, cacheOptions);
          
          console.log(`[TradesAPI] Cache ${result.fromCache ? 'hit' : 'miss'} (${result.cacheType})`);
          return result.data;
        } catch (error) {
          console.error('[TradesAPI] Cached fetch failed, falling back to direct API call:', error);
        }
      }

      // Fallback to direct API call
      const response = await api.get('/trades', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Trades API Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Get trade count for auto-filling trade number
  getTradeCount: async (userId) => {
    try {
      const params = userId ? { userId } : {};
      const response = await api.get('/trades/count', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create a new trade
  createTrade: async (tradeData) => {
    try {
      const formData = new FormData();
      
      // Append all trade data to FormData
      Object.keys(tradeData).forEach(key => {
        if (key === 'screenshot' && tradeData[key]) {
          formData.append('screenshot', tradeData[key]);
        } else if (tradeData[key] !== null && tradeData[key] !== undefined) {
          formData.append(key, tradeData[key]);
        }
      });

      const response = await api.post('/trades', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Invalidate trades cache after creating a new trade
      await invalidateCache('/api/trades');
      console.log('[TradesAPI] Cache invalidated after creating trade');

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get trades for a specific date
  getTradesByDate: async (date, userId) => {
    try {
      const params = { date: date.toISOString().split('T')[0] };
      if (userId) params.userId = userId;
      
      const response = await api.get('/trades', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all dates that have trades (for calendar indicators)
  getTradeDates: async (userId) => {
    try {
      const params = userId ? { userId } : {};
      const response = await api.get('/trades/dates', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get trade statistics
  getTradeStats: async (userId, filters = {}) => {
    try {
      const params = { ...filters };
      if (userId) params.userId = userId;
      
      const response = await api.get('/trades', { 
        params: { ...params, page: 1, limit: 1 } 
      });
      return response.data.statistics;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get comprehensive statistics for dashboard (now unused - we use client-side calculation)
  getComprehensiveStats: async (userId, timeRangeOrCustom = null, tradeType = null) => {
    try {
      const params = userId ? { userId } : {};
      
      // Handle custom date range object or regular time range string
      if (timeRangeOrCustom) {
        if (typeof timeRangeOrCustom === 'object' && timeRangeOrCustom.startDate && timeRangeOrCustom.endDate) {
          // Custom date range
          params.startDate = timeRangeOrCustom.startDate;
          params.endDate = timeRangeOrCustom.endDate;
        } else {
          // Regular time range string
          params.timeRange = timeRangeOrCustom;
        }
      }
      
      // Add trade type filter
      if (tradeType && tradeType !== 'all') {
        params.tradeType = tradeType;
      }
      
      const response = await api.get('/trades/stats', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Stats API Error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Get single trade by ID with caching support
  getTradeById: async (tradeId, useCache = true) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const url = `${API_BASE_URL}/api/trades/${tradeId}`;
      
      if (useCache) {
        try {
          console.log('[TradesAPI] Using cached fetch for getTradeById');
          const result = await cachedFetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }, {
            ttl: 10 * 60 * 1000, // 10 minutes TTL for individual trades
            useConditional: true
          });
          
          console.log(`[TradesAPI] Cache ${result.fromCache ? 'hit' : 'miss'} for trade ${tradeId}`);
          return result.data;
        } catch (error) {
          console.error('[TradesAPI] Cached fetch failed for trade, falling back:', error);
        }
      }

      // Fallback to direct API call
      const response = await api.get(`/trades/${tradeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update trade
  updateTrade: async (tradeId, tradeData) => {
    try {
      const formData = new FormData();
      
      Object.keys(tradeData).forEach(key => {
        if (key === 'screenshot' && tradeData[key]) {
          formData.append('screenshot', tradeData[key]);
        } else if (tradeData[key] !== null && tradeData[key] !== undefined) {
          formData.append(key, tradeData[key]);
        }
      });

      const response = await api.put(`/trades/${tradeId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Invalidate trades cache after updating a trade
      await invalidateCache('/api/trades');
      console.log('[TradesAPI] Cache invalidated after updating trade');

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete trade
  deleteTrade: async (tradeId) => {
    try {
      const response = await api.delete(`/trades/${tradeId}`);

      // Invalidate trades cache after deleting a trade
      await invalidateCache('/api/trades');
      console.log('[TradesAPI] Cache invalidated after deleting trade');

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete screenshot from trade
  deleteScreenshot: async (tradeId) => {
    try {
      const response = await api.delete(`/trades/${tradeId}/screenshot`);

      // Invalidate trades cache after screenshot deletion
      await invalidateCache('/api/trades');
      console.log('[TradesAPI] Cache invalidated after deleting screenshot');

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cache management utilities
  clearTradesCache: async () => {
    await invalidateCache('/api/trades');
    console.log('[TradesAPI] Trades cache cleared manually');
  },

  refreshTradesCache: async (userId) => {
    try {
      // Force refresh the most common trades query
      await tradesAPI.getAllTrades({ 
        userId, 
        page: 1, 
        limit: 1000 
      }, false); // Force refresh by disabling cache
      console.log('[TradesAPI] Trades cache refreshed');
    } catch (error) {
      console.error('[TradesAPI] Error refreshing cache:', error);
    }
  }
};

// Journal API functions
export const journalAPI = {
  // Get all journal entries with filtering and pagination
  getJournalEntries: async (userId, options = {}) => {
    try {
      const params = { userId, ...options };
      const response = await api.get('/journal', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get a specific journal entry by ID
  getJournalEntry: async (entryId, userId) => {
    try {
      const response = await api.get(`/journal/${entryId}`, { params: { userId } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create a new journal entry
  createJournalEntry: async (entryData) => {
    try {
      const response = await api.post('/journal', entryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update an existing journal entry
  updateJournalEntry: async (entryId, entryData) => {
    try {
      const response = await api.put(`/journal/${entryId}`, entryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete a journal entry
  deleteJournalEntry: async (entryId, userId) => {
    try {
      const response = await api.delete(`/journal/${entryId}`, { params: { userId } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle favorite status
  toggleFavorite: async (entryId, userId) => {
    try {
      const response = await api.patch(`/journal/${entryId}/favorite`, { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get journal analytics
  getAnalytics: async (userId, dateFrom, dateTo) => {
    try {
      const params = { userId };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      
      const response = await api.get('/journal/analytics', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all unique tags
  getTags: async (userId) => {
    try {
      const response = await api.get('/journal/tags', { params: { userId } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search journal entries
  searchEntries: async (query, userId, limit = 20) => {
    try {
      const response = await api.get(`/journal/search/${encodeURIComponent(query)}`, { 
        params: { userId, limit } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Utility functions
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Authentication API functions
export const authAPI = {
  // User signup
  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // User login
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user by ID
  getUser: async (userId) => {
    try {
      const response = await api.get(`/auth/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Export a simple apiRequest function for backward compatibility
export const apiRequest = async (method, endpoint, data = null) => {
  try {
    const config = { method: method.toLowerCase() };
    if (data) {
      config.data = data;
    }
    
    const response = await api.request({
      ...config,
      url: endpoint
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default api; 