import React, { useState } from 'react';
import { Trade, TradeSession, TradingRule } from '../types';
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface JournalTabProps {
  trades: Trade[];
  tradingRules: TradingRule[];
  onAddTrade: () => void;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
}

export const JournalTab: React.FC<JournalTabProps> = ({
  trades,
  onAddTrade,
  onEditTrade,
  onDeleteTrade,
  onExportCSV,
  onImportCSV,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionFilter, setSessionFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'OPEN'>('ALL');
  const [rulesFilter, setRulesFilter] = useState<'ALL' | 'FOLLOWED' | 'BROKEN'>('ALL');
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSV(file);
      e.target.value = '';
    }
  };

  // Filter trades
  const filteredTrades = trades.filter(t => {
    // Search
    const searchMatch =
      !searchTerm ||
      t.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.strategy && t.strategy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    // Session
    const sessionMatch = sessionFilter === 'ALL' || t.session === sessionFilter;

    // Outcome
    let outcomeMatch = true;
    if (outcomeFilter === 'WIN') outcomeMatch = t.status === 'CLOSED' && t.profitAmount > 0;
    else if (outcomeFilter === 'LOSS') outcomeMatch = t.status === 'CLOSED' && t.profitAmount < 0;
    else if (outcomeFilter === 'OPEN') outcomeMatch = t.status === 'OPEN';

    // Rules
    let rulesMatch = true;
    if (rulesFilter === 'FOLLOWED') rulesMatch = t.rulesFollowed;
    else if (rulesFilter === 'BROKEN') rulesMatch = !t.rulesFollowed;

    return searchMatch && sessionMatch && outcomeMatch && rulesMatch;
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Trading Journal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {trades.length} recorded positions · Filter and analyze executions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
          </label>

          <button
            type="button"
            onClick={onExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onAddTrade}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Trade</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by instrument, strategy, or notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Outcome Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(['ALL', 'WIN', 'LOSS', 'OPEN'] as const).map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setOutcomeFilter(item)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  outcomeFilter === item
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item === 'ALL' ? 'All Outcomes' : item}
              </button>
            ))}
          </div>

          {/* Session Selector */}
          <select
            value={sessionFilter}
            onChange={e => setSessionFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Sessions</option>
            <option value="Asian">Asian</option>
            <option value="London">London</option>
            <option value="London–New York overlap">London-NY Overlap</option>
            <option value="New York">New York</option>
          </select>

          {/* Rules Selector */}
          <select
            value={rulesFilter}
            onChange={e => setRulesFilter(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Rule States</option>
            <option value="FOLLOWED">Rules Followed Only</option>
            <option value="BROKEN">Rules Broken Only</option>
          </select>
        </div>
      </div>

      {/* Trades List */}
      {filteredTrades.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No trades match your current filters.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search query, or record a new trade.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map(trade => {
            const isExpanded = expandedTradeId === trade.id;
            const isBuy = trade.direction === 'BUY';
            const isProfit = trade.profitAmount > 0;
            const isLoss = trade.profitAmount < 0;

            return (
              <div
                key={trade.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all"
              >
                {/* Main Row / Header */}
                <div
                  onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                  className="p-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isBuy
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}
                    >
                      {isBuy ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {trade.instrument}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isBuy
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {trade.direction}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {trade.lotSize} lots
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{trade.date}</span>
                        <span>·</span>
                        <span>{trade.session}</span>
                        <span>·</span>
                        <span className="truncate">{trade.strategy || 'Setup'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      {trade.status === 'CLOSED' ? (
                        <div
                          className={`font-mono font-bold text-sm tabular-nums ${
                            isProfit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isLoss
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isProfit ? '+' : ''}${trade.profitAmount.toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                          OPEN
                        </span>
                      )}
                      <div className="text-[10px] text-slate-400 font-mono">
                        R:R 1:{trade.realizedRR.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 text-xs space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-400 block font-sans">Entry Price</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {trade.entryPrice || '—'}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-rose-500 block font-sans">Stop Loss</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {trade.stopLoss || '—'}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-emerald-500 block font-sans">Take Profit</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {trade.takeProfit || '—'}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-400 block font-sans">Risk USD</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          ${trade.riskAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Discipline & Rules Tag */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {trade.rulesFollowed ? (
                          <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-medium flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Rules Followed
                          </span>
                        ) : (
                          <span className="text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded font-medium flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Rules Broken / Deviated
                          </span>
                        )}
                        {trade.fees ? (
                          <span className="text-slate-400 text-[11px]">
                            · Fees: ${trade.fees.toFixed(2)}
                          </span>
                        ) : null}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditTrade(trade)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 flex items-center gap-1 text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTrade(trade.id)}
                          className="px-2.5 py-1 text-rose-600 hover:text-rose-700 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Notes */}
                    {trade.notes && (
                      <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-slate-400 block text-[10px] font-semibold mb-0.5">
                          PSYCHOLOGY & EMOTIONS
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {trade.notes}
                        </p>
                      </div>
                    )}

                    {/* Chart Screenshot Preview */}
                    {trade.screenshotUrl && (
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold mb-1">
                          CHART SCREENSHOT
                        </span>
                        <img
                          src={trade.screenshotUrl}
                          alt="Trade chart"
                          onClick={() => setPreviewImage(trade.screenshotUrl!)}
                          className="max-h-48 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer object-cover hover:opacity-90 transition-opacity"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Full Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl w-full">
            <img src={previewImage} alt="Enlarged chart" className="rounded-xl w-full max-h-[85vh] object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
