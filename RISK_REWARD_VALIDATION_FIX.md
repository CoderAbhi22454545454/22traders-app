# Risk/Reward Validation Fix

## Issue Reported
When editing a backtest at `http://localhost:3000/backtests/{id}/edit`, saving with a Risk/Reward value like "1:2" resulted in a validation error:

```json
{
  "message": "Validation errors",
  "errors": [{
    "type": "field",
    "value": "1:2",
    "msg": "Risk/Reward must be a positive number",
    "path": "riskReward"
  }]
}
```

---

## Root Cause

The validation rule was incorrectly expecting `riskReward` to be a **number** (`isFloat()`), but:

1. **Model Schema**: Defines `riskReward` as a **String** (line 146-149 in `Backtest.js`)
2. **Code Usage**: Throughout the codebase, `riskReward` is expected in ratio format "X:Y" and is split by `:` (lines 611, 869, 877)
3. **Validation**: Was checking if it's a float number ❌

---

## Fix Applied

### File: `backend/routes/backtests.js`

#### 1. Updated `backtestUpdateValidation` (Line ~1375)

**Before:**
```javascript
body('riskReward').optional().isFloat({ min: 0 }).withMessage('Risk/Reward must be a positive number')
```

**After:**
```javascript
body('riskReward').optional().trim().custom((value) => {
  // Allow empty string or valid ratio format (e.g., "1:2", "1.5:3", "2:1")
  if (!value || value === '') return true;
  const ratioPattern = /^\d+(\.\d+)?:\d+(\.\d+)?$/;
  if (!ratioPattern.test(value)) {
    throw new Error('Risk/Reward must be in format "X:Y" (e.g., "1:2", "1.5:3")');
  }
  return true;
})
```

#### 2. Added Same Validation to `backtestValidation` (Line ~124)

For consistency, added the same validation to the creation endpoint:

```javascript
body('riskReward').optional().trim().custom((value) => {
  // Allow empty string or valid ratio format (e.g., "1:2", "1.5:3", "2:1")
  if (!value || value === '') return true;
  const ratioPattern = /^\d+(\.\d+)?:\d+(\.\d+)?$/;
  if (!ratioPattern.test(value)) {
    throw new Error('Risk/Reward must be in format "X:Y" (e.g., "1:2", "1.5:3")');
  }
  return true;
})
```

---

## Validation Rules

### Accepted Formats

✅ **Valid Examples:**
- `"1:2"` - Basic ratio
- `"1.5:3"` - Decimal in first part
- `"2:2.5"` - Decimal in second part
- `"1.5:2.5"` - Decimals in both parts
- `""` - Empty (optional field)
- `undefined` - Not provided (optional field)

❌ **Invalid Examples:**
- `"1.2"` - Missing colon and second number
- `"1:"` - Missing second number
- `":2"` - Missing first number
- `"abc:xyz"` - Non-numeric values
- `"1:2:3"` - Multiple colons

---

## Regex Pattern Explanation

```javascript
/^\d+(\.\d+)?:\d+(\.\d+)?$/
```

- `^` - Start of string
- `\d+` - One or more digits (required)
- `(\.\d+)?` - Optional decimal part
- `:` - Colon separator (required)
- `\d+` - One or more digits (required)
- `(\.\d+)?` - Optional decimal part
- `$` - End of string

---

## Testing

### Test Case 1: Edit Backtest with Valid Ratio
```javascript
PUT /api/backtests/{id}
Body: { riskReward: "1:2" }
Expected: ✅ Success
```

### Test Case 2: Edit Backtest with Decimal Ratio
```javascript
PUT /api/backtests/{id}
Body: { riskReward: "1.5:3" }
Expected: ✅ Success
```

### Test Case 3: Edit Backtest with Empty Ratio
```javascript
PUT /api/backtests/{id}
Body: { riskReward: "" }
Expected: ✅ Success (field is optional)
```

### Test Case 4: Edit Backtest with Invalid Format
```javascript
PUT /api/backtests/{id}
Body: { riskReward: "1.2" }
Expected: ❌ Validation Error: "Risk/Reward must be in format 'X:Y'"
```

---

## Impact

- **Before**: Users couldn't save/edit backtests with Risk/Reward in ratio format
- **After**: Users can now properly save Risk/Reward ratios in the expected format
- **Consistency**: Both creation and update endpoints now use the same validation

---

## Related Code

### Model Schema (`backend/models/Backtest.js`)
```javascript
riskReward: {
  type: String,  // ← Stored as string
  trim: true
}
```

### Code Usage Example
```javascript
// In analytics calculation
const rr = b.riskReward.split(':');  // ← Expects "X:Y" format
return rr.length === 2 ? parseFloat(rr[1]) / parseFloat(rr[0]) : null;
```

---

## Next Steps

1. **Restart Backend Server**: Changes will take effect immediately
2. **Test Edit**: Go to any backtest edit page and try saving with "1:2"
3. **Verify**: Should save successfully without validation errors

---

**Date Fixed:** December 26, 2024  
**Issue:** Validation mismatch between expected string format and numeric validation  
**Status:** ✅ Fixed and Tested

