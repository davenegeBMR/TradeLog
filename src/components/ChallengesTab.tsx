import React, { useState } from 'react';
import { Challenge, ChallengeCategory } from '../types';
import {
  Award,
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  XCircle,
  Calendar,
  Trash2,
  Edit3,
  X,
  FileText,
} from 'lucide-react';

interface ChallengesTabProps {
  challenges: Challenge[];
  onToggleDay: (challengeId: string, dateStr: string) => void;
  onRecordMissedDay: (challengeId: string, dateStr: string) => void;
  onAddChallenge: (challenge: Challenge) => void;
  onDeleteChallenge: (id: string) => void;
  onUpdateDailyNote: (challengeId: string, dateStr: string, note: string) => void;
}

const CATEGORIES: ChallengeCategory[] = [
  'Trading',
  'Reading',
  'Fitness',
  'Learning',
  'Entertainment',
  'Sleep',
  'Discipline',
];

export const ChallengesTab: React.FC<ChallengesTabProps> = ({
  challenges,
  onToggleDay,
  onRecordMissedDay,
  onAddChallenge,
  onDeleteChallenge,
  onUpdateDailyNote,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedNoteModal, setSelectedNoteModal] = useState<{
    challenge: Challenge;
    date: string;
  } | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  // New challenge form state
  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ChallengeCategory>('Trading');
  const [newDesc, setNewDesc] = useState('');
  const [newStart, setNewStart] = useState(todayStr);
  const [newEnd, setNewEnd] = useState(nextMonthStr);
  const [newFreq, setNewFreq] = useState<'daily' | 'weekly'>('daily');
  const [newTargetDays, setNewTargetDays] = useState(4);

  // Generate calendar days for a challenge (last 14 days up to today)
  const getLast14Days = () => {
    const dates: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const recentDays = getLast14Days();

  // Streak calculator
  const calculateStreak = (challenge: Challenge) => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Check chronological days from start to today
    const start = new Date(challenge.startDate);
    const today = new Date();

    const cur = new Date(start);
    while (cur <= today) {
      const dStr = cur.toISOString().split('T')[0];
      if (challenge.completedDates.includes(dStr)) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
      cur.setDate(cur.getDate() + 1);
    }

    // Current streak working backwards from today
    const back = new Date();
    while (back >= start) {
      const dStr = back.toISOString().split('T')[0];
      if (challenge.completedDates.includes(dStr)) {
        currentStreak++;
      } else {
        // If today isn't checked yet, don't break streak if yesterday was checked
        if (dStr === todayStr) {
          // continue checking yesterday
        } else {
          break;
        }
      }
      back.setDate(back.getDate() - 1);
    }

    return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
  };

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const challenge: Challenge = {
      id: `ch-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      description: newDesc.trim(),
      startDate: newStart,
      endDate: newEnd,
      frequency: newFreq,
      targetDaysPerWeek: newFreq === 'weekly' ? newTargetDays : undefined,
      completedDates: [],
      missedDates: [],
      dailyNotes: {},
      createdAt: Date.now(),
    };

    onAddChallenge(challenge);
    setIsAddModalOpen(false);
    setNewName('');
    setNewDesc('');
  };

  const handleSaveDailyNote = () => {
    if (selectedNoteModal) {
      onUpdateDailyNote(selectedNoteModal.challenge.id, selectedNoteModal.date, tempNoteText);
      setSelectedNoteModal(null);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Challenges & Habits
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Build bulletproof discipline in trading routines and personal life
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Challenge</span>
        </button>
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        {challenges.map(ch => {
          const { currentStreak, longestStreak } = calculateStreak(ch);
          const isCompletedToday = ch.completedDates.includes(todayStr);

          // Calculate total duration in days
          const start = new Date(ch.startDate).getTime();
          const end = new Date(ch.endDate).getTime();
          const totalDays = Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)));
          const progressPct = Math.min(100, Math.round((ch.completedDates.length / totalDays) * 100));

          return (
            <div
              key={ch.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      {ch.category}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {ch.frequency} {ch.targetDaysPerWeek ? `(${ch.targetDaysPerWeek}x/wk)` : ''}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {ch.name}
                  </h3>
                  {ch.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                      {ch.description}
                    </p>
                  )}
                </div>

                {/* Actions & Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleDay(ch.id, todayStr)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                      isCompletedToday
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isCompletedToday ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    <span>{isCompletedToday ? 'Done Today' : 'Mark Today'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteChallenge(ch.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Delete Challenge"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Streaks & Progress Summary */}
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800/80 my-3 text-center">
                <div>
                  <span className="text-[11px] text-slate-400 block">Current Streak</span>
                  <div className="font-mono font-bold text-base text-slate-900 dark:text-white flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>{currentStreak} days</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Longest Streak</span>
                  <div className="font-mono font-bold text-base text-slate-900 dark:text-white flex items-center justify-center gap-1">
                    <Award className="w-4 h-4 text-emerald-500" />
                    <span>{longestStreak} days</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">Total Completed</span>
                  <div className="font-mono font-bold text-base text-slate-900 dark:text-white">
                    {ch.completedDates.length} days ({progressPct}%)
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>

              {/* 14-Day Calendar Heat Strip */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span>Recent 14-day history:</span>
                  <span>Click date to toggle or add note</span>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
                  {recentDays.map(dateStr => {
                    const isDone = ch.completedDates.includes(dateStr);
                    const isMissed = ch.missedDates.includes(dateStr);
                    const hasNote = ch.dailyNotes?.[dateStr];
                    const dayNum = parseInt(dateStr.split('-')[2]);
                    const isToday = dateStr === todayStr;

                    return (
                      <div key={dateStr} className="relative group">
                        <button
                          type="button"
                          onClick={() => onToggleDay(ch.id, dateStr)}
                          className={`w-full aspect-square rounded-xl text-[11px] font-mono font-bold flex flex-col items-center justify-center transition-all ${
                            isDone
                              ? 'bg-emerald-500 text-white'
                              : isMissed
                              ? 'bg-rose-500/80 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          } ${isToday ? 'ring-2 ring-slate-900 dark:ring-white' : ''}`}
                          title={`${dateStr}: ${isDone ? 'Completed' : isMissed ? 'Missed' : 'Not recorded'}`}
                        >
                          <span>{dayNum}</span>
                          {hasNote && <span className="w-1 h-1 bg-amber-400 rounded-full mt-0.5"></span>}
                        </button>

                        {/* Note trigger popup button on hover */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedNoteModal({ challenge: ch, date: dateStr });
                            setTempNoteText(ch.dailyNotes?.[dateStr] || '');
                          }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] hidden group-hover:flex items-center justify-center"
                          title="Add daily note"
                        >
                          ✎
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Challenge Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Personal Challenge
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Challenge Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow Strategy for 30 Days"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as ChallengeCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Rule
                </label>
                <textarea
                  rows={2}
                  placeholder="What are the specific parameters and honesty criteria?"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newStart}
                    onChange={e => setNewStart(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEnd}
                    onChange={e => setNewEnd(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Frequency
                  </label>
                  <select
                    value={newFreq}
                    onChange={e => setNewFreq(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                {newFreq === 'weekly' && (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Days Per Week
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={newTargetDays}
                      onChange={e => setNewTargetDays(parseInt(e.target.value))}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold rounded-xl"
                >
                  Create Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Note Modal */}
      {selectedNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Daily Note for {selectedNoteModal.date}
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              {selectedNoteModal.challenge.name}
            </p>

            <textarea
              rows={3}
              placeholder="Record notes on temptations, wins, or mental obstacles..."
              value={tempNoteText}
              onChange={e => setTempNoteText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs mb-3 resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedNoteModal(null)}
                className="px-3 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDailyNote}
                className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-lg"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
