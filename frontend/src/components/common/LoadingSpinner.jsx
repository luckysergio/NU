// src/components/common/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'md', fullPage = false }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  const spinner = (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-b-2 border-emerald-600 ${sizes[size]}`}></div>
    </div>
  );
  
  if (fullPage) {
    return <div className="flex justify-center items-center h-64">{spinner}</div>;
  }
  
  return spinner;
};

export default LoadingSpinner;