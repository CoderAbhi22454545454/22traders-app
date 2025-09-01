import React from 'react';
import { 
  ChartBarIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  LightBulbIcon,
  CogIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ClockIcon,
  FireIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const JournalTemplates = ({ onSelectTemplate, onClose }) => {
  const templates = [
    {
      id: 'trade-entry-planner',
      name: 'Trade Entry Planner',
      description: 'Comprehensive planning template for trade entries with risk management',
      icon: CurrencyDollarIcon,
      color: 'emerald',
      content: `<h2>🎯 Trade Entry Planner - ${new Date().toLocaleDateString()}</h2>

<h3>📋 Trade Setup Information</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #ecfdf5;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Field</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Value</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Instrument</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[e.g., EUR/USD, Gold, Bitcoin]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Timeframe</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[e.g., M15, H1, H4, Daily]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Setup Type</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Breakout / Pullback / Reversal / Continuation]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Strategy Name</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Your strategy name]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Market Session</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Asian / London / NY / Overlap]</td>
  </tr>
</table>

<h3>📊 Technical Analysis</h3>
<p><strong>Trend Analysis:</strong></p>
<ul>
  <li><strong>Higher Timeframe Trend:</strong> [Bullish / Bearish / Sideways]</li>
  <li><strong>Lower Timeframe Trend:</strong> [Bullish / Bearish / Sideways]</li>
  <li><strong>Trend Strength:</strong> [Strong / Moderate / Weak]</li>
</ul>

<p><strong>Key Levels:</strong></p>
<ul>
  <li><strong>Resistance:</strong> [Level] - [Description]</li>
  <li><strong>Support:</strong> [Level] - [Description]</li>
  <li><strong>Current Price:</strong> [Level]</li>
  <li><strong>Entry Zone:</strong> [Price range]</li>
</ul>

<p><strong>Technical Indicators:</strong></p>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #f0fdf4;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Indicator</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Value</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Signal</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Confidence</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">RSI (14)</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Value]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Bullish/Bearish/Neutral]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[1-10]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">MACD</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Values]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Bullish/Bearish/Neutral]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[1-10]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Moving Averages</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[20, 50, 200 values]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Above/Below/Crossing]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[1-10]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Volume</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[High/Medium/Low]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Confirming/Diverging]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[1-10]</td>
  </tr>
</table>

<h3>🎯 Entry Plan</h3>
<p><strong>Direction:</strong> [Long / Short]</p>
<p><strong>Entry Strategy:</strong></p>
<ul>
  <li><strong>Entry Price:</strong> [Exact entry level]</li>
  <li><strong>Entry Trigger:</strong> [What condition must be met?]</li>
  <li><strong>Entry Timeframe:</strong> [Which TF to use for entry]</li>
  <li><strong>Entry Type:</strong> [Market / Limit / Stop]</li>
</ul>

<h3>🛡️ Risk Management</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #fef2f2;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Parameter</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Value</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Calculation</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Stop Loss</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Price level]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Distance in pips/points]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Take Profit 1</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Price level]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[R:R ratio]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Take Profit 2</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Price level]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[R:R ratio]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Position Size</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Lot size / Units]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Based on risk %]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Risk Amount</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[$ amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[% of account]</td>
  </tr>
</table>

<h3>📈 Market Context</h3>
<p><strong>Market Conditions:</strong></p>
<ul>
  <li><strong>Volatility:</strong> [High / Medium / Low]</li>
  <li><strong>Liquidity:</strong> [High / Medium / Low]</li>
  <li><strong>Correlation:</strong> [Positive / Negative / None] with [Instrument]</li>
  <li><strong>Seasonal Factors:</strong> [Any relevant patterns]</li>
</ul>

<p><strong>News & Events:</strong></p>
<ul>
  <li><strong>Upcoming Events:</strong> [Economic releases, central bank meetings]</li>
  <li><strong>Event Impact:</strong> [High / Medium / Low]</li>
  <li><strong>Timing:</strong> [How this affects entry timing]</li>
</ul>

<h3>✅ Pre-Entry Checklist</h3>
<div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
  <ul style="list-style: none; padding: 0;">
    <li style="margin-bottom: 8px;">☐ Technical setup confirmed on multiple timeframes</li>
    <li style="margin-bottom: 8px;">☐ Risk management calculated and verified</li>
    <li style="margin-bottom: 8px;">☐ No conflicting news events within 2 hours</li>
    <li style="margin-bottom: 8px;">☐ Proper market hours for instrument</li>
    <li style="margin-bottom: 8px;">☐ Good liquidity conditions</li>
    <li style="margin-bottom: 8px;">☐ Mental state is optimal (1-10 rating: ___)</li>
    <li style="margin-bottom: 8px;">☐ Account has sufficient margin</li>
    <li style="margin-bottom: 8px;">☐ Stop loss and take profit orders ready</li>
    <li style="margin-bottom: 8px;">☐ Position size calculated correctly</li>
    <li style="margin-bottom: 8px;">☐ Trade journal entry prepared</li>
  </ul>
</div>

<h3>📝 Additional Notes</h3>
<p>[Any additional observations, concerns, or thoughts about this setup]</p>

<h3>🎯 Confidence Assessment</h3>
<p><strong>Setup Confidence Level (1-10):</strong> ___</p>
<p><strong>Expected Holding Time:</strong> [Minutes/Hours/Days]</p>
<p><strong>Success Probability:</strong> [High/Medium/Low]</p>

<hr>
<p><em>Planner Created: ${new Date().toLocaleString()} | Next Review: [Time] | Status: [Planning/Ready/Executed]</em></p>`,
      tags: ['planning', 'entry', 'setup', 'risk-management'],
      mood: 'analytical'
    },
    {
      id: 'daily-review',
      name: 'Daily Trading Review',
      description: 'Reflect on today\'s trading session and key lessons learned',
      icon: CalendarDaysIcon,
      color: 'blue',
      content: `<h2>📅 Daily Trading Review - ${new Date().toLocaleDateString()}</h2>

<h3>📊 Market Overview</h3>
<p><strong>Overall Market Sentiment:</strong> Bullish / Bearish / Neutral</p>
<p><strong>Major Economic Events:</strong></p>
<ul>
  <li>News releases that affected the market</li>
  <li>Central bank announcements</li>
  <li>Earnings reports or economic data</li>
</ul>
<p><strong>Market Volatility:</strong> High / Medium / Low</p>

<h3>💼 Trading Summary</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #f5f5f5;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Metric</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Value</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Total Trades</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Enter number]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Winning Trades</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Enter number]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Losing Trades</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Enter number]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Net P&L</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Enter amount]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Win Rate</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Enter percentage]</td>
  </tr>
</table>

<h3>🎯 What Went Well Today</h3>
<ul>
  <li><strong>Discipline:</strong> Did I stick to my trading plan?</li>
  <li><strong>Risk Management:</strong> Did I manage my risk properly?</li>
  <li><strong>Patience:</strong> Did I wait for quality setups?</li>
  <li><strong>Execution:</strong> How was my trade execution?</li>
</ul>

<h3>⚠️ Areas for Improvement</h3>
<ul>
  <li><strong>Mistakes Made:</strong> What specific errors occurred?</li>
  <li><strong>Emotional Reactions:</strong> How did emotions affect my trading?</li>
  <li><strong>Rule Violations:</strong> Which trading rules did I break?</li>
  <li><strong>Missed Opportunities:</strong> What good setups did I miss?</li>
</ul>

<h3>📝 Key Lessons Learned</h3>
<blockquote style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; font-style: italic;">
What did I learn today that will make me a better trader tomorrow?
</blockquote>

<h3>🎯 Tomorrow's Action Plan</h3>
<ol>
  <li><strong>Primary Focus:</strong> What will be my main focus tomorrow?</li>
  <li><strong>Instruments to Watch:</strong> Which pairs/instruments to monitor?</li>
  <li><strong>Risk Parameters:</strong> Maximum risk per trade and daily loss limit</li>
  <li><strong>Strategy to Use:</strong> Which strategy fits current market conditions?</li>
</ol>

<hr>
<p><em>Session Rating (1-10): ___ | Confidence Level: ___ | Stress Level: ___</em></p>`,
      tags: ['daily', 'review', 'reflection', 'performance'],
      mood: 'reflective'
    },
    {
      id: 'pre-market-analysis',
      name: 'Pre-Market Analysis',
      description: 'Prepare for the trading session with market analysis and planning',
      icon: ClockIcon,
      color: 'green',
      content: `<h2>🌅 Pre-Market Analysis - ${new Date().toLocaleDateString()}</h2>

<h3>📊 Market Environment Check</h3>
<p><strong>Session:</strong> Asian / London / New York / Overlap</p>
<p><strong>Market Open Time:</strong> [Enter local time]</p>
<p><strong>Expected Volatility:</strong> High / Medium / Low</p>

<h3>📰 Economic Calendar</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #f0fdf4;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Time</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Event</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Currency</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Impact</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">[Time]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Event]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Currency]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">High/Medium/Low</td>
  </tr>
</table>

<h3>🎯 Trading Plan</h3>
<p><strong>Primary Strategy:</strong> [Breakout / Trend Following / Mean Reversion / Scalping]</p>
<p><strong>Instruments to Trade:</strong></p>
<ul>
  <li>Primary: [Enter main instrument to focus on]</li>
  <li>Secondary: [Enter backup instruments]</li>
  <li>Avoid: [Instruments to avoid today]</li>
</ul>

<h3>⚡ Key Levels to Watch</h3>
<p><strong>EUR/USD:</strong></p>
<ul>
  <li>Resistance: [Enter level]</li>
  <li>Support: [Enter level]</li>
</ul>
<p><strong>GBP/USD:</strong></p>
<ul>
  <li>Resistance: [Enter level]</li>
  <li>Support: [Enter level]</li>
</ul>
<p><strong>Gold (XAU/USD):</strong></p>
<ul>
  <li>Resistance: [Enter level]</li>
  <li>Support: [Enter level]</li>
</ul>

<h3>🛡️ Risk Management</h3>
<ul>
  <li><strong>Max Risk Per Trade:</strong> [Enter percentage or amount]</li>
  <li><strong>Daily Loss Limit:</strong> [Enter amount]</li>
  <li><strong>Position Size:</strong> [Enter lot size]</li>
  <li><strong>Stop Loss Strategy:</strong> [Technical / ATR-based / Fixed]</li>
</ul>

<h3>🧠 Mental Preparation</h3>
<p><strong>Current Mood:</strong> [1-10 scale]</p>
<p><strong>Confidence Level:</strong> [1-10 scale]</p>
<p><strong>Energy Level:</strong> [1-10 scale]</p>
<p><strong>Distractions:</strong> [Any personal/external factors affecting focus?]</p>

<blockquote style="border-left: 4px solid #10b981; padding-left: 16px; margin: 16px 0;">
<strong>Today's Affirmation:</strong><br>
I will trade with discipline, patience, and proper risk management. I will only take high-probability setups that align with my strategy.
</blockquote>`,
      tags: ['preparation', 'analysis', 'planning', 'pre-market'],
      mood: 'confident'
    },
    {
      id: 'trade-setup',
      name: 'Trade Setup Analysis',
      description: 'Detailed analysis of a specific trade setup and entry plan',
      icon: CurrencyDollarIcon,
      color: 'indigo',
      content: `<h2>🎯 Trade Setup Analysis</h2>

<h3>📋 Setup Overview</h3>
<p><strong>Instrument:</strong> [e.g., EUR/USD, Gold, Bitcoin]</p>
<p><strong>Timeframe:</strong> [e.g., H1, H4, Daily]</p>
<p><strong>Setup Type:</strong> [Breakout / Pullback / Reversal / Continuation]</p>
<p><strong>Strategy:</strong> [Name of your trading strategy]</p>
<p><strong>Date/Time Identified:</strong> ${new Date().toLocaleString()}</p>

<h3>📊 Technical Analysis</h3>
<p><strong>Trend Direction:</strong></p>
<ul>
  <li>Overall Trend (HTF): Bullish / Bearish / Sideways</li>
  <li>Immediate Trend (LTF): Bullish / Bearish / Sideways</li>
</ul>

<p><strong>Key Levels:</strong></p>
<ul>
  <li><strong>Resistance:</strong> [Enter price level and description]</li>
  <li><strong>Support:</strong> [Enter price level and description]</li>
  <li><strong>Current Price:</strong> [Enter current market price]</li>
</ul>

<p><strong>Technical Indicators:</strong></p>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #eef2ff;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Indicator</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Value</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Signal</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">RSI</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Value]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Bullish/Bearish/Neutral</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">MACD</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Value]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Bullish/Bearish/Neutral</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Moving Averages</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Values]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Above/Below/Crossing</td>
  </tr>
</table>

<h3>🎯 Trade Plan</h3>
<p><strong>Direction:</strong> Long / Short</p>
<p><strong>Entry Strategy:</strong></p>
<ul>
  <li>Entry Price: [Exact entry level]</li>
  <li>Entry Trigger: [What condition must be met?]</li>
  <li>Entry Timeframe: [Which TF to use for entry]</li>
</ul>

<p><strong>Risk Management:</strong></p>
<ul>
  <li><strong>Stop Loss:</strong> [Price level] ([Distance in pips/points])</li>
  <li><strong>Take Profit 1:</strong> [Price level] ([R:R ratio])</li>
  <li><strong>Take Profit 2:</strong> [Price level] ([R:R ratio])</li>
  <li><strong>Position Size:</strong> [Lot size / Units]</li>
  <li><strong>Risk Amount:</strong> [$ amount or % of account]</li>
</ul>

<h3>📈 Market Context</h3>
<p><strong>Market Session:</strong> [Asian/London/NY/Overlap]</p>
<p><strong>Volume Conditions:</strong> High / Medium / Low</p>
<p><strong>Volatility:</strong> High / Medium / Low</p>
<p><strong>News Events:</strong> [Any relevant upcoming news]</p>

<h3>✅ Entry Checklist</h3>
<ul>
  <li>☐ Technical setup confirmed</li>
  <li>☐ Risk management calculated</li>
  <li>☐ No conflicting news events</li>
  <li>☐ Proper market hours</li>
  <li>☐ Good liquidity conditions</li>
  <li>☐ Mental state is optimal</li>
</ul>

<h3>📝 Additional Notes</h3>
<p>[Any additional observations, concerns, or thoughts about this setup]</p>

<hr>
<p><em>Setup Confidence Level (1-10): ___ | Expected Holding Time: ___</em></p>`,
      tags: ['setup', 'entry', 'analysis', 'planning'],
      mood: 'analytical'
    },
    {
      id: 'monthly-performance',
      name: 'Monthly Performance Review',
      description: 'Comprehensive monthly analysis of trading performance',
      icon: TrophyIcon,
      color: 'yellow',
      content: `<h2>📊 Monthly Performance Review - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>

<h3>🎯 Performance Summary</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #fefce8;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Metric</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>This Month</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Last Month</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Change</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Total Trades</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Number]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Number]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[+/- %]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Win Rate</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[%]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[%]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[+/- %]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Net P&L</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[+/- %]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Avg Win</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[+/- %]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Avg Loss</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[+/- %]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Profit Factor</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Ratio]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Ratio]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[+/- %]</td>
  </tr>
</table>

<h3>🏆 Best Performing Strategies</h3>
<ol>
  <li><strong>[Strategy Name]</strong> - Win Rate: [%] | Net P&L: [Amount]</li>
  <li><strong>[Strategy Name]</strong> - Win Rate: [%] | Net P&L: [Amount]</li>
  <li><strong>[Strategy Name]</strong> - Win Rate: [%] | Net P&L: [Amount]</li>
</ol>

<h3>📉 Underperforming Areas</h3>
<ul>
  <li><strong>Worst Strategy:</strong> [Strategy name] - Loss: [Amount]</li>
  <li><strong>Problematic Instruments:</strong> [List instruments with poor performance]</li>
  <li><strong>Timing Issues:</strong> [Sessions or times with poor performance]</li>
</ul>

<h3>🧠 Psychological Analysis</h3>
<p><strong>Emotional Patterns Observed:</strong></p>
<ul>
  <li>Most common emotional triggers: [List triggers]</li>
  <li>Impact of emotions on performance: [Describe impact]</li>
  <li>Successful coping strategies used: [List strategies]</li>
</ul>

<p><strong>Discipline Assessment:</strong></p>
<ul>
  <li>Rule adherence rate: [Percentage]</li>
  <li>Most frequently broken rules: [List rules]</li>
  <li>Improvement in discipline over the month: [Describe]</li>
</ul>

<h3>📊 Market Conditions Analysis</h3>
<p><strong>Dominant Market Theme:</strong> [Trending / Ranging / Volatile]</p>
<p><strong>Best Performing Sessions:</strong> [Asian / London / NY]</p>
<p><strong>Most Profitable Instruments:</strong> [List top 3]</p>
<p><strong>Market Events Impact:</strong> [How news/events affected performance]</p>

<h3>🎯 Goals Achievement</h3>
<p><strong>Monthly Goals Set:</strong></p>
<ul>
  <li>Goal 1: [Description] - Status: ✅ Achieved / ❌ Not Achieved</li>
  <li>Goal 2: [Description] - Status: ✅ Achieved / ❌ Not Achieved</li>
  <li>Goal 3: [Description] - Status: ✅ Achieved / ❌ Not Achieved</li>
</ul>

<h3>🔄 Action Plan for Next Month</h3>
<ol>
  <li><strong>Strategy Adjustments:</strong> [What changes to make?]</li>
  <li><strong>Risk Management:</strong> [Any risk parameter changes?]</li>
  <li><strong>Skill Development:</strong> [What skills to focus on?]</li>
  <li><strong>Psychological Work:</strong> [What mental aspects to improve?]</li>
  <li><strong>New Goals:</strong> [Set specific, measurable goals]</li>
</ol>

<blockquote style="border-left: 4px solid #f59e0b; padding-left: 16px; margin: 16px 0; font-style: italic;">
<strong>Key Insight:</strong> What is the most important lesson from this month that will guide my trading going forward?
</blockquote>

<hr>
<p><em>Overall Month Rating (1-10): ___ | Satisfaction Level: ___ | Progress Made: ___</em></p>`,
      tags: ['monthly', 'performance', 'review', 'analysis', 'goals'],
      mood: 'reflective'
    },
    {
      id: 'risk-management',
      name: 'Risk Management Review',
      description: 'Analyze and improve your risk management practices',
      icon: ExclamationTriangleIcon,
      color: 'red',
      content: `<h2>🛡️ Risk Management Review - ${new Date().toLocaleDateString()}</h2>

<h3>📊 Current Risk Parameters</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #fef2f2;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Parameter</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Current Setting</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Performance</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Risk per Trade</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[% or $ amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Effective / Too High / Too Low</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Daily Loss Limit</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[$ amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Effective / Too High / Too Low</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Max Open Positions</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Number]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Effective / Too High / Too Low</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Stop Loss Strategy</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Type]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Effective / Needs Adjustment</td>
  </tr>
</table>

<h3>📈 Risk-Adjusted Performance</h3>
<p><strong>Recent Risk Metrics:</strong></p>
<ul>
  <li><strong>Largest Single Loss:</strong> [Amount] ([% of account])</li>
  <li><strong>Largest Drawdown:</strong> [Amount] ([% of account])</li>
  <li><strong>Average Risk per Trade:</strong> [Amount] ([% of account])</li>
  <li><strong>Risk-Reward Ratio:</strong> [Average ratio]</li>
  <li><strong>Sharpe Ratio:</strong> [If calculated]</li>
</ul>

<h3>⚠️ Risk Events Analysis</h3>
<p><strong>Times When Risk Rules Were Violated:</strong></p>
<ol>
  <li><strong>Date:</strong> [Date] - <strong>Violation:</strong> [Description] - <strong>Impact:</strong> [P&L impact]</li>
  <li><strong>Date:</strong> [Date] - <strong>Violation:</strong> [Description] - <strong>Impact:</strong> [P&L impact]</li>
  <li><strong>Date:</strong> [Date] - <strong>Violation:</strong> [Description] - <strong>Impact:</strong> [P&L impact]</li>
</ol>

<p><strong>Close Calls (Near Violations):</strong></p>
<ul>
  <li>[Describe situations where you almost violated risk rules]</li>
  <li>[What prevented the violation?]</li>
  <li>[What can be learned from these situations?]</li>
</ul>

<h3>🎯 Position Sizing Analysis</h3>
<p><strong>Current Position Sizing Method:</strong> [Fixed / Percentage / Volatility-based / Kelly Criterion]</p>
<p><strong>Effectiveness Assessment:</strong></p>
<ul>
  <li>Is current method producing consistent results? [Yes/No]</li>
  <li>Are position sizes appropriate for market volatility? [Yes/No]</li>
  <li>Do I need to adjust for different instruments? [Yes/No]</li>
</ul>

<h3>🧠 Psychological Risk Factors</h3>
<p><strong>Emotional Triggers for Risk Rule Violations:</strong></p>
<ul>
  <li><strong>Revenge Trading:</strong> [Frequency and triggers]</li>
  <li><strong>FOMO (Fear of Missing Out):</strong> [How it affects position sizing]</li>
  <li><strong>Overconfidence:</strong> [When do I tend to risk too much?]</li>
  <li><strong>Fear:</strong> [When do I risk too little?]</li>
</ul>

<h3>🔄 Risk Management Improvements</h3>
<p><strong>What's Working Well:</strong></p>
<ul>
  <li>[List effective risk management practices]</li>
  <li>[Successful risk mitigation strategies]</li>
  <li>[Times when good risk management saved money]</li>
</ul>

<p><strong>Areas Needing Improvement:</strong></p>
<ol>
  <li><strong>Issue:</strong> [Describe problem] - <strong>Solution:</strong> [Proposed fix]</li>
  <li><strong>Issue:</strong> [Describe problem] - <strong>Solution:</strong> [Proposed fix]</li>
  <li><strong>Issue:</strong> [Describe problem] - <strong>Solution:</strong> [Proposed fix]</li>
</ol>

<h3>📋 Updated Risk Management Rules</h3>
<blockquote style="border-left: 4px solid #ef4444; padding-left: 16px; margin: 16px 0;">
<strong>My Risk Management Commandments:</strong><br>
1. I will never risk more than [X]% per trade<br>
2. I will set stop losses before entering any trade<br>
3. I will never add to a losing position<br>
4. I will take profits according to my plan<br>
5. I will stop trading if I hit my daily loss limit<br>
6. [Add your specific rules here]
</blockquote>

<h3>📊 Risk Monitoring Plan</h3>
<ul>
  <li><strong>Daily Review:</strong> Check if any risk rules were violated</li>
  <li><strong>Weekly Review:</strong> Analyze risk-adjusted returns</li>
  <li><strong>Monthly Review:</strong> Evaluate and adjust risk parameters</li>
  <li><strong>Quarterly Review:</strong> Complete overhaul of risk management system</li>
</ul>

<hr>
<p><em>Risk Discipline Rating (1-10): ___ | Improvement Priority: ___ | Next Review Date: ___</em></p>`,
      tags: ['risk', 'management', 'safety', 'discipline'],
      mood: 'analytical'
    },
    {
      id: 'lesson-learned',
      name: 'Lesson Learned Template',
      description: 'Document important trading lessons and insights',
      icon: LightBulbIcon,
      color: 'orange',
      content: `<h2>💡 Trading Lesson Learned - ${new Date().toLocaleDateString()}</h2>

<h3>📋 Lesson Overview</h3>
<p><strong>Lesson Title:</strong> [Give your lesson a memorable title]</p>
<p><strong>Category:</strong> [Technical Analysis / Risk Management / Psychology / Strategy / Market Structure]</p>
<p><strong>Importance Level:</strong> ⭐⭐⭐⭐⭐ (Rate 1-5 stars)</p>
<p><strong>Date Learned:</strong> ${new Date().toLocaleDateString()}</p>

<h3>🔍 What Happened?</h3>
<p><strong>Context:</strong> [Describe the situation that led to this lesson]</p>
<p><strong>Trade Details (if applicable):</strong></p>
<ul>
  <li>Instrument: [Currency pair/instrument]</li>
  <li>Entry Price: [Price]</li>
  <li>Exit Price: [Price]</li>
  <li>P&L: [Result]</li>
  <li>Duration: [How long was the trade held?]</li>
</ul>

<h3>❌ What Went Wrong?</h3>
<p><strong>The Mistake/Problem:</strong></p>
<p>[Clearly describe what went wrong or what you misunderstood]</p>

<p><strong>Why Did This Happen?</strong></p>
<ul>
  <li>Lack of knowledge about: [Specific knowledge gap]</li>
  <li>Emotional state: [How emotions affected the decision]</li>
  <li>External factors: [Market conditions, news, etc.]</li>
  <li>Process failure: [Which part of your process broke down?]</li>
</ul>

<h3>💡 The Key Insight</h3>
<blockquote style="border-left: 4px solid #f97316; padding-left: 16px; margin: 16px 0; font-weight: bold; font-size: 1.1em;">
[Write the core lesson in one clear, actionable sentence]
</blockquote>

<h3>🎯 How to Apply This Lesson</h3>
<p><strong>Specific Actions to Take:</strong></p>
<ol>
  <li><strong>Immediate Action:</strong> [What will you do right now?]</li>
  <li><strong>Process Update:</strong> [How will you change your trading process?]</li>
  <li><strong>Checklist Addition:</strong> [What new item to add to your pre-trade checklist?]</li>
  <li><strong>Rule Creation:</strong> [Any new trading rule to implement?]</li>
</ol>

<h3>🔄 Similar Situations to Watch For</h3>
<p><strong>When This Lesson Applies:</strong></p>
<ul>
  <li>Market Conditions: [When similar market conditions occur]</li>
  <li>Trade Setups: [Similar setups where this lesson is relevant]</li>
  <li>Emotional States: [When you're in similar emotional states]</li>
  <li>Time Periods: [Specific times/sessions when this is most relevant]</li>
</ul>

<h3>📊 Supporting Evidence</h3>
<p><strong>Additional Examples:</strong></p>
<ul>
  <li>[Other times you've seen this pattern]</li>
  <li>[Historical examples from your trading]</li>
  <li>[Market examples that support this lesson]</li>
</ul>

<h3>🧠 Mental Models & Reminders</h3>
<p><strong>Easy Way to Remember:</strong> [Create a simple phrase or mental model]</p>
<p><strong>Visual Reminder:</strong> [Describe any chart patterns or visual cues]</p>
<p><strong>Emotional Trigger:</strong> [What feeling should remind you of this lesson?]</p>

<h3>📝 Teaching Others</h3>
<p><strong>If I had to explain this lesson to another trader, I would say:</strong></p>
<p>[Write out how you'd teach this lesson to someone else - this reinforces your understanding]</p>

<h3>🔬 Testing the Lesson</h3>
<p><strong>How to Verify This Lesson Works:</strong></p>
<ul>
  <li>Success Metric: [How will you measure if applying this lesson works?]</li>
  <li>Time Frame: [How long before you can evaluate its effectiveness?]</li>
  <li>Review Schedule: [When will you review if this lesson is being applied?]</li>
</ul>

<h3>🏷️ Related Lessons</h3>
<p><strong>Connected Insights:</strong></p>
<ul>
  <li>[Link to other lessons that relate to this one]</li>
  <li>[How this lesson builds on previous knowledge]</li>
  <li>[What this lesson might lead to learning next]</li>
</ul>

<hr>
<p><em>Confidence in Lesson (1-10): ___ | Implementation Status: ___ | Next Review: ___</em></p>`,
      tags: ['lesson', 'learning', 'insight', 'improvement'],
      mood: 'reflective'
    },
    {
      id: 'technical-analysis',
      name: 'Technical Analysis Notes',
      description: 'Document your chart analysis and technical insights',
      icon: ChartBarIcon,
      color: 'green',
      content: `<h2>📈 Technical Analysis - ${new Date().toLocaleDateString()}</h2>

<h3>📊 Instrument Analyzed</h3>
<p><strong>Symbol:</strong> [Enter instrument]</p>
<p><strong>Primary Timeframe:</strong> [Enter timeframe]</p>
<p><strong>Analysis Date:</strong> ${new Date().toLocaleDateString()}</p>

<h3>🔍 Market Structure</h3>
<ul>
  <li><strong>Overall Trend (HTF):</strong> Bullish / Bearish / Ranging</li>
  <li><strong>Recent Price Action:</strong> [Describe recent movements]</li>
  <li><strong>Key Support Levels:</strong> [List levels with explanations]</li>
  <li><strong>Key Resistance Levels:</strong> [List levels with explanations]</li>
  <li><strong>Current Position in Range:</strong> Top / Middle / Bottom</li>
</ul>

<h3>📊 Technical Indicators</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #f0fdf4;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Indicator</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Value</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Signal</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Strength</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">RSI (14)</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Value]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Bullish/Bearish/Neutral</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Strong/Weak</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">MACD</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Value]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Bullish/Bearish/Neutral</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Strong/Weak</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Moving Averages</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[20, 50, 200 values]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Above/Below/Crossing</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Strong/Weak</td>
  </tr>
</table>

<h3>🎯 Trade Opportunities</h3>
<p><strong>Potential Setups Identified:</strong></p>
<ol>
  <li><strong>Setup 1:</strong> [Type] - Entry: [Price] - Target: [Price] - Stop: [Price]</li>
  <li><strong>Setup 2:</strong> [Type] - Entry: [Price] - Target: [Price] - Stop: [Price]</li>
</ol>

<h3>⚡ Catalysts & Events</h3>
<ul>
  <li><strong>Upcoming News:</strong> [Economic events that might affect price]</li>
  <li><strong>Correlations:</strong> [Other instruments/markets to watch]</li>
  <li><strong>Seasonal Factors:</strong> [Any seasonal patterns relevant]</li>
</ul>

<h3>📝 Analysis Notes</h3>
<p>[Additional observations, patterns noticed, and thoughts about the analysis]</p>`,
      tags: ['technical', 'analysis', 'charts', 'indicators'],
      mood: 'analytical'
    },
    {
      id: 'psychology-log',
      name: 'Trading Psychology Log',
      description: 'Track your emotional state and psychological patterns',
      icon: AcademicCapIcon,
      color: 'purple',
      content: `<h2>📝 Trading Psychology Log - ${new Date().toLocaleDateString()}</h2>

<h3>🧠 Pre-Market Mindset</h3>
<p><strong>Mood:</strong> [Rate 1-10]</p>
<p><strong>Confidence Level:</strong> [Rate 1-10]</p>
<p><strong>Stress Level:</strong> [Rate 1-10]</p>
<p><strong>Energy Level:</strong> [Rate 1-10]</p>

<h3>😊 Emotional State</h3>
<ul>
  <li>How am I feeling before trading?</li>
  <li>Any external factors affecting my mood?</li>
  <li>Am I following my routine?</li>
</ul>

<h3>🎯 Trading Goals Today</h3>
<ul>
  <li>Primary objective:</li>
  <li>Risk tolerance:</li>
  <li>Maximum drawdown limit:</li>
</ul>

<h3>⚠️ Potential Psychological Traps</h3>
<ul>
  <li>FOMO situations to watch for:</li>
  <li>Revenge trading triggers:</li>
  <li>Overconfidence risks:</li>
</ul>

<h3>💪 Coping Strategies</h3>
<ul>
  <li>What will I do if I feel stressed?</li>
  <li>How will I handle losses?</li>
  <li>When will I take breaks?</li>
</ul>

<h3>📝 Post-Session Reflection</h3>
<p>How did my emotions affect my trading today?</p>
<p>What psychological patterns did I notice?</p>
<p>What can I improve mentally for tomorrow?</p>`,
      tags: ['psychology', 'emotions', 'mindset'],
      mood: 'reflective'
    },
    {
      id: 'trade-post-mortem',
      name: 'Trade Post-Mortem',
      description: 'Deep dive analysis of a specific trade',
      icon: ExclamationTriangleIcon,
      color: 'red',
      content: `<h2>📋 Trade Post-Mortem Analysis</h2>

<h3>�� Trade Details</h3>
<p><strong>Instrument:</strong></p>
<p><strong>Entry Date/Time:</strong></p>
<p><strong>Exit Date/Time:</strong></p>
<p><strong>Direction:</strong> Long/Short</p>
<p><strong>Position Size:</strong></p>
<p><strong>Entry Price:</strong></p>
<p><strong>Exit Price:</strong></p>
<p><strong>P&L:</strong></p>

<h3>🎯 Trade Rationale</h3>
<p><strong>Why did I enter this trade?</strong></p>
<ul>
  <li>Technical setup:</li>
  <li>Fundamental factors:</li>
  <li>Market conditions:</li>
</ul>

<h3>📊 Execution Analysis</h3>
<p><strong>Entry Execution:</strong> [Perfect/Good/Poor]</p>
<p><strong>Position Management:</strong> [Perfect/Good/Poor]</p>
<p><strong>Exit Execution:</strong> [Perfect/Good/Poor]</p>

<h3>✅ What Went Right</h3>
<ul>
  <li>Good decisions made:</li>
  <li>Rules followed:</li>
  <li>Proper risk management:</li>
</ul>

<h3>❌ What Went Wrong</h3>
<ul>
  <li>Mistakes made:</li>
  <li>Rules violated:</li>
  <li>Emotional reactions:</li>
</ul>

<h3>🎓 Lessons Learned</h3>
<p>What specific lessons can I extract from this trade?</p>

<h3>🔄 Process Improvements</h3>
<p>How can I improve my process based on this trade?</p>`,
      tags: ['postmortem', 'analysis', 'learning'],
      mood: 'analytical'
    },
    {
      id: 'weekly-strategy',
      name: 'Weekly Strategy Review',
      description: 'Comprehensive weekly performance and strategy analysis',
      icon: TrophyIcon,
      color: 'yellow',
      content: `<h2>📊 Weekly Strategy Review - Week of ${new Date().toLocaleDateString()}</h2>

<h3>📊 Performance Summary</h3>
<ul>
  <li><strong>Total Trades:</strong></li>
  <li><strong>Winning Trades:</strong></li>
  <li><strong>Losing Trades:</strong></li>
  <li><strong>Win Rate:</strong></li>
  <li><strong>Net P&L:</strong></li>
  <li><strong>Largest Win:</strong></li>
  <li><strong>Largest Loss:</strong></li>
</ul>

<h3>🎯 Strategy Performance</h3>
<p><strong>Primary Strategy Used:</strong></p>
<p><strong>Strategy Effectiveness:</strong> [Rate 1-10]</p>
<p><strong>Market Conditions:</strong> Trending/Ranging/Volatile</p>

<h3>📈 Best Performing Setups</h3>
<ul>
  <li>What setups worked best this week?</li>
  <li>Which timeframes were most profitable?</li>
  <li>Best performing instruments:</li>
</ul>

<h3>📉 Underperforming Areas</h3>
<ul>
  <li>What setups didn't work?</li>
  <li>Which instruments to avoid?</li>
  <li>Timing issues identified:</li>
</ul>

<h3>🧠 Psychological Insights</h3>
<ul>
  <li>Emotional patterns noticed:</li>
  <li>Stress triggers identified:</li>
  <li>Confidence levels throughout the week:</li>
</ul>

<h3>🎯 Next Week's Plan</h3>
<ul>
  <li>Key focus areas:</li>
  <li>Strategy adjustments:</li>
  <li>Risk management changes:</li>
  <li>Goals for next week:</li>
</ul>`,
      tags: ['weekly', 'strategy', 'performance', 'review'],
      mood: 'reflective'
    },
    {
      id: 'market-insights',
      name: 'Market Insights & Ideas',
      description: 'Capture market observations and trading ideas',
      icon: LightBulbIcon,
      color: 'indigo',
      content: `<h2>📊 Market Insights & Trading Ideas - ${new Date().toLocaleDateString()}</h2>

<h3>🌍 Market Overview</h3>
<p><strong>Current Market Theme:</strong></p>
<p><strong>Major Events This Week:</strong></p>
<ul>
  <li>Economic releases:</li>
  <li>Central bank meetings:</li>
  <li>Geopolitical events:</li>
</ul>

<h3>💡 Trading Ideas</h3>
<p><strong>Instrument:</strong></p>
<p><strong>Setup Type:</strong></p>
<p><strong>Rationale:</strong></p>
<p><strong>Entry Strategy:</strong></p>
<p><strong>Risk Level:</strong> Low/Medium/High</p>

<h3>🔍 Sector Analysis</h3>
<ul>
  <li><strong>Currencies:</strong> Which are strong/weak?</li>
  <li><strong>Commodities:</strong> Key trends observed</li>
  <li><strong>Indices:</strong> Sector rotation patterns</li>
</ul>

<h3>📊 Correlation Observations</h3>
<ul>
  <li>Currency correlations:</li>
  <li>Risk-on/risk-off sentiment:</li>
  <li>Commodity relationships:</li>
</ul>

<h3>⏰ Upcoming Catalysts</h3>
<ul>
  <li>This week's key events:</li>
  <li>Potential market movers:</li>
  <li>Seasonal patterns to watch:</li>
</ul>

<h3>📝 Random Thoughts</h3>
<p>Additional market observations, hunches, or ideas...</p>`,
      tags: ['ideas', 'insights', 'market', 'analysis'],
      mood: 'analytical'
    },
    {
      id: 'strategy-backtest',
      name: 'Strategy Backtest Results',
      description: 'Document strategy backtesting results and performance metrics',
      icon: ChartBarIcon,
      color: 'teal',
      content: `<h2>📊 Strategy Backtest Results - ${new Date().toLocaleDateString()}</h2>

<h3>📋 Strategy Information</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #f0fdfa;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Field</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Value</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Strategy Name</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Strategy name]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Timeframe</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[e.g., H1, H4, Daily]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Instruments</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[List instruments tested]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Backtest Period</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Start date] to [End date]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Market Conditions</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Trending/Ranging/Volatile]</td>
  </tr>
</table>

<h3>📈 Performance Metrics</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #f0fdfa;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Metric</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Value</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Benchmark</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Total Trades</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Number]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Previous result]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Win Rate</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[%]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Target %]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Profit Factor</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Ratio]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Target ratio]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Average Win</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Previous avg]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Average Loss</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Previous avg]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Max Drawdown</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Acceptable limit]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Sharpe Ratio</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Value]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Target >1.0]</td>
  </tr>
</table>

<h3>🎯 Trade Analysis</h3>
<p><strong>Best Performing Setups:</strong></p>
<ul>
  <li><strong>Setup 1:</strong> [Description] - Win Rate: [%] - Avg P&L: [Amount]</li>
  <li><strong>Setup 2:</strong> [Description] - Win Rate: [%] - Avg P&L: [Amount]</li>
  <li><strong>Setup 3:</strong> [Description] - Win Rate: [%] - Avg P&L: [Amount]</li>
</ul>

<p><strong>Worst Performing Setups:</strong></p>
<ul>
  <li><strong>Setup 1:</strong> [Description] - Win Rate: [%] - Avg P&L: [Amount]</li>
  <li><strong>Setup 2:</strong> [Description] - Win Rate: [%] - Avg P&L: [Amount]</li>
</ul>

<h3>📊 Market Condition Analysis</h3>
<p><strong>Performance by Market Type:</strong></p>
<ul>
  <li><strong>Trending Markets:</strong> Win Rate: [%] | Profit Factor: [Ratio]</li>
  <li><strong>Ranging Markets:</strong> Win Rate: [%] | Profit Factor: [Ratio]</li>
  <li><strong>Volatile Markets:</strong> Win Rate: [%] | Profit Factor: [Ratio]</li>
</ul>

<p><strong>Best Performing Instruments:</strong></p>
<ol>
  <li>[Instrument] - [Win Rate]% - [Profit Factor]</li>
  <li>[Instrument] - [Win Rate]% - [Profit Factor]</li>
  <li>[Instrument] - [Win Rate]% - [Profit Factor]</li>
</ol>

<h3>🔍 Key Insights</h3>
<p><strong>What Worked Well:</strong></p>
<ul>
  <li>[List successful aspects of the strategy]</li>
  <li>[Patterns that led to wins]</li>
  <li>[Market conditions where it excels]</li>
</ul>

<p><strong>What Needs Improvement:</strong></p>
<ul>
  <li>[Areas where the strategy underperforms]</li>
  <li>[Common causes of losses]</li>
  <li>[Market conditions to avoid]</li>
</ul>

<h3>🔄 Strategy Refinements</h3>
<p><strong>Recommended Changes:</strong></p>
<ol>
  <li><strong>Entry Rules:</strong> [Specific modifications]</li>
  <li><strong>Exit Rules:</strong> [Specific modifications]</li>
  <li><strong>Risk Management:</strong> [Specific modifications]</li>
  <li><strong>Filtering:</strong> [Additional conditions to consider]</li>
</ol>

<h3>📝 Next Steps</h3>
<p><strong>Forward Testing Plan:</strong></p>
<ul>
  <li><strong>Duration:</strong> [How long to test]</li>
  <li><strong>Instruments:</strong> [Which to focus on]</li>
  <li><strong>Success Criteria:</strong> [What metrics to achieve]</li>
  <li><strong>Review Schedule:</strong> [When to evaluate results]</li>
</ul>

<hr>
<p><em>Backtest Completed: ${new Date().toLocaleString()} | Confidence Level: [1-10] | Next Review: [Date]</em></p>`,
      tags: ['backtest', 'strategy', 'performance', 'analysis'],
      mood: 'analytical'
    },
    {
      id: 'correlation-analysis',
      name: 'Correlation Analysis',
      description: 'Analyze relationships between different instruments and markets',
      icon: ChartBarIcon,
      color: 'violet',
      content: `<h2>🔗 Correlation Analysis - ${new Date().toLocaleDateString()}</h2>

<h3>📊 Correlation Overview</h3>
<p><strong>Analysis Period:</strong> [Time period analyzed]</strong></p>
<p><strong>Market Theme:</strong> [Current market environment]</p>
<p><strong>Update Frequency:</strong> [Daily/Weekly/Monthly]</p>

<h3>💱 Currency Correlations</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #faf5ff;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Pair 1</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Pair 2</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Correlation</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Strength</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Notes</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">EUR/USD</td>
    <td style="border: 1px solid #ccc; padding: 8px;">GBP/USD</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[0.85]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Strong</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Comments]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">USD/JPY</td>
    <td style="border: 1px solid #ccc; padding: 8px;">USD/CHF</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[0.72]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Moderate</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Comments]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">AUD/USD</td>
    <td style="border: 1px solid #ccc; padding: 8px;">NZD/USD</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[0.91]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Very Strong</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Comments]</td>
  </tr>
</table>

<h3>🪙 Commodity Correlations</h3>
<p><strong>Gold (XAU/USD) Correlations:</strong></p>
<ul>
  <li><strong>USD Index:</strong> [Correlation value] - [Strength] - [Explanation]</li>
  <li><strong>EUR/USD:</strong> [Correlation value] - [Strength] - [Explanation]</li>
  <li><strong>Oil (WTI):</strong> [Correlation value] - [Strength] - [Explanation]</li>
  <li><strong>Bonds:</strong> [Correlation value] - [Strength] - [Explanation]</li>
</ul>

<p><strong>Oil (WTI) Correlations:</strong></p>
<ul>
  <li><strong>CAD/JPY:</strong> [Correlation value] - [Strength] - [Explanation]</li>
  <li><strong>USD/RUB:</strong> [Correlation value] - [Strength] - [Explanation]</li>
  <li><strong>Stock Indices:</strong> [Correlation value] - [Strength] - [Explanation]</li>
</ul>

<h3>📈 Stock Market Correlations</h3>
<p><strong>Major Indices:</strong></p>
<ul>
  <li><strong>S&P 500 vs NASDAQ:</strong> [Correlation value] - [Strength]</li>
  <li><strong>DAX vs FTSE:</strong> [Correlation value] - [Strength]</li>
  <li><strong>Nikkei vs Hang Seng:</strong> [Correlation value] - [Strength]</li>
</ul>

<p><strong>Currency vs Stocks:</strong></p>
<ul>
  <li><strong>USD/JPY vs S&P 500:</strong> [Correlation value] - [Strength] - [Risk-on/off indicator]</li>
  <li><strong>EUR/USD vs DAX:</strong> [Correlation value] - [Strength] - [Risk-on/off indicator]</li>
</ul>

<h3>🌍 Cross-Asset Correlations</h3>
<p><strong>Risk-On vs Risk-Off Assets:</strong></p>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #faf5ff;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Risk-On Asset</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Risk-Off Asset</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Correlation</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">S&P 500</td>
    <td style="border: 1px solid #ccc; padding: 8px;">USD/JPY</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Value]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Gold</td>
    <td style="border: 1px solid #ccc; padding: 8px;">USD Index</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Value]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Oil</td>
    <td style="border: 1px solid #ccc; padding: 8px;">CAD/JPY</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Value]</td>
  </tr>
</table>

<h3>⏰ Time-Based Correlations</h3>
<p><strong>Session Correlations:</strong></p>
<ul>
  <li><strong>Asian Session:</strong> [Key correlations during Asian hours]</li>
  <li><strong>London Session:</strong> [Key correlations during London hours]</li>
  <li><strong>NY Session:</strong> [Key correlations during NY hours]</li>
  <li><strong>Overlap Periods:</strong> [Correlations during session overlaps]</li>
</ul>

<p><strong>Weekly Patterns:</strong></p>
<ul>
  <li><strong>Monday:</strong> [Typical correlation behavior]</li>
  <li><strong>Wednesday:</strong> [Typical correlation behavior]</li>
  <li><strong>Friday:</strong> [Typical correlation behavior]</li>
</ul>

<h3>🎯 Trading Implications</h3>
<p><strong>Portfolio Management:</strong></p>
<ul>
  <li><strong>Diversification:</strong> [How to use correlations for portfolio balance]</li>
  <li><strong>Risk Management:</strong> [Avoiding over-exposure to correlated assets]</li>
  <li><strong>Hedging Opportunities:</strong> [Using correlations for hedging]</li>
</ul>

<p><strong>Entry/Exit Timing:</strong></p>
<ul>
  <li><strong>Confirmation Trades:</strong> [Using correlations to confirm setups]</li>
  <li><strong>Divergence Trades:</strong> [Trading correlation breakdowns]</li>
  <li><strong>News Impact:</strong> [How news affects correlations]</li>
</ul>

<h3>📊 Correlation Changes</h3>
<p><strong>Recent Changes:</strong></p>
<ul>
  <li><strong>Strengthening:</strong> [Pairs becoming more correlated]</li>
  <li><strong>Weakening:</strong> [Pairs becoming less correlated]</li>
  <li><strong>New Patterns:</strong> [Emerging correlation relationships]</li>
</ul>

<p><strong>Market Events Impact:</strong></p>
<ul>
  <li><strong>Central Bank Actions:</strong> [How they affect correlations]</li>
  <li><strong>Economic Data:</strong> [Impact on correlation strength]</li>
  <li><strong>Geopolitical Events:</strong> [Correlation shifts during events]</li>
</ul>

<h3>📝 Notes & Observations</h3>
<p>[Additional insights, patterns noticed, and thoughts about correlations]</p>

<hr>
<p><em>Analysis Date: ${new Date().toLocaleString()} | Next Update: [Date] | Confidence Level: [1-10]</em></p>`,
      tags: ['correlation', 'analysis', 'relationships', 'markets'],
      mood: 'analytical'
    },
    {
      id: 'economic-calendar',
      name: 'Economic Calendar Analysis',
      description: 'Plan trading around economic events and news releases',
      icon: CalendarDaysIcon,
      color: 'amber',
      content: `<h2>📅 Economic Calendar Analysis - ${new Date().toLocaleDateString()}</h2>

<h3>📊 This Week's High-Impact Events</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #fffbeb;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Date & Time</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Event</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Currency</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Impact</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Previous</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Forecast</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Notes</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">[Date] [Time]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Event name]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Currency]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">High</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Previous value]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Forecast value]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Important notes]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">[Date] [Time]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Event name]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Currency]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">High</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Previous value]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Forecast value]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Important notes]</td>
  </tr>
</table>

<h3>🎯 Medium-Impact Events</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #fef3c7;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Date & Time</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Event</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Currency</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Impact</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Previous</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Forecast</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">[Date] [Time]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Event name]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Currency]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Medium</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Previous value]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Forecast value]</td>
  </tr>
</table>

<h3>🏛️ Central Bank Events</h3>
<p><strong>This Week:</strong></p>
<ul>
  <li><strong>[Central Bank]:</strong> [Event type] - [Date] - [Expected outcome]</li>
  <li><strong>[Central Bank]:</strong> [Event type] - [Date] - [Expected outcome]</li>
</ul>

<p><strong>Next Week:</strong></p>
<ul>
  <li><strong>[Central Bank]:</strong> [Event type] - [Date] - [Expected outcome]</li>
</ul>

<h3>📊 Market Expectations</h3>
<p><strong>Consensus Views:</strong></p>
<ul>
  <li><strong>Rate Decisions:</strong> [Expected changes and reasoning]</li>
  <li><strong>Economic Data:</strong> [Market expectations vs reality]</li>
  <li><strong>Forward Guidance:</strong> [Expected policy signals]</li>
</ul>

<p><strong>Potential Surprises:</strong></p>
<ul>
  <li><strong>Data Surprises:</strong> [What could surprise the market]</li>
  <li><strong>Policy Changes:</strong> [Unexpected policy shifts]</li>
  <li><strong>Forward Guidance:</strong> [Unexpected signals]</li>
</ul>

<h3>🎯 Trading Strategy</h3>
<p><strong>Pre-Event Positioning:</strong></p>
<ul>
  <li><strong>High-Impact Events:</strong> [How to position before major events]</li>
  <li><strong>Risk Management:</strong> [Position sizing and stop losses]</li>
  <li><strong>Timing:</strong> [When to enter/exit positions]</li>
</ul>

<p><strong>Event Trading:</strong></p>
<ul>
  <li><strong>Scalping Strategy:</strong> [Quick trades during volatility]</li>
  <li><strong>Breakout Strategy:</strong> [Trading post-event breakouts]</li>
  <li><strong>Fade Strategy:</strong> [Fading initial moves]</li>
</ul>

<h3>⚠️ Risk Management</h3>
<p><strong>Position Sizing:</strong></p>
<ul>
  <li><strong>High-Impact Events:</strong> [Reduced position sizes]</li>
  <li><strong>Medium-Impact Events:</strong> [Normal position sizes]</li>
  <li><strong>Low-Impact Events:</strong> [Full position sizes]</li>
</ul>

<p><strong>Stop Loss Strategy:</strong></p>
<ul>
  <li><strong>Wider Stops:</strong> [During high volatility]</li>
  <li><strong>News Stops:</strong> [Special stop loss rules for news]</li>
  <li><strong>Time Stops:</strong> [Exit if no move within timeframe]</li>
</ul>

<h3>📈 Historical Performance</h3>
<p><strong>Recent Event Impact:</strong></p>
<ul>
  <li><strong>Last NFP:</strong> [Impact on USD pairs]</li>
  <li><strong>Last CPI:</strong> [Impact on inflation expectations]</li>
  <li><strong>Last Rate Decision:</strong> [Market reaction]</li>
</ul>

<p><strong>Pattern Recognition:</strong></p>
<ul>
  <li><strong>Typical Moves:</strong> [Average pip movement]</li>
  <li><strong>Duration:</strong> [How long moves last]</li>
  <li><strong>Reversals:</strong> [Common reversal patterns]</li>
</ul>

<h3>📝 Notes & Observations</h3>
<p>[Additional insights about specific events, market sentiment, and trading opportunities]</p>

<h3>🔄 Weekly Review</h3>
<p><strong>Events That Moved Markets:</strong></p>
<ul>
  <li>[Event 1] - [Impact] - [Lessons learned]</li>
  <li>[Event 2] - [Impact] - [Lessons learned]</li>
</ul>

<p><strong>Strategy Adjustments:</strong></p>
<ul>
  <li>[What worked well]</li>
  <li>[What needs improvement]</li>
  <li>[Changes for next week]</li>
</ul>

<hr>
<p><em>Calendar Updated: ${new Date().toLocaleString()} | Next Review: [Date] | Market Sentiment: [Bullish/Bearish/Neutral]</em></p>`,
      tags: ['economic', 'calendar', 'news', 'events'],
      mood: 'analytical'
    },
    {
      id: 'position-sizing-calculator',
      name: 'Position Sizing Calculator',
      description: 'Calculate optimal position sizes based on risk management rules',
      icon: CogIcon,
      color: 'slate',
      content: `<h2>🧮 Position Sizing Calculator - ${new Date().toLocaleDateString()}</h2>

<h3>📊 Account Information</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #f8fafc;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Field</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Value</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Notes</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Account Balance</td>
    <td style="border: 1px solid #ccc; padding: 8px;">$[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Current account value</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Risk Per Trade</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[%]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Maximum risk per trade</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Daily Loss Limit</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[%]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Maximum daily loss</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Max Open Positions</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Number]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Maximum concurrent trades</td>
  </tr>
</table>

<h3>🎯 Trade Setup</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #f8fafc;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Parameter</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Value</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Calculation</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Instrument</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[e.g., EUR/USD]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Currency pair</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Entry Price</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Price]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Entry level</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Stop Loss</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Price]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Stop loss level</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Risk Distance</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Pips/Points]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Entry to stop loss</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Pip Value</td>
    <td style="border: 1px solid #ccc; padding: 8px;">$[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Value per pip</td>
  </tr>
</table>

<h3>🧮 Position Size Calculations</h3>
<p><strong>Method 1: Fixed Risk Percentage</strong></p>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #f0fdf4;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Calculation</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Formula</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Result</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Risk Amount</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Account × Risk %</td>
    <td style="border: 1px solid #ccc; padding: 8px;">$[Amount]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Position Size</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Risk Amount ÷ (Risk Distance × Pip Value)</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Lot Size]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Standard Lots</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Lot Size] ÷ 100,000</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Standard Lots]</td>
  </tr>
</table>

<p><strong>Method 2: Kelly Criterion</strong></p>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #f0fdf4;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Parameter</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Value</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Notes</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Win Rate</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[%]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Historical win rate</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Average Win</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Average winning trade</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Average Loss</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">Average losing trade</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Kelly %</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[%]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">(Win% × Avg Win - Loss% × Avg Loss) ÷ Avg Win</td>
  </tr>
</table>

<h3>⚠️ Risk Management Checks</h3>
<div style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444;">
  <ul style="list-style: none; padding: 0;">
    <li style="margin-bottom: 8px;">☐ Position size doesn't exceed max risk per trade</li>
    <li style="margin-bottom: 8px;">☐ Total open risk doesn't exceed daily loss limit</li>
    <li style="margin-bottom: 8px;">☐ Position size allows for proper stop loss placement</li>
    <li style="margin-bottom: 8px;">☐ Account has sufficient margin for position</li>
    <li style="margin-bottom: 8px;">☐ Position size is appropriate for market volatility</li>
  </ul>
</div>

<h3>📊 Position Size Summary</h3>
<table style="width: 100%; border: 1px solid #ccc; border-collapse: collapse;">
  <tr style="background: #f8fafc;">
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Method</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Position Size</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Risk Amount</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Recommendation</strong></td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Fixed Risk %</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Lot Size]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">$[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Safe/Moderate/Aggressive]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;">Kelly Criterion</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Lot Size]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">$[Amount]</td>
    <td style="border: 1px solid #ccc; padding: 8px;">[Safe/Moderate/Aggressive]</td>
  </tr>
  <tr>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>Final Choice</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>[Lot Size]</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>$[Amount]</strong></td>
    <td style="border: 1px solid #ccc; padding: 8px;"><strong>[Reasoning]</strong></td>
  </tr>
</table>

<h3>📝 Notes & Adjustments</h3>
<p><strong>Market Conditions:</strong> [How current volatility affects position sizing]</p>
<p><strong>Account Status:</strong> [Any special considerations for current account state]</p>
<p><strong>Strategy Adjustments:</strong> [Modifications based on recent performance]</p>

<hr>
<p><em>Calculation Date: ${new Date().toLocaleString()} | Risk Level: [Low/Medium/High] | Confidence: [1-10]</em></p>`,
      tags: ['position-sizing', 'risk-management', 'calculator', 'math'],
      mood: 'analytical'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
      green: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
      purple: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
      red: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100',
      orange: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
      teal: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100',
      violet: 'bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100',
      amber: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
      slate: 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100',
    };
    return colors[color] || colors.blue;
  };

  const handleSelectTemplate = (template) => {
    onSelectTemplate({
      title: template.name,
      content: template.content,
      tags: template.tags,
      mood: template.mood || 'neutral'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Journal Templates</h2>
                <p className="text-sm text-gray-600">Choose a template to get started quickly</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${getColorClasses(template.color)}`}
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 p-2 bg-white bg-opacity-70 rounded-lg">
                    <template.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-2 leading-tight">{template.name}</h3>
                    <p className="text-sm opacity-90 mb-3 line-clamp-2">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-60"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Template Option */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                onSelectTemplate({
                  title: 'New Journal Entry',
                  content: '<h2>📝 My Trading Journal Entry</h2><p>Start writing your thoughts and analysis here...</p><h3>Key Points</h3><ul><li>Point 1</li><li>Point 2</li><li>Point 3</li></ul>',
                  tags: [],
                  mood: 'neutral'
                });
                onClose();
              }}
              className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-center justify-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 group-hover:text-purple-600" />
                <div className="text-left">
                  <div className="font-semibold text-lg">Start with Blank Template</div>
                  <p className="text-sm mt-1">Create your own custom journal entry from scratch</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalTemplates; 