import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  LineChart,
  Clock,
  Award,
  Plus,
  Sliders,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { UserSettings } from '../types';

export type ActiveTab = 'overview' | 'journal' | 'analytics' | 'sessions' | 'challenges';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenTradeModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenInstallModal: () => void;
  settings: UserSettings;
  onToggleTheme: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenTradeModal,
  onOpenSettingsModal,
  onOpenInstallModal,
  settings,
  onToggleTheme,
}) => {
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'journal' as const, label: 'Journal', icon: BookOpen },
    { id: 'analytics' as const, label: 'Analytics', icon: LineChart },
    { id: 'sessions' as const, label: 'Sessions', icon: Clock },
    { id: 'challenges' as const, label: 'Challenges', icon: Award },
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span
              onClick={() => onSelectTab('overview')}
              className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white cursor-pointer select-none"
            >
              Trade<span className="text-emerald-500">Log</span>
            </span>

            {/* Timezone Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 font-mono">
              <Globe className="w-3.5 h-3.5" />
              <span>{settings.timezone.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Zone 2: Desktop Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Install Android App CTA */}
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Download Android App"
            >
              <span className="text-xs">📲</span>
              <span className="hidden xs:inline sm:inline">Install App</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              title={settings.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              )}
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={onOpenSettingsModal}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Quick Add Trade CTA */}
            <button
              type="button"
              onClick={onOpenTradeModal}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Trade</span>
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Mobile Tab Bar (Matches user screenshots with 5 tabs and safe touch targets >= 44px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors pb-safe">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center transition-colors active:scale-95 ${
                  isActive
                    ? 'text-slate-950 dark:text-white font-bold'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
