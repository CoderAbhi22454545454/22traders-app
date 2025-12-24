import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ClockIcon, CalendarIcon, ChartBarIcon, TrophyIcon } from '@heroicons/react/24/outline';

const MasterCardQuickStats = ({ backtests }) => {
  if (!backtests || backtests.length === 0) {
    return null;
  }

  // Calculate session-based win rates
  const getSessionStats = () => {
    const sessions = {
      'Sydney': { total: 0, wins: 0, pnl: 0 },
      'Tokyo': { total: 0, wins: 0, pnl: 0 },
      'London': { total: 0, wins: 0, pnl: 0 },
      'New York': { total: 0, wins: 0, pnl: 0 }
    };

    backtests.forEach(trade => {
      // Determine session based on trade date/time
      const tradeDate = new Date(trade.date);
      const utcHour = tradeDate.getUTCHours();
      
      let session;
      if (utcHour >= 22 || utcHour < 7) session = 'Sydney';
      else if (utcHour >= 0 && utcHour < 9) session = 'Tokyo';
      else if (utcHour >= 8 && utcHour < 16) session = 'London';
      else if (utcHour >= 13 && utcHour < 22) session = 'New York';
      
      if (session && sessions[session]) {
        sessions[session].total++;
        if (trade.result === 'win') sessions[session].wins++;
        sessions[session].pnl += trade.pnl || 0;
      }
    });

    return Object.entries(sessions)
      .filter(([_, stats]) => stats.total > 0)
      .map(([session, stats]) => ({
        session,
        winRate: stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(1) : 0,
        trades: stats.total,
        pnl: stats.pnl
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
  };

  // Calculate day of week performance
  const getDayOfWeekStats = () => {
    const days = {
      0: { name: 'Sunday', total: 0, wins: 0, pnl: 0 },
      1: { name: 'Monday', total: 0, wins: 0, pnl: 0 },
      2: { name: 'Tuesday', total: 0, wins: 0, pnl: 0 },
      3: { name: 'Wednesday', total: 0, wins: 0, pnl: 0 },
      4: { name: 'Thursday', total: 0, wins: 0, pnl: 0 },
      5: { name: 'Friday', total: 0, wins: 0, pnl: 0 },
      6: { name: 'Saturday', total: 0, wins: 0, pnl: 0 }
    };

    backtests.forEach(trade => {
      const day = new Date(trade.date).getDay();
      days[day].total++;
      if (trade.result === 'win') days[day].wins++;
      days[day].pnl += trade.pnl || 0;
    });

    const dayStats = Object.values(days)
      .filter(day => day.total > 0)
      .map(day => ({
        day: day.name.substring(0, 3),
        fullDay: day.name,
        winRate: day.total > 0 ? ((day.wins / day.total) * 100).toFixed(1) : 0,
        trades: day.total,
        pnl: day.pnl
      }));

    const sortedByPnL = [...dayStats].sort((a, b) => b.pnl - a.pnl);
    return {
      allDays: dayStats,
      bestDay: sortedByPnL[0],
      worstDay: sortedByPnL[sortedByPnL.length - 1]
    };
  };

  // Calculate average holding time
  const getAverageHoldingTime = () => {
    // This is a placeholder - in real implementation, you'd need entry and exit times
    // For now, we'll show a message that this requires additional data
    return null; // Will implement when entry/exit time fields are available
  };

  // Calculate R:R distribution
  const getRiskRewardDistribution = () => {
    const rrData = {};
    
    backtests.forEach(trade => {
      if (trade.riskReward && trade.riskReward.includes(':')) {
        const [risk, reward] = trade.riskReward.split(':').map(Number);
        if (risk && reward) {
          const ratio = `1:${(reward / risk).toFixed(1)}`;
          rrData[ratio] = (rrData[ratio] || 0) + 1;
        }
      }
    });

    return Object.entries(rrData)
      .map(([ratio, count]) => ({ ratio, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Calculate monthly performance
  const getMonthlyPerformance = () => {
    const months = {};
    
    backtests.forEach(trade => {
      const date = new Date(trade.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { wins: 0, total: 0, pnl: 0 };
      }
      
      months[monthKey].total++;
      if (trade.result === 'win') months[monthKey].wins++;
      months[monthKey].pnl += trade.pnl || 0;
    });

    return Object.entries(months)
      .map(([month, stats]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        winRate: stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(0) : 0,
        pnl: stats.pnl,
        trades: stats.total
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  };

  const sessionStats = getSessionStats();
  const dayStats = getDayOfWeekStats();
  const rrDistribution = getRiskRewardDistribution();
  const monthlyPerformance = getMonthlyPerformance();

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Session Performance */}
      {sessionStats.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-blue-600" />
            Performance by Trading Session
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sessionStats.map((session, idx) => (
              <div key={session.session} className="bg-gray-50 rounded-lg p-4 border-l-4" style={{
                borderLeftColor: parseFloat(session.winRate) >= 50 ? '#10B981' : '#EF4444'
              }}>
                <div className="text-sm font-medium text-gray-600 mb-1">{session.session}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {session.winRate}%
                </div>
                <div className="text-xs text-gray-500">
                  {session.trades} trades • ${session.pnl.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day of Week Performance */}
      {dayStats.allDays.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
            Performance by Day of Week
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-700 mb-1">Best Day</div>
              <div className="text-xl font-bold text-green-900">{dayStats.bestDay.fullDay}</div>
              <div className="text-sm text-green-600">
                ${dayStats.bestDay.pnl.toFixed(2)} • {dayStats.bestDay.winRate}% WR
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm font-medium text-red-700 mb-1">Worst Day</div>
              <div className="text-xl font-bold text-red-900">{dayStats.worstDay.fullDay}</div>
              <div className="text-sm text-red-600">
                ${dayStats.worstDay.pnl.toFixed(2)} • {dayStats.worstDay.winRate}% WR
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayStats.allDays}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                  return [value, name];
                }}
              />
              <Bar dataKey="winRate" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Risk:Reward Distribution */}
      {rrDistribution.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-orange-600" />
            Risk:Reward Distribution
          </h3>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-full lg:w-1/2">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={rrDistribution}
                    dataKey="count"
                    nameKey="ratio"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ ratio, count }) => `${ratio} (${count})`}
                  >
                    {rrDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full lg:w-1/2 space-y-2">
              {rrDistribution.map((rr, idx) => (
                <div key={rr.ratio} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-semibold text-gray-900">{rr.ratio}</span>
                  </div>
                  <span className="text-gray-600">{rr.count} trades</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Performance Heatmap */}
      {monthlyPerformance.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-yellow-600" />
            Monthly Performance (Last 6 Months)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {monthlyPerformance.map((month) => {
              const isProfitable = month.pnl >= 0;
              return (
                <div 
                  key={month.month}
                  className={`rounded-lg p-4 border-2 ${
                    isProfitable 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="text-xs font-medium text-gray-600 mb-1">{month.month}</div>
                  <div className={`text-xl font-bold mb-1 ${
                    isProfitable ? 'text-green-700' : 'text-red-700'
                  }`}>
                    ${month.pnl.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {month.winRate}% WR
                  </div>
                  <div className="text-xs text-gray-500">
                    {month.trades} trades
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterCardQuickStats;





