# Backtesting Module Documentation

## Overview
The Backtesting Module is a comprehensive MVP feature that allows traders to create, analyze, and filter historical trade backtests with advanced labeling and pattern recognition capabilities.

## Features

### 🏷️ Custom Chips/Labels System
- **Fully customizable labels** with name-value pairs
- **Color-coded categories**: Strategy, Timeframe, Session, Pattern, Custom
- **Reusable chips** from previous backtests
- **Multiple chips per trade** for detailed categorization

### 📸 Multiple Screenshot Upload
- **Three screenshot types**: Before Trade, Trade Entry, After Trade
- **Optional uploads** - any combination of the three types
- **Description support** - textarea below each image for detailed notes
- **Cloudinary integration** for reliable image storage

### 🔍 Advanced Filtering & Pattern Analysis
- **Time-based filters**: 7 days, 1 month, 3 months, 6 months, 1 year
- **Pattern filtering** by identified patterns
- **Market condition filtering**: Trending, Ranging, Volatile, Calm
- **Custom chip filtering** by name and value
- **Performance analytics** with win rates and P&L analysis

### 📊 Pattern Recognition Dashboard
- **Pattern performance analysis** with profitability metrics
- **Market condition effectiveness** tracking
- **Strategy comparison** across different setups
- **Sortable results** by P&L, win rate, or trade count

## Backend Implementation

### Models
- **`/backend/models/Backtest.js`**: Main backtest model with custom chips and screenshots
- **Custom chip schema** with name, value, color, and category
- **Screenshot schema** with type, URL, description, and metadata

### Routes
- **`/backend/routes/backtests.js`**: Complete CRUD operations
- **`GET /api/backtests`**: List backtests with filtering
- **`POST /api/backtests`**: Create new backtest with file uploads
- **`GET /api/backtests/patterns`**: Pattern analysis endpoint
- **`GET /api/backtests/filters`**: Available filter options
- **`DELETE /api/backtests/:id/screenshots/:screenshotId`**: Delete specific screenshots

## Frontend Implementation

### Components
- **`/frontend/src/components/Backtests.jsx`**: Main listing page with filters
- **`/frontend/src/components/NewBacktest.jsx`**: Create new backtest form
- **`/frontend/src/components/BacktestDetail.jsx`**: View/edit individual backtest
- **`/frontend/src/components/BacktestPatterns.jsx`**: Pattern analysis dashboard

### Routes
- **`/backtests`**: Main backtesting page
- **`/backtests/new`**: Create new backtest
- **`/backtests/:id`**: View backtest details
- **`/backtests/patterns`**: Pattern analysis page

## Usage Guide

### Creating a Backtest
1. Navigate to **Backtests** → **New Backtest**
2. Fill in basic trade information (date, instrument, prices, etc.)
3. Add custom chips:
   - Enter label name (e.g., "Strategy")
   - Enter value (e.g., "Breakout")
   - Select category and color
   - Click "Add Label"
4. Upload screenshots (optional):
   - Before Trade: Market setup before entry
   - Trade Entry: Actual entry point
   - After Trade: Result/exit point
   - Add descriptions for each screenshot
5. Complete analysis section with patterns, market conditions, and insights
6. Submit to create the backtest

### Filtering Backtests
- Use time range filters for specific periods
- Filter by identified patterns
- Filter by market conditions
- Search by custom chip names/values
- Combine multiple filters for precise results

### Pattern Analysis
- Access via **Pattern Analysis** button on main backtests page
- View performance metrics by pattern, market condition, and strategy
- Sort by profitability, win rate, or trade count
- Apply minimum win rate and trade count filters
- Identify most and least profitable patterns

## API Endpoints

### Backtests
```
GET    /api/backtests              # List backtests with filters
POST   /api/backtests              # Create new backtest
GET    /api/backtests/:id          # Get specific backtest
PUT    /api/backtests/:id          # Update backtest
DELETE /api/backtests/:id          # Delete backtest
```

### Analysis
```
GET    /api/backtests/chips        # Get unique chips for user
GET    /api/backtests/patterns     # Get pattern analysis
GET    /api/backtests/filters      # Get available filter options
```

### Screenshots
```
DELETE /api/backtests/:id/screenshots/:screenshotId  # Delete specific screenshot
```

## Database Schema

### Backtest Model
```javascript
{
  userId: ObjectId,
  date: Date,
  tradeNumber: String,
  instrument: String,
  tradePair: String,
  entryPrice: Number,
  exitPrice: Number,
  stopLoss: Number,
  takeProfit: Number,
  pnl: Number,
  result: ['win', 'loss', 'be'],
  direction: ['Long', 'Short'],
  lotSize: Number,
  customChips: [{
    name: String,
    value: String,
    color: String,
    category: ['strategy', 'timeframe', 'session', 'pattern', 'custom']
  }],
  screenshots: [{
    type: ['before', 'entry', 'after'],
    url: String,
    publicId: String,
    description: String,
    metadata: Object
  }],
  patternIdentified: String,
  marketCondition: ['trending', 'ranging', 'volatile', 'calm'],
  confidence: Number (1-10),
  reasonForEntry: String,
  reasonForExit: String,
  whatWorked: String,
  whatDidntWork: String,
  improvementAreas: String,
  backtestNotes: String
}
```

## Testing

A test script is available at `/backend/test-backtest.js` to verify:
- Model creation and validation
- Custom chip functionality
- Virtual field calculations
- Database operations

Run with: `node test-backtest.js`

## Integration Notes

- The backtesting module is fully integrated with the existing trade journal app
- Uses the same authentication and user system
- Shares Cloudinary configuration for image uploads
- Maintains consistent UI/UX with existing components
- Navigation includes new "Backtests" menu item with BeakerIcon

## Future Enhancements

- **Bulk import** from CSV/Excel files
- **Advanced pattern recognition** using ML
- **Comparison tools** between real trades and backtests
- **Export functionality** for analysis results
- **Template system** for common backtest setups
