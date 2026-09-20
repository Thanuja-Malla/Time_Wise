import React from 'react';

export default function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-indigo-200 border-t-indigo-600 rounded-full animate-spin`}
      />
      {message && <p className="text-xs font-medium text-slate-500 tracking-wide">{message}</p>}
    </div>
  );
}
