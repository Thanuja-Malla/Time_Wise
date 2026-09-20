import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ type = 'info', message, onClose }) {
  if (!message) return null;

  const styles = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    error: 'bg-rose-50 border-rose-300 text-rose-900',
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
    info: 'bg-indigo-50 border-indigo-300 text-indigo-900'
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-600 shrink-0" />
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-md animate-in slide-in-from-top-2 duration-200 ${
        styles[type] || styles.info
      }`}
    >
      {icons[type] || icons.info}
      <div className="flex-1 text-sm font-medium leading-relaxed">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 transition p-0.5 rounded-lg -mr-1"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
