import React from 'react';
import { NextSessionAlarm, SessionConfig, TradingRule } from '../types';
import { BellRing, ShieldCheck, X } from 'lucide-react';

interface AlarmBannerProps {
  alarm: NextSessionAlarm;
  onDismiss: () => void;
  onOpenChecklist: (session: SessionConfig) => void;
}

export const AlarmBanner: React.FC<AlarmBannerProps> = ({
  alarm,
  onDismiss,
  onOpenChecklist,
}) => {
  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs font-medium animate-pulse">
      <div className="flex items-center gap-2 min-w-0">
        <BellRing className="w-4 h-4 shrink-0 text-slate-950" />
        <div className="truncate">
          <span className="font-bold">{alarm.session.name} Alarm!</span> Starts at{' '}
          {alarm.formattedLocalTime}. Reminder: {alarm.session.prepReminder}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onOpenChecklist(alarm.session)}
          className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[11px] font-bold hover:bg-slate-800 transition-colors flex items-center gap-1"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Prep Checklist</span>
        </button>
        <button
          onClick={onDismiss}
          className="p-1 text-slate-900 hover:text-slate-800 transition-colors"
          aria-label="Dismiss alarm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
