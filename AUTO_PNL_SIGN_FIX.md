# Auto P&L Sign Adjustment - Implementation Summary

## Feature Request
When a user enters a trade in the backtest module:
- **If Result = "Loss"**, P&L should automatically become negative (shown in red)
- **If Result = "Win"**, P&L should automatically become positive (shown in green)
- Users should not have to manually add the "-" sign for losses

---

## Implementation

### Files Modified

#### 1. `/frontend/src/components/NewBacktest.jsx`
Updated `handleInputChange` function to automatically adjust P&L sign based on result.

#### 2. `/frontend/src/components/EditBacktest.jsx`
Updated `handleInputChange` function with the same logic for consistency.

---

## Logic Implemented

### Scenario 1: User Changes Result
When the user selects a result (Win/Loss/Break Even):

```javascript
if (name === 'result') {
  // If result is "loss" and PnL is positive, make it negative
  if (value === 'loss' && prev.pnl && parseFloat(prev.pnl) > 0) {
    updatedData.pnl = (-Math.abs(parseFloat(prev.pnl))).toString();
  }
  // If result is "win" and PnL is negative, make it positive
  else if (value === 'win' && prev.pnl && parseFloat(prev.pnl) < 0) {
    updatedData.pnl = Math.abs(parseFloat(prev.pnl)).toString();
  }
}
```

### Scenario 2: User Enters P&L
When the user enters or changes the P&L value:

```javascript
if (name === 'pnl') {
  const numValue = parseFloat(value);
  
  // If result is "loss", ensure PnL is negative
  if (prev.result === 'loss' && numValue > 0) {
    adjustedValue = (-Math.abs(numValue)).toString();
  }
  // If result is "win", ensure PnL is positive
  else if (prev.result === 'win' && numValue < 0) {
    adjustedValue = Math.abs(numValue).toString();
  }
}
```

---

## User Experience Flow

### Flow 1: Result Selected First
1. User selects **Result = "Loss"**
2. User enters **P&L = 100**
3. System automatically converts to **P&L = -100** ✅
4. P&L displays in **red** (negative value)

### Flow 2: P&L Entered First
1. User enters **P&L = 150**
2. User selects **Result = "Loss"**
3. System automatically converts to **P&L = -150** ✅
4. P&L displays in **red** (negative value)

### Flow 3: Correcting a Mistake
1. User has **Result = "Loss"** and **P&L = -100**
2. User changes to **Result = "Win"**
3. System automatically converts to **P&L = 100** ✅
4. P&L displays in **green** (positive value)

### Flow 4: Break Even (No Change)
1. User selects **Result = "Break Even"**
2. P&L remains as entered (can be 0, positive, or negative)
3. No automatic adjustment for break-even trades

---

## Behavior Matrix

| Result Selected | P&L Entered | Final P&L | Display Color |
|----------------|-------------|-----------|---------------|
| Win            | 100         | 100       | Green ✅      |
| Win            | -100        | 100       | Green ✅      |
| Loss           | 100         | -100      | Red ✅        |
| Loss           | -100        | -100      | Red ✅        |
| Break Even     | 0           | 0         | Yellow ⚠️     |
| Break Even     | 50          | 50        | Yellow ⚠️     |
| (None)         | 100         | 100       | Default       |

---

## Edge Cases Handled

### 1. Empty P&L
- If P&L is empty/blank, no conversion happens
- User can leave P&L empty if not yet calculated

### 2. Zero P&L
- Zero remains zero regardless of result
- Useful for break-even trades

### 3. Decimal Values
- Works with decimal P&L values (e.g., 123.45)
- Sign is preserved correctly

### 4. Switching Results Multiple Times
- User can switch between Win/Loss/Break Even
- P&L sign adjusts automatically each time

### 5. Editing Existing Trades
- Works the same way in edit mode
- Existing P&L values are adjusted when result changes

---

## Testing Scenarios

### Test 1: New Backtest - Loss Trade
1. Go to `/backtests/new`
2. Select Result = "Loss"
3. Enter P&L = 50
4. **Expected:** P&L automatically becomes -50
5. **Verify:** Displays in red

### Test 2: New Backtest - Win Trade
1. Go to `/backtests/new`
2. Select Result = "Win"
3. Enter P&L = -75 (user mistake)
4. **Expected:** P&L automatically becomes 75
5. **Verify:** Displays in green

### Test 3: Edit Existing - Change Result
1. Go to `/backtests/{id}/edit`
2. Existing trade: Result = "Win", P&L = 100
3. Change Result to "Loss"
4. **Expected:** P&L automatically becomes -100
5. **Verify:** Displays in red

### Test 4: P&L First, Then Result
1. Go to `/backtests/new`
2. Enter P&L = 200
3. Select Result = "Loss"
4. **Expected:** P&L automatically becomes -200
5. **Verify:** Displays in red

### Test 5: Break Even Trade
1. Go to `/backtests/new`
2. Select Result = "Break Even"
3. Enter P&L = 0
4. **Expected:** P&L remains 0
5. **Verify:** No automatic sign change

---

## Benefits

### 1. User Convenience
- No need to manually type the minus sign
- Faster data entry
- Less prone to user error

### 2. Data Consistency
- Ensures losses are always negative
- Ensures wins are always positive
- Prevents display color mismatches

### 3. Visual Feedback
- Red color for losses (negative P&L)
- Green color for wins (positive P&L)
- Immediate visual confirmation

### 4. Error Prevention
- Prevents users from forgetting the minus sign
- Automatically corrects sign mismatches
- Reduces data entry mistakes

---

## Technical Details

### Function Location
Both files use the same `handleInputChange` function:
- `NewBacktest.jsx` - Line ~133
- `EditBacktest.jsx` - Line ~156

### State Management
- Uses React `useState` hook
- Updates `formData` state object
- Preserves other form fields during update

### Type Conversion
- Converts string to number using `parseFloat()`
- Uses `Math.abs()` to ensure absolute value
- Converts back to string for form input compatibility

---

## Compatibility

- ✅ Works with new backtest creation
- ✅ Works with backtest editing
- ✅ Compatible with all browsers
- ✅ No backend changes required
- ✅ No database migration needed

---

## Future Enhancements (Optional)

1. **Visual Indicator**: Add a small icon next to P&L showing auto-adjustment
2. **Tooltip**: Show tooltip explaining automatic sign adjustment
3. **Settings**: Allow users to disable auto-adjustment if preferred
4. **Notification**: Brief toast message when P&L sign is auto-adjusted

---

**Date Implemented:** December 26, 2024  
**Applies To:** New Backtest & Edit Backtest  
**Status:** ✅ Complete and Ready to Test

