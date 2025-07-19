import React from 'react';
import bitcoinIcon from '../../assets/bitcoin.png';
import goldIcon from '../../assets/gold.png';

const InstrumentIcon = ({ instrument, className = '' }) => {
  const getIcon = () => {
    const normalizedInstrument = instrument?.toLowerCase() || '';
    if (normalizedInstrument.includes('btc') || normalizedInstrument.includes('bitcoin')) {
      return <img src={bitcoinIcon} alt="Bitcoin" className={`w-5 h-5 inline-block mr-1 ${className}`} />;
    }
    if (normalizedInstrument.includes('gold') || normalizedInstrument.includes('xau')) {
      return <img src={goldIcon} alt="Gold" className={`w-5 h-5 inline-block mr-1 ${className}`} />;
    }
    return null;
  };

  return (
    <span className="flex items-center">
      {getIcon()}
      {instrument}
    </span>
  );
};

export default InstrumentIcon; 