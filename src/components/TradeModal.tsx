import React, { useState } from 'react';
import { Trade, TradeDirection, TradeSession, TradeStatus, TradingRule } from '../types';
import { Camera, Check, X, AlertTriangle } from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  initialTrade?: Trade | null;
  tradingRules: TradingRule[];
}

const COMMON_INSTRUMENTS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'US30', 'NAS100', 'BTCUSD', 'ETHUSD'];
const COMMON_STRATEGIES = [
  'Liquidity Sweep',
  'Fair Value Gap (FVG)',
  'Order Block Rejection',
  'Break & Retest',
  'Asian Range Breakout',
  'Trend Continuation',
  'Momentum Scalp',
  'Support & Resistance Bounce',
];

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTrade,
  tradingRules,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [date, setDate] = useState(initialTrade?.date || todayStr);
  const [entryTime, setEntryTime] = useState(initialTrade?.entryTime || nowTime);
  const [exitTime, setExitTime] = useState(initialTrade?.exitTime || '');
  const [instrument, setInstrument] = useState(initialTrade?.instrument || 'XAUUSD');
  const [direction, setDirection] = useState<TradeDirection>(initialTrade?.direction || 'BUY');
  const [session, setSession] = useState<TradeSession>(initialTrade?.session || 'London');
  const [entryPrice, setEntryPrice] = useState<string>(initialTrade?.entryPrice?.toString() || '');
  const [stopLoss, setStopLoss] = useState<string>(initialTrade?.stopLoss?.toString() || '');
  const [takeProfit, setTakeProfit] = useState<string>(initialTrade?.takeProfit?.toString() || '');
  const [lotSize, setLotSize] = useState<string>(initialTrade?.lotSize?.toString() || '0.05');
  const [riskAmount, setRiskAmount] = useState<string>(initialTrade?.riskAmount?.toString() || '20');
  const [profitAmount, setProfitAmount] = useState<string>(initialTrade?.profitAmount?.toString() || '0');
  const [status, setStatus] = useState<TradeStatus>(initialTrade?.status || 'CLOSED');
  const [strategy, setStrategy] = useState(initialTrade?.strategy || 'Liquidity Sweep');
  const [notes, setNotes] = useState(initialTrade?.notes || '');
  const [screenshotUrl, setScreenshotUrl] = useState(initialTrade?.screenshotUrl || '');
  const [rulesFollowed, setRulesFollowed] = useState<boolean>(initialTrade ? initialTrade.rulesFollowed : true);
  const [fees, setFees] = useState<string>(initialTrade?.fees?.toString() || '0');

  // Rule checkboxes
  const [ruleChecks, setRuleChecks] = useState<{ [id: string]: boolean }>(
    initialTrade?.ruleChecklist ||
      tradingRules.reduce((acc, r) => ({ ...acc, [r.id]: true }), {})
  );

  // Auto calculate planned R:R
  const numEntry = parseFloat(entryPrice) || 0;
  const numSL = parseFloat(stopLoss) || 0;
  const numTP = parseFloat(takeProfit) || 0;
  const numRisk = parseFloat(riskAmount) || 0;
  const numProfit = parseFloat(profitAmount) || 0;

  let calculatedPlannedRR = 0;
  if (numEntry > 0 && numSL > 0 && numTP > 0) {
    const riskPips = Math.abs(numEntry - numSL);
    const rewardPips = Math.abs(numTP - numEntry);
    if (riskPips > 0) {
      calculatedPlannedRR = Math.round((rewardPips / riskPips) * 100) / 100;
    }
  }

  let calculatedRealizedRR = 0;
  if (numRisk > 0 && status === 'CLOSED') {
    calculatedRealizedRR = Math.round((numProfit / numRisk) * 100) / 100;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setScreenshotUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleRule = (ruleId: string) => {
    const updated = { ...ruleChecks, [ruleId]: !ruleChecks[ruleId] };
    setRuleChecks(updated);
    // If any active rule is unchecked, rulesFollowed can be false
    const allChecked = tradingRules.every(r => updated[r.id] !== false);
    setRulesFollowed(allChecked);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trade: Trade = {
      id: initialTrade?.id || `tr-${Date.now()}`,
      date,
      entryTime,
      exitTime: exitTime || undefined,
      instrument: instrument.trim().toUpperCase(),
      direction,
      session,
      entryPrice: parseFloat(entryPrice) || 0,
      stopLoss: parseFloat(stopLoss) || 0,
      takeProfit: parseFloat(takeProfit) || 0,
      lotSize: parseFloat(lotSize) || 0.01,
      riskAmount: parseFloat(riskAmount) || 0,
      profitAmount: status === 'CLOSED' ? parseFloat(profitAmount) || 0 : 0,
      status,
      plannedRR: calculatedPlannedRR || (initialTrade?.plannedRR || 2.0),
      realizedRR: calculatedRealizedRR,
      strategy,
      screenshotUrl: screenshotUrl || undefined,
      notes: notes.trim(),
      rulesFollowed,
      fees: parseFloat(fees) || 0,
      ruleChecklist: ruleChecks,
      createdAt: initialTrade?.createdAt || Date.now(),
    };

    onSave(trade);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {initialTrade ? 'Edit Trade' : 'Record New Trade'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Fast journal entry with risk and discipline validation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Direction & Status Switcher */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Position Side</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDirection('BUY')}
                  className={`py-1.5 font-bold rounded-md transition-colors ${
                    direction === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SELL')}
                  className={`py-1.5 font-bold rounded-md transition-colors ${
                    direction === 'SELL'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  SELL / SHORT
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Trade Status</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setStatus('CLOSED')}
                  className={`py-1.5 font-medium rounded-md transition-colors ${
                    status === 'CLOSED'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Closed
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('OPEN')}
                  className={`py-1.5 font-medium rounded-md transition-colors ${
                    status === 'OPEN'
                      ? 'bg-amber-500 text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Open Active
                </button>
              </div>
            </div>
          </div>

          {/* Instrument Quick Chips & Input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Instrument / Pair</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_INSTRUMENTS.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setInstrument(item)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                    instrument === item
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              placeholder="e.g. XAUUSD, EURUSD"
              value={instrument}
              onChange={e => setInstrument(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-hidden focus:border-slate-500"
            />
          </div>

          {/* Date, Session, Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Trading Session</label>
              <select
                value={session}
                onChange={e => setSession(e.target.value as TradeSession)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Asian">Asian Session</option>
                <option value="London">London Session</option>
                <option value="London–New York overlap">London–NY Overlap</option>
                <option value="New York">New York Session</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Entry Time</label>
              <input
                type="time"
                value={entryTime}
                onChange={e => setEntryTime(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Exit Time (Optional)</label>
              <input
                type="time"
                value={exitTime}
                onChange={e => setExitTime(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Price Levels (Entry, SL, TP) */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1 text-[11px]">Entry Price</label>
              <input
                type="number"
                step="any"
                placeholder="2650.00"
                value={entryPrice}
                onChange={e => setEntryPrice(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white tabular-nums"
              />
            </div>

            <div>
              <label className="block text-rose-600 dark:text-rose-400 font-medium mb-1 text-[11px]">Stop Loss</label>
              <input
                type="number"
                step="any"
                placeholder="2646.00"
                value={stopLoss}
                onChange={e => setStopLoss(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white tabular-nums"
              />
            </div>

            <div>
              <label className="block text-emerald-600 dark:text-emerald-400 font-medium mb-1 text-[11px]">Take Profit</label>
              <input
                type="number"
                step="any"
                placeholder="2658.00"
                value={takeProfit}
                onChange={e => setTakeProfit(e.target.value)}
                className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white tabular-nums"
              />
            </div>

            {calculatedPlannedRR > 0 && (
              <div className="col-span-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Planned Risk/Reward:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">1:{calculatedPlannedRR}</span>
              </div>
            )}
          </div>

          {/* Lot Size, Risk ($), Profit/Loss ($) */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Lot Size</label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                required
                placeholder="0.05"
                value={lotSize}
                onChange={e => setLotSize(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tabular-nums"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Risk Amount ($)</label>
              <input
                type="number"
                step="any"
                placeholder="20"
                value={riskAmount}
                onChange={e => setRiskAmount(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tabular-nums"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                {status === 'CLOSED' ? 'Profit / Loss ($)' : 'Est. Unrealized ($)'}
              </label>
              <input
                type="number"
                step="any"
                placeholder="+25 or -15"
                value={profitAmount}
                onChange={e => setProfitAmount(e.target.value)}
                className={`w-full px-2.5 py-2 border rounded-lg tabular-nums font-semibold ${
                  parseFloat(profitAmount) > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                    : parseFloat(profitAmount) < 0
                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
          </div>

          {/* Strategy & Fees */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Setup / Strategy</label>
              <select
                value={strategy}
                onChange={e => setStrategy(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {COMMON_STRATEGIES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Other">Other / Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Fees / Swap ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={fees}
                onChange={e => setFees(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white tabular-nums"
              />
            </div>
          </div>

          {/* Screenshot Upload / URL */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Chart Screenshot</label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Camera className="w-4 h-4" />
                <span>Upload Chart</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              <input
                type="text"
                placeholder="Or paste screenshot URL..."
                value={screenshotUrl}
                onChange={e => setScreenshotUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
              />
            </div>
            {screenshotUrl && (
              <div className="mt-2 relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-36">
                <img src={screenshotUrl} alt="Trade chart preview" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={() => setScreenshotUrl('')}
                  className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Psychology / Discipline / Rules Checklist */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Discipline & Trading Rules</span>
              <button
                type="button"
                onClick={() => setRulesFollowed(!rulesFollowed)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  rulesFollowed
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {rulesFollowed ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {rulesFollowed ? 'Rules Followed' : 'Rules Broken'}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Check off rules satisfied for this trade:
            </p>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
              {tradingRules.slice(0, 5).map(rule => (
                <label key={rule.id} className="flex items-start gap-2 cursor-pointer text-slate-700 dark:text-slate-300 text-[11px]">
                  <input
                    type="checkbox"
                    checked={ruleChecks[rule.id] !== false}
                    onChange={() => handleToggleRule(rule.id)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{rule.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes: Emotions, discipline, mistakes */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
              Emotions, Discipline & Mistakes Log
            </label>
            <textarea
              rows={2}
              placeholder="How was your mental state? Did you feel FOMO, hesitation, or execute calmly?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialTrade ? 'Save Changes' : 'Record Trade'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
