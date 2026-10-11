import React, { useState } from 'react';
import { SessionConfig, TradingRule } from '../types';
import { X, CheckCircle2, Shield, Bell } from 'lucide-react';
import { playSuccessChime } from '../utils/sound';

interface PreSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: SessionConfig;
  rules: TradingRule[];
}

export const PreSessionModal: React.FC<PreSessionModalProps> = ({
  isOpen,
  onClose,
  session,
  rules,
}) => {
  if (!isOpen) return null;

  const [checkedIds, setCheckedIds] = useState<{ [id: string]: boolean }>({});

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allComplete = rules.length > 0 && rules.every(r => checkedIds[r.id]);

  const handleFinish = () => {
    playSuccessChime();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {session ? `${session.name} Checklist` : 'Pre-Session Checklist'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review before placing any orders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reminder Banner */}
        {session?.prepReminder && (
          <div className="mx-5 mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 font-medium">
              <span className="font-bold">Session Reminder: </span>
              {session.prepReminder}
            </div>
          </div>
        )}

        {/* Checklist Items */}
        <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {rules.map((rule, idx) => {
            const isDone = !!checkedIds[rule.id];
            return (
              <button
                key={rule.id}
                type="button"
                onClick={() => toggleCheck(rule.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  isDone
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="text-xs font-medium leading-relaxed">
                  {rule.text}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {Object.values(checkedIds).filter(Boolean).length} / {rules.length} completed
          </span>
          <button
            type="button"
            onClick={handleFinish}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              allComplete
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900'
            }`}
          >
            {allComplete ? 'Ready to Trade' : 'Close Checklist'}
          </button>
        </div>
      </div>
    </div>
  );
};
