# Win Rate Calculation - Test Example

## Test Scenario

### Sample Data
- **6 Winning Trades**
- **3 Losing Trades**
- **1 Break-Even Trade**
- **Total: 10 Trades**

---

## Before Fix ❌

### Formula Used
```javascript
winRate = (wins / totalTrades) * 100
winRate = (6 / 10) * 100
winRate = 60%
```

### Problem
- Break-even trade was counted in the denominator
- Artificially lowered the win rate
- Penalized traders for taking break-even trades

---

## After Fix ✅

### Formula Used
```javascript
winRate = (wins / (wins + losses)) * 100
winRate = (6 / (6 + 3)) * 100
winRate = (6 / 9) * 100
winRate = 66.67%
```

### Benefits
- Break-even trades are excluded from calculation
- More accurate representation of trading performance
- Win rate only considers decisive outcomes (wins vs losses)

---

## Real-World Impact

### Example 1: Conservative Trader
- 10 wins, 5 losses, 5 break-even
- **Old:** 50% win rate (10/20)
- **New:** 66.67% win rate (10/15)
- **Difference:** +16.67%

### Example 2: Aggressive Trader
- 15 wins, 10 losses, 0 break-even
- **Old:** 60% win rate (15/25)
- **New:** 60% win rate (15/25)
- **Difference:** No change (correct behavior)

### Example 3: Risk-Averse Trader
- 8 wins, 2 losses, 10 break-even
- **Old:** 40% win rate (8/20)
- **New:** 80% win rate (8/10)
- **Difference:** +40%

---

## Edge Cases Handled

### All Break-Even Trades
```javascript
wins = 0, losses = 0, breakEven = 10
winRate = (0 + 0) > 0 ? (0 / (0 + 0)) * 100 : 0
winRate = 0% (or N/A)
```

### Only Wins and Break-Even
```javascript
wins = 8, losses = 0, breakEven = 2
winRate = (8 + 0) > 0 ? (8 / (8 + 0)) * 100 : 0
winRate = 100%
```

### Only Losses and Break-Even
```javascript
wins = 0, losses = 5, breakEven = 5
winRate = (0 + 5) > 0 ? (0 / (0 + 5)) * 100 : 0
winRate = 0%
```

---

## Testing Checklist

- [ ] Create backtests with mix of wins, losses, and break-even
- [ ] Verify win rate on Backtests list page
- [ ] Check Backtest Analytics dashboard
- [ ] Verify Pattern Performance page
- [ ] Check Master Card statistics
- [ ] Verify Combined Master Cards analytics
- [ ] Test time-based analytics (hourly, daily, weekly, monthly)
- [ ] Check label/chip performance statistics
- [ ] Verify confidence level impact analysis
- [ ] Test market condition performance
- [ ] Check direction (Long/Short) performance
- [ ] Verify instrument performance

---

## SQL/MongoDB Query Example

### Old Query (Incorrect)
```javascript
const winRate = (wins / totalTrades) * 100;
// Includes break-even in denominator
```

### New Query (Correct)
```javascript
const wins = backtests.filter(b => b.result === 'win').length;
const losses = backtests.filter(b => b.result === 'loss').length;
const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
// Excludes break-even trades
```

---

**Note:** This fix applies to the entire backtest module including all analytics pages and aggregation pipelines.

