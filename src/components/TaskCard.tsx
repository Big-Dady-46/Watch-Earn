'use client';

import Link from 'next/link';
import { Play, Clock, CheckCircle2, Tv, TrendingUp, Sparkles } from 'lucide-react';
import { VideoTask } from '@/types';
import { sounds } from '@/lib/audio';
import { YouTubeLogo } from './Logos';

interface TaskCardProps {
  task: VideoTask;
  isCompletedToday?: boolean;
}

export default function TaskCard({ task, isCompletedToday }: TaskCardProps) {
  return (
    <div className="ivory-card rounded-2xl p-3.5 sm:p-4 bg-white border border-black/[0.06] hover:border-[#12544F]/40 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 group">
      
      {/* Left Area: Compact Thumbnail & Meta */}
      <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
        
        {/* Compact Thumbnail ("choti si patti" style) */}
        <div className="relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-[#F8F9F8] border border-black/[0.06]">
          <img
            src={task.thumbnailUrl}
            alt={task.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${task.youtubeId}/0.jpg`;
            }}
          />

          {/* YouTube icon watermark */}
          <div className="absolute top-1 left-1">
            <YouTubeLogo className="w-3.5 h-3.5 shadow-sm" />
          </div>

          {/* Duration overlay badge */}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-[#111827]/85 backdrop-blur-xs text-[9px] font-bold text-white flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5 text-[#8BBB92]" />
            <span>{task.durationMinutes}m</span>
          </div>

          {/* Completed badge if done */}
          {isCompletedToday && (
            <div className="absolute inset-0 bg-[#12544F]/75 backdrop-blur-[1px] flex items-center justify-center text-white">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Task Info & Title */}
        <div className="flex-1 min-w-0 space-y-1">
          
          {/* Top metadata tags */}
          <div className="flex items-center flex-wrap gap-2 text-[10px] text-[#64748B] font-semibold">
            <span className="px-2 py-0.5 rounded-md bg-[#8BBB92]/20 text-[#12544F] font-extrabold uppercase tracking-wide">
              {task.category}
            </span>
            <span className="flex items-center gap-1 text-[#64748B] truncate max-w-[140px]">
              <Tv className="w-3 h-3 text-[#94A3B8] shrink-0" />
              <span className="truncate">{task.channelName}</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[#12544F] font-bold">
              • 1 PKR / Min
            </span>
          </div>

          {/* Task Title with comfortable leading */}
          <h3 className="font-extrabold text-sm sm:text-[15px] text-[#111827] group-hover:text-[#12544F] transition-colors truncate leading-snug">
            {task.title}
          </h3>

          {/* Subtitle / Description line */}
          <p className="text-[11px] text-[#64748B] truncate font-medium leading-normal">
            {task.description || `Watch for ${task.durationMinutes} minutes to claim reward.`}
          </p>
        </div>

      </div>

      {/* Right Area: Reward & Action Button with clean boundary */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 sm:pl-3.5 sm:border-l border-black/[0.05]">
        
        {/* Reward Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8BBB92]/20 border border-[#8BBB92]/35 text-[#12544F]">
          <span className="text-xs sm:text-sm font-black">
            +Rs. {task.rewardPKR}.00
          </span>
          <TrendingUp className="w-3.5 h-3.5 text-[#12544F]" />
        </div>

        {/* Action Button */}
        <Link
          href={`/watch/${task.id}`}
          onClick={() => sounds.playClick()}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
            isCompletedToday
              ? 'bg-[#F8F9F8] hover:bg-slate-200 text-[#64748B] border border-black/[0.05]'
              : 'bg-[#12544F] hover:bg-[#0E423E] text-white shadow-[#12544F]/20 hover:scale-[1.02]'
          }`}
        >
          {isCompletedToday ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#12544F]" />
              <span>Done (Watch Again)</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>Start Task</span>
            </>
          )}
        </Link>

      </div>

    </div>
  );
}
