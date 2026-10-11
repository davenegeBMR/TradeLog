import React, { useState } from 'react';
import { AnalyticsSummary, calculateAnalytics } from '../utils/analytics';
import { Trade, UserSettings } from '../types';
import { SessionHeatmap } from './SessionHeatmap';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Activity,
  ShieldCheck,
  AlertOctagon,
  Calendar,
  Layers,
  Scale,
  Award,
} from 'lucide-react';

interface AnalyticsTabProps {
  trades: Trade[];
  settings: UserSettings;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ trades, settings }) => {
  const [filterPeriod, setFilterPeriod] = useState<'7' | '30' | '90' | 'ALL' | 'CUSTOM'>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const filterDays =
    filterPeriod === '7' ? 7 : filterPeriod === '30' ? 30 : filterPeriod === '90' ? 90 : undefined;

  const customRange =
    filterPeriod === 'CUSTOM' ? { start: customStart, end: customEnd } : undefined;

  const data: AnalyticsSummary = calculateAnalytics(
    trades,
    settings.accountBalance,
    filterDays,
    customRange
  );

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Trading Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Realized mathematical metrics calculated from {data.closedTrades} closed positions
          </p>
        </div>

        {/* Date Filter Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
          {(['7', '30', '90', 'ALL', 'CUSTOM'] as const).map(period => (
            <button
              key={period}
              type="button"
              onClick={() => setFilterPeriod(period)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterPeriod === period
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {period === 'ALL'
                ? 'All Time'
                : period === 'CUSTOM'
                ? 'Custom'
                : `Last ${period}d`}
            </button>
          ))}
        </div>
      </div>

      {filterPeriod === 'CUSTOM' && (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-0.5">Start Date</label>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded-md"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-0.5">End Date</label>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded-md"
            />
          </div>
        </div>
      )}

      {/* 1. Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Net Profit & Gross Win/Loss */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-400 block mb-1">Net Realized P/L</span>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              data.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {data.netProfit >= 0 ? '+' : ''}${data.netProfit.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            +${data.grossProfit.toFixed(2)} / -${data.grossLoss.toFixed(2)}
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-400 block mb-1">Win Rate (W / Closed)</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {data.winRate.toFixed(1)}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {data.winningTrades} wins · {data.losingTrades} losses · {data.breakevenTrades} BE
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-400 block mb-1">Profit Factor</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {data.profitFactor === Infinity ? '∞' : data.profitFactor.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Gross Profit / Gross Loss
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-400 block mb-1">Max Drawdown</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            -${data.maxDrawdown.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {data.maxDrawdownPct.toFixed(1)}% peak drop
          </div>
        </div>
      </div>

      {/* 2. Secondary Metrics: Avg Win vs Avg Loss & Realized R:R */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Avg Win vs Avg Loss</span>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +${data.avgWin.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">vs</span>
            <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">
              -${data.avgLoss.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Win/Loss Ratio: <span className="font-mono font-semibold">{data.winLossRatio.toFixed(2)}x</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Risk-to-Reward Execution</span>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Planned</span>
              <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                1:{data.avgPlannedRR.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Realized</span>
              <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                1:{data.avgRealizedRR.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Efficiency: {data.avgPlannedRR > 0 ? ((data.avgRealizedRR / data.avgPlannedRR) * 100).toFixed(0) : 0}% of target
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Best & Worst Executions</span>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Best Win</span>
              <span className="text-base font-bold font-mono text-emerald-600">
                +${data.bestTrade.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Worst Loss</span>
              <span className="text-base font-bold font-mono text-rose-600">
                -${Math.abs(data.worstTrade).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Total Fees: ${data.totalFees.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 3. The Discipline Edge Card (Key Discipline Question Answer) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>DISCIPLINE EDGE ANALYSIS</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Following Rules vs Breaking Rules
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Does following your written trading plan mathematically make you more profitable?
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Discipline P/L Edge</span>
            <span
              className={`text-base font-mono font-bold ${
                data.disciplineStats.disciplineEdge >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              +${data.disciplineStats.disciplineEdge.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Rules Followed */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                When Rules Were Followed
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300">
                {data.disciplineStats.followedCount} trades
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">Net P/L</span>
                <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  +${data.disciplineStats.followedProfit.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">Win Rate</span>
                <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {data.disciplineStats.followedWinRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Rules Broken */}
          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                When Rules Were Broken
              </span>
              <span className="text-xs font-mono font-bold text-rose-800 dark:text-rose-300">
                {data.disciplineStats.brokenCount} trades
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <div>
                <span className="text-[11px] text-rose-700 dark:text-rose-400 block">Net P/L</span>
                <span className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
                  ${data.disciplineStats.brokenProfit.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-rose-700 dark:text-rose-400 block">Win Rate</span>
                <span className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">
                  {data.disciplineStats.brokenWinRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Session Breakdown Table & Heatmap */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Performance by Trading Session
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Detailed metrics across Asian, London, and New York sessions
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 pr-3 font-medium">Session</th>
                <th className="py-2.5 px-3 font-medium text-right">Trades</th>
                <th className="py-2.5 px-3 font-medium text-right">Lots</th>
                <th className="py-2.5 px-3 font-medium text-right">Net P/L</th>
                <th className="py-2.5 px-3 font-medium text-right">Win Rate</th>
                <th className="py-2.5 pl-3 font-medium text-right">Avg Realized R:R</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {data.sessionBreakdown.map(sess => {
                const isProfit = sess.netProfit >= 0;
                return (
                  <tr key={sess.session} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 pr-3 font-sans font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {sess.session}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {sess.trades}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {sess.lots.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-3 text-right tabular-nums font-semibold ${
                        isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isProfit ? '+' : ''}${sess.netProfit.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {sess.trades > 0 ? `${sess.winRate.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3 pl-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {sess.trades > 0 ? `1:${sess.avgRealizedRR.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmap Matrix */}
      <SessionHeatmap matrix={data.sessionActivityHeatmap} />

      {/* 5. Performance by Setup / Strategy */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Performance by Strategy / Setup
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Identifies your highest edge and most consistent trading models
        </p>

        <div className="space-y-3">
          {data.strategyBreakdown.map(st => {
            const isProfit = st.netProfit >= 0;
            return (
              <div
                key={st.strategy}
                className="p-3 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {st.strategy}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {st.trades} trades · {st.winRate.toFixed(1)}% win rate
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div
                    className={`font-bold tabular-nums ${
                      isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isProfit ? '+' : ''}${st.netProfit.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    PF: {st.profitFactor.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Weekday Performance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Performance by Weekday
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          See which days of the week generate your highest returns
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {data.weekdayBreakdown.filter(w => w.dayIndex >= 1 && w.dayIndex <= 5).map(w => (
            <div
              key={w.dayName}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-center text-xs"
            >
              <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">{w.dayName}</div>
              <div className="text-[11px] text-slate-400 mb-1">{w.trades} trades</div>
              <div
                className={`font-mono font-bold tabular-nums ${
                  w.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {w.netProfit >= 0 ? '+' : ''}${w.netProfit.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
