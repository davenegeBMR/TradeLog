import { Trade } from '../types';

export interface DailyPerformanceRow {
  date: string;
  formattedDate: string;
  trades: number;
  lots: number;
  cashProfit: number;
  returnPct: number;
  wins: number;
  losses: number;
}

export interface InstrumentStats {
  instrument: string;
  trades: number;
  percentageOfAll: number;
  netProfit: number;
  winRate: number;
  lots: number;
  avgProfit: number;
}

export interface SessionStats {
  session: string;
  trades: number;
  lots: number;
  netProfit: number;
  winRate: number;
  avgPlannedRR: number;
  avgRealizedRR: number;
}

export interface WeekdayStats {
  dayName: string;
  dayIndex: number; // 0=Sun, 1=Mon, ..., 6=Sat
  trades: number;
  netProfit: number;
  winRate: number;
}

export interface StrategyStats {
  strategy: string;
  trades: number;
  netProfit: number;
  winRate: number;
  profitFactor: number;
}

export interface DisciplineStats {
  followedCount: number;
  followedProfit: number;
  followedWinRate: number;
  brokenCount: number;
  brokenProfit: number;
  brokenWinRate: number;
  disciplineEdge: number; // followedProfit - brokenProfit
}

export interface EquityPoint {
  index: number;
  date: string;
  tradeId?: string;
  equity: number;
  profit: number;
  drawdown: number;
  drawdownPct: number;
}

export interface AnalyticsSummary {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // 0 to 100
  lossRate: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  totalLots: number;
  totalFees: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number; // avgWin / avgLoss
  avgPlannedRR: number;
  avgRealizedRR: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  currentStreak: { type: 'WIN' | 'LOSS' | 'NONE'; count: number };
  bestTrade: number;
  worstTrade: number;
  dailyRows: DailyPerformanceRow[];
  instrumentBreakdown: InstrumentStats[];
  sessionBreakdown: SessionStats[];
  weekdayBreakdown: WeekdayStats[];
  strategyBreakdown: StrategyStats[];
  disciplineStats: DisciplineStats;
  equityCurve: EquityPoint[];
  sessionActivityHeatmap: {
    [session: string]: { [dayIndex: number]: number }; // session -> dayIndex (1=Mon..7=Sun) -> count
  };
}

export function calculateAnalytics(
  trades: Trade[],
  startingBalance = 10000,
  filterDays?: number, // e.g. 7, 30, 90, undefined for all
  customDateRange?: { start?: string; end?: string }
): AnalyticsSummary {
  // 1. Filter trades based on date if requested
  let filtered = [...trades];

  if (customDateRange?.start || customDateRange?.end) {
    if (customDateRange.start) {
      filtered = filtered.filter(t => t.date >= customDateRange.start!);
    }
    if (customDateRange.end) {
      filtered = filtered.filter(t => t.date <= customDateRange.end!);
    }
  } else if (filterDays !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filterDays);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    filtered = filtered.filter(t => t.date >= cutoffStr);
  }

  // Sort chronological by date then time
  filtered.sort((a, b) => {
    const dComp = a.date.localeCompare(b.date);
    if (dComp !== 0) return dComp;
    return (a.entryTime || '').localeCompare(b.entryTime || '');
  });

  const totalTrades = filtered.length;
  const closedTradesList = filtered.filter(t => t.status === 'CLOSED');
  const openTrades = totalTrades - closedTradesList.length;
  const closedTrades = closedTradesList.length;

  let grossProfit = 0;
  let grossLoss = 0;
  let totalFees = 0;
  let totalLots = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let plannedRRSum = 0;
  let realizedRRSum = 0;
  let bestTrade = 0;
  let worstTrade = 0;

  for (const t of closedTradesList) {
    const p = t.profitAmount;
    totalLots += t.lotSize || 0;
    totalFees += t.fees || 0;
    plannedRRSum += t.plannedRR || 0;
    realizedRRSum += t.realizedRR || 0;

    if (p > 0) {
      grossProfit += p;
      winningTrades++;
      if (p > bestTrade) bestTrade = p;
    } else if (p < 0) {
      grossLoss += Math.abs(p);
      losingTrades++;
      if (p < worstTrade) worstTrade = p;
    } else {
      breakevenTrades++;
    }
  }

  const netProfit = grossProfit - grossLoss - totalFees;
  const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;
  const lossRate = closedTrades > 0 ? (losingTrades / closedTrades) * 100 : 0;
  
  // Profit Factor = gross profit / gross loss. If gross loss is 0, return grossProfit if > 0 else 0
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0);
  
  const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? avgWin : 0);
  const avgPlannedRR = closedTrades > 0 ? plannedRRSum / closedTrades : 0;
  const avgRealizedRR = closedTrades > 0 ? realizedRRSum / closedTrades : 0;

  // Streak calculation (on closed trades in chronological order)
  let currentStreakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';
  let streakCount = 0;
  if (closedTradesList.length > 0) {
    const latestTrades = [...closedTradesList].reverse();
    for (let i = 0; i < latestTrades.length; i++) {
      const p = latestTrades[i].profitAmount;
      const type = p > 0 ? 'WIN' : p < 0 ? 'LOSS' : 'NONE';
      if (i === 0) {
        currentStreakType = type;
        if (type !== 'NONE') streakCount = 1;
      } else {
        if (type === currentStreakType && type !== 'NONE') {
          streakCount++;
        } else {
          break;
        }
      }
    }
  }

  // Equity Curve & Drawdown calculation
  let runningEquity = startingBalance;
  let peakEquity = startingBalance;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;

  const equityCurve: EquityPoint[] = [
    {
      index: 0,
      date: closedTradesList[0]?.date || 'Start',
      equity: startingBalance,
      profit: 0,
      drawdown: 0,
      drawdownPct: 0,
    },
  ];

  closedTradesList.forEach((t, i) => {
    runningEquity += t.profitAmount - (t.fees || 0);
    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }
    const currentDrawdown = peakEquity - runningEquity;
    const currentDrawdownPct = peakEquity > 0 ? (currentDrawdown / peakEquity) * 100 : 0;

    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
    if (currentDrawdownPct > maxDrawdownPct) {
      maxDrawdownPct = currentDrawdownPct;
    }

    equityCurve.push({
      index: i + 1,
      date: t.date,
      tradeId: t.id,
      equity: Math.round(runningEquity * 100) / 100,
      profit: t.profitAmount,
      drawdown: Math.round(currentDrawdown * 100) / 100,
      drawdownPct: Math.round(currentDrawdownPct * 10) / 10,
    });
  });

  // Daily Performance Rows (Matching screenshots 2 & 3: Date | Trades | Lots | Cash Profit | Return %)
  const dailyMap = new Map<string, { trades: number; lots: number; cashProfit: number; wins: number; losses: number }>();
  for (const t of closedTradesList) {
    const current = dailyMap.get(t.date) || { trades: 0, lots: 0, cashProfit: 0, wins: 0, losses: 0 };
    current.trades++;
    current.lots += t.lotSize || 0;
    current.cashProfit += t.profitAmount - (t.fees || 0);
    if (t.profitAmount > 0) current.wins++;
    if (t.profitAmount < 0) current.losses++;
    dailyMap.set(t.date, current);
  }

  const dailyRows: DailyPerformanceRow[] = Array.from(dailyMap.entries())
    .map(([date, data]) => {
      const d = new Date(date + 'T12:00:00Z');
      const formattedDate = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      // Return % calculated against reference starting balance
      const returnPct = startingBalance > 0 ? (data.cashProfit / startingBalance) * 100 : 0;
      return {
        date,
        formattedDate,
        trades: data.trades,
        lots: Math.round(data.lots * 100) / 100,
        cashProfit: Math.round(data.cashProfit * 100) / 100,
        returnPct: Math.round(returnPct * 100) / 100,
        wins: data.wins,
        losses: data.losses,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date)); // Descending order like screenshot

  // Instrument Breakdown (Matching screenshot 1: Your Instruments & Most Profitable Instruments)
  const instMap = new Map<string, { trades: number; netProfit: number; wins: number; lots: number }>();
  for (const t of closedTradesList) {
    const inst = t.instrument.toUpperCase().trim();
    const curr = instMap.get(inst) || { trades: 0, netProfit: 0, wins: 0, lots: 0 };
    curr.trades++;
    curr.netProfit += t.profitAmount - (t.fees || 0);
    curr.lots += t.lotSize || 0;
    if (t.profitAmount > 0) curr.wins++;
    instMap.set(inst, curr);
  }

  const instrumentBreakdown: InstrumentStats[] = Array.from(instMap.entries()).map(([inst, data]) => ({
    instrument: inst,
    trades: data.trades,
    percentageOfAll: closedTrades > 0 ? (data.trades / closedTrades) * 100 : 0,
    netProfit: Math.round(data.netProfit * 100) / 100,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
    lots: Math.round(data.lots * 100) / 100,
    avgProfit: data.trades > 0 ? Math.round((data.netProfit / data.trades) * 100) / 100 : 0,
  }));
  instrumentBreakdown.sort((a, b) => b.trades - a.trades);

  // Session Breakdown
  const sessMap = new Map<string, { trades: number; lots: number; netProfit: number; wins: number; plannedRR: number; realizedRR: number }>();
  for (const t of closedTradesList) {
    const s = t.session;
    const curr = sessMap.get(s) || { trades: 0, lots: 0, netProfit: 0, wins: 0, plannedRR: 0, realizedRR: 0 };
    curr.trades++;
    curr.lots += t.lotSize || 0;
    curr.netProfit += t.profitAmount - (t.fees || 0);
    if (t.profitAmount > 0) curr.wins++;
    curr.plannedRR += t.plannedRR || 0;
    curr.realizedRR += t.realizedRR || 0;
    sessMap.set(s, curr);
  }

  const sessionBreakdown: SessionStats[] = ['Asian', 'London', 'New York', 'London–New York overlap'].map(sessionName => {
    const data = sessMap.get(sessionName) || { trades: 0, lots: 0, netProfit: 0, wins: 0, plannedRR: 0, realizedRR: 0 };
    return {
      session: sessionName,
      trades: data.trades,
      lots: Math.round(data.lots * 100) / 100,
      netProfit: Math.round(data.netProfit * 100) / 100,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      avgPlannedRR: data.trades > 0 ? data.plannedRR / data.trades : 0,
      avgRealizedRR: data.trades > 0 ? data.realizedRR / data.trades : 0,
    };
  });

  // Session Activity Heatmap (Matching screenshot 1: Sydney, Asia, London, New York x Mon..Sun)
  // Day indexing: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  const sessionActivityHeatmap: { [session: string]: { [dayIndex: number]: number } } = {
    Sydney: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
    Asia: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
    London: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
    'New York': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
  };

  for (const t of filtered) {
    const d = new Date(t.date + 'T12:00:00Z');
    let day = d.getUTCDay(); // 0=Sun, 1=Mon..6=Sat
    if (day === 0) day = 7; // Convert Sun to 7 so 1=Mon..7=Sun
    
    let key = 'Asia';
    if (t.session === 'Asian') key = 'Asia';
    else if (t.session === 'London') key = 'London';
    else if (t.session === 'New York' || t.session === 'London–New York overlap') key = 'New York';

    if (sessionActivityHeatmap[key]) {
      sessionActivityHeatmap[key][day] = (sessionActivityHeatmap[key][day] || 0) + 1;
    }
  }

  // Weekday Breakdown
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStatsMap = new Map<number, { trades: number; netProfit: number; wins: number }>();
  for (let i = 0; i < 7; i++) {
    dayStatsMap.set(i, { trades: 0, netProfit: 0, wins: 0 });
  }
  for (const t of closedTradesList) {
    const d = new Date(t.date + 'T12:00:00Z');
    const day = d.getUTCDay();
    const curr = dayStatsMap.get(day)!;
    curr.trades++;
    curr.netProfit += t.profitAmount - (t.fees || 0);
    if (t.profitAmount > 0) curr.wins++;
  }
  const weekdayBreakdown: WeekdayStats[] = [1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
    const data = dayStatsMap.get(dayIndex)!;
    return {
      dayName: dayNames[dayIndex],
      dayIndex,
      trades: data.trades,
      netProfit: Math.round(data.netProfit * 100) / 100,
      winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
    };
  });

  // Strategy breakdown
  const stratMap = new Map<string, { trades: number; netProfit: number; wins: number; grossProfit: number; grossLoss: number }>();
  for (const t of closedTradesList) {
    const strat = t.strategy?.trim() || 'Unspecified';
    const curr = stratMap.get(strat) || { trades: 0, netProfit: 0, wins: 0, grossProfit: 0, grossLoss: 0 };
    curr.trades++;
    curr.netProfit += t.profitAmount - (t.fees || 0);
    if (t.profitAmount > 0) {
      curr.wins++;
      curr.grossProfit += t.profitAmount;
    } else if (t.profitAmount < 0) {
      curr.grossLoss += Math.abs(t.profitAmount);
    }
    stratMap.set(strat, curr);
  }
  const strategyBreakdown: StrategyStats[] = Array.from(stratMap.entries()).map(([strat, data]) => ({
    strategy: strat,
    trades: data.trades,
    netProfit: Math.round(data.netProfit * 100) / 100,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
    profitFactor: data.grossLoss > 0 ? data.grossProfit / data.grossLoss : (data.grossProfit > 0 ? data.grossProfit : 0),
  })).sort((a, b) => b.netProfit - a.netProfit);

  // Discipline Stats (Followed vs Broken Rules)
  let followedCount = 0;
  let followedProfit = 0;
  let followedWins = 0;
  let brokenCount = 0;
  let brokenProfit = 0;
  let brokenWins = 0;

  for (const t of closedTradesList) {
    if (t.rulesFollowed) {
      followedCount++;
      followedProfit += t.profitAmount - (t.fees || 0);
      if (t.profitAmount > 0) followedWins++;
    } else {
      brokenCount++;
      brokenProfit += t.profitAmount - (t.fees || 0);
      if (t.profitAmount > 0) brokenWins++;
    }
  }

  const disciplineStats: DisciplineStats = {
    followedCount,
    followedProfit: Math.round(followedProfit * 100) / 100,
    followedWinRate: followedCount > 0 ? (followedWins / followedCount) * 100 : 0,
    brokenCount,
    brokenProfit: Math.round(brokenProfit * 100) / 100,
    brokenWinRate: brokenCount > 0 ? (brokenWins / brokenCount) * 100 : 0,
    disciplineEdge: Math.round((followedProfit - brokenProfit) * 100) / 100,
  };

  return {
    totalTrades,
    closedTrades,
    openTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate: Math.round(winRate * 10) / 10,
    lossRate: Math.round(lossRate * 10) / 10,
    netProfit: Math.round(netProfit * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossLoss: Math.round(grossLoss * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    totalLots: Math.round(totalLots * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    winLossRatio: Math.round(winLossRatio * 100) / 100,
    avgPlannedRR: Math.round(avgPlannedRR * 100) / 100,
    avgRealizedRR: Math.round(avgRealizedRR * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    maxDrawdownPct: Math.round(maxDrawdownPct * 10) / 10,
    currentStreak: { type: currentStreakType, count: streakCount },
    bestTrade: Math.round(bestTrade * 100) / 100,
    worstTrade: Math.round(worstTrade * 100) / 100,
    dailyRows,
    instrumentBreakdown,
    sessionBreakdown,
    weekdayBreakdown,
    strategyBreakdown,
    disciplineStats,
    equityCurve,
    sessionActivityHeatmap,
  };
}
