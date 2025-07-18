# Trade Journal App 📈

A comprehensive trading journal application built with the MERN stack (MongoDB, Express.js, React, Node.js). Track your trades, analyze performance, and improve your trading strategy with an intuitive calendar-based interface.

![Trade Journal Demo](https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=Trade+Journal+Dashboard)

## ✨ Features

### 📊 Core Functionality
- **Calendar-based Trade Entry**: Click any date to add trades for that specific day
- **Trade Management**: Add trades with entry/exit prices, P&L, instruments, and notes
- **Screenshot Uploads**: Upload trade screenshots using Cloudinary integration
- **Performance Analytics**: Real-time statistics including win rate, total P&L, and trade breakdown
- **Visual Indicators**: Calendar dots show dates with trades

### 🎨 User Experience
- **Modern UI**: Built with Tailwind CSS and Headless UI components
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Interactive Calendar**: Powered by react-calendar with custom styling
- **Modal Forms**: Smooth modal experience for trade entry
- **Real-time Updates**: Statistics update automatically when trades are added

### 🔧 Technical Features
- **Image Upload**: Cloudinary integration for screenshot storage
- **Data Validation**: Comprehensive validation on both client and server
- **Error Handling**: Graceful error handling with user feedback
- **API Integration**: RESTful API with filtering and pagination
- **Database Indexing**: Optimized MongoDB queries for performance

## 🏗️ Project Structure

```
trade-journal-app/
├── backend/                    # Express.js API
│   ├── models/
│   │   ├── User.js            # User model
│   │   └── Trade.js           # Trade model with schema
│   ├── routes/
│   │   └── trades.js          # Trade API routes
│   ├── config.example.js      # Environment config example
│   ├── package.json
│   └── server.js              # Express server entry point
├── frontend/                   # React application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── CalendarView.jsx    # Calendar with trade indicators
│   │   │   ├── TradeModal.jsx      # Trade entry modal
│   │   │   └── Dashboard.jsx       # Main dashboard component
│   │   ├── utils/
│   │   │   └── api.js              # API utility functions
│   │   ├── App.js                  # Main App component
│   │   ├── index.js                # React entry point
│   │   └── index.css               # Tailwind CSS with custom styles
│   ├── package.json
│   ├── tailwind.config.js          # Tailwind configuration
│   └── postcss.config.js           # PostCSS configuration
├── package.json                    # Root monorepo package
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Cloudinary account (for image uploads)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd trade-journal-app
npm run install-all
```

### 2. Backend Setup

```bash
cd backend
```

Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb://localhost:27017/trade-journal
PORT=5000
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
```

### 3. Frontend Setup

No additional configuration needed for the frontend.

### 4. Start Development Servers

From the root directory:

```bash
# Start both backend and frontend concurrently
npm run dev

# Or start them separately:
npm run server    # Backend only
npm run client    # Frontend only
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔌 API Endpoints

### Trades API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trades` | Get all trades with optional filters |
| POST | `/api/trades` | Create a new trade entry |
| GET | `/api/trades/dates` | Get dates that have trades (for calendar) |

### Query Parameters

**GET /api/trades**
- `date`: Filter by specific date (YYYY-MM-DD)
- `instrument`: Filter by instrument name
- `userId`: Filter by user ID
- `page`: Page number for pagination
- `limit`: Number of trades per page

### Request/Response Examples

**Create Trade (POST /api/trades)**

```bash
curl -X POST http://localhost:5000/api/trades \
  -F "userId=507f1f77bcf86cd799439011" \
  -F "date=2024-01-15" \
  -F "instrument=AAPL" \
  -F "entryPrice=150.00" \
  -F "exitPrice=155.00" \
  -F "pnl=5.00" \
  -F "result=win" \
  -F "notes=Strong breakout above resistance" \
  -F "screenshot=@chart.png"
```

**Response:**
```json
{
  "message": "Trade created successfully",
  "trade": {
    "_id": "...",
    "userId": "507f1f77bcf86cd799439011",
    "date": "2024-01-15T00:00:00.000Z",
    "instrument": "AAPL",
    "entryPrice": 150,
    "exitPrice": 155,
    "pnl": 5,
    "result": "win",
    "notes": "Strong breakout above resistance",
    "screenshotUrl": "https://res.cloudinary.com/...",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🗃️ Database Schema

### Trade Schema

```javascript
{
  userId: ObjectId,        // Reference to User
  date: Date,             // Trade date
  instrument: String,     // e.g., "AAPL", "EURUSD", "BTC/USD"
  entryPrice: Number,     // Entry price
  exitPrice: Number,      // Exit price
  pnl: Number,           // Profit/Loss amount
  result: String,        // "win", "loss", or "be"
  notes: String,         // Optional trade notes
  screenshotUrl: String, // Cloudinary URL for screenshot
  createdAt: Date        // Auto-generated timestamp
}
```

### User Schema

```javascript
{
  name: String,
  email: String,
  password: String,
  preferences: {
    timezone: String,
    currency: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 Customization

### Styling
The app uses Tailwind CSS with custom color scheme:
- Primary: Blue tones (#3B82F6)
- Success: Green tones (#22C55E)
- Danger: Red tones (#EF4444)

### Calendar Styling
Custom calendar styles are defined in `frontend/src/index.css` with:
- Trade indicators (dots)
- Hover effects
- Responsive design

### Adding New Features

1. **Backend**: Add new routes in `backend/routes/`
2. **Frontend**: Create components in `frontend/src/components/`
3. **API**: Extend `frontend/src/utils/api.js` for new endpoints

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/trade-journal
PORT=5000
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_secret_key
```

**Frontend**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name, API key, and API secret
3. Add them to your backend `.env` file

## 📱 Usage Guide

### Adding a Trade

1. **Select Date**: Click on any date in the calendar
2. **Fill Form**: Enter instrument, entry/exit prices, and result
3. **Add Notes**: Optional strategy notes or lessons learned
4. **Upload Screenshot**: Drag and drop or select a chart image
5. **Submit**: Click "Add Trade" to save

### Viewing Statistics

The dashboard shows:
- Total trades count
- Overall P&L
- Win rate percentage
- Trade breakdown visualization

### Calendar Features

- **Blue dots**: Dates with trades
- **Click dates**: Open trade entry modal
- **Navigation**: Use arrows to browse months

## 🛠️ Development

### Code Structure

- **Backend**: Express.js with MongoDB and Mongoose
- **Frontend**: React with Hooks and functional components
- **Styling**: Tailwind CSS with custom components
- **State Management**: React useState and useEffect hooks
- **API Communication**: Axios with interceptors

### Adding New Components

1. Create component in `frontend/src/components/`
2. Export from component file
3. Import and use in parent components
4. Add styling with Tailwind classes

### Database Operations

The app uses Mongoose for MongoDB operations:
- Indexing for performance optimization
- Aggregation pipelines for statistics
- Population for user references

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check MongoDB is running
mongod --version
# Or start MongoDB service
brew services start mongodb/brew/mongodb-community
```

**Cloudinary Upload Fails**
- Verify API credentials in `.env`
- Check file size limits (5MB max)
- Ensure image format is supported

**Port Already in Use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**React Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Deployment

### Backend Deployment (Heroku)

```bash
cd backend
heroku create your-app-name
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
# Add other environment variables
git push heroku main
```

### Frontend Deployment (Netlify)

```bash
cd frontend
npm run build
# Upload dist folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **React Calendar** - Calendar component
- **Headless UI** - Accessible UI components  
- **Tailwind CSS** - Utility-first CSS framework
- **Cloudinary** - Image upload and management
- **Heroicons** - Beautiful SVG icons

---

Built with ❤️ using the MERN stack 