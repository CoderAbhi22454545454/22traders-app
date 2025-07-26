const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Initialize Cloudinary
require('./config/cloudinary');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://fx-trading-journal.netlify.app',
    'https://687a025701b4a620efa7d732--fx-trading-journal.netlify.app',
    
    'http://localhost:3000',
    'http://localhost:5001',
    'http://127.0.0.1:5001',
    'http://192.168.31.216:5001',
  
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Routes
app.use('/api/trades', require('./routes/trades'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/push', require('./routes/push'));
app.use('/api/pwa', require('./routes/pwa'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Trade Journal API is running!' });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-journal');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 