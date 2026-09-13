'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Flame, Coins, Tv, Sparkles, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { getLeaderboard, syncWithCloud } from '@/lib/storage';
import { LeaderboardUser } from '@/types';
import { sounds } from '@/lib/audio';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    setUsers(getLeaderboard());
    syncWithCloud().then(() => setUsers(getLeaderboard()));
    const handleUpdate = () => setUsers(getLeaderboard());
    window.addEventListener('watch-earn-update', handleUpdate);
    return () => window.removeEventListener('watch-earn-update', handleUpdate);
  }, []);

  const top3 = users.slice(0, 3);
  const others = users.slice(3);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8BBB92]/20 border border-[#8BBB92]/40 text-[#12544F] text-xs font-bold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5 text-[#12544F]" />
          <span>Worker Hall of Fame</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[#111827] tracking-tight">
          Weekly Top 10 Earners
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto leading-relaxed font-medium">
          Verified rankings of the Top 10 workers with the highest watch time and task completion earnings in Rupees.
        </p>
      </div>

      {/* Podium Top 3 (Shown if at least 3 workers have earnings) */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end pt-4">
          
          {/* Rank 2 (Silver) */}
          <div className="ivory-card p-4 sm:p-6 bg-white rounded-3xl border border-slate-200 text-center space-y-2 order-1 transform translate-y-3 shadow-sm">
            <div className="text-3xl sm:text-4xl">{top3[1].avatar}</div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
              2nd Place
            </div>
            <h4 className="font-extrabold text-[#111827] text-xs sm:text-sm truncate">
              {top3[1].name}
            </h4>
            <div className="text-[#12544F] font-black text-sm sm:text-base">
              Rs. {top3[1].coins} PKR
            </div>
          </div>

          {/* Rank 1 (Gold) */}
          <div className="ivory-card p-5 sm:p-8 bg-gradient-to-b from-amber-50 to-white rounded-3xl border-2 border-amber-400 text-center space-y-2 order-2 relative shadow-md shadow-amber-500/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Crown className="w-8 h-8 text-amber-500 fill-amber-400 filter drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))" />
            </div>
            <div className="text-4xl sm:text-5xl pt-2">{top3[0].avatar}</div>
            <div className="text-xs font-black text-amber-700 uppercase tracking-wider">
              Champion 👑
            </div>
            <h4 className="font-black text-[#111827] text-sm sm:text-base truncate">
              {top3[0].name}
            </h4>
            <div className="text-amber-600 font-black text-base sm:text-xl">
              Rs. {top3[0].coins} PKR
            </div>
            <div className="text-[11px] text-[#64748B] font-semibold">
              {top3[0].videosWatched} Tasks Verified
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="ivory-card p-4 sm:p-6 bg-white rounded-3xl border border-slate-200 text-center space-y-2 order-3 transform translate-y-6 shadow-sm">
            <div className="text-3xl sm:text-4xl">{top3[2].avatar}</div>
            <div className="text-xs font-black text-orange-600 uppercase tracking-wider">
              3rd Place
            </div>
            <h4 className="font-extrabold text-[#111827] text-xs sm:text-sm truncate">
              {top3[2].name}
            </h4>
            <div className="text-[#12544F] font-black text-sm sm:text-base">
              Rs. {top3[2].coins} PKR
            </div>
          </div>

        </div>
      )}

      {/* Complete Rankings or Clean Empty State */}
      {users.length > 0 ? (
        <div className="ivory-card bg-white rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-[#111827] flex items-center justify-between border-b border-black/[0.05] pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Top 10 Worker Rankings</span>
            </div>
            <span className="text-xs text-[#12544F] font-bold px-2.5 py-0.5 rounded-md bg-[#8BBB92]/20">
              Only Top 10 Show
            </span>
          </h3>

          <div className="divide-y divide-black/[0.05]">
            {users.map((u) => (
              <div
                key={u.rank}
                className={`py-3.5 px-3 rounded-xl flex items-center justify-between gap-4 transition-colors ${
                  u.isCurrentUser
                    ? 'bg-[#12544F]/5 border border-[#12544F]/20'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                    u.rank === 1 ? 'bg-amber-400 text-black' :
                    u.rank === 2 ? 'bg-slate-200 text-slate-800' :
                    u.rank === 3 ? 'bg-amber-200 text-amber-900' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    #{u.rank}
                  </span>

                  <span className="text-xl">{u.avatar}</span>

                  <div>
                    <div className="font-bold text-sm text-[#111827] flex items-center gap-2">
                      <span>{u.name}</span>
                      {u.isCurrentUser && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#12544F] text-white font-extrabold">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#64748B] flex items-center gap-2">
                      <span className="flex items-center gap-1 font-medium">
                        <Tv className="w-3 h-3 text-[#12544F]" />
                        {u.videosWatched} tasks watched
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-[#12544F] flex items-center gap-1 justify-end">
                    <span>Rs. {u.coins} PKR</span>
                  </div>
                  <div className="text-[11px] text-[#64748B] font-medium">
                    Verified Balance
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ivory-card bg-white rounded-3xl p-10 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs border border-amber-200">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-black text-[#111827]">
              Rankings Open For All Workers!
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed font-medium">
              Start completing daily YouTube video tasks today. The highest earners in Rupees will appear on this weekly leaderboard podium!
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/tasks"
              onClick={() => sounds.playClick()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#12544F] hover:bg-[#0E423E] text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105"
            >
              <Tv className="w-4 h-4" />
              <span>Watch Tasks Now</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
