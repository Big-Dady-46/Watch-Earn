'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Wallet, 
  CheckSquare, 
  ShieldCheck, 
  Clock, 
  Award, 
  ArrowRight, 
  Sparkles,
  Search,
  Filter,
  Users,
  ChevronRight,
  TrendingUp,
  Tv,
  HelpCircle,
  Zap
} from 'lucide-react';
import { getTasks, getCurrentUser, getMinimumWithdrawal } from '@/lib/storage';
import { VideoTask, UserAccount } from '@/types';
import TaskCard from '@/components/TaskCard';
import { sounds } from '@/lib/audio';

export default function HomePage() {
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setTasks(getTasks());
    setUser(getCurrentUser());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('watch-earn-update', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('watch-earn-update', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  const categories = ['All', 'Technology', 'Earning', 'Music', 'Gaming'];

  const filteredTasks = tasks.filter((t) => {
    if (!t.active) return false;
    const matchesCat = selectedCategory === 'All' || t.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.channelName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const minWithdrawal = getMinimumWithdrawal(user);
  const currentTier = (user?.withdrawalCount || 0) + 1;
  const balance = user ? user.balancePKR : 0;
  const progressPercent = Math.min(100, Math.round((balance / minWithdrawal) * 100));

  return (
    <div className="space-y-7 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      {/* Top Section: Semicircular Summary Gauge & Main Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Card: Ultra-Premium Fintech Worker Card & Roadmap */}
        <div className="ivory-card p-6 sm:p-7 flex flex-col justify-between bg-white space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12544F] animate-pulse"></span>
              <span className="text-[11px] font-black tracking-wider text-[#64748B] uppercase">
                Worker Wallet & Status
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#8BBB92]/20 border border-[#8BBB92]/40 text-[#12544F] text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tier {currentTier} Active</span>
            </span>
          </div>

          {/* Unified Luxury Fintech Card (Single Bold Balance Display) */}
          <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#12544F] via-[#0E443F] to-[#0A2E2B] text-white shadow-xl overflow-hidden border border-[#8BBB92]/25">
            {/* Ambient Background Glows */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#8BBB92]/20 blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-black/40 blur-2xl pointer-events-none" />

            {/* Card Header Row */}
            <div className="flex items-center justify-between relative z-10 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-5 rounded-md bg-gradient-to-tr from-amber-400 to-amber-200 shadow-xs flex items-center justify-center opacity-95">
                  <div className="w-4 h-3 border border-amber-900/30 rounded-xs" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8BBB92]">
                  Available Balance
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/10 text-slate-200 tracking-wider">
                PKR • CASH
              </span>
            </div>

            {/* Single Bold Balance Display */}
            <div className="relative z-10 mb-5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-bold text-[#8BBB92] uppercase">Rs.</span>
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                  {balance}
                </span>
                <span className="text-xs font-semibold text-slate-300">.00</span>
              </div>
            </div>

            {/* Integrated Payout Milestone (No redundant numbers, focuses on unlock state) */}
            <div className="relative z-10 pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#8BBB92]" />
                  <span>{balance >= minWithdrawal ? 'Payout Unlocked' : 'Cashout Progress'}</span>
                </span>
                <span className="text-[#8BBB92] font-black font-mono">
                  {progressPercent}%
                </span>
              </div>

              {/* Glowing Progress Track */}
              <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8BBB92] to-emerald-400 transition-all duration-700 shadow-sm shadow-[#8BBB92]/50"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Smart Unlock Message */}
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>
                  {balance >= minWithdrawal 
                    ? 'Ready for instant transfer!' 
                    : `Need Rs. ${Math.max(0, minWithdrawal - balance)} to cash out`}
                </span>
                <span className="font-bold text-white">Target: Rs. {minWithdrawal}</span>
              </div>
            </div>
          </div>

          {/* Gamified Tier Progression Roadmap */}
          <div className="bg-[#F8F9F8] rounded-2xl p-3.5 border border-black/[0.04]">
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Withdrawal Tier Roadmap</span>
              <span className="text-[#12544F] font-black">Level {currentTier}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className={`p-2 rounded-xl text-[10px] font-bold transition-all ${currentTier === 1 ? 'bg-[#12544F] text-white shadow-xs scale-[1.02]' : 'bg-white text-slate-400 border border-black/[0.04]'}`}>
                <div className="text-[9px] opacity-75">Tier 1</div>
                <div className="font-black">Rs. 100</div>
              </div>
              <div className={`p-2 rounded-xl text-[10px] font-bold transition-all ${currentTier === 2 ? 'bg-[#12544F] text-white shadow-xs scale-[1.02]' : 'bg-white text-slate-400 border border-black/[0.04]'}`}>
                <div className="text-[9px] opacity-75">Tier 2</div>
                <div className="font-black">Rs. 200</div>
              </div>
              <div className={`p-2 rounded-xl text-[10px] font-bold transition-all ${currentTier >= 3 ? 'bg-[#12544F] text-white shadow-xs scale-[1.02]' : 'bg-white text-slate-400 border border-black/[0.04]'}`}>
                <div className="text-[9px] opacity-75">Tier 3+</div>
                <div className="font-black">Rs. 300+</div>
              </div>
            </div>
          </div>

          {/* Two Activity Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs">
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-[#12544F]" />
                <span>Tasks Today</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#111827] mt-1">
                {user?.completedTasksToday?.length || 0} / {tasks.length}
              </div>
              <div className="text-[11px] text-[#8BBB92] font-semibold mt-0.5">
                Daily Quota
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs">
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#12544F]" />
                <span>Watch Time</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#111827] mt-1">
                {balance} Mins
              </div>
              <div className="text-[11px] text-[#12544F] font-semibold mt-0.5">
                1 PKR / Minute
              </div>
            </div>
          </div>

          {/* Bottom Withdrawal Button */}
          <Link
            href="/wallet"
            onClick={() => sounds.playClick()}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#12544F] hover:bg-[#0E423E] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#12544F]/20 transition-all hover:scale-[1.01]"
          >
            <Wallet className="w-4 h-4" />
            <span>Withdrawal Center (Min Rs. {minWithdrawal})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Center & Right 2 Cols: Main Banner */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Hero Card with generous line height and padding */}
          <div className="ivory-card p-6 sm:p-8 bg-white relative overflow-hidden space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8BBB92]/20 border border-[#8BBB92]/40 text-[#12544F] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#12544F]" />
              <span>Official Rate: 1 Minute Watch Time = Rs. 1 PKR</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#111827] tracking-tight leading-[1.25]">
              Watch Verified YouTube Videos &{' '}
              <span className="bg-gradient-to-r from-[#12544F] to-[#8BBB92] bg-clip-text text-transparent">
                Earn Real Money
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-xl font-medium">
              Complete your daily video watch quota with full anti-cheat verification. Instant earnings in Rupees directly withdrawable to <strong>EasyPaisa</strong>, <strong>JazzCash</strong>, and <strong>Bank Accounts</strong>.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Link
                href="/tasks"
                onClick={() => sounds.playClick()}
                className="px-6 py-3.5 rounded-xl bg-[#12544F] hover:bg-[#0E423E] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-[#12544F]/20 transition-all hover:scale-105"
              >
                <span>Browse All Daily Tasks</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/wallet"
                onClick={() => sounds.playClick()}
                className="px-6 py-3.5 rounded-xl bg-[#F8F9F8] hover:bg-slate-200 border border-black/[0.06] text-[#111827] font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors"
              >
                <Wallet className="w-4 h-4 text-[#12544F]" />
                <span>Withdrawal Center</span>
              </Link>
            </div>
          </div>

          {/* Quick Action Navigation Strip with proper padding */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            
            <Link
              href="/tasks"
              onClick={() => sounds.playClick()}
              className="ivory-card p-4 bg-white flex flex-col items-center justify-center text-center gap-2 group hover:border-[#12544F]/40 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#12544F]/10 text-[#12544F] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Tv className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#111827]">Watch Tasks</span>
              <span className="text-[10px] text-[#12544F] font-semibold">1 PKR / Min</span>
            </Link>

            <Link
              href="/wallet"
              onClick={() => sounds.playClick()}
              className="ivory-card p-4 bg-white flex flex-col items-center justify-center text-center gap-2 group hover:border-[#12544F]/40 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#8BBB92]/25 text-[#12544F] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#111827]">Cashout PKR</span>
              <span className="text-[10px] text-[#64748B] font-medium">Min Rs. 100</span>
            </Link>

            <div className="ivory-card p-4 bg-white flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#111827]">Daily Refresh</span>
              <span className="text-[10px] text-[#64748B] font-medium">12:00 AM Midnight</span>
            </div>

            <Link
              href="/admin"
              onClick={() => sounds.playClick()}
              className="ivory-card p-4 bg-white flex flex-col items-center justify-center text-center gap-2 group hover:border-[#12544F]/40 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-[#111827] flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#111827]">Admin Center</span>
              <span className="text-[10px] text-[#64748B] font-medium">Authorized Portal</span>
            </Link>

          </div>

        </div>

      </div>

      {/* Rules & Guidelines Card with generous breathing room */}
      <section className="ivory-card p-6 sm:p-7 bg-white space-y-5">
        <div className="flex items-center justify-between border-b border-black/[0.05] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#12544F]/10 text-[#12544F] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#111827]">
                Worker Guidelines & Working Rules (Kaam Ke Rules)
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                Follow these instructions to verify your watch time and ensure smooth payouts.
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-[#12544F]/10 text-[#12544F] text-xs font-bold">
            Verified Verification
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="p-4.5 rounded-2xl bg-[#F8F9F8] border border-black/[0.03] space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#12544F] text-white font-black text-[11px] flex items-center justify-center shrink-0">1</span>
              <h3 className="font-bold text-xs text-[#111827]">1 Minute = Rs. 1 PKR</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed font-medium">
              System video minutes ko auto-analyze karke exact 1 Rupee per minute reward set karta hai (e.g. 5 min video = Rs. 5 PKR).
            </p>
          </div>

          <div className="p-4.5 rounded-2xl bg-[#F8F9F8] border border-black/[0.03] space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#8BBB92] text-[#111827] font-black text-[11px] flex items-center justify-center shrink-0">2</span>
              <h3 className="font-bold text-xs text-[#111827]">Anti-Cheat Active Player</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed font-medium">
              Video play hone par hi countdown chalta hai. Tab switch karne ya pause karne par timer ruk jata hai. Video poori dekhna lazmi hai.
            </p>
          </div>

          <div className="p-4.5 rounded-2xl bg-[#F8F9F8] border border-black/[0.03] space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#111827] text-white font-black text-[11px] flex items-center justify-center shrink-0">3</span>
              <h3 className="font-bold text-xs text-[#111827]">Progressive Tier Payout</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed font-medium">
              Pehli bar withdraw limit <strong>Rs. 100</strong> hai, doosri bar <strong>Rs. 200</strong>, aur har bar Rs. 100 barhti hai. Payout EasyPaisa/JazzCash par milta hai.
            </p>
          </div>
        </div>
      </section>

      {/* Daily Tasks Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-black/[0.05] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#12544F]/10 text-[#12544F] flex items-center justify-center shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#111827]">
                Today's Daily Tasks Quota
              </h2>
              <p className="text-xs text-[#64748B] font-medium">
                Pick any video task below to watch and collect verified Rupees!
              </p>
            </div>
          </div>

          {/* Search bar & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-black/[0.08] text-xs text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:border-[#12544F]"
              />
            </div>
            
            <div className="flex items-center gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#12544F] text-white shadow-sm'
                      : 'bg-white text-[#64748B] border border-black/[0.04] hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Task Rows / Strips ("choti si patti") */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isCompletedToday={user?.completedTasksToday?.includes(task.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center ivory-card bg-white rounded-2xl space-y-2.5">
            <Tv className="w-8 h-8 text-[#12544F] mx-auto opacity-75" />
            <h3 className="text-sm font-black text-[#111827]">No Tasks Published Yet</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto font-medium">
              The daily tasks feed is fresh and ready for launch. Paste any YouTube video link in the Admin Portal to publish tasks!
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#12544F] text-white text-xs font-bold shadow-sm hover:bg-[#0E423E] transition-all"
            >
              <span>Go to Admin Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>

    </div>
  );
}
