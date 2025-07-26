# Journal API Documentation

This document describes the Journal API endpoints for the Trading Journal application.

## Base URL
```
http://localhost:5001/api/journal
```

## Authentication
All endpoints require a `userId` parameter to identify the user. In a production environment, this would be handled through JWT tokens.

## Endpoints

### 1. GET /api/journal
Get all journal entries for a user with filtering and pagination.

**Query Parameters:**
- `userId` (required): User ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sortBy` (optional): Sort field (default: '-createdAt')
- `mood` (optional): Filter by mood
- `category` (optional): Filter by category
- `isFavorite` (optional): Filter favorites (true/false)
- `tags` (optional): Filter by tags (array)
- `search` (optional): Text search in title/content/tags
- `dateFrom` (optional): Filter from date (ISO format)
- `dateTo` (optional): Filter to date (ISO format)
- `hasDrawing` (optional): Filter entries with drawings (true/false)
- `template` (optional): Filter by template type

**Example Request:**
```bash
GET /api/journal?userId=507f1f77bcf86cd799439011&page=1&limit=10&mood=confident
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalEntries": 50,
      "limit": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. GET /api/journal/analytics
Get analytics data for journal entries.

**Query Parameters:**
- `userId` (required): User ID
- `dateFrom` (optional): From date
- `dateTo` (optional): To date

**Example Request:**
```bash
GET /api/journal/analytics?userId=507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEntries": 25,
    "totalWords": 12500,
    "averageWords": 500,
    "totalReadingTime": 63,
    "favoriteEntries": 8,
    "entriesWithDrawings": 12,
    "entriesWithTrades": 15,
    "totalPnL": 1250.50,
    "moodDistribution": {
      "confident": 10,
      "analytical": 8,
      "reflective": 7
    },
    "categoryDistribution": {
      "analysis": 12,
      "psychology": 8,
      "strategy": 5
    },
    "topTags": [
      { "tag": "eur-usd", "count": 15 },
      { "tag": "breakout", "count": 8 }
    ]
  }
}
```

### 3. GET /api/journal/tags
Get all unique tags for a user.

**Query Parameters:**
- `userId` (required): User ID

**Example Request:**
```bash
GET /api/journal/tags?userId=507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": ["analysis", "breakout", "eur-usd", "psychology", "technical"]
}
```

### 4. GET /api/journal/:id
Get a specific journal entry by ID.

**Path Parameters:**
- `id`: Journal entry ID

**Query Parameters:**
- `userId` (required): User ID

**Example Request:**
```bash
GET /api/journal/507f1f77bcf86cd799439012?userId=507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "EUR/USD Breakout Analysis",
    "content": "<h2>Market Analysis</h2><p>Strong breakout above resistance...</p>",
    "date": "2024-01-15T00:00:00.000Z",
    "mood": "confident",
    "tags": ["eur-usd", "breakout", "technical"],
    "isFavorite": true,
    "hasDrawing": true,
    "linkedTrades": [...],
    "wordCount": 485,
    "readingTime": 3,
    "views": 15,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:20:00.000Z"
  }
}
```

### 5. POST /api/journal
Create a new journal entry.

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "title": "EUR/USD Breakout Analysis",
  "content": "<h2>Market Analysis</h2><p>Strong breakout above resistance...</p>",
  "date": "2024-01-15T00:00:00.000Z",
  "mood": "confident",
  "tags": ["eur-usd", "breakout", "technical"],
  "isFavorite": true,
  "linkedTrades": ["507f1f77bcf86cd799439013"],
  "pnl": 250.50,
  "category": "analysis",
  "template": "technical-analysis",
  "hasDrawing": true,
  "instruments": ["EUR/USD"],
  "tradeSetups": [
    {
      "instrument": "EUR/USD",
      "direction": "long",
      "entryPrice": 1.0855,
      "exitPrice": 1.0895,
      "stopLoss": 1.0825,
      "takeProfit": 1.0920,
      "riskReward": 2.0,
      "lotSize": 1.0
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Journal entry created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    ...
  }
}
```

### 6. PUT /api/journal/:id
Update an existing journal entry.

**Path Parameters:**
- `id`: Journal entry ID

**Request Body:** Same as POST, but all fields are optional except `userId`.

**Example Request:**
```bash
PUT /api/journal/507f1f77bcf86cd799439012
```

**Response:**
```json
{
  "success": true,
  "message": "Journal entry updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    ...
  }
}
```

### 7. POST /api/journal/:id/drawing
Upload a drawing image for a journal entry.

**Path Parameters:**
- `id`: Journal entry ID

**Request Body (multipart/form-data):**
- `drawing` (file): Image file
- `userId`: User ID
- `drawingData` (optional): JSON string of canvas data

**Example Request:**
```bash
POST /api/journal/507f1f77bcf86cd799439012/drawing
Content-Type: multipart/form-data

drawing=@chart_analysis.png
userId=507f1f77bcf86cd799439011
drawingData={"objects":[...],"background":"#ffffff"}
```

**Response:**
```json
{
  "success": true,
  "message": "Drawing uploaded successfully",
  "data": {
    "drawingImageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/journal-drawings/abc123.png",
    "metadata": {
      "filename": "chart_analysis.png",
      "width": 800,
      "height": 600,
      "format": "png",
      "bytes": 245760
    }
  }
}
```

### 8. DELETE /api/journal/:id
Delete a journal entry.

**Path Parameters:**
- `id`: Journal entry ID

**Query Parameters:**
- `userId` (required): User ID

**Example Request:**
```bash
DELETE /api/journal/507f1f77bcf86cd799439012?userId=507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "message": "Journal entry deleted successfully"
}
```

### 9. PATCH /api/journal/:id/favorite
Toggle favorite status of a journal entry.

**Path Parameters:**
- `id`: Journal entry ID

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Journal entry added to favorites",
  "data": {
    "isFavorite": true
  }
}
```

### 10. GET /api/journal/search/:query
Search journal entries by text.

**Path Parameters:**
- `query`: Search query

**Query Parameters:**
- `userId` (required): User ID
- `limit` (optional): Max results (default: 20)

**Example Request:**
```bash
GET /api/journal/search/EUR%20USD%20breakout?userId=507f1f77bcf86cd799439011&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "EUR/USD Breakout Analysis",
      "content": "<h2>Market Analysis</h2><p>Strong breakout...</p>",
      "date": "2024-01-15T00:00:00.000Z",
      "mood": "confident",
      "tags": ["eur-usd", "breakout"],
      "isFavorite": true,
      "hasDrawing": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Data Models

### Journal Entry Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to User
  title: String, // Required, max 200 chars
  content: String, // Required, HTML content
  date: Date, // Entry date
  mood: String, // enum: ['confident', 'reflective', 'analytical', 'excited', 'calm', 'frustrated', 'neutral']
  tags: [String], // Array of lowercase tags
  isFavorite: Boolean,
  hasDrawing: Boolean,
  drawingData: Mixed, // Canvas JSON data
  drawingImageUrl: String, // Cloudinary URL
  drawingPublicId: String, // Cloudinary public ID
  linkedTrades: [ObjectId], // References to Trade documents
  instruments: [String], // Trading instruments mentioned
  pnl: Number, // Profit/Loss if applicable
  tradeSetups: [TradeSetup], // Detailed trade information
  wordCount: Number, // Calculated automatically
  characterCount: Number, // Calculated automatically
  readingTime: Number, // Estimated reading time in minutes
  template: String, // Template used
  category: String, // Entry category
  views: Number, // View count
  lastViewedAt: Date,
  version: Number, // Version for edit tracking
  editHistory: [EditHistory],
  createdAt: Date, // Auto-generated
  updatedAt: Date // Auto-generated
}
```

### TradeSetup Sub-document
```javascript
{
  instrument: String,
  direction: String, // 'long' or 'short'
  entryPrice: Number,
  exitPrice: Number,
  stopLoss: Number,
  takeProfit: Number,
  riskReward: Number,
  lotSize: Number
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting
Currently no rate limiting is implemented, but it's recommended for production use.

## File Upload Limits
- Drawing images: Max 10MB
- Supported formats: JPEG, PNG, GIF, WebP

## Database Indexes
The following indexes are automatically created for better query performance:
- `userId + createdAt` (compound)
- `userId + isFavorite` (compound)
- `userId + mood` (compound)
- `userId + category` (compound)
- `userId + tags` (compound)
- Text search on `title`, `content`, and `tags` 