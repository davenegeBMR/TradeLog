import React, { useState, useEffect } from 'react';
import { NextSessionAlarm, SessionConfig, TradingRule, UserSettings } from '../types';
import {
  POPULAR_TIMEZONES,
  formatUtcToTargetTz,
  getEffectiveSessionUtcStart,
  isDaylightSavingTime,
} from '../utils/sessions';
import { playSessionChime } from '../utils/sound';
import {
  Clock,
  Bell,
  BellRing,
  Volume2,
  Check,
  ShieldCheck,
  Globe,
  Sun,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface SessionsTabProps {
  sessions: SessionConfig[];
  settings: UserSettings;
  tradingRules: TradingRule[];
  nextAlarm: NextSessionAlarm | null;
  onUpdateSessions: (sessions: SessionConfig[]) => void;
  onUpdateSettings: (settings: UserSettings) => void;
  onOpenPreSession: (session: SessionConfig) => void;
}

const WEEKDAY_NAMES = [
  { label: 'Mon', index: 1 },
  { label: 'Tue', index: 2 },
  { label: 'Wed', index: 3 },
  { label: 'Thu', index: 4 },
  { label: 'Fri', index: 5 },
  { label: 'Sat', index: 6 },
  { label: 'Sun', index: 0 },
];

export const SessionsTab: React.FC<SessionsTabProps> = ({
  sessions,
  settings,
  nextAlarm,
  onUpdateSessions,
  onUpdateSettings,
  onOpenPreSession,
}) => {
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [testChimePlaying, setTestChimePlaying] = useState(false);
  const [showNotificationHelp, setShowNotificationHelp] = useState(false);

  // Live countdown timer string
  const [countdownStr, setCountdownStr] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      if (!nextAlarm) {
        setCountdownStr('');
        return;
      }
      const now = Date.now();
      const diff = Math.max(0, Math.floor((nextAlarm.startDate.getTime() - now) / 1000));
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      setCountdownStr(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextAlarm]);

  const handleToggleSession = (id: string) => {
    const updated = sessions.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    onUpdateSessions(updated);
  };

  const handleUpdateLeadMinutes = (id: string, mins: number) => {
    const updated = sessions.map(s => (s.id === id ? { ...s, alarmLeadMinutes: mins } : s));
    onUpdateSessions(updated);
  };

  const handleToggleWeekday = (sessionId: string, dayIndex: number) => {
    const updated = sessions.map(s => {
      if (s.id !== sessionId) return s;
      const activeDays = s.activeDays.includes(dayIndex)
        ? s.activeDays.filter(d => d !== dayIndex)
        : [...s.activeDays, dayIndex];
      return { ...s, activeDays };
    });
    onUpdateSessions(updated);
  };

  const handleUpdateReminder = (sessionId: string, text: string) => {
    const updated = sessions.map(s => (s.id === sessionId ? { ...s, prepReminder: text } : s));
    onUpdateSessions(updated);
  };

  const handleTestSound = () => {
    setTestChimePlaying(true);
    playSessionChime();
    setTimeout(() => setTestChimePlaying(false), 800);
  };

  const handleRequestNotifications = async () => {
    if (typeof Notification === 'undefined') {
      alert('Browser notifications are not supported in this browser environment. In-app alarms are active.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationStatus(perm);
      if (perm === 'granted') {
        onUpdateSettings({ ...settings, browserNotifications: true });
        new Notification('TradeLog Alarms Active', {
          body: 'You will receive notifications before your trading sessions begin.',
          icon: '/favicon.ico',
        });
      }
    } catch {
      // ignore
    }
  };

  // DST status inspection
  const londonDst = isDaylightSavingTime('Europe/London');
  const nyDst = isDaylightSavingTime('America/New_York');

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sessions & Alarms
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure market open alarms, local timezone conversion, and pre-session checklists
          </p>
        </div>

        {/* Sound & Notification Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestSound}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Volume2 className={`w-4 h-4 ${testChimePlaying ? 'text-amber-500' : ''}`} />
            <span>Test Alarm Sound</span>
          </button>

          <button
            type="button"
            onClick={handleRequestNotifications}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              notificationStatus === 'granted'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{notificationStatus === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}</span>
          </button>
        </div>
      </div>

      {/* 1. Countdown Hero Card */}
      {nextAlarm && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Next Scheduled Session
                </span>
              </div>
              <h3 className="text-2xl font-extrabold">{nextAlarm.session.name}</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Local time: <span className="font-bold text-white">{nextAlarm.formattedLocalTime}</span> ({settings.timezone.replace('_', ' ')})
              </p>
            </div>

            {/* Countdown Display */}
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 px-5 py-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider block">
                Time Until Open
              </span>
              <div className="text-3xl font-mono font-bold tracking-tight text-white mt-0.5">
                {countdownStr || '00:00:00'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Timezone & Daylight Saving Time Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Timezone & Automatic Daylight Saving Time (DST)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Session start and end hours are calculated and converted into your preferred timezone.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Primary Local Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={e => onUpdateSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
            >
              {POPULAR_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
              Active Market Seasonal Offsets:
            </span>
            <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
              <div>
                London:{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {londonDst ? 'British Summer Time (BST, UTC+1)' : 'Greenwich Mean Time (GMT, UTC+0)'}
                </span>
              </div>
              <div>
                New York:{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {nyDst ? 'Eastern Daylight Time (EDT, UTC-4)' : 'Eastern Standard Time (EST, UTC-5)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Session Cards Configuration */}
      <div className="space-y-4">
        {sessions.map(session => {
          const effectiveStart = getEffectiveSessionUtcStart(session);
          const localStartTime = formatUtcToTargetTz(effectiveStart.hour, effectiveStart.minute, settings.timezone);
          const localEndTime = formatUtcToTargetTz(session.endHourUtc, session.endMinuteUtc, settings.timezone);

          return (
            <div
              key={session.id}
              className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs transition-all ${
                session.enabled
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200/60 dark:border-slate-800/40 opacity-75'
              }`}
            >
              {/* Header with Switch */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: session.color }}
                  ></div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {session.name}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {localStartTime} – {localEndTime} ({settings.timezone.split('/')[1] || settings.timezone})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenPreSession(session)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Checklist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleSession(session.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      session.enabled ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-900 shadow-md ring-0 transition duration-200 ease-in-out ${
                        session.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Controls when enabled */}
              {session.enabled && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5 text-xs">
                  {/* Alarm Lead Time */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Alarm Timing Before Open:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[0, 5, 10, 15, 30].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleUpdateLeadMinutes(session.id, mins)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                            session.alarmLeadMinutes === mins
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {mins === 0 ? 'At Open' : `${mins}m before`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Weekdays */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Recurring Alarm Days:
                    </span>
                    <div className="flex items-center gap-1">
                      {WEEKDAY_NAMES.map(day => {
                        const isActive = session.activeDays.includes(day.index);
                        return (
                          <button
                            key={day.label}
                            type="button"
                            onClick={() => handleToggleWeekday(session.id, day.index)}
                            className={`w-7 h-7 rounded-lg font-semibold text-[11px] transition-colors ${
                              isActive
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Personal Reminder Text */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Session Preparation Reminder
                    </label>
                    <input
                      type="text"
                      value={session.prepReminder}
                      onChange={e => handleUpdateReminder(session.id, e.target.value)}
                      placeholder="e.g. Check high-timeframe bias, wait for liquidity sweep..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Permissions Note */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
            About Browser & In-App Alarms
          </span>
          Alarms play audio chimes and display in-app checklists while the app is active in your browser tab. For system-level push notifications, allow notification permissions when prompted. Background notifications require keeping the web application pinned or installed as a PWA.
        </div>
      </div>
    </div>
  );
};
