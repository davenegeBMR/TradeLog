import React, { useState } from 'react';
import { SessionReview, TradeSession } from '../types';
import { X, Check, Award, AlertCircle } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (review: SessionReview) => void;
  sessionName?: TradeSession;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  sessionName = 'London',
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [session, setSession] = useState<TradeSession>(sessionName);
  const [followedPlan, setFollowedPlan] = useState<boolean>(true);
  const [tookImpulsiveTrades, setTookImpulsiveTrades] = useState<boolean>(false);
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatToImprove, setWhatToImprove] = useState('');
  const [disciplineScore, setDisciplineScore] = useState<number>(9);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const review: SessionReview = {
      id: `rev-${Date.now()}`,
      date,
      session,
      followedPlan,
      tookImpulsiveTrades,
      whatWentWell: whatWentWell.trim(),
      whatToImprove: whatToImprove.trim(),
      disciplineScore,
      createdAt: Date.now(),
    };
    onSave(review);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Post-Session Reflection</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grade your psychological discipline and rules adherence
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Session</label>
              <select
                value={session}
                onChange={e => setSession(e.target.value as TradeSession)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Asian">Asian</option>
                <option value="London">London</option>
                <option value="London–New York overlap">London–NY Overlap</option>
                <option value="New York">New York</option>
              </select>
            </div>
          </div>

          {/* Question 1: Did I follow my trading plan? */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="block font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Did you follow your trading plan today?
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFollowedPlan(true)}
                className={`py-2 px-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  followedPlan
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Yes, 100%</span>
              </button>
              <button
                type="button"
                onClick={() => setFollowedPlan(false)}
                className={`py-2 px-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  !followedPlan
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Deviated / Broke Rules</span>
              </button>
            </div>
          </div>

          {/* Question 2: Did I take any impulsive trades? */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="block font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Did you take any impulsive or revenge trades?
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTookImpulsiveTrades(false)}
                className={`py-2 px-3 rounded-lg font-bold transition-colors ${
                  !tookImpulsiveTrades
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                No Impulsive Trades
              </button>
              <button
                type="button"
                onClick={() => setTookImpulsiveTrades(true)}
                className={`py-2 px-3 rounded-lg font-bold transition-colors ${
                  tookImpulsiveTrades
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Yes, Traded on FOMO
              </button>
            </div>
          </div>

          {/* Self-Rating Discipline Score */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-700 dark:text-slate-300 font-semibold">
                Discipline Rating (1 - 10)
              </label>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {disciplineScore} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={disciplineScore}
              onChange={e => setDisciplineScore(parseInt(e.target.value))}
              className="w-full accent-slate-900 dark:accent-white"
            />
          </div>

          {/* What did I do well? */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              What did you do well?
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Patiently waited for the London sweep, stayed calm after small loss..."
              value={whatWentWell}
              onChange={e => setWhatWentWell(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* What should I improve tomorrow? */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              What should you improve tomorrow?
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Close the charts after daily target, avoid watching lower timeframes..."
              value={whatToImprove}
              onChange={e => setWhatToImprove(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-xs transition-colors"
            >
              Save Reflection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
