import { Challenge, SessionConfig, SessionReview, Trade, TradingRule, UserSettings } from '../types';
import { INITIAL_CHALLENGES, INITIAL_RULES, INITIAL_SETTINGS, INITIAL_TRADES } from './defaultData';
import { DEFAULT_SESSIONS } from './sessions';

const STORAGE_KEYS = {
  TRADES: 'tradelog_trades_v1',
  SESSIONS: 'tradelog_sessions_v1',
  CHALLENGES: 'tradelog_challenges_v1',
  RULES: 'tradelog_rules_v1',
  REVIEWS: 'tradelog_reviews_v1',
  SETTINGS: 'tradelog_settings_v1',
};

export function loadStoredTrades(): Trade[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRADES);
    if (!raw) {
      saveStoredTrades(INITIAL_TRADES);
      return INITIAL_TRADES;
    }
    const parsed: Trade[] = JSON.parse(raw);
    return parsed.map(t => {
      if (!t.screenshots || t.screenshots.length === 0) {
        t.screenshots = t.screenshotUrl ? [t.screenshotUrl] : [];
      }
      return t;
    });
  } catch (e) {
    console.error('Failed to load trades from storage', e);
    return INITIAL_TRADES;
  }
}

export function saveStoredTrades(trades: Trade[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
  } catch (e) {
    console.error('Failed to save trades to storage', e);
  }
}

export function loadStoredSessions(): SessionConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) {
      saveStoredSessions(DEFAULT_SESSIONS);
      return DEFAULT_SESSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SESSIONS;
  }
}

export function saveStoredSessions(sessions: SessionConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions', e);
  }
}

export function loadStoredChallenges(): Challenge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
    if (!raw) {
      saveStoredChallenges(INITIAL_CHALLENGES);
      return INITIAL_CHALLENGES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CHALLENGES;
  }
}

export function saveStoredChallenges(challenges: Challenge[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
  } catch (e) {
    console.error('Failed to save challenges', e);
  }
}

export function loadStoredRules(): TradingRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RULES);
    if (!raw) {
      saveStoredRules(INITIAL_RULES);
      return INITIAL_RULES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_RULES;
  }
}

export function saveStoredRules(rules: TradingRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save rules', e);
  }
}

export function loadStoredReviews(): SessionReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredReviews(reviews: SessionReview[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  } catch (e) {
    console.error('Failed to save reviews', e);
  }
}

export function loadStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveStoredSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveStoredSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function exportTradesToCSV(trades: Trade[]): void {
  const headers = [
    'Date',
    'Entry Time',
    'Exit Time',
    'Instrument',
    'Direction',
    'Session',
    'Entry Price',
    'Stop Loss',
    'Take Profit',
    'Lot Size',
    'Risk USD',
    'Profit USD',
    'Status',
    'Planned RR',
    'Realized RR',
    'Strategy',
    'Rules Followed',
    'Notes',
  ];

  const rows = trades.map(t => [
    t.date,
    t.entryTime || '',
    t.exitTime || '',
    t.instrument,
    t.direction,
    t.session,
    t.entryPrice,
    t.stopLoss,
    t.takeProfit,
    t.lotSize,
    t.riskAmount,
    t.profitAmount,
    t.status,
    t.plannedRR,
    t.realizedRR,
    `"${(t.strategy || '').replace(/"/g, '""')}"`,
    t.rulesFollowed ? 'YES' : 'NO',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `TradeLog_Trades_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseCSVToTrades(csvText: string): Trade[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV row parser handling quotes
    const rawCols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
    const cols = rawCols.map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 4) continue;

    const date = cols[0] || new Date().toISOString().split('T')[0];
    const instrument = (cols[3] || 'XAUUSD').toUpperCase();
    const direction = (cols[4] || 'BUY').toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
    const session = (cols[5] as Trade['session']) || 'London';
    const entryPrice = parseFloat(cols[6]) || 0;
    const stopLoss = parseFloat(cols[7]) || 0;
    const takeProfit = parseFloat(cols[8]) || 0;
    const lotSize = parseFloat(cols[9]) || 0.01;
    const riskAmount = parseFloat(cols[10]) || 10;
    const profitAmount = parseFloat(cols[11]) || 0;
    const status = (cols[12] || 'CLOSED').toUpperCase() === 'OPEN' ? 'OPEN' : 'CLOSED';
    const plannedRR = parseFloat(cols[13]) || 2;
    const realizedRR = parseFloat(cols[14]) || (riskAmount > 0 ? profitAmount / riskAmount : 0);
    const strategy = cols[15] || 'Setup';
    const rulesFollowed = (cols[16] || '').toLowerCase() !== 'no';
    const notes = cols[17] || '';

    trades.push({
      id: `imported-${Date.now()}-${i}`,
      date,
      entryTime: cols[1] || '08:00',
      exitTime: cols[2] || '09:00',
      instrument,
      direction,
      session,
      entryPrice,
      stopLoss,
      takeProfit,
      lotSize,
      riskAmount,
      profitAmount,
      status,
      plannedRR: Math.round(plannedRR * 100) / 100,
      realizedRR: Math.round(realizedRR * 100) / 100,
      strategy,
      rulesFollowed,
      notes,
      createdAt: Date.now() - (lines.length - i) * 60000,
    });
  }

  return trades;
}

export function exportFullBackupJSON(): void {
  try {
    const backupData = {
      version: '1.1',
      appName: 'TradeLog',
      exportDate: new Date().toISOString(),
      trades: loadStoredTrades(),
      sessions: loadStoredSessions(),
      challenges: loadStoredChallenges(),
      rules: loadStoredRules(),
      reviews: loadStoredReviews(),
      settings: loadStoredSettings(),
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TradeLog_FullBackup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export JSON backup', err);
  }
}

export function importFullBackupJSON(jsonText: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonText);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Invalid JSON file format.' };
    }

    if (Array.isArray(data.trades)) {
      saveStoredTrades(data.trades);
    }
    if (Array.isArray(data.challenges)) {
      saveStoredChallenges(data.challenges);
    }
    if (Array.isArray(data.sessions)) {
      saveStoredSessions(data.sessions);
    }
    if (Array.isArray(data.rules)) {
      saveStoredRules(data.rules);
    }
    if (Array.isArray(data.reviews)) {
      saveStoredReviews(data.reviews);
    }
    if (data.settings && typeof data.settings === 'object') {
      saveStoredSettings(data.settings);
    }

    return {
      success: true,
      message: `Successfully restored ${Array.isArray(data.trades) ? data.trades.length : 0} trades and settings!`,
    };
  } catch (err) {
    console.error('Failed to parse JSON backup', err);
    return { success: false, message: 'Could not read backup file. Make sure it is a valid TradeLog backup.' };
  }
}

