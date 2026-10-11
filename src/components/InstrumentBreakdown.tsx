import React from 'react';
import { InstrumentStats } from '../utils/analytics';
import { TrendingUp } from 'lucide-react';

interface InstrumentBreakdownProps {
  instruments: InstrumentStats[];
}

export const InstrumentBreakdown: React.FC<InstrumentBreakdownProps> = ({ instruments }) => {
  if (!instruments || instruments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center text-xs text-slate-400">
        No instrument data yet.
      </div>
    );
  }

  // Sorted by trade volume
  const byTrades = [...instruments].sort((a, b) => b.trades - a.trades);

  // Sorted by net profit
  const byProfit = [...instruments].sort((a, b) => b.netProfit - a.netProfit);
  const maxNetProfit = Math.max(...instruments.map(i => Math.abs(i.netProfit)), 1);

  return (
    <div className="space-y-4">
      {/* 1. Your instruments - By trades (Matching screenshot 1) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Your instruments
          </h3>
          <span className="text-xs text-slate-400 font-medium">By trades</span>
        </div>

        <div className="space-y-4">
          {byTrades.map(item => (
            <div key={item.instrument}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {item.instrument}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium font-mono tabular-nums">
                  {item.trades} {item.trades === 1 ? 'trade' : 'trades'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mb-1.5 font-mono tabular-nums">
                {item.percentageOfAll.toFixed(1)}% of all trades
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-700/80 dark:bg-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(4, item.percentageOfAll))}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Most profitable instruments (Matching screenshot 1 & 2) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Most profitable instruments
          </h3>
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </div>

        <div className="space-y-4">
          {byProfit.map(item => {
            const isProfitable = item.netProfit >= 0;
            const barWidth = Math.min(100, Math.max(6, (Math.abs(item.netProfit) / maxNetProfit) * 100));

            return (
              <div key={item.instrument}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {item.instrument}
                  </span>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isProfitable ? '+' : ''}${item.netProfit.toFixed(2)}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isProfitable
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-rose-500 dark:bg-rose-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
