import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Challenge,
  NextSessionAlarm,
  SessionConfig,
  SessionReview,
  Trade,
  TradingRule,
  UserSettings,
} from './types';
import {
  loadStoredTrades,
  saveStoredTrades,
  loadStoredSessions,
  saveStoredSessions,
  loadStoredChallenges,
  saveStoredChallenges,
  loadStoredRules,
  saveStoredRules,
  loadStoredReviews,
  saveStoredReviews,
  loadStoredSettings,
  saveStoredSettings,
  exportTradesToCSV,
  parseCSVToTrades,
} from './utils/storage';
import { calculateAnalytics } from './utils/analytics';
import { getNextUpcomingSession } from './utils/sessions';
import { playSessionChime } from './utils/sound';
import { INITIAL_CHALLENGES, INITIAL_RULES, INITIAL_TRADES } from './utils/defaultData';
import { DEFAULT_SESSIONS } from './utils/sessions';

import { Navigation, ActiveTab } from './components/Navigation';
import { OverviewTab } from './components/OverviewTab';
import { JournalTab } from './components/JournalTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { SessionsTab } from './components/SessionsTab';
import { ChallengesTab } from './components/ChallengesTab';
import { TradeModal } from './components/TradeModal';
import { PreSessionModal } from './components/PreSessionModal';
import { ReviewModal } from './components/ReviewModal';
import { SettingsModal } from './components/SettingsModal';
import { AlarmBanner } from './components/AlarmBanner';
import { InstallModal } from './components/InstallModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [trades, setTrades] = useState<Trade[]>(() => loadStoredTrades());
  const [sessions, setSessions] = useState<SessionConfig[]>(() => loadStoredSessions());
  const [challenges, setChallenges] = useState<Challenge[]>(() => loadStoredChallenges());
  const [rules, setRules] = useState<TradingRule[]>(() => loadStoredRules());
  const [reviews, setReviews] = useState<SessionReview[]>(() => loadStoredReviews());
  const [settings, setSettings] = useState<UserSettings>(() => loadStoredSettings());

  // Modal states
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isPreSessionModalOpen, setIsPreSessionModalOpen] = useState(false);
  const [selectedSessionForPre, setSelectedSessionForPre] = useState<SessionConfig | undefined>();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Active triggered alarm state
  const [triggeredAlarm, setTriggeredAlarm] = useState<NextSessionAlarm | null>(null);
  const lastAlarmKeyRef = useRef<string>('');

  // Sync dark class on root html
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [settings.theme]);

  // Compute upcoming session alarm
  const [nextAlarm, setNextAlarm] = useState<NextSessionAlarm | null>(null);

  useEffect(() => {
    const checkSessionAlarm = () => {
      const upcoming = getNextUpcomingSession(sessions, settings.timezone);
      setNextAlarm(upcoming);

      if (upcoming && upcoming.isAlarmTriggeredNow) {
        const alarmKey = `${upcoming.session.id}-${upcoming.startDate.toISOString()}`;
        if (lastAlarmKeyRef.current !== alarmKey) {
          lastAlarmKeyRef.current = alarmKey;
          setTriggeredAlarm(upcoming);

          if (settings.soundAlerts) {
            playSessionChime();
          }

          if (
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted'
          ) {
            new Notification(`${upcoming.session.name} Alarm!`, {
              body: `Session opens at ${upcoming.formattedLocalTime}. Reminder: ${upcoming.session.prepReminder}`,
            });
          }
        }
      }
    };

    checkSessionAlarm();
    const interval = setInterval(checkSessionAlarm, 5000);
    return () => clearInterval(interval);
  }, [sessions, settings.timezone, settings.soundAlerts]);

  // Calculations
  const analytics = useMemo(() => {
    return calculateAnalytics(trades, settings.accountBalance);
  }, [trades, settings.accountBalance]);

  // Trade actions
  const handleSaveTrade = (trade: Trade) => {
    const index = trades.findIndex(t => t.id === trade.id);
    let updated: Trade[];
    if (index >= 0) {
      updated = [...trades];
      updated[index] = trade;
    } else {
      updated = [trade, ...trades];
    }
    setTrades(updated);
    saveStoredTrades(updated);
  };

  const handleDeleteTrade = (tradeId: string) => {
    if (confirm('Delete this trade from your journal?')) {
      const updated = trades.filter(t => t.id !== tradeId);
      setTrades(updated);
      saveStoredTrades(updated);
    }
  };

  const handleExportCSV = () => {
    exportTradesToCSV(trades);
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        const imported = parseCSVToTrades(text);
        if (imported.length > 0) {
          const merged = [...imported, ...trades];
          setTrades(merged);
          saveStoredTrades(merged);
          alert(`Successfully imported ${imported.length} trades.`);
        } else {
          alert('No valid trades found in this CSV. Please check formatting.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Challenge actions
  const handleToggleChallengeDay = (challengeId: string, dateStr: string) => {
    const updated = challenges.map(ch => {
      if (ch.id !== challengeId) return ch;
      const isDone = ch.completedDates.includes(dateStr);
      const completedDates = isDone
        ? ch.completedDates.filter(d => d !== dateStr)
        : [...ch.completedDates, dateStr];
      // remove from missed if completing
      const missedDates = ch.missedDates.filter(d => d !== dateStr);
      return { ...ch, completedDates, missedDates };
    });
    setChallenges(updated);
    saveStoredChallenges(updated);
  };

  const handleRecordMissedDay = (challengeId: string, dateStr: string) => {
    const updated = challenges.map(ch => {
      if (ch.id !== challengeId) return ch;
      const isMissed = ch.missedDates.includes(dateStr);
      const missedDates = isMissed
        ? ch.missedDates.filter(d => d !== dateStr)
        : [...ch.missedDates, dateStr];
      // remove from completed if missed
      const completedDates = ch.completedDates.filter(d => d !== dateStr);
      return { ...ch, completedDates, missedDates };
    });
    setChallenges(updated);
    saveStoredChallenges(updated);
  };

  const handleAddChallenge = (newChallenge: Challenge) => {
    const updated = [newChallenge, ...challenges];
    setChallenges(updated);
    saveStoredChallenges(updated);
  };

  const handleDeleteChallenge = (id: string) => {
    if (confirm('Delete this challenge?')) {
      const updated = challenges.filter(c => c.id !== id);
      setChallenges(updated);
      saveStoredChallenges(updated);
    }
  };

  const handleUpdateDailyNote = (challengeId: string, dateStr: string, note: string) => {
    const updated = challenges.map(ch => {
      if (ch.id !== challengeId) return ch;
      const dailyNotes = { ...(ch.dailyNotes || {}), [dateStr]: note };
      return { ...ch, dailyNotes };
    });
    setChallenges(updated);
    saveStoredChallenges(updated);
  };

  // Sessions actions
  const handleUpdateSessions = (updated: SessionConfig[]) => {
    setSessions(updated);
    saveStoredSessions(updated);
  };

  // Settings actions
  const handleUpdateSettings = (updated: UserSettings) => {
    setSettings(updated);
    saveStoredSettings(updated);
  };

  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    handleUpdateSettings({ ...settings, theme: nextTheme });
  };

  // Reset & Clear data
  const handleResetToDemoData = () => {
    setTrades(INITIAL_TRADES);
    saveStoredTrades(INITIAL_TRADES);
    setChallenges(INITIAL_CHALLENGES);
    saveStoredChallenges(INITIAL_CHALLENGES);
    setSessions(DEFAULT_SESSIONS);
    saveStoredSessions(DEFAULT_SESSIONS);
    setRules(INITIAL_RULES);
    saveStoredRules(INITIAL_RULES);
  };

  const handleClearAllData = () => {
    setTrades([]);
    saveStoredTrades([]);
  };

  // Post session review save
  const handleSaveReview = (review: SessionReview) => {
    const updated = [review, ...reviews];
    setReviews(updated);
    saveStoredReviews(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Triggered Alarm Banner */}
      {triggeredAlarm && (
        <AlarmBanner
          alarm={triggeredAlarm}
          onDismiss={() => setTriggeredAlarm(null)}
          onOpenChecklist={s => {
            setSelectedSessionForPre(s);
            setIsPreSessionModalOpen(true);
            setTriggeredAlarm(null);
          }}
        />
      )}

      {/* Top Header & Mobile Nav Bar */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenTradeModal={() => {
          setEditingTrade(null);
          setIsTradeModalOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        settings={settings}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-5 pb-24 md:pb-12">
        {activeTab === 'overview' && (
          <OverviewTab
            analytics={analytics}
            trades={trades}
            challenges={challenges}
            nextAlarm={nextAlarm}
            settings={settings}
            tradingRules={rules}
            onToggleChallengeDay={handleToggleChallengeDay}
            onOpenTradeModal={() => {
              setEditingTrade(null);
              setIsTradeModalOpen(true);
            }}
            onOpenPreSession={s => {
              setSelectedSessionForPre(s);
              setIsPreSessionModalOpen(true);
            }}
            onOpenReviewModal={() => setIsReviewModalOpen(true)}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
          />
        )}

        {activeTab === 'journal' && (
          <JournalTab
            trades={trades}
            tradingRules={rules}
            onAddTrade={() => {
              setEditingTrade(null);
              setIsTradeModalOpen(true);
            }}
            onEditTrade={t => {
              setEditingTrade(t);
              setIsTradeModalOpen(true);
            }}
            onDeleteTrade={handleDeleteTrade}
            onExportCSV={handleExportCSV}
            onImportCSV={handleImportCSV}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab trades={trades} settings={settings} />
        )}

        {activeTab === 'sessions' && (
          <SessionsTab
            sessions={sessions}
            settings={settings}
            tradingRules={rules}
            nextAlarm={nextAlarm}
            onUpdateSessions={handleUpdateSessions}
            onUpdateSettings={handleUpdateSettings}
            onOpenPreSession={s => {
              setSelectedSessionForPre(s);
              setIsPreSessionModalOpen(true);
            }}
          />
        )}

        {activeTab === 'challenges' && (
          <ChallengesTab
            challenges={challenges}
            onToggleDay={handleToggleChallengeDay}
            onRecordMissedDay={handleRecordMissedDay}
            onAddChallenge={handleAddChallenge}
            onDeleteChallenge={handleDeleteChallenge}
            onUpdateDailyNote={handleUpdateDailyNote}
          />
        )}
      </main>

      {/* Modals */}
      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => {
          setIsTradeModalOpen(false);
          setEditingTrade(null);
        }}
        onSave={handleSaveTrade}
        initialTrade={editingTrade}
        tradingRules={rules}
      />

      <PreSessionModal
        isOpen={isPreSessionModalOpen}
        onClose={() => setIsPreSessionModalOpen(false)}
        session={selectedSessionForPre}
        rules={rules}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSave={handleSaveReview}
        sessionName={nextAlarm?.session.name as any || 'London'}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        onResetToDemoData={handleResetToDemoData}
        onClearAllData={handleClearAllData}
      />

      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
