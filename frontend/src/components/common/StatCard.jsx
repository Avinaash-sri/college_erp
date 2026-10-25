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
    <div className={`erp-card p-3 sm:p-3.5 ${accentClass} animate-fade-in-up flex flex-col justify-between`}>
      {/* Top Header: Full-width Title + Icon */}
      <div className="flex items-start justify-between gap-1.5">
        <p
          className="flex-1 min-w-0 text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wide leading-snug whitespace-normal break-words line-clamp-2 min-h-[2rem] flex items-center"
          title={title}
        >
          {title}
        </p>
        {Icon && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 ml-1 mt-0.5">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" strokeWidth={1.8} />
          </div>
        )}
      </div>

      {/* Middle: Numeric Value */}
      <div className="mt-1 sm:mt-1.5">
        <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-none tabular-nums">
          {value}
        </p>
      </div>

      {/* Bottom Footer: Subtitle / Trend / Badge */}
      <div className="mt-1.5 pt-0.5 flex items-center justify-between gap-1.5 min-h-[1.25rem]">
        <div className="flex-1 min-w-0">
          {subtitle && (
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}
          {!trendNeutral && (
            <p className={`text-[10px] sm:text-[11px] font-semibold ${trendPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
              {trendPositive ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
    </div>
  );
}
