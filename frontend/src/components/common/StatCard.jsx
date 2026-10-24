import React from 'react';

const accentMap = {
  indigo: 'stat-accent-blue',
  blue: 'stat-accent-blue',
  emerald: 'stat-accent-emerald',
  amber: 'stat-accent-amber',
  rose: 'stat-accent-rose',
  violet: 'stat-accent-blue',
  sky: 'stat-accent-sky',
};

export default function StatCard({ title, value, subtitle, icon: Icon, badge, accent = 'blue', trend }) {
  const accentClass = accentMap[accent] || accentMap.blue;
  const trendPositive = trend > 0;
  const trendNeutral = trend === undefined || trend === null;

  return (
    <div className={`erp-card p-4 ${accentClass} animate-fade-in-up`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 leading-none tabular-nums">{value}</p>
          {subtitle && (
            <p className="mt-1 text-[11px] text-slate-400 truncate">{subtitle}</p>
          )}
          {!trendNeutral && (
            <p className={`mt-1.5 text-[11px] font-semibold ${trendPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
              {trendPositive ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {Icon && (
            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4.5 h-4.5 text-slate-500" strokeWidth={1.8} />
            </div>
          )}
          {badge && <div>{badge}</div>}
        </div>
      </div>
    </div>
  );
}
