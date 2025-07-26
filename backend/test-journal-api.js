#!/usr/bin/env node

/**
 * Journal API Test Script
 * 
 * This script demonstrates how to use the Journal API endpoints.
 * Make sure the server is running on http://localhost:5001 before running this script.
 * 
 * Usage: node test-journal-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/journal';
const TEST_USER_ID = '507f1f77bcf86cd799439011'; // Mock user ID

// Test data
const sampleJournalEntry = {
  userId: TEST_USER_ID,
  title: 'EUR/USD Breakout Analysis - API Test',
  content: `
    <h2>📊 Market Overview</h2>
    <p><strong>EUR/USD</strong> showed strong bullish momentum today with a clean breakout above the 1.0850 resistance level.</p>
    
    <h3>🔍 Technical Analysis</h3>
    <ul>
      <li><strong>Resistance Broken:</strong> 1.0850 (now becomes support)</li>
      <li><strong>Next Target:</strong> 1.0920 psychological level</li>
      <li><strong>Stop Loss:</strong> Below 1.0820 (30 pips risk)</li>
      <li><strong>RSI:</strong> 65 - showing momentum but not overbought</li>
    </ul>
    
    <h3>💡 Key Lessons</h3>
    <p>Patience paid off waiting for the proper breakout confirmation rather than jumping in early.</p>
  `,
  date: new Date().toISOString(),
  mood: 'confident',
  tags: ['eur-usd', 'breakout', 'technical', 'api-test'],
  isFavorite: true,
  category: 'analysis',
  template: 'technical-analysis',
  hasDrawing: false,
  instruments: ['EUR/USD'],
  pnl: 150.75,
  tradeSetups: [
    {
      instrument: 'EUR/USD',
      direction: 'long',
      entryPrice: 1.0855,
      exitPrice: 1.0895,
      stopLoss: 1.0825,
      takeProfit: 1.0920,
      riskReward: 2.0,
      lotSize: 1.0
    }
  ]
};

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, params = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      params,
      timeout: 10000
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status} - ${error.response.data.message}`);
      if (error.response.data.errors) {
        error.response.data.errors.forEach(err => {
          console.error(`   - ${err.field}: ${err.message}`);
        });
      }
    } else {
      console.error(`❌ Network Error: ${error.message}`);
    }
    return null;
  }
}

// Test functions
async function testCreateJournalEntry() {
  console.log('\n🧪 Testing: Create Journal Entry');
  console.log('===============================');
  
  const result = await apiRequest('POST', '', sampleJournalEntry);
  
  if (result && result.success) {
    console.log('✅ Journal entry created successfully');
    console.log(`   ID: ${result.data._id}`);
    console.log(`   Title: ${result.data.title}`);
    console.log(`   Word Count: ${result.data.wordCount}`);
    console.log(`   Reading Time: ${result.data.readingTime} minutes`);
    return result.data._id;
  }
  
  console.log('❌ Failed to create journal entry');
  return null;
}

async function testGetJournalEntries() {
  console.log('\n🧪 Testing: Get Journal Entries');
  console.log('===============================');
  
  const result = await apiRequest('GET', '', null, {
    userId: TEST_USER_ID,
    page: 1,
    limit: 5,
    sortBy: '-createdAt'
  });
  
  if (result && result.success) {
    console.log('✅ Journal entries retrieved successfully');
    console.log(`   Total Entries: ${result.data.pagination.totalEntries}`);
    console.log(`   Current Page: ${result.data.pagination.currentPage}`);
    console.log(`   Entries in Response: ${result.data.entries.length}`);
    
    result.data.entries.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.title} (${entry.mood}, ${entry.tags.length} tags)`);
    });
    
    return result.data.entries;
  }
  
  console.log('❌ Failed to get journal entries');
  return [];
}

async function testGetJournalEntry(entryId) {
  if (!entryId) {
    console.log('\n⏭️  Skipping: Get Specific Journal Entry (no entry ID)');
    return;
  }

  console.log('\n🧪 Testing: Get Specific Journal Entry');
  console.log('=====================================');
  
  const result = await apiRequest('GET', `/${entryId}`, null, {
    userId: TEST_USER_ID
  });
  
  if (result && result.success) {
    console.log('✅ Journal entry retrieved successfully');
    console.log(`   ID: ${result.data._id}`);
    console.log(`   Title: ${result.data.title}`);
    console.log(`   Views: ${result.data.views}`);
    console.log(`   Version: ${result.data.version}`);
    console.log(`   Linked Trades: ${result.data.linkedTrades.length}`);
  } else {
    console.log('❌ Failed to get journal entry');
  }
}

async function testUpdateJournalEntry(entryId) {
  if (!entryId) {
    console.log('\n⏭️  Skipping: Update Journal Entry (no entry ID)');
    return;
  }

  console.log('\n🧪 Testing: Update Journal Entry');
  console.log('===============================');
  
  const updateData = {
    userId: TEST_USER_ID,
    title: 'EUR/USD Breakout Analysis - UPDATED via API',
    tags: ['eur-usd', 'breakout', 'technical', 'api-test', 'updated'],
    mood: 'analytical',
    pnl: 175.25
  };
  
  const result = await apiRequest('PUT', `/${entryId}`, updateData);
  
  if (result && result.success) {
    console.log('✅ Journal entry updated successfully');
    console.log(`   New Title: ${result.data.title}`);
    console.log(`   New Mood: ${result.data.mood}`);
    console.log(`   New P&L: ${result.data.pnl}`);
    console.log(`   Version: ${result.data.version}`);
    console.log(`   Tags: ${result.data.tags.join(', ')}`);
  } else {
    console.log('❌ Failed to update journal entry');
  }
}

async function testToggleFavorite(entryId) {
  if (!entryId) {
    console.log('\n⏭️  Skipping: Toggle Favorite (no entry ID)');
    return;
  }

  console.log('\n🧪 Testing: Toggle Favorite Status');
  console.log('=================================');
  
  const result = await apiRequest('PATCH', `/${entryId}/favorite`, {
    userId: TEST_USER_ID
  });
  
  if (result && result.success) {
    console.log('✅ Favorite status toggled successfully');
    console.log(`   Is Favorite: ${result.data.isFavorite}`);
  } else {
    console.log('❌ Failed to toggle favorite status');
  }
}

async function testGetAnalytics() {
  console.log('\n🧪 Testing: Get Journal Analytics');
  console.log('=================================');
  
  const result = await apiRequest('GET', '/analytics', null, {
    userId: TEST_USER_ID
  });
  
  if (result && result.success) {
    console.log('✅ Analytics retrieved successfully');
    console.log(`   Total Entries: ${result.data.totalEntries}`);
    console.log(`   Total Words: ${result.data.totalWords}`);
    console.log(`   Average Words: ${result.data.averageWords}`);
    console.log(`   Total Reading Time: ${result.data.totalReadingTime} minutes`);
    console.log(`   Favorite Entries: ${result.data.favoriteEntries}`);
    console.log(`   Entries with Drawings: ${result.data.entriesWithDrawings}`);
    console.log(`   Total P&L: $${result.data.totalPnL}`);
    
    console.log('   Mood Distribution:');
    Object.entries(result.data.moodDistribution).forEach(([mood, count]) => {
      console.log(`     - ${mood}: ${count}`);
    });
    
    console.log('   Top Tags:');
    result.data.topTags.slice(0, 5).forEach((tag, index) => {
      console.log(`     ${index + 1}. ${tag.tag}: ${tag.count}`);
    });
  } else {
    console.log('❌ Failed to get analytics');
  }
}

async function testGetTags() {
  console.log('\n🧪 Testing: Get All Tags');
  console.log('========================');
  
  const result = await apiRequest('GET', '/tags', null, {
    userId: TEST_USER_ID
  });
  
  if (result && result.success) {
    console.log('✅ Tags retrieved successfully');
    console.log(`   Total Tags: ${result.data.length}`);
    console.log(`   Tags: ${result.data.join(', ')}`);
  } else {
    console.log('❌ Failed to get tags');
  }
}

async function testSearch() {
  console.log('\n🧪 Testing: Search Journal Entries');
  console.log('==================================');
  
  const result = await apiRequest('GET', '/search/EUR%20USD', null, {
    userId: TEST_USER_ID,
    limit: 5
  });
  
  if (result && result.success) {
    console.log('✅ Search completed successfully');
    console.log(`   Results Found: ${result.data.length}`);
    
    result.data.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.title} (${entry.mood})`);
    });
  } else {
    console.log('❌ Failed to search entries');
  }
}

async function testDeleteJournalEntry(entryId) {
  if (!entryId) {
    console.log('\n⏭️  Skipping: Delete Journal Entry (no entry ID)');
    return;
  }

  console.log('\n🧪 Testing: Delete Journal Entry');
  console.log('===============================');
  console.log('⚠️  This will delete the test entry created earlier');
  
  // Uncomment the next line if you want to actually delete the test entry
  // const result = await apiRequest('DELETE', `/${entryId}`, null, { userId: TEST_USER_ID });
  
  console.log('🔒 Delete test skipped (uncomment in code to enable)');
  console.log('   This prevents accidental deletion during testing');
  
  // Uncomment these lines too if you enable deletion
  // if (result && result.success) {
  //   console.log('✅ Journal entry deleted successfully');
  // } else {
  //   console.log('❌ Failed to delete journal entry');
  // }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Journal API Tests');
  console.log('==============================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User ID: ${TEST_USER_ID}`);
  
  try {
    // Test creating a journal entry
    const createdEntryId = await testCreateJournalEntry();
    
    // Test getting journal entries
    const entries = await testGetJournalEntries();
    
    // Use created entry ID or first entry from list
    const testEntryId = createdEntryId || (entries.length > 0 ? entries[0]._id : null);
    
    // Test getting specific entry
    await testGetJournalEntry(testEntryId);
    
    // Test updating entry
    await testUpdateJournalEntry(testEntryId);
    
    // Test toggling favorite
    await testToggleFavorite(testEntryId);
    
    // Test analytics
    await testGetAnalytics();
    
    // Test getting tags
    await testGetTags();
    
    // Test search
    await testSearch();
    
    // Test delete (currently disabled for safety)
    await testDeleteJournalEntry(testEntryId);
    
    console.log('\n🎉 All tests completed!');
    console.log('======================');
    console.log('Check the results above to see if all APIs are working correctly.');
    
  } catch (error) {
    console.error('\n💥 Test runner failed:', error.message);
  }
}

// Check if axios is available
if (typeof axios === 'undefined') {
  console.error('❌ axios is required to run this test script');
  console.log('Install it with: npm install axios');
  process.exit(1);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(() => {
    console.log('\n👋 Test script finished. Press Ctrl+C to exit if the process hangs.');
  }).catch((error) => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  apiRequest,
  BASE_URL,
  TEST_USER_ID
}; 