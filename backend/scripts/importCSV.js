const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();
const Trade = require('../models/Trade');

// 🔧 Configuration
const CSV_FILE_PATH = path.join(__dirname, '01_01_2007-30_06_2025.csv'); // Update this path to your actual CSV file
const USER_ID = new mongoose.Types.ObjectId("6862699656a3ced7b36b132b"); // Replace with actual user ID
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-journal';

// 📊 Statistics tracking
let totalProcessed = 0;
let totalValid = 0;
let totalErrors = 0;
const errors = [];

/**
 * 🔍 Validate a trade record before insertion
 */
function validateTrade(trade) {
  const requiredFields = ['instrument', 'entryPrice', 'exitPrice', 'pnl', 'result', 'direction', 'lotSize', 'strategy', 'session', 'executionScore'];
  
  for (const field of requiredFields) {
    if (trade[field] === undefined || trade[field] === null || trade[field] === '') {
      return `Missing required field: ${field}`;
    }
  }
  
  // Validate enum values
  if (!['win', 'loss', 'be'].includes(trade.result)) {
    return `Invalid result value: ${trade.result}. Must be 'win', 'loss', or 'be'`;
  }
  
  if (!['Long', 'Short'].includes(trade.direction)) {
    return `Invalid direction value: ${trade.direction}. Must be 'Long' or 'Short'`;
  }
  
  if (!['London', 'NY', 'Asian', 'Overlap'].includes(trade.session)) {
    return `Invalid session value: ${trade.session}. Must be 'London', 'NY', 'Asian', or 'Overlap'`;
  }
  
  // Validate numeric ranges
  if (trade.entryPrice <= 0) return 'Entry price must be greater than 0';
  if (trade.exitPrice <= 0) return 'Exit price must be greater than 0';
  if (trade.lotSize < 0.01) return 'Lot size must be at least 0.01';
  if (trade.executionScore < 1 || trade.executionScore > 10) return 'Execution score must be between 1 and 10';
  
  return null; // Valid
}

/**
 * 🗂️ Map CSV row to Trade model fields
 */
function mapCsvToTrade(row) {
  try {
    // Parse date from opening_time_utc
    let parsedDate;
    const dateStr = row["opening_time_utc"] || row["Date"] || row["date"] || row["DATE"];
    
    if (dateStr) {
      // Handle UTC timestamp format (2025-06-30T07:22:32.956000)
      if (dateStr.includes('T')) {
        parsedDate = new Date(dateStr);
      } else if (dateStr.includes('/')) {
        // Handle MM/DD/YYYY or DD/MM/YYYY format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          // Assume MM/DD/YYYY format
          parsedDate = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
        }
      } else if (dateStr.includes('-')) {
        // Handle YYYY-MM-DD format
        parsedDate = new Date(dateStr);
      } else {
        parsedDate = new Date(dateStr);
      }
      
      // Fallback to current date if parsing fails
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }
    } else {
      parsedDate = new Date();
    }
    
    // Parse direction from type field (buy/sell)
    let direction = '';
    const typeStr = (row["type"] || row["Direction"] || row["direction"] || '').toString().toLowerCase().trim();
    if (typeStr === 'buy') {
      direction = 'Long';
    } else if (typeStr === 'sell') {
      direction = 'Short';
    } else {
      direction = typeStr; // fallback
    }
    
    // Calculate PnL from profit_usd minus commission and swap
    const profitUsd = parseFloat(row["profit_usd"] || 0);
    const commissionUsd = parseFloat(row["commission_usd"] || 0);
    const swapUsd = parseFloat(row["swap_usd"] || 0);
    const totalPnl = profitUsd + commissionUsd + swapUsd; // Commission and swap are usually negative
    
    // Determine session based on opening time (rough approximation)
    let session = 'London'; // default
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      const hour = parsedDate.getUTCHours();
      if (hour >= 0 && hour < 8) {
        session = 'Asian';
      } else if (hour >= 8 && hour < 13) {
        session = 'London';
      } else if (hour >= 13 && hour < 22) {
        session = 'NY';
      } else {
        session = 'Overlap';
      }
    }
    
    // Determine strategy based on close_reason
    let strategy = 'General';
    const closeReason = (row["close_reason"] || '').toString().toLowerCase().trim();
    if (closeReason === 'sl') {
      strategy = 'Stop Loss';
    } else if (closeReason === 'tp') {
      strategy = 'Take Profit';
    } else if (closeReason === 'user') {
      strategy = 'Manual Close';
    }
    
    // Map CSV columns to Trade model fields
    const trade = {
      userId: USER_ID,
      date: parsedDate,
      instrument: (row["symbol"] || row["Symbol"] || row["SYMBOL"] || row["Instrument"] || row["instrument"] || '').toString().trim(),
      entryPrice: parseFloat(row["opening_price"] || row["Entry"] || row["entry"] || row["ENTRY"] || row["EntryPrice"] || row["entryPrice"] || 0),
      exitPrice: parseFloat(row["closing_price"] || row["Exit"] || row["exit"] || row["EXIT"] || row["ExitPrice"] || row["exitPrice"] || 0),
      pnl: totalPnl || parseFloat(row["PnL"] || row["pnl"] || row["PNL"] || row["P&L"] || row["profit"] || row["Profit"] || 0),
      result: '', // Will be auto-determined below
      direction: direction,
      lotSize: parseFloat(row["lots"] || row["LotSize"] || row["lotSize"] || row["LOTSIZE"] || row["Size"] || row["size"] || row["Lot"] || row["lot"] || 1),
      strategy: strategy,
      session: session,
      executionScore: parseInt(row["Execution"] || row["execution"] || row["EXECUTION"] || row["Score"] || row["score"] || 5),
      emotions: (row["Emotions"] || row["emotions"] || row["EMOTIONS"] || '').toString().trim(),
      notes: (row["Notes"] || row["notes"] || row["NOTES"] || row["Comment"] || row["comment"] || `Ticket: ${row["ticket"] || 'N/A'}, Close reason: ${closeReason || 'N/A'}`).toString().trim(),
      screenshotUrl: ""
    };
    
    // Auto-determine result based on PnL
    if (trade.pnl > 0) {
      trade.result = 'win';
    } else if (trade.pnl < 0) {
      trade.result = 'loss';
    } else {
      trade.result = 'be';
    }
    
    return trade;
  } catch (error) {
    throw new Error(`Error mapping CSV row: ${error.message}`);
  }
}

/**
 * 🚀 Main import function
 */
async function importCSV() {
  console.log('🔄 Starting CSV import process...');
  console.log(`📁 CSV File: ${CSV_FILE_PATH}`);
  console.log(`👤 User ID: ${USER_ID}`);
  console.log('─────────────────────────────────────────────────');
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found at: ${CSV_FILE_PATH}`);
    }
    
    console.log('📖 Reading and parsing CSV file...');
    
    const trades = [];
    
    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv())
        .on('data', (row) => {
          totalProcessed++;
          
          try {
            const trade = mapCsvToTrade(row);
            const validationError = validateTrade(trade);
            
            if (validationError) {
              totalErrors++;
              errors.push(`Row ${totalProcessed}: ${validationError}`);
              console.log(`❌ Row ${totalProcessed}: ${validationError}`);
            } else {
              trades.push(trade);
              totalValid++;
              
              // Log progress every 100 records
              if (totalProcessed % 100 === 0) {
                console.log(`📊 Processed ${totalProcessed} rows (${totalValid} valid, ${totalErrors} errors)`);
              }
            }
          } catch (error) {
            totalErrors++;
            errors.push(`Row ${totalProcessed}: ${error.message}`);
            console.log(`❌ Row ${totalProcessed}: ${error.message}`);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log('─────────────────────────────────────────────────');
    console.log(`📈 CSV parsing complete:`);
    console.log(`   Total rows processed: ${totalProcessed}`);
    console.log(`   Valid trades: ${totalValid}`);
    console.log(`   Errors: ${totalErrors}`);
    
    if (trades.length === 0) {
      console.log('⚠️  No valid trades to import');
      return;
    }
    
    // Bulk insert trades
    console.log('💾 Inserting trades into database...');
    const result = await Trade.insertMany(trades, { ordered: false });
    
    console.log('─────────────────────────────────────────────────');
    console.log('🎉 Import completed successfully!');
    console.log(`✅ ${result.length} trades imported to database`);
    
    if (totalErrors > 0) {
      console.log(`\n⚠️  ${totalErrors} errors encountered:`);
      errors.slice(0, 10).forEach(error => console.log(`   • ${error}`));
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }
    
  } catch (error) {
    console.error('💥 Import failed:', error.message);
    
    if (error.writeErrors) {
      console.log(`\n📝 Database insertion errors:`);
      error.writeErrors.slice(0, 5).forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.errmsg}`);
      });
    }
    
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    console.log('\n🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
  }
}

// 🏃‍♂️ Run the import
if (require.main === module) {
  importCSV()
    .then(() => {
      console.log('🏁 Import process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { importCSV, mapCsvToTrade, validateTrade }; 