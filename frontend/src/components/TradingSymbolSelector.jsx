import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const TradingSymbolSelector = ({ onSymbolSelect, onClose, currentText = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const tradingSymbols = {
    forex: [
      { symbol: 'EUR/USD', name: 'Euro/US Dollar', type: 'Major' },
      { symbol: 'GBP/USD', name: 'British Pound/US Dollar', type: 'Major' },
      { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', type: 'Major' },
      { symbol: 'USD/CHF', name: 'US Dollar/Swiss Franc', type: 'Major' },
      { symbol: 'AUD/USD', name: 'Australian Dollar/US Dollar', type: 'Major' },
      { symbol: 'USD/CAD', name: 'US Dollar/Canadian Dollar', type: 'Major' },
      { symbol: 'NZD/USD', name: 'New Zealand Dollar/US Dollar', type: 'Major' },
      { symbol: 'EUR/GBP', name: 'Euro/British Pound', type: 'Cross' },
      { symbol: 'EUR/JPY', name: 'Euro/Japanese Yen', type: 'Cross' },
      { symbol: 'GBP/JPY', name: 'British Pound/Japanese Yen', type: 'Cross' },
    ],
    commodities: [
      { symbol: 'GOLD', name: 'Gold Spot', type: 'Precious Metal' },
      { symbol: 'SILVER', name: 'Silver Spot', type: 'Precious Metal' },
      { symbol: 'WTI', name: 'West Texas Intermediate Oil', type: 'Energy' },
      { symbol: 'BRENT', name: 'Brent Crude Oil', type: 'Energy' },
      { symbol: 'NATGAS', name: 'Natural Gas', type: 'Energy' },
      { symbol: 'COPPER', name: 'Copper', type: 'Industrial Metal' },
    ],
    indices: [
      { symbol: 'SPX500', name: 'S&P 500 Index', type: 'US Index' },
      { symbol: 'NAS100', name: 'Nasdaq 100 Index', type: 'US Index' },
      { symbol: 'DJI30', name: 'Dow Jones Industrial Average', type: 'US Index' },
      { symbol: 'GER40', name: 'DAX 40 Index', type: 'European Index' },
      { symbol: 'UK100', name: 'FTSE 100 Index', type: 'European Index' },
      { symbol: 'JPN225', name: 'Nikkei 225 Index', type: 'Asian Index' },
    ],
    crypto: [
      { symbol: 'BTC/USD', name: 'Bitcoin/US Dollar', type: 'Major Crypto' },
      { symbol: 'ETH/USD', name: 'Ethereum/US Dollar', type: 'Major Crypto' },
      { symbol: 'XRP/USD', name: 'Ripple/US Dollar', type: 'Altcoin' },
      { symbol: 'LTC/USD', name: 'Litecoin/US Dollar', type: 'Altcoin' },
      { symbol: 'ADA/USD', name: 'Cardano/US Dollar', type: 'Altcoin' },
    ]
  };

  const categories = [
    { id: 'all', name: 'All Instruments', icon: SparklesIcon },
    { id: 'forex', name: 'Forex', icon: CurrencyDollarIcon },
    { id: 'commodities', name: 'Commodities', icon: SparklesIcon },
    { id: 'indices', name: 'Indices', icon: SparklesIcon },
    { id: 'crypto', name: 'Crypto', icon: SparklesIcon },
  ];

  const getAllSymbols = () => {
    if (selectedCategory === 'all') {
      return Object.values(tradingSymbols).flat();
    }
    return tradingSymbols[selectedCategory] || [];
  };

  const filteredSymbols = getAllSymbols().filter(item =>
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSymbolClick = (symbol) => {
    const insertText = `**${symbol.symbol}** (${symbol.name})`;
    onSymbolSelect(insertText);
    onClose();
  };

  const quickInsertPhrases = [
    { text: 'Long position', insert: '🟢 **Long Position**' },
    { text: 'Short position', insert: '🔴 **Short Position**' },
    { text: 'Support level', insert: '📈 **Support Level**' },
    { text: 'Resistance level', insert: '📉 **Resistance Level**' },
    { text: 'Bullish trend', insert: '🐂 **Bullish Trend**' },
    { text: 'Bearish trend', insert: '🐻 **Bearish Trend**' },
    { text: 'Entry point', insert: '🎯 **Entry Point**' },
    { text: 'Stop loss', insert: '🛑 **Stop Loss**' },
    { text: 'Take profit', insert: '💰 **Take Profit**' },
    { text: 'Risk/Reward', insert: '⚖️ **Risk/Reward Ratio**' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Trading Symbols & Quick Insert</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex h-[70vh]">
          {/* Categories Sidebar */}
          <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <category.icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            {/* Quick Insert Phrases */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Insert</h3>
              <div className="space-y-1">
                {quickInsertPhrases.map((phrase, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onSymbolSelect(phrase.insert);
                      onClose();
                    }}
                    className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    {phrase.text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Search */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trading instruments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Symbols Grid */}
            <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSymbols.map((symbol, index) => (
                  <div
                    key={index}
                    onClick={() => handleSymbolClick(symbol)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900 text-lg">{symbol.symbol}</span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {symbol.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{symbol.name}</p>
                      </div>
                      <PlusIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              {filteredSymbols.length === 0 && (
                <div className="text-center py-12">
                  <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No instruments found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search criteria or browse different categories.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingSymbolSelector; 