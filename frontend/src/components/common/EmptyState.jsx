import React from 'react';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({ title = 'No data available', message = 'No records match your criteria.', action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
    <div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-3">
      <PackageOpen className="w-8 h-8" />
    </div>
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500 max-w-sm mt-1 mb-4">{message}</p>
    {action && <div>{action}</div>}
  </div>
);
