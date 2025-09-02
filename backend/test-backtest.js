const mongoose = require('mongoose');
const Backtest = require('./models/Backtest');
require('dotenv').config();

// Test the Backtest model and basic functionality
async function testBacktestModule() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-journal');
    console.log('✅ Connected to MongoDB');

    // Test creating a backtest with custom chips
    const testBacktest = new Backtest({
      userId: new mongoose.Types.ObjectId(),
      date: new Date(),
      tradeNumber: 'BT-TEST-001',
      instrument: 'EURUSD',
      tradePair: 'EURUSD',
      entryPrice: 1.0850,
      exitPrice: 1.0900,
      stopLoss: 1.0800,
      takeProfit: 1.0950,
      pnl: 50.00,
      result: 'win',
      direction: 'Long',
      lotSize: 0.1,
      customChips: [
        {
          name: 'Strategy',
          value: 'Breakout',
          color: '#3B82F6',
          category: 'strategy'
        },
        {
          name: 'Timeframe',
          value: '1H',
          color: '#10B981',
          category: 'timeframe'
        },
        {
          name: 'Session',
          value: 'London',
          color: '#F59E0B',
          category: 'session'
        }
      ],
      patternIdentified: 'Support/Resistance Break',
      marketCondition: 'trending',
      confidence: 8,
      reasonForEntry: 'Clean breakout above resistance with volume confirmation',
      reasonForExit: 'Hit take profit target',
      whatWorked: 'Entry timing was perfect, pattern recognition was accurate',
      whatDidntWork: 'Could have used tighter stop loss',
      improvementAreas: 'Better risk management on similar setups',
      backtestNotes: 'Excellent example of breakout strategy execution'
    });

    // Test saving
    const savedBacktest = await testBacktest.save();
    console.log('✅ Backtest created successfully:', savedBacktest._id);

    // Test querying
    const foundBacktest = await Backtest.findById(savedBacktest._id);
    console.log('✅ Backtest retrieved successfully');

    // Test custom chip methods
    const strategyChips = foundBacktest.getChipsByCategory('strategy');
    console.log('✅ Strategy chips found:', strategyChips.length);

    // Test static method for unique chips
    const uniqueChips = await Backtest.getUniqueChips(foundBacktest.userId);
    console.log('✅ Unique chips query successful:', uniqueChips.length);

    // Test virtual field
    const calculatedRR = foundBacktest.calculatedRiskReward;
    console.log('✅ Calculated Risk:Reward:', calculatedRR);

    // Clean up test data
    await Backtest.findByIdAndDelete(savedBacktest._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All backtest model tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

// Run the test
testBacktestModule();
