import React from 'react';

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  badge,
  badgeType = 'neutral'
}) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      gradient: 'from-amber-500 to-amber-600'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      gradient: 'from-rose-500 to-rose-600'
    },
    sky: {
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      border: 'border-sky-100',
      gradient: 'from-sky-500 to-sky-600'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      gradient: 'from-purple-500 to-purple-600'
    }
  };

  const badgeStyles = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    negative: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      {/* Decorative top gradient strip */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${scheme.gradient}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {value}
            </h3>
            {badge && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  badgeStyles[badgeType] || badgeStyles.neutral
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${scheme.bg} ${scheme.text} group-hover:scale-105 transition-transform`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
