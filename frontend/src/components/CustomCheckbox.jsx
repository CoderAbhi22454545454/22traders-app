import React from 'react';

const CustomCheckbox = ({ checked, onChange, label }) => {
  return (
    <div
      onClick={onChange}
      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 bg-white
        ${checked ? ' border-black' : 'bg-white border-gray-300 hover:bg-gray-50'}
      `}
    >
      {/* Checkbox Box */}
      <div
        className={`flex-shrink-0 w-6 h-6 border-2 rounded
          ${checked ? 'bg-gray-400 border-black' : 'bg-white border-gray-400'}
        `}
      />

      {/* Label */}
      <span
        className={`ml-3 font-semibold text-lg flex-1
          ${checked ? 'text-gray-900' : 'text-gray-700'}
        `}
      >
        {label}
      </span>
    </div>
  );
};

export default CustomCheckbox;