import React from 'react';
import { Challenge, NextSessionAlarm, SessionConfig, Trade, TradingRule, UserSettings } from '../types';
import { AnalyticsSummary } from '../utils/analytics';
import { EquityChart } from './EquityChart';
import { SessionHeatmap } from './SessionHeatmap';
import { InstrumentBreakdown } from './InstrumentBreakdown';
import { DailyPerformanceTable } from './DailyPerformanceTable';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Award,
  Smartphone,
  Download,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface OverviewTabProps {
  analytics: AnalyticsSummary;
  trades: Trade[];
  challenges: Challenge[];
  nextAlarm: NextSessionAlarm | null;
  settings: UserSettings;
  tradingRules: TradingRule[];
  onToggleChallengeDay: (challengeId: string, dateStr: string) => void;
  onOpenTradeModal: () => void;
  onOpenPreSession: (session?: SessionConfig) => void;
  onOpenReviewModal: () => void;
  onOpenInstallModal?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  analytics,
  trades,
  challenges,
  nextAlarm,
  settings,
  onToggleChallengeDay,
  onOpenTradeModal,
  onOpenPreSession,
  onOpenReviewModal,
  onOpenInstallModal,
}) => {
  const isNetProfitPositive = analytics.netProfit >= 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const { isInstalled } = usePWAInstall();

  // Calculate today's challenge completion
  const todayCompletedCount = challenges.filter(c => c.completedDates.includes(todayStr)).length;
  const totalChallenges = challenges.length;
  const todayProgressPct = totalChallenges > 0 ? Math.round((todayCompletedCount / totalChallenges) * 100) : 0;

  return (
    <div className="space-y-5 pb-8">
      {/* Android Installation Banner */}
      {!isInstalled && onOpenInstallModal && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Download & Install TradeLog on Android
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Install as a standalone native app on your phone with offline support and alarms.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 self-end sm:self-auto shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        </div>
      )}

      {/* 1. Next Upcoming Session Alarm Card */}
      {nextAlarm && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-semibold text-emerald-300">
                  {nextAlarm.isActiveRightNow ? 'ACTIVE NOW' : 'UPCOMING SESSION'}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-300 font-mono">
                  {settings.timezone.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {nextAlarm.session.name}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Starts at <span className="font-bold text-white">{nextAlarm.formattedLocalTime}</span>. {nextAlarm.session.prepReminder}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenPreSession(nextAlarm.session)}
                className="px-4 py-2.5 bg-white text-slate-950 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Prep Checklist</span>
              </button>
              <button
                type="button"
                onClick={onOpenReviewModal}
                className="px-3 py-2.5 bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Review</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">
            Total Net P/L
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                isNetProfitPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isNetProfitPositive ? '+' : ''}${analytics.netProfit.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
            {isNetProfitPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span>Gross: ${analytics.grossProfit.toFixed(2)}</span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">
            Win Rate
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {analytics.winRate.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {analytics.winningTrades}W / {analytics.losingTrades}L ({analytics.closedTrades} closed)
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">
            Profit Factor
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Gross win / loss ratio
          </div>
        </div>

        {/* Avg Risk-to-Reward & Streak */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mb-1">
            Realized R:R & Streak
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              1:{analytics.avgRealizedRR.toFixed(2)}
            </span>
            {analytics.currentStreak.count > 0 && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono ${
                  analytics.currentStreak.type === 'WIN'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                {analytics.currentStreak.count} {analytics.currentStreak.type}
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Planned avg: 1:{analytics.avgPlannedRR.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 3. Equity Curve Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Equity Curve
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cumulative balance growth & drawdown tracking
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Max Drawdown</span>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
              -${analytics.maxDrawdown.toFixed(2)} ({analytics.maxDrawdownPct.toFixed(1)}%)
            </span>
          </div>
        </div>

        <EquityChart data={analytics.equityCurve} startingBalance={settings.accountBalance} />
      </div>

      {/* 4. Today's Personal Discipline Challenges */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Today's Discipline Goals
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Habits and rules required for long-term consistency
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {todayCompletedCount}/{totalChallenges} Done ({todayProgressPct}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${todayProgressPct}%` }}
          ></div>
        </div>

        {/* Challenges List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {challenges.slice(0, 4).map(ch => {
            const isCompletedToday = ch.completedDates.includes(todayStr);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => onToggleChallengeDay(ch.id, todayStr)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                  isCompletedToday
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{ch.name}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {ch.category} · {ch.completedDates.length} days checked
                  </div>
                </div>
                <div className="shrink-0">
                  {isCompletedToday ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-slate-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Trading Activity Heatmap Matrix (Matching Screenshot 1) */}
      <SessionHeatmap matrix={analytics.sessionActivityHeatmap} />

      {/* 6. Your Instruments & Most Profitable Instruments (Matching Screenshot 1 & 2) */}
      <InstrumentBreakdown instruments={analytics.instrumentBreakdown} />

      {/* 7. Daily Performance Table (Matching Screenshot 2 & 3) */}
      <DailyPerformanceTable rows={analytics.dailyRows} />

      {/* Quick Add Floating Button trigger */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={onOpenTradeModal}
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record a Trade</span>
        </button>
      </div>
    </div>
  );
};
