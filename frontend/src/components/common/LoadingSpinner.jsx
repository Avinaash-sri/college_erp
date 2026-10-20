import React from 'react';

export default function LoadingSpinner({ message = 'Loading records...' }) {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
}
