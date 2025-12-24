# Backtest Goals Feature - Testing Checklist

## Issues Fixed
✅ Fixed date mutation bug in daily/weekly time period calculations
✅ Fixed validation to allow decimals for winRate and pnl goals

## Testing Steps

### 1. Backend Setup
- [ ] Ensure MongoDB is running
- [ ] Start backend server: `cd backend && npm start`
- [ ] Verify route is registered: Check server logs for `/api/backtest-goals`

### 2. Create Overall Goal
- [ ] Navigate to `/backtests` (Master Cards page)
- [ ] Scroll to "Backtest Goals" section
- [ ] Click "New Goal"
- [ ] Create a goal:
  - Title: "Test 100 Backtests"
  - Goal Type: "Number of Trades"
  - Target: 100
  - Time Period: "No Time Limit"
  - Scope: Should show "Overall"
- [ ] Click "Create Goal"
- [ ] Verify goal appears in the list

### 3. Create Master Card Specific Goal
- [ ] Open any Master Card detail page
- [ ] Scroll to "Backtest Goals" section
- [ ] Click "New Goal"
- [ ] Create a goal:
  - Title: "Complete 50 Trades in This Strategy"
  - Goal Type: "Number of Trades"
  - Target: 50
  - Scope: Should show "Master Card" (auto-selected)
- [ ] Click "Create Goal"
- [ ] Verify goal appears

### 4. Test Milestones
- [ ] Edit an existing goal
- [ ] Add milestones:
  - Milestone 1: Target 25, Label "Quarter Way"
  - Milestone 2: Target 50, Label "Half Way"
  - Milestone 3: Target 75, Label "Three Quarters"
- [ ] Save goal
- [ ] Verify milestones appear

### 5. Test Time Periods
- [ ] Create a new goal with "Daily" time period
- [ ] Create a goal with "Weekly" time period
- [ ] Create a goal with "Monthly" time period
- [ ] Create a goal with "Custom Date Range":
  - Set start date and end date
  - Verify dates are saved correctly

### 6. Test Progress Calculation
- [ ] Create a goal: "Test 10 Trades" (target: 10)
- [ ] Add 5 backtests to the relevant master card
- [ ] View the goal - should show 5/10 (50% progress)
- [ ] Add 5 more backtests
- [ ] View the goal - should show 10/10 (100% complete) ✅

### 7. Test Different Goal Types
- [ ] Create "Win Rate" goal: Target 60%
- [ ] Create "P&L" goal: Target $1000
- [ ] Verify progress calculation works for each type

### 8. Test Dashboard Integration
- [ ] Navigate to Dashboard (`/dashboard`)
- [ ] Look for "Backtest Goals Progress" section
- [ ] Verify active goals appear as cards
- [ ] Check progress bars are displayed correctly
- [ ] Verify "Manage Goals" link works

### 9. Test Edit/Delete
- [ ] Edit an existing goal (change target or title)
- [ ] Verify changes are saved
- [ ] Delete a goal
- [ ] Verify goal is removed

### 10. Test Edge Cases
- [ ] Try creating goal with invalid data (empty title, negative target)
- [ ] Try editing goal to set target lower than current progress
- [ ] Test with no backtests (should show 0 progress)
- [ ] Test with completed goal (should show ✅)

## Known Potential Issues to Watch For

1. **Date Timezone**: Time period calculations use server timezone - verify dates match expectations
2. **Progress Recalculation**: Progress is calculated on-demand - may need manual refresh
3. **Milestone Achievement**: Milestones are checked when progress updates - verify they trigger correctly
4. **Custom Goal Type**: Custom goals require manual progress updates - verify this works

## API Endpoints to Test

```bash
# Get all goals
GET /api/backtest-goals?userId=<userId>

# Get specific goal
GET /api/backtest-goals/<goalId>?userId=<userId>

# Create goal
POST /api/backtest-goals
Body: { userId, title, target, goalType, scope, ... }

# Update goal
PUT /api/backtest-goals/<goalId>
Body: { userId, title, target, ... }

# Delete goal
DELETE /api/backtest-goals/<goalId>?userId=<userId>

# Calculate progress
POST /api/backtest-goals/<goalId>/calculate?userId=<userId>

# Get summary
GET /api/backtest-goals/summary/<userId>
```

## Quick Test Script

```javascript
// Test in browser console on /backtests page
// Replace userId with your actual userId

const userId = 'YOUR_USER_ID';
const API_BASE = 'http://localhost:5001/api';

// Create test goal
fetch(`${API_BASE}/backtest-goals`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    title: 'Test Goal',
    target: 10,
    goalType: 'trades',
    scope: 'overall',
    timePeriod: 'none'
  })
})
.then(r => r.json())
.then(console.log);

// Get all goals
fetch(`${API_BASE}/backtest-goals?userId=${userId}`)
.then(r => r.json())
.then(console.log);
```





