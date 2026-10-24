import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600"
          style={{ animation: 'spin 0.75s linear infinite' }}
        />
      </div>
      <p className="text-xs font-medium text-slate-400">{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
