import React, { useState } from 'react';
import { Trade, TradeDirection, TradeSession, TradeStatus, TradingRule } from '../types';
import { Camera, Check, X, AlertTriangle, Plus, Trash2, Image as ImageIcon, Loader2, Eye, Upload } from 'lucide-react';

function readFileAsOptimizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1280;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

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
  
  // Multiple screenshots state (backward compatible with screenshotUrl)
  const initialPhotos = initialTrade?.screenshots?.length
    ? initialTrade.screenshots
    : initialTrade?.screenshotUrl
    ? [initialTrade.screenshotUrl]
    : [];
  const [screenshots, setScreenshots] = useState<string[]>(initialPhotos);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const openPreviewModal = (img: string) => {
    try {
      window.history.pushState({ modal: 'tradelog-preview' }, '');
    } catch {
      // ignore
    }
    setPreviewModalImg(img);
  };

  const closePreviewModal = () => {
    if (window.history.state?.modal === 'tradelog-preview') {
      window.history.back();
    } else {
      setPreviewModalImg(null);
    }
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setPreviewModalImg(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const optimized = await readFileAsOptimizedDataUrl(file);
        if (optimized) {
          newPhotos.push(optimized);
        }
      } catch (err) {
        console.warn('Failed to process image', err);
      }
    }

    if (newPhotos.length > 0) {
      setScreenshots(prev => [...prev, ...newPhotos]);
    }
    setIsProcessingImages(false);
    e.target.value = '';
  };

  const handleAddUrl = () => {
    if (urlInput.trim()) {
      setScreenshots(prev => [...prev, urlInput.trim()]);
      setUrlInput('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
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
      screenshotUrl: screenshots.length > 0 ? screenshots[0] : undefined,
      screenshots: screenshots,
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

          {/* Multiple Screenshots & Photos Upload / URL */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs">
                  Trade Charts & Photos
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Attach as many charts as you need (HTF bias, 15m entry, 1m execution, exit)
                </p>
              </div>
              {screenshots.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {screenshots.length} photo{screenshots.length === 1 ? '' : 's'}
                  </span>
                  {screenshots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setScreenshots([])}
                      className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Upload Buttons & URL Input */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors shrink-0">
                  <Camera className="w-4 h-4" />
                  <span>Choose Photos / Screenshots</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImageUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="text"
                    placeholder="Or paste chart URL..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUrl();
                      }
                    }}
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={!urlInput.trim()}
                    className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-40 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-xs transition-colors shrink-0"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {isProcessingImages && (
                <div className="flex items-center gap-2 text-[11px] text-indigo-600 dark:text-indigo-400 py-1 font-medium animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Optimizing and attaching photos...</span>
                </div>
              )}
            </div>

            {/* Photo Gallery Grid */}
            {screenshots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {screenshots.map((photo, index) => (
                  <div
                    key={index}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-black/30 aspect-video shadow-xs"
                  >
                    <img
                      src={photo}
                      alt={`Trade screenshot ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewModalImg(photo)}
                    />

                    {/* Photo index badge */}
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold font-mono">
                      #{index + 1}{index === 0 ? ' (Main)' : ''}
                    </div>

                    {/* Action buttons on thumbnail */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewModalImg(photo)}
                        title="View photo full size"
                        className="p-1 rounded bg-black/70 hover:bg-black/90 text-white transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        title="Delete photo"
                        className="p-1 rounded bg-rose-600/90 hover:bg-rose-700 text-white transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Click to zoom overlay */}
                    <button
                      type="button"
                      onClick={() => openPreviewModal(photo)}
                      className="absolute inset-0 bg-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs">
                        <Eye className="w-3 h-3" /> Click to enlarge
                      </span>
                    </button>
                  </div>
                ))}

                {/* Add more button box */}
                <label className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 aspect-video transition-colors p-2 text-center">
                  <Plus className="w-5 h-5 mb-0.5 text-indigo-500" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">+ Add More</span>
                  <span className="text-[9px] text-slate-400">Select more photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-colors">
                <ImageIcon className="w-6 h-6 mb-1 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tap to upload multiple trade photos
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Select as many photos as you want from your phone library
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultipleImageUpload}
                  className="hidden"
                />
              </label>
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

      {/* Enlarged image preview lightbox inside TradeModal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
          onClick={closePreviewModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={closePreviewModal}
              className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300 bg-black/50 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalImg}
              alt="Full size trade preview"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

