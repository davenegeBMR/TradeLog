export type TradeDirection = 'BUY' | 'SELL';
export type TradeSession = 'Asian' | 'London' | 'New York' | 'London–New York overlap';
export type TradeStatus = 'CLOSED' | 'OPEN';

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  entryTime: string; // HH:mm
  exitTime?: string; // HH:mm
  instrument: string; // e.g. XAUUSD, EURUSD, GBPUSD, US30, NAS100
  direction: TradeDirection;
  session: TradeSession;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskAmount: number; // in USD
  profitAmount: number; // in USD (realized profit or loss, positive for profit, negative for loss)
  status: TradeStatus;
  plannedRR: number; // Planned Risk-to-Reward ratio (e.g. 2.5)
  realizedRR: number; // Realized Risk-to-Reward ratio
  strategy: string; // e.g. "Liquidity Sweep", "Fair Value Gap", "Break & Retest"
  screenshotUrl?: string; // base64 or URL
  notes?: string;
  rulesFollowed: boolean;
  fees?: number; // Spread, commission, swap
  ruleChecklist?: { [ruleId: string]: boolean };
  createdAt: number;
}

export interface SessionConfig {
  id: 'asian' | 'london' | 'new_york' | 'overlap';
  name: string;
  shortName: string;
  enabled: boolean;
  startHourUtc: number;
  startMinuteUtc: number;
  endHourUtc: number;
  endMinuteUtc: number;
  alarmLeadMinutes: number; // 0, 5, 10, 15, 30
  activeDays: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun
  prepReminder: string;
  color: string;
}

export interface NextSessionAlarm {
  session: SessionConfig;
  startDate: Date;
  alarmDate: Date;
  secondsUntilStart: number;
  secondsUntilAlarm: number;
  isAlarmTriggeredNow: boolean;
  isActiveRightNow: boolean;
  formattedLocalTime: string;
}

export type ChallengeCategory = 'Trading' | 'Reading' | 'Fitness' | 'Learning' | 'Entertainment' | 'Sleep' | 'Discipline';

export interface Challenge {
  id: string;
  name: string;
  category: ChallengeCategory;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  frequency: 'daily' | 'weekly';
  targetDaysPerWeek?: number; // e.g. 4 for fitness
  completedDates: string[]; // ['2026-10-05', '2026-10-06']
  missedDates: string[]; // recorded missed days
  dailyNotes?: { [date: string]: string };
  createdAt: number;
}

export interface TradingRule {
  id: string;
  text: string;
  category: 'pre_trade' | 'risk' | 'psychology';
  isActive: boolean;
}

export interface SessionReview {
  id: string;
  date: string;
  session: TradeSession;
  followedPlan: boolean;
  tookImpulsiveTrades: boolean;
  whatWentWell: string;
  whatToImprove: string;
  disciplineScore: number; // 1-10 or percentage
  createdAt: number;
}

export interface UserSettings {
  timezone: string; // e.g. "Africa/Addis_Ababa"
  accountBalance: number; // Initial / reference balance
  dailyLossLimit: number;
  maxRiskPerTradePercent: number;
  soundAlerts: boolean;
  browserNotifications: boolean;
  theme: 'light' | 'dark';
}
