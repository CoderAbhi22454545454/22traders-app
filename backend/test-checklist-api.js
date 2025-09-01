const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Test data
const testUserId = '507f1f77bcf86cd799439011'; // Replace with actual user ID
const testChecklist = {
  userId: testUserId,
  name: 'Sample Trading Checklist',
  description: 'A comprehensive checklist for quality trade setups',
  category: 'day-trading',
  isActive: true,
  isDefault: false,
  instruments: ['EURUSD', 'GBPUSD'],
  strategies: ['Breakout', 'Pullback'],
  items: [
    {
      title: 'Market Structure Analysis',
      description: 'Identify key support and resistance levels',
      isRequired: true,
      order: 1,
      category: 'technical',
      inputType: 'checkbox'
    },
    {
      title: 'Risk Management Check',
      description: 'Verify position size and stop loss placement',
      isRequired: true,
      order: 2,
      category: 'risk-management',
      inputType: 'checkbox'
    },
    {
      title: 'Entry Confirmation',
      description: 'Wait for price action confirmation',
      isRequired: false,
      order: 3,
      category: 'execution',
      inputType: 'text'
    },
    {
      title: 'Risk-Reward Ratio',
      description: 'Calculate and verify minimum 1:2 risk-reward',
      isRequired: true,
      order: 4,
      category: 'risk-management',
      inputType: 'number'
    },
    {
      title: 'Market Session',
      description: 'Select the appropriate trading session',
      isRequired: false,
      order: 5,
      category: 'execution',
      inputType: 'select',
      options: [
        { label: 'London Session', value: 'london' },
        { label: 'New York Session', value: 'ny' },
        { label: 'Asian Session', value: 'asian' },
        { label: 'Overlap Session', value: 'overlap' }
      ]
    }
  ]
};

async function testChecklistAPI() {
  console.log('🧪 Testing Trade Checklist API...\n');

  try {
    // Test 1: Create a new checklist
    console.log('1. Creating new checklist...');
    const createResponse = await axios.post(`${API_BASE_URL}/checklists`, testChecklist);
    const checklistId = createResponse.data.checklist._id;
    console.log('✅ Checklist created successfully:', createResponse.data.checklist.name);
    console.log('   ID:', checklistId);
    console.log('   Items:', createResponse.data.checklist.items.length);
    console.log('');

    // Test 2: Get all checklists
    console.log('2. Fetching all checklists...');
    const getAllResponse = await axios.get(`${API_BASE_URL}/checklists?userId=${testUserId}`);
    console.log('✅ Found', getAllResponse.data.checklists.length, 'checklists');
    console.log('');

    // Test 3: Get specific checklist
    console.log('3. Fetching specific checklist...');
    const getOneResponse = await axios.get(`${API_BASE_URL}/checklists/${checklistId}`);
    console.log('✅ Retrieved checklist:', getOneResponse.data.checklist.name);
    console.log('');

    // Test 4: Update checklist
    console.log('4. Updating checklist...');
    const updateData = {
      ...testChecklist,
      name: 'Updated Trading Checklist',
      description: 'Updated description for the checklist'
    };
    const updateResponse = await axios.put(`${API_BASE_URL}/checklists/${checklistId}`, updateData);
    console.log('✅ Checklist updated successfully:', updateResponse.data.checklist.name);
    console.log('');

    // Test 5: Duplicate checklist
    console.log('5. Duplicating checklist...');
    const duplicateResponse = await axios.post(`${API_BASE_URL}/checklists/${checklistId}/duplicate`);
    const duplicatedId = duplicateResponse.data.checklist._id;
    console.log('✅ Checklist duplicated successfully:', duplicateResponse.data.checklist.name);
    console.log('   New ID:', duplicatedId);
    console.log('');

    // Test 6: Create a test trade for checklist results
    console.log('6. Creating test trade...');
    const testTrade = {
      userId: testUserId,
      date: new Date().toISOString(),
      instrument: 'EURUSD',
      direction: 'Long',
      entryPrice: 1.0850,
      exitPrice: 1.0870,
      pnl: 20,
      result: 'win',
      strategy: 'Breakout',
      lotSize: 0.1
    };
    const tradeResponse = await axios.post(`${API_BASE_URL}/trades`, testTrade);
    const tradeId = tradeResponse.data.trade._id;
    console.log('✅ Test trade created successfully:', tradeResponse.data.trade.instrument);
    console.log('   Trade ID:', tradeId);
    console.log('');

    // Test 7: Create checklist result
    console.log('7. Creating checklist result...');
    const testResult = {
      userId: testUserId,
      tradeId: tradeId,
      checklistId: checklistId,
      items: [
        {
          itemId: getOneResponse.data.checklist.items[0]._id,
          title: 'Market Structure Analysis',
          isCompleted: true,
          value: null,
          notes: 'Key levels identified at 1.0850 and 1.0870',
          order: 1
        },
        {
          itemId: getOneResponse.data.checklist.items[1]._id,
          title: 'Risk Management Check',
          isCompleted: true,
          value: null,
          notes: 'Stop loss placed at 1.0830, position size 0.1 lots',
          order: 2
        },
        {
          itemId: getOneResponse.data.checklist.items[2]._id,
          title: 'Entry Confirmation',
          isCompleted: true,
          value: null,
          notes: 'Price broke above resistance with strong momentum',
          order: 3
        },
        {
          itemId: getOneResponse.data.checklist.items[3]._id,
          title: 'Risk-Reward Ratio',
          isCompleted: true,
          value: '2.5',
          notes: 'Risk: 20 pips, Reward: 50 pips = 1:2.5 ratio',
          order: 4
        },
        {
          itemId: getOneResponse.data.checklist.items[4]._id,
          title: 'Market Session',
          isCompleted: true,
          value: 'london',
          notes: 'Trade taken during London session overlap',
          order: 5
        }
      ],
      overallNotes: 'Excellent setup with all criteria met. Strong market structure and proper risk management.',
      qualityScore: 9,
      isCompleted: true
    };
    const resultResponse = await axios.post(`${API_BASE_URL}/checklists/results`, testResult);
    console.log('✅ Checklist result created successfully');
    console.log('   Completion:', resultResponse.data.result.completionPercentage + '%');
    console.log('   Quality Score:', resultResponse.data.result.qualityScore);
    console.log('');

    // Test 8: Get checklist results for trade
    console.log('8. Fetching checklist results for trade...');
    const tradeResultsResponse = await axios.get(`${API_BASE_URL}/checklists/results/trade/${tradeId}`);
    console.log('✅ Retrieved checklist result for trade');
    console.log('   Checklist:', tradeResultsResponse.data.result.checklistName);
    console.log('   Items completed:', tradeResultsResponse.data.result.completedItems);
    console.log('');

    // Test 9: Get all checklist results
    console.log('9. Fetching all checklist results...');
    const allResultsResponse = await axios.get(`${API_BASE_URL}/checklists/results/all?userId=${testUserId}`);
    console.log('✅ Retrieved', allResultsResponse.data.results.length, 'checklist results');
    console.log('');

    // Test 10: Get results for specific checklist
    console.log('10. Fetching results for specific checklist...');
    const checklistResultsResponse = await axios.get(`${API_BASE_URL}/checklists/${checklistId}/results`);
    console.log('✅ Retrieved', checklistResultsResponse.data.results.length, 'results for checklist');
    console.log('');

    console.log('🎉 All API tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Checklists: Created, retrieved, updated, duplicated');
    console.log('   - Results: Created and retrieved for trades');
    console.log('   - All endpoints working correctly');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Run the test
testChecklistAPI(); 