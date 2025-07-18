# 📊 Trade History CSV Import Script

This script safely imports trade history from a CSV file into your MongoDB database using the existing Trade model.

## 🚀 Quick Start

1. **Prepare your CSV file** with trade data (see format below)
2. **Update the script configuration** (file path, user ID)
3. **Run the import script**

```bash
cd backend
node scripts/importCSV.js
```

## 📋 CSV Format Requirements

Your CSV file must include the following columns (case-insensitive):

### Required Columns:
- **Date**: Trade date (MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD)
- **Symbol**: Trading instrument (e.g., EURUSD, AAPL, BTC/USD)
- **Entry**: Entry price (decimal number)
- **Exit**: Exit price (decimal number)
- **PnL**: Profit/Loss amount (decimal, positive or negative)
- **Result**: Trade outcome (`win`, `loss`, or `be` for break-even)
- **Direction**: Trade direction (`Long` or `Short`)
- **LotSize**: Position size (decimal, minimum 0.01)
- **Strategy**: Trading strategy name
- **Session**: Trading session (`London`, `NY`, `Asian`, or `Overlap`)
- **Execution**: Execution score (integer 1-10)

### Optional Columns:
- **Emotions**: Your emotional state during the trade
- **Notes**: Additional trade notes or comments

### Alternative Column Names:
The script is flexible and accepts various column name formats:
- Date: `Date`, `date`, `DATE`
- Symbol: `Symbol`, `symbol`, `Instrument`, `instrument`
- Entry: `Entry`, `entry`, `EntryPrice`, `entryPrice`
- Exit: `Exit`, `exit`, `ExitPrice`, `exitPrice`
- PnL: `PnL`, `pnl`, `P&L`, `profit`, `Profit`
- Direction: `Direction`, `direction`, `Type`, `type`
- LotSize: `LotSize`, `lotSize`, `Size`, `size`, `Lot`, `lot`
- Session: `Session`, `session`
- Execution: `Execution`, `execution`, `Score`, `score`
- Emotions: `Emotions`, `emotions`
- Notes: `Notes`, `notes`, `Comment`, `comment`

## 📁 Sample CSV File

See `sample-trades.csv` for an example of the correct format:

```csv
Date,Symbol,Entry,Exit,PnL,Result,Direction,LotSize,Strategy,Session,Execution,Emotions,Notes
2025-06-29,EURUSD,1.0850,1.0865,15.50,win,Long,0.10,Support Resistance,London,8,Confident and patient,Perfect entry at support level
2025-06-29,XAUUSD,2380.50,2372.19,-8.31,loss,Long,0.01,Big Bar 15 Min,London,5,Frustrated,Should have waited for better entry
```

## ⚙️ Configuration

Before running the script, update these settings in `importCSV.js`:

### 1. CSV File Path
```javascript
const CSV_FILE_PATH = path.join(__dirname, '../../your-trades.csv');
```

### 2. User ID
Replace with your actual user ID from the database:
```javascript
const USER_ID = new mongoose.Types.ObjectId("your-actual-user-id-here");
```

### 3. MongoDB Connection (Optional)
The script uses the same MongoDB connection as your main app. Update if needed:
```javascript
const MONGODB_URI = 'your-mongodb-connection-string';
```

## 🔍 How It Works

1. **Connects** to your MongoDB database
2. **Reads** the CSV file row by row
3. **Maps** CSV columns to Trade model fields
4. **Validates** each trade record against the schema
5. **Bulk inserts** valid trades using `Trade.insertMany()`
6. **Reports** statistics (total processed, valid, errors)
7. **Disconnects** from the database

## 📊 Features

### ✅ Robust Validation
- Validates all required fields
- Checks enum values (result, direction, session)
- Validates numeric ranges (prices, lot size, execution score)
- Provides detailed error messages for invalid records

### 🔄 Flexible CSV Parsing
- Handles multiple date formats
- Case-insensitive column names
- Supports alternative column naming conventions
- Auto-determines trade result from P&L if missing

### 📈 Progress Tracking
- Real-time progress updates every 100 records
- Detailed statistics on completion
- Error logging with row numbers
- Summary of insertion results

### 🛡️ Error Handling
- Graceful handling of invalid records
- Continues processing even with errors
- Detailed error reporting
- Database disconnection on completion/failure

## 📋 Example Output

```
🔄 Starting CSV import process...
📁 CSV File: /path/to/your/trades.csv
👤 User ID: 6862699656a3ced7b36b132b
─────────────────────────────────────────────────
🔌 Connecting to MongoDB...
✅ Connected to MongoDB successfully
📖 Reading and parsing CSV file...
📊 Processed 100 rows (98 valid, 2 errors)
📊 Processed 200 rows (195 valid, 5 errors)
─────────────────────────────────────────────────
📈 CSV parsing complete:
   Total rows processed: 250
   Valid trades: 240
   Errors: 10
💾 Inserting trades into database...
─────────────────────────────────────────────────
🎉 Import completed successfully!
✅ 240 trades imported to database
🔌 Disconnecting from MongoDB...
✅ Disconnected successfully
🏁 Import process finished
```

## ⚠️ Important Notes

- **Backup your database** before running large imports
- The script will **NOT modify** existing Trade model or application code
- Invalid records are **skipped** with detailed error messages
- Use `ordered: false` for bulk insert to continue on individual record errors
- The script can be run multiple times safely (may create duplicates)

## 🐛 Troubleshooting

### CSV File Not Found
```
💥 Import failed: CSV file not found at: /path/to/file.csv
```
**Solution**: Update the `CSV_FILE_PATH` variable with the correct file path.

### Invalid Date Format
```
❌ Row 15: Error mapping CSV row: Invalid Date
```
**Solution**: Ensure dates are in MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD format.

### Missing Required Fields
```
❌ Row 23: Missing required field: instrument
```
**Solution**: Ensure all required columns are present and not empty.

### Database Connection Issues
```
💥 Import failed: Connection timeout
```
**Solution**: Check your MongoDB connection string and network connectivity.

## 🔧 Advanced Usage

### Test Run (Dry Run)
To test without actually inserting data, comment out the `insertMany` line:
```javascript
// const result = await Trade.insertMany(trades, { ordered: false });
console.log(`Would insert ${trades.length} trades`);
```

### Custom Validation
Add custom validation rules in the `validateTrade` function:
```javascript
// Custom validation example
if (trade.instrument === 'INVALID') {
  return 'Invalid instrument not allowed';
}
```

### Batch Processing
For very large files, you can process in batches by modifying the insertion logic:
```javascript
const BATCH_SIZE = 1000;
for (let i = 0; i < trades.length; i += BATCH_SIZE) {
  const batch = trades.slice(i, i + BATCH_SIZE);
  await Trade.insertMany(batch, { ordered: false });
  console.log(`Inserted batch ${Math.ceil((i + 1) / BATCH_SIZE)}`);
}
``` 