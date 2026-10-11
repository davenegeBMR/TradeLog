import React from 'react';
import { DailyPerformanceRow } from '../utils/analytics';
import { Calendar } from 'lucide-react';

interface DailyPerformanceTableProps {
  rows: DailyPerformanceRow[];
}

export const DailyPerformanceTable: React.FC<DailyPerformanceTableProps> = ({ rows }) => {
  if (!rows || rows.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center text-xs text-slate-400">
        No daily trade activity recorded yet.
      </div>
    );
  }

  const totalTrades = rows.reduce((acc, r) => acc + r.trades, 0);
  const totalLots = Math.round(rows.reduce((acc, r) => acc + r.lots, 0) * 100) / 100;
  const totalCashProfit = Math.round(rows.reduce((acc, r) => acc + r.cashProfit, 0) * 100) / 100;
  const avgReturnPct = rows.length > 0 ? rows.reduce((acc, r) => acc + r.returnPct, 0) : 0;
  const isOverallProfitable = totalCashProfit >= 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
      {/* Title block matching screenshot */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Daily performance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Broker days, realized results.
          </p>
        </div>
      </div>

      {/* Table container with horizontal scroll support */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
              <th className="py-2.5 pr-3 font-medium">Date</th>
              <th className="py-2.5 px-3 font-medium text-right">Trades</th>
              <th className="py-2.5 px-3 font-medium text-right">Lots</th>
              <th className="py-2.5 px-3 font-medium text-right">Cash profit (USD)</th>
              <th className="py-2.5 pl-3 font-medium text-right">Return %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
            {rows.map(row => {
              const isProfit = row.cashProfit >= 0;
              return (
                <tr key={row.date} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 pr-3 font-sans font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {row.formattedDate}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {row.trades}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {row.lots.toFixed(2)}
                  </td>
                  <td
                    className={`py-3 px-3 text-right tabular-nums font-semibold ${
                      isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isProfit ? '$' : '-$'}{Math.abs(row.cashProfit).toFixed(2)}
                  </td>
                  <td
                    className={`py-3 pl-3 text-right tabular-nums font-semibold ${
                      row.returnPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {row.returnPct >= 0 ? '' : '-'}{Math.abs(row.returnPct).toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 dark:border-slate-700 font-bold font-mono">
              <td className="py-3 pr-3 font-sans text-slate-900 dark:text-white">
                Total
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-slate-900 dark:text-white">
                {totalTrades}
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-slate-900 dark:text-white">
                {totalLots.toFixed(2)}
              </td>
              <td
                className={`py-3 px-3 text-right tabular-nums ${
                  isOverallProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isOverallProfitable ? '$' : '-$'}{Math.abs(totalCashProfit).toFixed(2)}
              </td>
              <td
                className={`py-3 pl-3 text-right tabular-nums ${
                  avgReturnPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {avgReturnPct >= 0 ? '' : '-'}{Math.abs(avgReturnPct).toFixed(2)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
