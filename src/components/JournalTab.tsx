import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  ExternalLink,
} from 'lucide-react';

interface LightboxState {
  photos: string[];
  index: number;
  instrument?: string;
  date?: string;
}

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
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const openLightbox = (photos: string[], index: number, instrument?: string, date?: string) => {
    try {
      window.history.pushState({ modal: 'tradelog-lightbox' }, '');
    } catch {
      // ignore
    }
    setLightbox({ photos, index, instrument, date });
  };

  const closeLightbox = () => {
    if (window.history.state?.modal === 'tradelog-lightbox') {
      window.history.back();
    } else {
      setLightbox(null);
    }
  };

  // Intercept Android / browser back button to close lightbox and stay on journal page
  useEffect(() => {
    const handlePopState = () => {
      setLightbox(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        setLightbox(prev => {
          if (!prev || prev.photos.length <= 1) return prev;
          const newIndex = prev.index > 0 ? prev.index - 1 : prev.photos.length - 1;
          return { ...prev, index: newIndex };
        });
      } else if (e.key === 'ArrowRight') {
        setLightbox(prev => {
          if (!prev || prev.photos.length <= 1) return prev;
          const newIndex = prev.index < prev.photos.length - 1 ? prev.index + 1 : 0;
          return { ...prev, index: newIndex };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

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
            const tradePhotos = trade.screenshots && trade.screenshots.length > 0
              ? trade.screenshots
              : trade.screenshotUrl
              ? [trade.screenshotUrl]
              : [];

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

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span>{trade.date}</span>
                        <span>·</span>
                        <span>{trade.session}</span>
                        <span>·</span>
                        <span className="truncate max-w-[120px]">{trade.strategy || 'Setup'}</span>
                        {tradePhotos.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                              <ImageIcon className="w-3 h-3" />
                              <span>{tradePhotos.length}</span>
                            </span>
                          </>
                        )}
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

                    {/* Chart Screenshots Gallery */}
                    {tradePhotos.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 block text-[10px] font-bold tracking-wider">
                            CHART SCREENSHOTS & PHOTOS ({tradePhotos.length})
                          </span>
                          <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
                            Tap any to view full screen
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {tradePhotos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() =>
                                openLightbox(
                                  tradePhotos,
                                  pIdx,
                                  trade.instrument,
                                  trade.date
                                )
                              }
                              className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-black/30 aspect-video cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-xs"
                            >
                              <img
                                src={photo}
                                alt={`${trade.instrument} chart ${pIdx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold font-mono">
                                #{pIdx + 1}
                              </div>
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="p-1.5 bg-black/70 rounded-full text-white shadow-sm">
                                  <Eye className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Photo Fullscreen Lightbox Modal */}
      {lightbox && lightbox.photos[lightbox.index] && (
        <div
          className="fixed inset-0 z-60 bg-black/92 backdrop-blur-sm flex flex-col justify-between p-3 sm:p-5"
          onClick={closeLightbox}
        >
          {/* Lightbox Header */}
          <div
            className="flex items-center justify-between z-10 py-1"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-white">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide">
                  {lightbox.instrument || 'Trade Chart'}
                </span>
                {lightbox.date && (
                  <span className="text-xs text-slate-400">· {lightbox.date}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Photo {lightbox.index + 1} of {lightbox.photos.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={lightbox.photos[lightbox.index]}
                target="_blank"
                rel="noreferrer"
                download={`trade-chart-${lightbox.index + 1}.jpg`}
                className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                title="Open image / download"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={closeLightbox}
                className="p-2 text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image with Navigation */}
          <div
            className="flex-1 flex items-center justify-center relative min-h-0 my-2"
            onClick={e => e.stopPropagation()}
          >
            {/* Previous Photo Button */}
            {lightbox.photos.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightbox(prev => {
                    if (!prev) return null;
                    const newIndex =
                      prev.index > 0 ? prev.index - 1 : prev.photos.length - 1;
                    return { ...prev, index: newIndex };
                  })
                }
                className="absolute left-2 sm:left-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all shadow-lg active:scale-95 border border-white/10"
                title="Previous photo (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Main Current Photo */}
            <img
              src={lightbox.photos[lightbox.index]}
              alt={`Trade chart ${lightbox.index + 1}`}
              className="max-h-[72vh] sm:max-h-[76vh] max-w-[94vw] object-contain rounded-xl shadow-2xl transition-all"
            />

            {/* Next Photo Button */}
            {lightbox.photos.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightbox(prev => {
                    if (!prev) return null;
                    const newIndex =
                      prev.index < prev.photos.length - 1 ? prev.index + 1 : 0;
                    return { ...prev, index: newIndex };
                  })
                }
                className="absolute right-2 sm:right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all shadow-lg active:scale-95 border border-white/10"
                title="Next photo (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Footer & Thumbnail Strip */}
          <div
            className="flex flex-col items-center gap-2 z-10"
            onClick={e => e.stopPropagation()}
          >
            {lightbox.photos.length > 1 && (
              <div className="flex items-center gap-2 max-w-full overflow-x-auto py-1 px-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                {lightbox.photos.map((thumb, tIdx) => (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => setLightbox(prev => (prev ? { ...prev, index: tIdx } : null))}
                    className={`w-12 h-9 rounded-lg overflow-hidden border-2 shrink-0 transition-transform ${
                      tIdx === lightbox.index
                        ? 'border-indigo-400 scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={thumb}
                      alt={`Thumbnail ${tIdx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Use Left/Right arrow keys to navigate · Escape to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
