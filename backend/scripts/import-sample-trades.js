const mongoose = require('mongoose');
const fs = require('fs');
const Trade = require('../models/Trade');

// Simple CSV parser function
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
      });
      data.push(row);
    }
  }
  
  return data;
}

async function importTrades() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-journal');
    console.log('✅ Connected to MongoDB');
    
    // Read CSV file
    const csvText = fs.readFileSync('./sample-trades.csv', 'utf8');
    const csvData = parseCSV(csvText);
    
    console.log(`📊 Found ${csvData.length} trades in CSV`);
    
    // Debug: Show first few rows
    if (csvData.length > 0) {
      console.log('🔍 Sample data from first row:');
      console.log('Headers:', Object.keys(csvData[0]));
      console.log('First row:', csvData[0]);
    }
    
    // Convert to Trade format
    const trades = csvData.map((row, index) => {
      try {
        const profit = parseFloat(row.profit || 0);
        const commission = parseFloat(row.commission || 0);
        const swap = parseFloat(row.swap || 0);
        const totalPnl = profit + commission + swap;
        
        // Parse date more carefully
        let tradeDate = new Date(row.openTime);
        if (isNaN(tradeDate.getTime())) {
          console.log(`⚠️  Row ${index + 1}: Invalid date '${row.openTime}', using current date`);
          tradeDate = new Date();
        }
        
        return {
          userId: new mongoose.Types.ObjectId('6862699656a3ced7b36b132b'),
          date: tradeDate,
          instrument: row.symbol,
          entryPrice: parseFloat(row.openPrice),
          exitPrice: parseFloat(row.closePrice),
          pnl: totalPnl,
          result: totalPnl > 0 ? 'win' : totalPnl < 0 ? 'loss' : 'be',
          direction: row.type === 'buy' ? 'Long' : 'Short',
          lotSize: parseFloat(row.lotSize),
          strategy: 'Imported Trade',
          session: 'London',
          executionScore: 7,
          emotions: 'Neutral',
          notes: `Imported from CSV - Profit: ${profit}, Commission: ${commission}, Swap: ${swap}`,
          screenshotUrl: ''
        };
      } catch (error) {
        console.error(`❌ Error processing row ${index + 1}:`, error.message);
        return null;
      }
    }).filter(trade => trade !== null);
    
    // Insert trades
    console.log('💾 Inserting trades into database...');
    const result = await Trade.insertMany(trades);
    
    console.log('🎉 Import completed successfully!');
    console.log(`✅ Imported ${result.length} trades`);
    
    // Verify import
    const totalTrades = await Trade.countDocuments();
    console.log(`📈 Total trades in database: ${totalTrades}`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Import error:', error.message);
    process.exit(1);
  }
}

importTrades(); 