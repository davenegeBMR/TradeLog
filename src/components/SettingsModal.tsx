import React, { useState } from 'react';
import { UserSettings } from '../types';
import { POPULAR_TIMEZONES } from '../utils/sessions';
import { X, Sliders, RotateCcw, Trash2, Sun, Moon, Volume2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onResetToDemoData: () => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetToDemoData,
  onClearAllData,
}) => {
  if (!isOpen) return null;

  const [timezone, setTimezone] = useState(settings.timezone);
  const [accountBalance, setAccountBalance] = useState(settings.accountBalance.toString());
  const [dailyLossLimit, setDailyLossLimit] = useState(settings.dailyLossLimit.toString());
  const [maxRiskPercent, setMaxRiskPercent] = useState(settings.maxRiskPerTradePercent.toString());
  const [soundAlerts, setSoundAlerts] = useState(settings.soundAlerts);
  const [theme, setTheme] = useState<'light' | 'dark'>(settings.theme);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      timezone,
      accountBalance: parseFloat(accountBalance) || 10000,
      dailyLossLimit: parseFloat(dailyLossLimit) || 200,
      maxRiskPerTradePercent: parseFloat(maxRiskPercent) || 1.0,
      soundAlerts,
      theme,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-slate-800 dark:text-slate-200" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              App Settings & Preferences
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Theme Switch */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Theme Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  onSaveSettings({ ...settings, theme: 'light' });
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  onSaveSettings({ ...settings, theme: 'dark' });
                }}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-colors ${
                  theme === 'dark'
                    ? 'bg-white text-slate-900 border-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Trading Timezone
            </label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
            >
              {POPULAR_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Account Balance & Risk */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Balance ($)
              </label>
              <input
                type="number"
                step="any"
                value={accountBalance}
                onChange={e => setAccountBalance(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl tabular-nums font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daily Loss Limit ($)
              </label>
              <input
                type="number"
                step="any"
                value={dailyLossLimit}
                onChange={e => setDailyLossLimit(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl tabular-nums font-mono"
              />
            </div>
          </div>

          {/* Max Risk % */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Max Risk Per Trade (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={maxRiskPercent}
              onChange={e => setMaxRiskPercent(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl tabular-nums font-mono"
            />
          </div>

          {/* Sound Alerts */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Session Audio Chime
              </span>
            </div>
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={e => setSoundAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-slate-900"
            />
          </div>

          {/* Reset & Wipe Options */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Data Management
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Restore default trading sample dataset matching the screenshots?')) {
                    onResetToDemoData();
                    onClose();
                  }
                }}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Sample Data</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all trades and start fresh with empty journal?')) {
                    onClearAllData();
                    onClose();
                  }
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Trades</span>
              </button>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500">
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold rounded-xl"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
