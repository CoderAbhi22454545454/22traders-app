import React, { useState, useEffect } from 'react';
import { tradesAPI } from '../utils/api';

const CalendarView = ({ onDateClick, selectedDate, userId }) => {
  const [tradeDates, setTradeDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

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
          dateResults[dateKey] = { wins: 0, losses: 0, breakEven: 0, totalPnL: 0, count: 0 };
        }
        
        dateResults[dateKey].count++;
        dateResults[dateKey].totalPnL += trade.pnl || 0;
        
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

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
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
          <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-12"></div>;
          }

          const tradeInfo = getTradeInfoForDate(date);
          const todayClass = isToday(date) ? 'bg-primary-100 text-white border-primary-300 font-semibold' : '';
          const selectedClass = isSelected(date) ? 'bg-blue-500 text-white' : '';
          const tradeBackgroundClass = tradeInfo ? getBackgroundColor(tradeInfo.overallResult) : '';
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                relative h-12 border border-gray-200 rounded cursor-pointer
                hover:bg-gray-50 transition-colors duration-150
                flex items-center justify-center text-sm
                ${todayClass} ${selectedClass} ${tradeBackgroundClass}
              `}
              title={tradeInfo ? `${tradeInfo.count} trade(s) - Total P&L: $${tradeInfo.totalPnL.toFixed(2)}` : ''}
            >
              <span className="text-gray-900">{date.getDate()}</span>
              
              {/* Trade Indicator */}
              {tradeInfo && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className={`w-2 h-2 rounded-full ${getIndicatorColor(tradeInfo.overallResult)}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Winning Day</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Losing Day</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Break Even</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView; 