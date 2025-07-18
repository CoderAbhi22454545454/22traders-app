// Copy this file to .env in the backend directory and fill in your values

module.exports = {
  // MongoDB Configuration
  MONGODB_URI: 'mongodb://localhost:27017/trade-journal',
  
  // Server Configuration
  PORT: 5000,
  NODE_ENV: 'development',
  
  // Cloudinary Configuration (for image uploads)
  // Sign up at https://cloudinary.com to get these credentials
  CLOUDINARY_CLOUD_NAME: 'your_cloud_name',
  CLOUDINARY_API_KEY: 'your_api_key',
  CLOUDINARY_API_SECRET: 'your_api_secret',
  
  // JWT Configuration (for future authentication)
  JWT_SECRET: 'your_jwt_secret_key_here_make_it_long_and_secure'
};

/*
Create a .env file in the backend directory with:

MONGODB_URI=mongodb://localhost:27017/trade-journal
PORT=5000
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
*/ 