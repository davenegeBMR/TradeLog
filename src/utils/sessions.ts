import { NextSessionAlarm, SessionConfig } from '../types';

export const DEFAULT_SESSIONS: SessionConfig[] = [
  {
    id: 'asian',
    name: 'Asian Session',
    shortName: 'Asia',
    enabled: true,
    startHourUtc: 0,
    startMinuteUtc: 0,
    endHourUtc: 9,
    endMinuteUtc: 0,
    alarmLeadMinutes: 15,
    activeDays: [1, 2, 3, 4, 5], // Mon-Fri
    prepReminder: 'Wait for Asian range high/low formation. Do not over-trade consolidation.',
    color: '#059669', // Emerald
  },
  {
    id: 'london',
    name: 'London Session',
    shortName: 'London',
    enabled: true,
    startHourUtc: 7, // Adjusts dynamically based on BST
    startMinuteUtc: 0,
    endHourUtc: 16,
    endMinuteUtc: 0,
    alarmLeadMinutes: 15,
    activeDays: [1, 2, 3, 4, 5],
    prepReminder: 'Watch for Judas swing and London open liquidity sweep. Confirm HTF bias.',
    color: '#0284c7', // Sky
  },
  {
    id: 'overlap',
    name: 'London–NY Overlap',
    shortName: 'NY/LDN Overlap',
    enabled: true,
    startHourUtc: 12,
    startMinuteUtc: 0,
    endHourUtc: 16,
    endMinuteUtc: 0,
    alarmLeadMinutes: 10,
    activeDays: [1, 2, 3, 4, 5],
    prepReminder: 'Peak volume and volatility window. Strictly honor stop-loss limits.',
    color: '#7c3aed', // Purple
  },
  {
    id: 'new_york',
    name: 'New York Session',
    shortName: 'New York',
    enabled: true,
    startHourUtc: 13,
    startMinuteUtc: 30,
    endHourUtc: 21,
    endMinuteUtc: 0,
    alarmLeadMinutes: 15,
    activeDays: [1, 2, 3, 4, 5],
    prepReminder: 'Check US economic calendar and high-impact news releases before entry.',
    color: '#d97706', // Amber
  },
];

export const POPULAR_TIMEZONES = [
  { value: 'Africa/Addis_Ababa', label: 'Africa/Addis Ababa (UTC+3, EAT)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Europe/London', label: 'London (GMT / BST)' },
  { value: 'America/New_York', label: 'New York (EST / EDT)' },
  { value: 'Europe/Frankfurt', label: 'Frankfurt / Paris (CET / CEST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST, UTC+4)' },
  { value: 'Asia/Singapore', label: 'Singapore / Hong Kong (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST, UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST / AEDT)' },
];

/**
 * Checks if a specific timezone is currently observing Daylight Saving Time
 */
export function isDaylightSavingTime(timeZone: string, date = new Date()): boolean {
  try {
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    
    const getOffset = (d: Date) => {
      const invDate = new Date(d.toLocaleString('en-US', { timeZone }));
      return (d.getTime() - invDate.getTime()) / 60000;
    };
    
    const stdOffset = Math.max(getOffset(jan), getOffset(jul));
    return getOffset(date) < stdOffset;
  } catch {
    return false;
  }
}

/**
 * Calculates current UTC open hour for London taking BST into account
 */
export function getAdjustedLondonStartUtc(date = new Date()): { hour: number; minute: number } {
  // London financial open is 08:00 London local time.
  // In BST (UTC+1), 08:00 London is 07:00 UTC.
  // In GMT (UTC+0), 08:00 London is 08:00 UTC.
  const isBst = isDaylightSavingTime('Europe/London', date);
  return { hour: isBst ? 7 : 8, minute: 0 };
}

/**
 * Calculates current UTC open hour for New York taking EDT into account
 */
export function getAdjustedNewYorkStartUtc(date = new Date()): { hour: number; minute: number } {
  // US Equity / Forex high liquidity kicks in 08:00 NY local (or 09:30 NY for stock open).
  // In EDT (UTC-4), 08:00 NY is 12:00 UTC, 09:30 NY is 13:30 UTC.
  // In EST (UTC-5), 08:00 NY is 13:00 UTC, 09:30 NY is 14:30 UTC.
  const isEdt = isDaylightSavingTime('America/New_York', date);
  return { hour: isEdt ? 13 : 14, minute: 30 };
}

/**
 * Converts a UTC hour:minute to a formatted local string in the target timezone
 */
export function formatUtcToTargetTz(
  utcHour: number,
  utcMinute: number,
  targetTimezone: string,
  date = new Date()
): string {
  try {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), utcHour, utcMinute, 0));
    return new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(utcDate);
  } catch {
    return `${String(utcHour).padStart(2, '0')}:${String(utcMinute).padStart(2, '0')} UTC`;
  }
}

/**
 * Gets effective start time in UTC for a session accounting for seasonal DST
 */
export function getEffectiveSessionUtcStart(session: SessionConfig, date = new Date()): { hour: number; minute: number } {
  if (session.id === 'london') {
    return getAdjustedLondonStartUtc(date);
  }
  if (session.id === 'new_york') {
    return getAdjustedNewYorkStartUtc(date);
  }
  return { hour: session.startHourUtc, minute: session.startMinuteUtc };
}


/**
 * Computes the current active session or next upcoming session alarm.
 * Automatically transitions to London when Asian session ends, London to NY, etc.
 */
export function getNextUpcomingSession(
  sessions: SessionConfig[],
  targetTimezone: string,
  now = new Date()
): NextSessionAlarm | null {
  const enabledSessions = sessions.filter(s => s.enabled);
  if (enabledSessions.length === 0) return null;

  const nowMs = now.getTime();
  const activeSessions: NextSessionAlarm[] = [];
  const upcomingSessions: NextSessionAlarm[] = [];

  for (const session of enabledSessions) {
    // Check candidate days around current time (-1 day to catch overnight spans, up to +7 days)
    for (let dayOffset = -1; dayOffset <= 7; dayOffset++) {
      const candidateDate = new Date(now);
      candidateDate.setUTCDate(candidateDate.getUTCDate() + dayOffset);
      const dayOfWeek = candidateDate.getUTCDay();

      if (!session.activeDays.includes(dayOfWeek)) continue;

      const { hour, minute } = getEffectiveSessionUtcStart(session, candidateDate);
      const startUtcDate = new Date(
        Date.UTC(
          candidateDate.getUTCFullYear(),
          candidateDate.getUTCMonth(),
          candidateDate.getUTCDate(),
          hour,
          minute,
          0
        )
      );

      // End time UTC
      const endUtcDate = new Date(
        Date.UTC(
          candidateDate.getUTCFullYear(),
          candidateDate.getUTCMonth(),
          candidateDate.getUTCDate(),
          session.endHourUtc,
          session.endMinuteUtc,
          0
        )
      );
      if (endUtcDate.getTime() <= startUtcDate.getTime()) {
        endUtcDate.setUTCDate(endUtcDate.getUTCDate() + 1);
      }

      const alarmUtcDate = new Date(startUtcDate.getTime() - session.alarmLeadMinutes * 60 * 1000);

      const isActiveNow = nowMs >= startUtcDate.getTime() && nowMs < endUtcDate.getTime();
      const secondsUntilStart = Math.floor((startUtcDate.getTime() - nowMs) / 1000);
      const secondsUntilEnd = Math.floor((endUtcDate.getTime() - nowMs) / 1000);
      const secondsUntilAlarm = Math.floor((alarmUtcDate.getTime() - nowMs) / 1000);

      const formattedLocalTime = formatUtcToTargetTz(hour, minute, targetTimezone, candidateDate);

      const alarmItem: NextSessionAlarm = {
        session,
        startDate: startUtcDate,
        alarmDate: alarmUtcDate,
        endDate: endUtcDate,
        secondsUntilStart,
        secondsUntilAlarm,
        secondsUntilEnd,
        isAlarmTriggeredNow: secondsUntilAlarm <= 0 && secondsUntilStart > 0,
        isActiveRightNow: isActiveNow,
        formattedLocalTime,
      };

      if (isActiveNow) {
        activeSessions.push(alarmItem);
        break;
      } else if (secondsUntilStart > 0) {
        upcomingSessions.push(alarmItem);
        break; // Closest upcoming instance for this session
      }
    }
  }

  // 1. If any session is currently active right now:
  if (activeSessions.length > 0) {
    // If multiple active (e.g. during London/Asian overlap or London/NY overlap):
    // Prioritize the one with the latest start time (the session that opened most recently)
    // Or if tied, the one with longest remaining time until end
    activeSessions.sort((a, b) => {
      if (b.startDate.getTime() !== a.startDate.getTime()) {
        return b.startDate.getTime() - a.startDate.getTime();
      }
      return b.secondsUntilEnd - a.secondsUntilEnd;
    });
    return activeSessions[0];
  }

  // 2. If no session is active right now, pick the earliest upcoming session
  if (upcomingSessions.length > 0) {
    upcomingSessions.sort((a, b) => a.secondsUntilStart - b.secondsUntilStart);
    return upcomingSessions[0];
  }

  return null;
}
