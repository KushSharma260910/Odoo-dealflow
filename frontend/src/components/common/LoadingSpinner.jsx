import React from 'react';

export const LoadingSpinner = ({ label = 'Loading data...' }) => (
  <div className="flex flex-col items-center justify-center p-12 text-gray-500">
    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    <span className="mt-3 text-sm font-medium">{label}</span>
  </div>
);
