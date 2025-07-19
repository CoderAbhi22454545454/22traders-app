import React, { useState, useEffect } from 'react';
import { tradesAPI } from '../utils/api';

const CalendarView = ({ onDateClick, selectedDate, userId }) => {
  const [tradeDates, setTradeDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [tooltip, setTooltip] = useState({ show: false, content: null, x: 0, y: 0 });

  useEffect(() => {
    if (userId) {
      fetchTradeDates();
    }
  }, [userId]);

  const fetchTradeDates = async () => {
    setLoading(true);
    try {
      const response = await tradesAPI.getAllTrades({ userId, limit: 1000 });
      const trades = response.trades || [];
      
      const dateResults = {};
      trades.forEach(trade => {
        const tradeDate = new Date(trade.date);
        const dateKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}-${String(tradeDate.getDate()).padStart(2, '0')}`;
        
        if (!dateResults[dateKey]) {
          dateResults[dateKey] = { wins: 0, losses: 0, breakEven: 0, totalPnL: 0, count: 0, instruments: new Set() };
        }
        
        dateResults[dateKey].count++;
        dateResults[dateKey].totalPnL += trade.pnl || 0;
        
        // Add instrument information (use tradePair first, fallback to instrument)
        const instrumentName = trade.tradePair || trade.instrument || 'Unknown';
        dateResults[dateKey].instruments.add(instrumentName);
        
        const result = trade.result || trade.tradeOutcome?.toLowerCase();
        if (result === 'win') dateResults[dateKey].wins++;
        else if (result === 'loss') dateResults[dateKey].losses++;
        else dateResults[dateKey].breakEven++;
      });
      
      const formattedDates = Object.entries(dateResults).map(([date, stats]) => ({
        date,
        count: stats.count,
        wins: stats.wins,
        losses: stats.losses,
        breakEven: stats.breakEven,
        totalPnL: stats.totalPnL,
        instruments: Array.from(stats.instruments), // Convert Set to Array
        overallResult: stats.totalPnL > 0 ? 'win' : stats.totalPnL < 0 ? 'loss' : 'breakEven'
      }));
      
      setTradeDates(formattedDates);
    } catch (error) {
      console.error('Error fetching trade dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTradeInfoForDate = (date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return tradeDates.find(td => td.date === dateString);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date && 
           date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    return selectedDate && date &&
           date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const handleDateClick = (date) => {
    if (date && onDateClick) {
      onDateClick(date);
    }
  };

  const getIndicatorColor = (result) => {
    switch (result) {
      case 'win': return 'bg-green-500';
      case 'loss': return 'bg-red-500';
      case 'breakEven': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getBackgroundColor = (result) => {
    switch (result) {
      case 'win': return 'bg-green-50 border-green-200';
      case 'loss': return 'bg-red-50 border-red-200';
      case 'breakEven': return 'bg-yellow-50 border-yellow-200';
      default: return '';
    }
  };

  const handleMouseEnter = (e, date) => {
    const tradeInfo = getTradeInfoForDate(date);
    if (!tradeInfo) return;

    const rect = e.target.getBoundingClientRect();
    const winRate = tradeInfo.count > 0 ? ((tradeInfo.wins / tradeInfo.count) * 100).toFixed(1) : 0;
    
    const tooltipContent = {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      totalTrades: tradeInfo.count,
      wins: tradeInfo.wins,
      losses: tradeInfo.losses,
      breakEven: tradeInfo.breakEven,
      totalPnL: tradeInfo.totalPnL,
      winRate: winRate,
      instruments: tradeInfo.instruments
    };

    setTooltip({
      show: true,
      content: tooltipContent,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, content: null, x: 0, y: 0 });
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading calendar...</span>
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentDate);
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {formatMonth(currentDate)}
        </h2>
        
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-20"></div>;
          }

          const tradeInfo = getTradeInfoForDate(date);
          const todayClass = isToday(date) ? 'border-blue-500 border-2' : 'border-gray-200';
          const selectedClass = isSelected(date) ? 'bg-blue-500 text-white' : '';
          const tradeBackgroundClass = tradeInfo ? getBackgroundColor(tradeInfo.overallResult) : 'bg-white';
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              onMouseEnter={(e) => handleMouseEnter(e, date)}
              onMouseLeave={handleMouseLeave}
              className={`
                relative h-20 border rounded cursor-pointer
                hover:bg-gray-50 transition-colors duration-150
                flex flex-col p-2 text-xs
                ${todayClass} ${selectedClass} ${tradeBackgroundClass}
              `}
            >
              {/* Date number and result indicator */}
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`font-medium text-sm ${isToday(date) ? 'text-blue-600' : 'text-gray-800'}`}>
                  {date.getDate()}
                </span>
                {tradeInfo && (
                  <div className="flex items-center space-x-1">
                    {/* Trade count badge */}
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium text-white bg-gray-600">
                      {tradeInfo.count}
                    </span>
                    {/* Up/Down arrow indicator */}
                    <div className={`
                      w-5 h-5 rounded-full flex items-center justify-center
                      ${tradeInfo.overallResult === 'win' ? 'bg-green-100' : 
                        tradeInfo.overallResult === 'loss' ? 'bg-red-100' : 'bg-yellow-100'}
                    `}>
                      {tradeInfo.overallResult === 'win' && (
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                      {tradeInfo.overallResult === 'loss' && (
                        <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      {tradeInfo.overallResult === 'breakEven' && (
                        <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Trade Information */}
              {tradeInfo && (
                <div className="flex-1 flex flex-col justify-center items-center space-y-1">
                  {/* P&L */}
                  <div className={`text-xs font-medium ${
                    tradeInfo.totalPnL > 0 ? 'text-green-600' : 
                    tradeInfo.totalPnL < 0 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {tradeInfo.totalPnL > 0 ? '+' : ''}${tradeInfo.totalPnL.toFixed(2)}
                  </div>
                  
                  {/* Instruments */}
                  <div className="text-xs text-gray-600 text-center">
                    {tradeInfo.instruments.slice(0, 2).map(instrument => {
                      return instrument
                        .replace('XAUUSD', 'Gold')
                        .replace('BTCUSD', 'BTC')
                        .replace('EURUSD', 'EUR');
                    }).join(', ')}
                    {tradeInfo.instruments.length > 2 && (
                      <span className="text-gray-400">+{tradeInfo.instruments.length - 2}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Simple Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
          <span>Profitable</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <span>Loss</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
          </div>
          <span>Break Even</span>
        </div>
      </div>

      {/* Monthly Summary - Simplified */}
      {tradeDates.length > 0 && (() => {
        const monthData = tradeDates.filter(td => {
          const tdDate = new Date(td.date);
          return tdDate.getMonth() === currentDate.getMonth() && 
                 tdDate.getFullYear() === currentDate.getFullYear();
        });
        
        if (monthData.length === 0) return null;
        
        const totalTrades = monthData.reduce((sum, day) => sum + day.count, 0);
        const totalPnL = monthData.reduce((sum, day) => sum + day.totalPnL, 0);
        const totalWins = monthData.reduce((sum, day) => sum + day.wins, 0);
        const winRate = totalTrades > 0 ? (totalWins / totalTrades * 100).toFixed(1) : 0;
        const tradingDays = monthData.length;
        
        return (
          <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{totalTrades}</div>
              <div className="text-xs text-gray-500">Trades</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">P&L</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${parseFloat(winRate) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                {winRate}%
              </div>
              <div className="text-xs text-gray-500">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{tradingDays}</div>
              <div className="text-xs text-gray-500">Days</div>
            </div>
          </div>
        );
      })()}

      {/* Custom Tooltip */}
      {tooltip.show && tooltip.content && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm min-w-64">
            {/* Date Header */}
            <div className="font-semibold text-center mb-2 border-b border-gray-700 pb-2">
              {tooltip.content.date}
            </div>
            
            {/* Trade Summary */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Total Trades:</span>
                <span className="font-semibold">{tooltip.content.totalTrades}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Win Rate:</span>
                <span className={`font-semibold ${
                  parseFloat(tooltip.content.winRate) >= 50 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {tooltip.content.winRate}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Total P&L:</span>
                                 <span className={`font-semibold ${
                   tooltip.content.totalPnL > 0 ? 'text-green-400' : 
                   tooltip.content.totalPnL < 0 ? 'text-red-400' : 'text-yellow-400'
                 }`}>
                   {tooltip.content.totalPnL > 0 ? '+' : ''}${tooltip.content.totalPnL.toFixed(2)}
                 </span>
              </div>
            </div>
            
            {/* Breakdown */}
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-green-400 font-semibold">{tooltip.content.wins}</div>
                  <div>Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 font-semibold">{tooltip.content.losses}</div>
                  <div>Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 font-semibold">{tooltip.content.breakEven}</div>
                  <div>B/E</div>
                </div>
              </div>
            </div>
            
            {/* Instruments */}
            {tooltip.content.instruments.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Instruments:</div>
                <div className="text-xs">
                  {tooltip.content.instruments.map(instrument => {
                    return instrument
                      .replace('XAUUSD', 'Gold')
                      .replace('BTCUSD', 'BTC')
                      .replace('EURUSD', 'EUR');
                  }).join(', ')}
                </div>
              </div>
            )}
            
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView; 