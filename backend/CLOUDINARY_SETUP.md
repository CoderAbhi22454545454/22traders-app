# Cloudinary Image Storage Setup

This project has been updated to use **Cloudinary** for image storage instead of Base64 + MongoDB storage.

## 🎯 Why Cloudinary?

- ✅ **Optimized Performance** - Better loading times with CDN delivery
- ✅ **Automatic Image Optimization** - Smart format and quality selection
- ✅ **Scalable Storage** - No MongoDB document size limitations
- ✅ **Built-in Transformations** - Resize, crop, and optimize on-the-fly
- ✅ **Better Database Performance** - Smaller document sizes improve query speed

## 🔧 Required Environment Variables

Add these environment variables to your `.env` file:

```env
# Cloudinary Configuration (Required)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Database
MONGODB_URI=mongodb://localhost:27017/trade-journal

# Server
PORT=5001
```

## 📋 How to Get Cloudinary Credentials

1. **Sign up for Cloudinary:**
   - Go to [https://cloudinary.com/](https://cloudinary.com/)
   - Create a free account (generous free tier available)

2. **Get your credentials:**
   - After login, go to your Dashboard
   - You'll find your credentials in the "Product Environment Credentials" section:
     - **Cloud Name** - Your unique cloud name
     - **API Key** - Your API key
     - **API Secret** - Your API secret (keep this secret!)

3. **Update your .env file:**
   ```env
   CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=your_actual_api_secret
   ```

## 🚀 What Changed

### Updated Files:
- `config/cloudinary.js` - New Cloudinary configuration
- `server.js` - Initialize Cloudinary on startup
- `models/Trade.js` - Added `screenshotPublicId` field for Cloudinary
- `routes/trades.js` - Replaced Base64 logic with Cloudinary upload/delete

### New Features:
- Images are automatically optimized by Cloudinary
- Images are served via CDN for faster loading
- Automatic cleanup when trades are deleted
- Better error handling for image operations
- Organized uploads in `trade-journal` folder

## 📊 Storage Comparison

| Feature | Base64 + MongoDB | Cloudinary |
|---------|------------------|------------|
| File Size Limit | 16MB (MongoDB limit) | 10MB (configurable) |
| Storage Overhead | +33% (Base64 encoding) | No overhead |
| Query Performance | Slower with large images | Faster (no image data in DB) |
| Image Optimization | Manual | Automatic |
| CDN Delivery | No | Yes |
| Backup Complexity | Simple (in DB) | External service |

## 🔄 Migration from Base64

If you have existing Base64 images in your database:

1. **No immediate action required** - existing Base64 images will continue to work
2. **New uploads** will use Cloudinary automatically
3. **Optional:** Create a migration script to convert existing Base64 images to Cloudinary

### Migration Script Template:
```javascript
const Trade = require('./models/Trade');
const cloudinary = require('./config/cloudinary');

async function migrateBase64ToCloudinary() {
  const tradesWithBase64 = await Trade.find({
    screenshotUrl: { $regex: '^data:image' }
  });

  for (const trade of tradesWithBase64) {
    try {
      // Extract base64 data
      const base64Data = trade.screenshotUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload to Cloudinary
      const result = await uploadToCloudinary(buffer, 'migrated-image.png');

      // Update trade
      trade.screenshotUrl = result.url;
      trade.screenshotPublicId = result.publicId;
      await trade.save();

      console.log(`Migrated trade ${trade._id}`);
    } catch (error) {
      console.error(`Failed to migrate trade ${trade._id}:`, error);
    }
  }
}
```

## 🛡️ Security Notes

- **Keep your API secret secure** - Never commit it to version control
- **Use environment variables** - Store credentials in `.env` file
- **Cloudinary folder organization** - Images are uploaded to `trade-journal` folder
- **Automatic cleanup** - Images are deleted from Cloudinary when trades are deleted

## 🌟 Free Tier Limits (Cloudinary)

- **Storage:** 25GB
- **Bandwidth:** 25GB/month
- **Transformations:** 25,000/month
- **Images/Videos:** 1,000,000

This should be more than sufficient for most trading journal applications.

## 🚨 Important Notes

- Ensure all three environment variables are set before starting the server
- The server will not start if Cloudinary credentials are missing
- Old Base64 images will continue to work alongside new Cloudinary images
- Consider setting up a backup strategy for your Cloudinary account

---

**Ready to use!** Your trade screenshots are now stored efficiently in Cloudinary with automatic optimization and CDN delivery. 🎯 