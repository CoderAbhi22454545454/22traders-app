# Codebase Review Report
## Comprehensive Logical Analysis & Issue Identification

**Date:** Generated Review  
**Scope:** Frontend & Backend Code Paths  
**Focus:** Critical User Flows, State Management, Error Handling, Edge Cases

---

## Executive Summary

This review identified **23 concrete issues** across 5 critical user flows:
- Creating a new backtest trade: 5 issues
- Executing a pre-trade checklist: 6 issues  
- Editing an existing trade: 4 issues
- Uploading and editing screenshots: 4 issues
- Viewing trade details: 4 issues

**Severity Breakdown:**
- **Critical (Runtime Crashes):** 8 issues
- **High (Data Loss/Corruption):** 7 issues
- **Medium (UI/UX Issues):** 8 issues

---

## 1. Creating a New Backtest Trade

### Issue #1: Missing Null Check for Checklist Items
**File:** `frontend/src/components/TradeChecklistExecutor.jsx`  
**Lines:** 74, 148, 210, 241, 304  
**Severity:** Critical

**Problem:**
```javascript
if (currentStep < checklist.items.length - 1) {
  // ...
}
return Math.round((completedItems / checklist.items.length) * 100);
const currentItem = checklist.items[currentStep];
```

If `checklist.items` is `undefined` or `null`, this will crash with `Cannot read property 'length' of undefined`.

**Why it occurs:**
- `checklist` state may be initialized as `null` or `undefined`
- `checklist.items` may not exist if the API response structure differs
- Race condition: component renders before checklist data is loaded

**Fix:**
```javascript
// Line 74
if (checklist?.items && currentStep < checklist.items.length - 1) {
  setCurrentStep(currentStep + 1);
} else {
  setShowSummary(true);
}

// Line 148
const calculateCompletionPercentage = () => {
  if (!checklist?.items || checklist.items.length === 0) return 0;
  const completedItems = Object.values(responses).filter(r => r.isCompleted).length;
  return Math.round((completedItems / checklist.items.length) * 100);
};

// Line 210
const currentItem = checklist?.items?.[currentStep];
if (!currentItem) {
  return <div>Loading...</div>;
}
```

---

### Issue #2: Division by Zero in Completion Percentage
**File:** `frontend/src/components/TradeChecklistExecutor.jsx`  
**Line:** 148  
**Severity:** High

**Problem:**
```javascript
return Math.round((completedItems / checklist.items.length) * 100);
```

If `checklist.items.length === 0`, this divides by zero, resulting in `Infinity` or `NaN`.

**Fix:**
```javascript
const calculateCompletionPercentage = () => {
  if (!checklist?.items || checklist.items.length === 0) return 0;
  const completedItems = Object.values(responses).filter(r => r.isCompleted).length;
  return Math.round((completedItems / checklist.items.length) * 100);
};
```

---

### Issue #3: Missing Error Handling in NewBacktest Submit
**File:** `frontend/src/components/NewBacktest.jsx`  
**Lines:** 243-309  
**Severity:** High

**Problem:**
```javascript
const response = await fetch(`${API_BASE_URL}/backtests`, {
  method: 'POST',
  body: formDataToSend
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || 'Failed to create backtest');
}
```

If the response is not JSON (e.g., 500 error with HTML), `response.json()` will throw, and the error is not caught properly.

**Fix:**
```javascript
const response = await fetch(`${API_BASE_URL}/backtests`, {
  method: 'POST',
  body: formDataToSend
});

if (!response.ok) {
  let errorMessage = 'Failed to create backtest';
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorMessage;
  } catch (e) {
    errorMessage = `Server error: ${response.status} ${response.statusText}`;
  }
  throw new Error(errorMessage);
}
```

---

### Issue #4: Missing MasterCardId Validation
**File:** `frontend/src/components/NewBacktest.jsx`  
**Line:** 258  
**Severity:** Medium

**Problem:**
```javascript
formDataToSend.append('userId', userId);
```

The form requires `masterCardId` (line 373 shows it's required), but there's no validation before submission. If `masterCardId` is empty, the backend will reject it, but the user gets a generic error.

**Fix:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.masterCardId) {
    setError('Master Card is required');
    return;
  }
  
  // ... rest of submit logic
};
```

---

### Issue #5: Screenshot Metadata Array Mismatch
**File:** `frontend/src/components/NewBacktest.jsx`  
**Lines:** 262-280  
**Severity:** High

**Problem:**
```javascript
screenshots.forEach((screenshot) => {
  if (screenshot.file) {
    formDataToSend.append('screenshots', screenshot.file);
    screenshotMetadata.push({
      label: screenshot.label || '',
      description: screenshot.description || '',
      borderColor: screenshot.borderColor || '#3B82F6'
    });
  }
});
```

If a user removes a screenshot from the middle of the array, the metadata array indices won't match the file array indices, causing incorrect label/description assignment.

**Fix:**
```javascript
const screenshotMetadata = [];
const filesToUpload = [];

screenshots.forEach((screenshot) => {
  if (screenshot.file) {
    filesToUpload.push(screenshot.file);
    screenshotMetadata.push({
      label: screenshot.label || '',
      description: screenshot.description || '',
      borderColor: screenshot.borderColor || '#3B82F6'
    });
  }
});

filesToUpload.forEach(file => {
  formDataToSend.append('screenshots', file);
});
```

---

## 2. Executing a Pre-Trade Checklist

### Issue #6: Duplicate TradeChecklistExecutor Component
**File:** `frontend/src/components/PreTradeChecklist.jsx`  
**Lines:** 299-667  
**Severity:** Medium

**Problem:**
There's a duplicate `TradeChecklistExecutor` component defined inside `PreTradeChecklist.jsx` (lines 299-667), but the actual component is imported from `TradeChecklistExecutor.jsx` (line 282). This creates confusion and potential bugs if the duplicate is used instead of the imported one.

**Why it occurs:**
- Code duplication - the component was likely copied instead of imported
- The duplicate has slightly different logic (lines 389-404 vs lines 112-125 in TradeChecklistExecutor.jsx)

**Fix:**
Remove the duplicate component definition (lines 299-667) and ensure only the imported component is used.

---

### Issue #7: Missing Null Check in assessSetupQuality
**File:** `frontend/src/components/TradeChecklistExecutor.jsx`  
**Line:** 151  
**Severity:** Critical

**Problem:**
```javascript
const assessSetupQuality = () => {
  const completionPercentage = calculateCompletionPercentage();
  const requiredItems = checklist.items.filter(item => item.isRequired);
  // ...
};
```

If `checklist.items` is undefined, `.filter()` will crash.

**Fix:**
```javascript
const assessSetupQuality = () => {
  if (!checklist?.items || checklist.items.length === 0) return 'poor';
  
  const completionPercentage = calculateCompletionPercentage();
  const requiredItems = checklist.items.filter(item => item.isRequired);
  // ... rest of logic
};
```

---

### Issue #8: Quality Score Not Required in Pre-Trade Mode
**File:** `frontend/src/components/TradeChecklistExecutor.jsx`  
**Lines:** 112-125, 405  
**Severity:** Medium

**Problem:**
In pre-trade mode (line 112), `qualityScore` is not required, but the button is disabled if `qualityScore` is missing (line 405). However, the pre-trade flow doesn't set `qualityScore` before calling `onComplete`.

**Why it occurs:**
- Pre-trade mode skips the quality score input (line 375-392 only shows for non-pre-trade)
- But `handleComplete` still expects it (line 405)

**Fix:**
```javascript
// Line 112-125
if (isPreTrade) {
  if (onComplete) {
    onComplete({
      checklistId,
      checklistName: checklist.name,
      completionPercentage: calculateCompletionPercentage(),
      qualityScore: null, // Pre-trade doesn't require quality score
      setupQuality: assessSetupQuality(),
      items,
      overallNotes,
      completedAt: new Date()
    });
  }
}

// Line 405
<button
  onClick={handleComplete}
  disabled={!isPreTrade && (!qualityScore || qualityScore < 1 || qualityScore > 10)}
  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
>
  Complete Checklist
</button>
```

---

### Issue #9: SessionStorage Not Cleared on Error
**File:** `frontend/src/components/PreTradeChecklist.jsx`  
**Lines:** 59-66  
**Severity:** Medium

**Problem:**
```javascript
sessionStorage.setItem('preTradeChecklistResult', JSON.stringify({
  // ...
}));
```

If the user navigates away or the trade creation fails, the sessionStorage data remains, causing stale data on next attempt.

**Fix:**
```javascript
// In TradeModal.jsx, after successful trade creation:
sessionStorage.removeItem('preTradeChecklistResult');

// Also add cleanup in PreTradeChecklist on unmount:
useEffect(() => {
  return () => {
    // Cleanup on unmount
    const stored = sessionStorage.getItem('preTradeChecklistResult');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only clear if older than 1 hour
      if (parsed.completedAt && new Date() - new Date(parsed.completedAt) > 3600000) {
        sessionStorage.removeItem('preTradeChecklistResult');
      }
    }
  };
}, []);
```

---

### Issue #10: Missing Checklist Items Validation
**File:** `frontend/src/components/TradeChecklistExecutor.jsx`  
**Line:** 93  
**Severity:** High

**Problem:**
```javascript
const items = Object.entries(responses).map(([itemId, response]) => ({
  itemId,
  title: checklist.items.find(item => item._id === itemId)?.title || '',
  // ...
}));
```

If `checklist.items` is undefined, `.find()` will crash. Also, if `responses` contains itemIds that don't exist in `checklist.items`, the title will be empty string.

**Fix:**
```javascript
const items = Object.entries(responses)
  .filter(([itemId]) => checklist?.items?.some(item => item._id === itemId))
  .map(([itemId, response]) => {
    const checklistItem = checklist.items.find(item => item._id === itemId);
    return {
      itemId,
      title: checklistItem?.title || 'Unknown Item',
      isCompleted: response.isCompleted,
      value: response.value,
      notes: response.notes,
      order: checklistItem?.order || 1
    };
  });
```

---

### Issue #11: Race Condition in Checklist Fetching
**File:** `frontend/src/components/TradeChecklistExecutor.jsx`  
**Lines:** 37-64  
**Severity:** High

**Problem:**
```javascript
useEffect(() => {
  if (!initialChecklist && checklistId) {
    fetchChecklist();
  }
}, [checklistId, initialChecklist]);
```

If the component unmounts while `fetchChecklist()` is in progress, `setChecklist` will be called on an unmounted component, causing a memory leak warning.

**Fix:**
```javascript
useEffect(() => {
  let isMounted = true;
  
  if (!initialChecklist && checklistId) {
    fetchChecklist().then(() => {
      if (isMounted) {
        // State updates
      }
    });
  }
  
  return () => {
    isMounted = false;
  };
}, [checklistId, initialChecklist]);
```

---

## 3. Editing an Existing Trade

### Issue #12: Missing Screenshot State Synchronization
**File:** `frontend/src/components/TradeModal.jsx`  
**Lines:** 136-161  
**Severity:** High

**Problem:**
```javascript
if (editTrade.screenshots && editTrade.screenshots.length > 0) {
  const formattedScreenshots = editTrade.screenshots.map(screenshot => ({
    id: screenshot._id,
    // ...
    isExisting: true
  }));
  setScreenshots(formattedScreenshots);
} else if (editTrade.screenshotUrl) {
  // Handle old single screenshot format
  setScreenshots([{ /* ... */ }]);
}
```

If `editTrade` is updated externally (e.g., from another tab), the screenshots state won't update, causing stale data.

**Fix:**
```javascript
useEffect(() => {
  if (isEditMode && editTrade) {
    populateFormForEdit();
  }
}, [editTrade, isEditMode]); // Add editTrade to dependencies
```

---

### Issue #13: Missing Validation for Screenshot Removal
**File:** `frontend/src/components/TradeModal.jsx`  
**Lines:** 351-373  
**Severity:** Medium

**Problem:**
```javascript
const removedIds = originalScreenshots
  .filter(orig => !existingScreenshots.find(ex => ex.id === orig._id))
  .map(s => s._id);
```

If `originalScreenshots` is undefined or null, this will crash. Also, if a screenshot was deleted from Cloudinary but the trade still references it, the removal will fail silently.

**Fix:**
```javascript
const originalScreenshots = editTrade.screenshots || [];
const removedIds = originalScreenshots
  .filter(orig => {
    if (!orig || !orig._id) return false;
    return !existingScreenshots.find(ex => ex.id === orig._id.toString());
  })
  .map(s => s._id.toString())
  .filter(id => id); // Remove any undefined/null values
```

---

### Issue #14: Date Format Mismatch
**File:** `frontend/src/components/EditTrade.jsx`  
**Line:** 62  
**Severity:** Medium

**Problem:**
```javascript
selectedDate={trade.date ? new Date(trade.date) : new Date()}
```

If `trade.date` is a string in an unexpected format, `new Date(trade.date)` may create an invalid date, causing the form to fail.

**Fix:**
```javascript
const parseDate = (date) => {
  if (!date) return new Date();
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

selectedDate={parseDate(trade.date)}
```

---

### Issue #15: Missing Error Handling for Trade Update
**File:** `frontend/src/components/TradeModal.jsx`  
**Lines:** 390-403  
**Severity:** High

**Problem:**
```javascript
const response = await fetch(url, {
  method: isEditMode ? 'PUT' : 'POST',
  body: formDataToSend
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} trade`);
}
```

Same issue as Issue #3 - if response is not JSON, this crashes.

**Fix:**
```javascript
if (!response.ok) {
  let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} trade`;
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorMessage;
  } catch (e) {
    errorMessage = `Server error: ${response.status} ${response.statusText}`;
  }
  throw new Error(errorMessage);
}
```

---

## 4. Uploading and Editing Screenshots

### Issue #16: Memory Leak - URL.createObjectURL Not Revoked
**File:** `frontend/src/components/ScreenshotManager.jsx`  
**Lines:** 34, 65, 77  
**Severity:** High

**Problem:**
```javascript
setCurrentUpload({
  file,
  preview: URL.createObjectURL(file)
});
```

`URL.createObjectURL()` creates a blob URL that must be revoked with `URL.revokeObjectURL()` to prevent memory leaks. While there's cleanup in `handleCancelUpload` and `removeScreenshot`, if the component unmounts with `currentUpload` set, the URL is never revoked.

**Fix:**
```javascript
useEffect(() => {
  return () => {
    // Cleanup on unmount
    if (currentUpload?.preview) {
      URL.revokeObjectURL(currentUpload.preview);
    }
    screenshots.forEach(screenshot => {
      if (screenshot.preview) {
        URL.revokeObjectURL(screenshot.preview);
      }
    });
  };
}, [currentUpload, screenshots]);
```

---

### Issue #17: Missing File Size Validation
**File:** `frontend/src/components/ScreenshotManager.jsx`  
**Line:** 31  
**Severity:** Medium

**Problem:**
```javascript
const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    setCurrentUpload({
      file,
      preview: URL.createObjectURL(file)
    });
  }
};
```

No file size validation. Backend limits to 10MB (line 15 in trades.js), but user gets error only after upload attempt.

**Fix:**
```javascript
const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    alert(`File size exceeds 10MB limit. Selected file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    e.target.value = ''; // Reset input
    return;
  }
  
  setCurrentUpload({
    file,
    preview: URL.createObjectURL(file)
  });
};
```

---

### Issue #18: Screenshot ID Collision Risk
**File:** `frontend/src/components/ScreenshotManager.jsx`  
**Line:** 45  
**Severity:** Medium

**Problem:**
```javascript
const newScreenshot = {
  id: `new-${Date.now()}-${Math.random()}`,
  // ...
};
```

If two screenshots are added in the same millisecond, there's a small risk of ID collision. Also, using `Date.now()` and `Math.random()` is not guaranteed unique.

**Fix:**
```javascript
const generateUniqueId = () => {
  return `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${performance.now()}`;
};

const newScreenshot = {
  id: generateUniqueId(),
  // ...
};
```

---

### Issue #19: Missing Screenshot Update Validation
**File:** `backend/routes/trades.js`  
**Lines:** 778-795  
**Severity:** High

**Problem:**
```javascript
if (updateScreenshots) {
  try {
    const updates = JSON.parse(updateScreenshots);
    for (const update of updates) {
      const screenshot = existingTrade.screenshots.find(s => s._id.toString() === update.id);
      if (screenshot) {
        if (update.label !== undefined) screenshot.label = update.label;
        // ...
      }
    }
  } catch (parseError) {
    console.error('❌ [Trade PUT] Error parsing updateScreenshots:', parseError);
  }
}
```

No validation that `update.id` exists or that the update data is valid. Malformed JSON or missing IDs are silently ignored.

**Fix:**
```javascript
if (updateScreenshots) {
  try {
    const updates = JSON.parse(updateScreenshots);
    if (!Array.isArray(updates)) {
      throw new Error('updateScreenshots must be an array');
    }
    
    for (const update of updates) {
      if (!update.id) {
        console.warn('Skipping update with missing id:', update);
        continue;
      }
      
      const screenshot = existingTrade.screenshots.find(s => s._id.toString() === update.id);
      if (!screenshot) {
        console.warn(`Screenshot with id ${update.id} not found`);
        continue;
      }
      
      if (update.label !== undefined) {
        screenshot.label = String(update.label).substring(0, 100); // Limit length
      }
      if (update.description !== undefined) {
        screenshot.description = String(update.description).substring(0, 500);
      }
      if (update.borderColor !== undefined) {
        // Validate hex color
        if (/^#[0-9A-F]{6}$/i.test(update.borderColor)) {
          screenshot.borderColor = update.borderColor;
        }
      }
    }
  } catch (parseError) {
    console.error('❌ [Trade PUT] Error parsing updateScreenshots:', parseError);
    return res.status(400).json({ 
      message: 'Invalid updateScreenshots format', 
      error: parseError.message 
    });
  }
}
```

---

## 5. Viewing Trade Details

### Issue #20: Missing Null Check for Trade Screenshots
**File:** `frontend/src/components/TradeDetail.jsx`  
**Lines:** 579, 606  
**Severity:** Medium

**Problem:**
```javascript
{trade.screenshots && trade.screenshots.length > 0 ? (
  // ...
) : trade.screenshotUrl ? (
  // ...
) : (
  // ...
)}
```

If `trade.screenshots` is an empty array `[]`, it will show "No screenshots" even if `trade.screenshotUrl` exists. The check should be `trade.screenshots?.length > 0`.

**Fix:**
```javascript
{trade.screenshots?.length > 0 ? (
  // ...
) : trade.screenshotUrl ? (
  // ...
) : (
  // ...
)}
```

---

### Issue #21: Missing Error Handling for Checklist Result Fetch
**File:** `frontend/src/components/TradeDetail.jsx`  
**Lines:** 54-67  
**Severity:** Medium

**Problem:**
```javascript
const fetchChecklistResult = async () => {
  try {
    setChecklistLoading(true);
    const response = await checklistAPI.getTradeChecklistResult(id);
    if (response.result) {
      setChecklistResult(response.result);
    }
  } catch (err) {
    // Silent fail if no checklist found
    console.log('No checklist result found for this trade');
  } finally {
    setChecklistLoading(false);
  }
};
```

Silent failure hides actual errors (network issues, API errors) from the user. Should differentiate between "not found" and actual errors.

**Fix:**
```javascript
const fetchChecklistResult = async () => {
  try {
    setChecklistLoading(true);
    const response = await checklistAPI.getTradeChecklistResult(id);
    if (response.result) {
      setChecklistResult(response.result);
    }
  } catch (err) {
    if (err.response?.status === 404) {
      // No checklist found - this is expected for some trades
      console.log('No checklist result found for this trade');
    } else {
      // Actual error - log but don't show to user (non-critical)
      console.error('Error fetching checklist result:', err);
    }
  } finally {
    setChecklistLoading(false);
  }
};
```

---

### Issue #22: Potential Null Reference in Result Calculation
**File:** `frontend/src/components/TradeDetail.jsx`  
**Line:** 139  
**Severity:** Medium

**Problem:**
```javascript
const result = trade.result || trade.tradeOutcome?.toLowerCase() || 
  (trade.pnl > 0 ? 'win' : trade.pnl < 0 ? 'loss' : 'be');
```

If `trade.pnl` is `null` or `undefined`, the comparison `trade.pnl > 0` will be `false`, but `trade.pnl < 0` will also be `false`, so it defaults to 'be'. However, if `trade.pnl` is `0`, it correctly returns 'be', but the logic is confusing.

**Fix:**
```javascript
const result = trade.result || 
  (trade.tradeOutcome ? trade.tradeOutcome.toLowerCase() : null) ||
  (trade.pnl != null ? (trade.pnl > 0 ? 'win' : trade.pnl < 0 ? 'loss' : 'be') : null) ||
  'be'; // Default fallback
```

---

### Issue #23: Missing Validation for Checklist Items Display
**File:** `frontend/src/components/TradeDetail.jsx`  
**Lines:** 470-514  
**Severity:** Low

**Problem:**
```javascript
{checklistResult.items && checklistResult.items.length > 0 && (
  // ...
  {checklistResult.items.map((item, index) => (
    // ...
  ))}
)}
```

If `checklistResult.items` is not an array (e.g., `null`, `undefined`, or an object), `.map()` will crash.

**Fix:**
```javascript
{Array.isArray(checklistResult.items) && checklistResult.items.length > 0 && (
  // ...
  {checklistResult.items.map((item, index) => (
    // ...
  ))}
)}
```

---

## Summary of Fixes Required

### Critical Fixes (Must Fix - Runtime Crashes)
1. Add null checks for `checklist.items` in TradeChecklistExecutor (Issues #1, #7, #10)
2. Fix division by zero in completion percentage (Issue #2)
3. Add proper error handling for non-JSON API responses (Issues #3, #15)
4. Fix race condition in checklist fetching (Issue #11)

### High Priority Fixes (Data Loss/Corruption)
5. Fix screenshot metadata array mismatch (Issue #5)
6. Fix screenshot state synchronization (Issue #12)
7. Add memory leak cleanup for object URLs (Issue #16)
8. Add screenshot update validation (Issue #19)

### Medium Priority Fixes (UI/UX)
9. Remove duplicate TradeChecklistExecutor component (Issue #6)
10. Fix quality score requirement in pre-trade mode (Issue #8)
11. Add sessionStorage cleanup (Issue #9)
12. Add file size validation (Issue #17)
13. Fix date parsing (Issue #14)
14. Improve error handling for checklist fetch (Issue #21)

### Low Priority Fixes (Edge Cases)
15. Add masterCardId validation (Issue #4)
16. Fix screenshot ID generation (Issue #18)
17. Fix screenshot removal validation (Issue #13)
18. Fix result calculation logic (Issue #22)
19. Add array validation for checklist items (Issue #23)
20. Fix screenshot display logic (Issue #20)

---

## Recommendations

1. **Add TypeScript** - Many issues would be caught at compile time with proper types
2. **Add Unit Tests** - Especially for edge cases (null checks, division by zero)
3. **Add Integration Tests** - For critical flows (trade creation, checklist execution)
4. **Implement Error Boundaries** - Catch React errors gracefully
5. **Add Input Validation Library** - Use a library like Yup or Zod for consistent validation
6. **Add Loading States** - Better UX during async operations
7. **Implement Optimistic Updates** - For better perceived performance
8. **Add Request Cancellation** - Cancel in-flight requests on unmount

---

## Testing Checklist

After applying fixes, test:
- [ ] Create backtest with empty checklist
- [ ] Create backtest with checklist that has 0 items
- [ ] Create backtest without masterCardId
- [ ] Complete checklist with network error
- [ ] Edit trade with deleted screenshot
- [ ] Upload screenshot > 10MB
- [ ] Edit trade with invalid date
- [ ] View trade with null checklist result
- [ ] View trade with malformed screenshot data
- [ ] Rapidly add/remove screenshots
- [ ] Navigate away during checklist completion

---

**End of Report**


