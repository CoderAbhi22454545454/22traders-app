# 🐛 Debug: Screenshot Labels & Descriptions Not Saving

## Issue
Labels and descriptions are not showing when viewing a trade, even though they were added during creation.

## Debug Steps Added

### 1. Frontend Logging (NewBacktest.jsx)
Added console logs to see what data is being sent:

```javascript
console.log('📸 Screenshots to upload:', screenshots);
console.log('📸 Screenshot Metadata being sent:', screenshotMetadata);
```

**What to check:**
- Open browser console (F12)
- Create a new backtest
- Add a screenshot with label and description
- Look for logs starting with 📸
- Verify that `label` and `description` are present in the data

### 2. Backend Logging (routes/backtests.js)
Added console logs to see what data is received and saved:

```javascript
console.log('📸 Screenshot Metadata Received:', metadata);
console.log('📸 Number of files:', req.files.length);
console.log(`📸 Screenshot ${i + 1} Data:`, { label, description, borderColor });
console.log('📸 Final screenshots array:', screenshots);
```

**What to check:**
- Look at backend terminal
- When creating a backtest, you should see logs starting with 📸
- Verify that metadata is received correctly
- Check if label and description are in the final array

## Testing Instructions

### Step 1: Create a Test Backtest
1. Go to http://localhost:3000/backtests/new
2. Fill in required fields (Master Card, Date, etc.)
3. Scroll to "Trade Screenshots" section
4. Click "Add Screenshot"
5. Select an image
6. **Important:** Fill in:
   - Label: "Test Entry Point"
   - Description: "This is a test description to verify data is saved"
   - Border Color: Pick any color (e.g., Green)
7. Click "Save Screenshot"
8. You should see the screenshot appear as a card
9. Submit the backtest

### Step 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs with 📸 emoji
4. You should see:
   ```
   📸 Screenshots to upload: [{ file: File, label: "Test Entry Point", description: "This is a test...", borderColor: "#10B981" }]
   📸 Screenshot Metadata being sent: [{ label: "Test Entry Point", description: "This is a test...", borderColor: "#10B981" }]
   ```

### Step 3: Check Backend Terminal
1. Look at your backend terminal
2. You should see:
   ```
   📸 Screenshot Metadata Received: [{ label: "Test Entry Point", description: "This is a test...", borderColor: "#10B981" }]
   📸 Number of files: 1
   📸 Screenshot 1 Data: { label: "Test Entry Point", description: "This is a test...", borderColor: "#10B981" }
   📸 Final screenshots array: [{ imageUrl: "...", publicId: "...", label: "Test Entry Point", description: "This is a test...", borderColor: "#10B981" }]
   ```

### Step 4: View the Backtest
1. After creation, you'll be redirected to the backtest detail page
2. Scroll to "Trade Screenshots" section
3. Check if label and description are showing

## Possible Issues & Solutions

### Issue 1: Data Not Sent from Frontend
**Symptoms:**
- Browser console shows empty label/description
- Or no 📸 logs at all

**Solution:**
- Check that you filled in the label and description fields
- Check that you clicked "Save Screenshot" button
- Verify the screenshot appears as a card before submitting

### Issue 2: Data Not Received by Backend
**Symptoms:**
- Browser console shows correct data
- Backend logs show empty or missing metadata

**Solution:**
- Check that `screenshotMetadata` is being parsed correctly
- Verify FormData is sending the data properly
- Check network tab in DevTools to see the actual request

### Issue 3: Data Not Saved to Database
**Symptoms:**
- Backend logs show correct data
- But viewing the backtest shows "No description"

**Solution:**
- Check the Backtest model schema
- Verify the screenshots array structure
- Check if there's a database validation error

### Issue 4: Data Not Displayed in UI
**Symptoms:**
- Data is in database
- But UI shows "No description"

**Solution:**
- Check BacktestDetail.jsx is using correct field names
- Verify: `screenshot.label` and `screenshot.description`
- Not: `screenshot.type` or old format

## Quick Database Check

If you have MongoDB access, you can check directly:

```javascript
// In MongoDB shell or Compass
db.backtests.findOne({ _id: ObjectId("YOUR_BACKTEST_ID") })

// Look at the screenshots array:
{
  screenshots: [
    {
      imageUrl: "https://...",
      publicId: "...",
      label: "Test Entry Point",        // Should be here
      description: "This is a test...", // Should be here
      borderColor: "#10B981",           // Should be here
      metadata: { ... }
    }
  ]
}
```

## Expected vs Actual

### Expected Data Flow:
```
Frontend (ScreenshotManager)
  ↓ User fills label & description
  ↓ Clicks "Save Screenshot"
  ↓ Screenshot added to state with metadata
  ↓
Frontend (NewBacktest)
  ↓ User submits form
  ↓ Creates FormData with screenshotMetadata
  ↓ Sends to backend
  ↓
Backend (routes/backtests.js)
  ↓ Receives files and metadata
  ↓ Uploads to Cloudinary
  ↓ Creates screenshot objects with label, description, borderColor
  ↓ Saves to database
  ↓
Database (MongoDB)
  ↓ Stores in screenshots array
  ↓
Frontend (BacktestDetail)
  ↓ Fetches backtest
  ↓ Displays screenshots with label & description
```

### Check Each Step:
1. ✅ User fills label & description
2. ✅ Screenshot saved to state
3. ❓ FormData includes metadata
4. ❓ Backend receives metadata
5. ❓ Backend saves to database
6. ❓ UI displays correctly

## Common Mistakes

### 1. Not Clicking "Save Screenshot"
- Just uploading the image is not enough
- You must click "Save Screenshot" button
- The screenshot should appear as a card

### 2. Empty Fields
- If you leave label and description empty, they'll be saved as empty strings
- Make sure to actually type something

### 3. Wrong Component
- Make sure you're using `ScreenshotManager` component
- Not the old `MultipleScreenshotUploader`

### 4. Cache Issues
- Clear browser cache
- Hard reload (Cmd+Shift+R or Ctrl+Shift+R)
- Restart backend server

## Next Steps

After running the test:
1. Share the console logs (both frontend and backend)
2. Share the backtest ID
3. We can check the database directly
4. Identify exactly where the data is being lost

## Temporary Workaround

If you need to add labels/descriptions to existing backtests:
1. Go to Edit page
2. The screenshots should load
3. You can add labels and descriptions in the card fields
4. Save the backtest

---

**Run the test and share the console logs to help debug!**

