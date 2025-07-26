# FX Trading Journal Application

A comprehensive trading journal application built with React (frontend) and Node.js (backend), featuring real-time trade tracking, analytics, and now including a **Digital Trading Journal** module for documenting your trading journey.

## ✨ New Features - Digital Trading Journal

### 📓 Complete Journal Module
- **Rich Text Editor**: Write detailed journal entries with formatting, lists, links, and more
- **Drawing Canvas**: Create technical analysis drawings with shapes, annotations, and trading tools
- **Journal Templates**: Pre-built templates for different scenarios:
  - Daily Trading Review
  - Technical Analysis Notes
  - Trading Psychology Log
  - Trade Post-Mortem Analysis
  - Weekly Strategy Review
  - Market Insights & Ideas

### 🎨 Drawing Tools & Features
- **Basic Tools**: Pen, line, rectangle, circle, arrow, text
- **Trading-Specific Tools**: Support/resistance lines, trend lines, Fibonacci retracements, channels
- **Customization**: Color picker, stroke width, fill options
- **Export**: Download drawings as PNG images
- **Integration**: Link drawings directly to journal entries

### 🔗 Smart Integrations
- **Trade Linking**: Connect journal entries to specific trades
- **Mood Tracking**: Track emotional state with each entry
- **Tagging System**: Organize entries with custom tags
- **Search & Filter**: Find entries by content, tags, or date ranges
- **Dashboard Preview**: See recent journal entries on the main dashboard

### 📱 User Experience Features
- **Templates**: Quick-start templates for common journal types
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Saving**: Auto-save functionality for entries
- **Favorites**: Mark important entries as favorites
- **Statistics**: Track journaling habits and insights

## Original Features

### Frontend Features
- **Dashboard**: Overview of trading performance with key metrics
- **Trade Management**: Add, edit, and view detailed trade information
- **Analytics**: Advanced charts and performance analysis
- **Calendar View**: Visual representation of trading activity
- **PWA Support**: Installable web app with offline capabilities
- **Real-time Notifications**: Push notifications for important updates
- **Responsive Design**: Mobile-first design approach

### Backend Features
- **RESTful API**: Comprehensive API for all trading data
- **Authentication**: Secure user authentication and session management
- **Data Persistence**: MongoDB integration for reliable data storage
- **Image Upload**: Cloudinary integration for trade screenshots
- **Performance Optimization**: Caching and efficient data queries

## Technology Stack

### Frontend
- **React 18**: Modern React with hooks and latest features
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Heroicons**: Beautiful SVG icons
- **Recharts**: Data visualization library
- **Tiptap**: Rich text editor for journal entries
- **Fabric.js**: Canvas library for drawing functionality
- **PWA**: Service worker and offline support

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Cloudinary**: Image upload and management
- **JWT**: JSON Web Tokens for authentication

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FX_MAIN
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure environment variables**
   - Copy `backend/config.example.js` to `backend/config.js`
   - Update with your MongoDB and Cloudinary credentials

5. **Start the application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

The application will be available at `http://localhost:3000`

## Project Structure

```
FX_MAIN/
├── backend/
│   ├── config/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Journal.jsx          # Main journal list view
│   │   │   ├── JournalEntry.jsx     # Individual entry editor/viewer
│   │   │   ├── JournalTemplates.jsx # Template selection modal
│   │   │   ├── DrawingCanvas.jsx    # Drawing and annotation tools
│   │   │   └── ...
│   │   ├── utils/
│   │   └── ...
└── README.md
```

## Key Journal Components

### Journal.jsx
Main journal interface with:
- Entry listing (grid/list view)
- Search and filtering
- Entry statistics
- Quick actions

### JournalEntry.jsx
Rich entry editor/viewer with:
- Rich text editing (Tiptap)
- Drawing canvas integration
- Trade linking
- Tag management
- Mood tracking

### DrawingCanvas.jsx
Advanced drawing functionality:
- Multiple drawing tools
- Trading-specific overlays
- Export capabilities
- Color and style customization

### JournalTemplates.jsx
Template system featuring:
- Pre-built journal templates
- Custom template creation
- Easy template application

## Usage

### Creating Journal Entries
1. Navigate to the Journal section
2. Click "New Entry" 
3. Choose a template or start blank
4. Write your content using the rich text editor
5. Add drawings if needed
6. Tag and categorize your entry
7. Link to relevant trades
8. Save your entry

### Using Drawing Tools
1. Enable drawing mode in any journal entry
2. Select from basic or trading-specific tools
3. Customize colors, sizes, and styles
4. Create technical analysis annotations
5. Export drawings as needed

### Organizing Entries
- Use tags to categorize entries
- Mark favorites for quick access
- Search by content, tags, or dates
- Filter by entry types or moods

## Contributing

We welcome contributions! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy Trading and Journaling! 📈📝** 