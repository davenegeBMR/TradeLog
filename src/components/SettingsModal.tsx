import React, { useState } from 'react';
import { UserSettings } from '../types';
import { POPULAR_TIMEZONES } from '../utils/sessions';
import { exportFullBackupJSON, importFullBackupJSON } from '../utils/storage';
import {
  X,
  Sliders,
  RotateCcw,
  Trash2,
  Sun,
  Moon,
  Volume2,
  Download,
  Upload,
  GitBranch,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onResetToDemoData: () => void;
  onClearAllData: () => void;
  onReloadAllData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetToDemoData,
  onClearAllData,
  onReloadAllData,
}) => {
  if (!isOpen) return null;

  const [timezone, setTimezone] = useState(settings.timezone);
  const [accountBalance, setAccountBalance] = useState(settings.accountBalance.toString());
  const [dailyLossLimit, setDailyLossLimit] = useState(settings.dailyLossLimit.toString());
  const [maxRiskPercent, setMaxRiskPercent] = useState(settings.maxRiskPerTradePercent.toString());
  const [soundAlerts, setSoundAlerts] = useState(settings.soundAlerts);
  const [theme, setTheme] = useState<'light' | 'dark'>(settings.theme);
  const [copiedGit, setCopiedGit] = useState(false);

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

          {/* GitHub & Source Export */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Source Code & GitHub Repository
            </span>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    Push to Your GitHub
                  </span>
                </div>
                <a
                  href="/tradelog-source.zip"
                  download="tradelog-source.zip"
                  className="px-2.5 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:opacity-90"
                >
                  <Download className="w-3 h-3" />
                  <span>Download .ZIP</span>
                </a>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                To link and push TradeLog to your GitHub account:
              </p>

              <div className="p-2 bg-slate-900 text-slate-200 rounded-lg font-mono text-[10px] space-y-1 relative">
                <div>git remote add origin https://github.com/&lt;user&gt;/&lt;repo&gt;.git</div>
                <div>git branch -M main</div>
                <div>git push -u origin main</div>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText('git remote add origin <YOUR_REPO_URL>\ngit branch -M main\ngit push -u origin main');
                      setCopiedGit(true);
                      setTimeout(() => setCopiedGit(false), 2000);
                    }
                  }}
                  className="absolute top-1.5 right-1.5 p-1 bg-slate-800 text-slate-300 rounded hover:text-white"
                  title="Copy commands"
                >
                  {copiedGit ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Data Backup & Phone Migration */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Data Backup & Safety
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Saved in App Storage
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Your trades, photos, and challenges stay saved on your phone. Download a full JSON backup to keep your journal 100% safe, or to transfer your trades to another device.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => exportFullBackupJSON()}
                className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Backup (JSON)</span>
              </button>

              <label className="cursor-pointer px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => {
                      const content = ev.target?.result;
                      if (typeof content === 'string') {
                        const res = importFullBackupJSON(content);
                        alert(res.message);
                        if (res.success && onReloadAllData) {
                          onReloadAllData();
                          onClose();
                        }
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
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
