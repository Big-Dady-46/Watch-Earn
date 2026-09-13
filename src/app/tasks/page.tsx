'use client';

import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Clock, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
import { getTasks, getCurrentUser } from '@/lib/storage';
import { VideoTask, UserAccount } from '@/types';
import TaskCard from '@/components/TaskCard';
import { sounds } from '@/lib/audio';

export default function TasksPage() {
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');
  const [midnightCountdown, setMidnightCountdown] = useState('');

  const loadData = () => {
    setTasks(getTasks());
    setUser(getCurrentUser());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('watch-earn-update', loadData);
    window.addEventListener('storage', loadData);

    const calcMidnightRemaining = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setMidnightCountdown(`${hours}h ${mins}m ${secs}s`);
    };

    calcMidnightRemaining();
    const interval = setInterval(calcMidnightRemaining, 1000);

    return () => {
      window.removeEventListener('watch-earn-update', loadData);
      window.removeEventListener('storage', loadData);
      clearInterval(interval);
    };
  }, []);

  const completedIds = user?.completedTasksToday || [];

  const filteredTasks = tasks.filter((t) => {
    if (!t.active) return false;
    const isDone = completedIds.includes(t.id);
    if (filterMode === 'pending') return !isDone;
    if (filterMode === 'completed') return isDone;
    return true;
  });

  const totalPotentialPKR = tasks.filter((t) => t.active).reduce((sum, t) => sum + t.rewardPKR, 0);
  const earnedTodayPKR = tasks.filter((t) => completedIds.includes(t.id)).reduce((sum, t) => sum + t.rewardPKR, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Header Banner in #12544F and #8BBB92 Theme */}
      <div className="ivory-card rounded-2xl p-6 sm:p-7 bg-white flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#8BBB92]/20 border border-[#8BBB92]/40 text-[#12544F] text-xs font-bold uppercase tracking-wider">
            <CheckSquare className="w-3.5 h-3.5 text-[#12544F]" />
            <span>Daily Tasks Quota</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight leading-snug">
            Daily Tasks Hub (1 Min = Rs. 1 PKR)
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl leading-relaxed font-medium">
            Watch each video to the end without skipping or leaving the tab. Coins & cash are credited immediately upon timer completion.
          </p>
        </div>

        {/* Midnight refresh pill */}
        <div className="p-4 rounded-2xl bg-[#F8F9F8] border border-black/[0.05] flex items-center gap-3.5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#8BBB92]/30 text-[#12544F] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">
              Midnight Auto-Reset In
            </div>
            <div className="text-sm font-black text-[#111827] font-mono mt-0.5">
              {midnightCountdown || 'Calculating...'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Earning Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ivory-card p-5 bg-white space-y-1">
          <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Total Available Today</div>
          <div className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight">
            Rs. {totalPotentialPKR} PKR
          </div>
          <div className="text-xs text-[#64748B] font-medium">{tasks.length} tasks in feed</div>
        </div>

        <div className="ivory-card p-5 bg-white space-y-1">
          <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Earned Today</div>
          <div className="text-xl sm:text-2xl font-black text-[#12544F] tracking-tight">
            Rs. {earnedTodayPKR} PKR
          </div>
          <div className="text-xs text-[#64748B] font-medium">{completedIds.length} tasks completed</div>
        </div>

        <div className="ivory-card p-5 bg-white space-y-1">
          <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">Remaining To Earn</div>
          <div className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight">
            Rs. {totalPotentialPKR - earnedTodayPKR} PKR
          </div>
          <div className="text-xs text-[#64748B] font-medium">{tasks.length - completedIds.length} tasks left</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2.5 border-b border-black/[0.05] pb-3">
        <button
          onClick={() => {
            sounds.playClick();
            setFilterMode('all');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterMode === 'all'
              ? 'bg-[#12544F] text-white shadow-sm'
              : 'bg-white text-[#64748B] border border-black/[0.04] hover:bg-slate-50'
          }`}
        >
          All Daily Tasks ({tasks.length})
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setFilterMode('pending');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterMode === 'pending'
              ? 'bg-[#12544F] text-white shadow-sm'
              : 'bg-white text-[#64748B] border border-black/[0.04] hover:bg-slate-50'
          }`}
        >
          Pending ({tasks.length - completedIds.length})
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setFilterMode('completed');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filterMode === 'completed'
              ? 'bg-[#12544F] text-white shadow-sm'
              : 'bg-white text-[#64748B] border border-black/[0.04] hover:bg-slate-50'
          }`}
        >
          Completed Today ({completedIds.length})
        </button>
      </div>

      {/* Task Rows / Strips ("choti si patti") */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-3.5">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isCompletedToday={completedIds.includes(task.id)}
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center ivory-card bg-white rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#12544F]/10 text-[#12544F] flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">Daily Feed Fresh & Ready</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
            The tasks feed is ready for launch. Video tasks added in the Admin Portal will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="p-10 text-center ivory-card bg-white rounded-2xl space-y-2">
          <CheckCircle2 className="w-9 h-9 text-[#12544F] mx-auto" />
          <h3 className="text-base font-bold text-[#111827]">All tasks in this section completed!</h3>
          <p className="text-xs text-[#64748B]">
            Great job! You have watched all available tasks. New tasks will refresh at midnight (12:00 AM).
          </p>
        </div>
      )}

    </div>
  );
}
