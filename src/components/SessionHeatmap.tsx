import React from 'react';
import { BarChart2 } from 'lucide-react';

interface SessionHeatmapProps {
  matrix: {
    [session: string]: { [dayIndex: number]: number };
  };
}

export const SessionHeatmap: React.FC<SessionHeatmapProps> = ({ matrix }) => {
  const days = [
    { label: 'Mon', index: 1 },
    { label: 'Tue', index: 2 },
    { label: 'Wed', index: 3 },
    { label: 'Thu', index: 4 },
    { label: 'Fri', index: 5 },
    { label: 'Sat', index: 6 },
    { label: 'Sun', index: 7 },
  ];

  const sessions = ['Sydney', 'Asia', 'London', 'New York'];

  // Find max count for dynamic heat scaling
  let maxCount = 1;
  sessions.forEach(sess => {
    days.forEach(day => {
      const count = matrix?.[sess]?.[day.index] || 0;
      if (count > maxCount) maxCount = count;
    });
  });

  const getCellColor = (count: number) => {
    if (!count || count === 0) {
      return 'bg-slate-100 dark:bg-slate-800/60';
    }
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 'bg-emerald-200 dark:bg-emerald-900/60';
    if (ratio <= 0.5) return 'bg-emerald-400/80 dark:bg-emerald-700';
    if (ratio <= 0.75) return 'bg-emerald-500 dark:bg-emerald-600';
    return 'bg-emerald-600 dark:bg-emerald-500';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
      {/* Title block matching screenshot */}
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 shrink-0">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Trading activity</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Trades opened by session and day (UTC).
          </p>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-[280px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-2 mb-2 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <div></div> {/* session label space */}
            {days.map(d => (
              <div key={d.label}>{d.label}</div>
            ))}
          </div>

          {/* Session Rows */}
          <div className="space-y-2">
            {sessions.map(sess => (
              <div key={sess} className="grid grid-cols-8 gap-2 items-center">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 text-left truncate pr-1">
                  {sess}
                </div>
                {days.map(d => {
                  const count = matrix?.[sess]?.[d.index] || 0;
                  return (
                    <div
                      key={d.label}
                      title={`${sess} - ${d.label}: ${count} trades`}
                      className={`h-7 rounded-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center text-[10px] font-mono font-bold ${
                        count > 0 ? 'text-white' : 'text-transparent'
                      } ${getCellColor(count)}`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Less ... More Scale matching screenshot */}
          <div className="flex items-center justify-end gap-1.5 mt-4 text-[11px] text-slate-400">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-200 dark:bg-emerald-900/60"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400/80 dark:bg-emerald-700"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500 dark:bg-emerald-600"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-600 dark:bg-emerald-500"></div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};
