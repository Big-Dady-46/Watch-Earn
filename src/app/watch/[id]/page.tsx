'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  getTaskById, 
  getTasks, 
  getCurrentUser 
} from '@/lib/storage';
import { VideoTask, UserAccount } from '@/types';
import YouTubeTaskPlayer from '@/components/YouTubeTaskPlayer';
import TaskCard from '@/components/TaskCard';
import { 
  ArrowLeft, 
  Clock, 
  ShieldAlert, 
  Tv, 
  Sparkles,
  CheckCircle2,
  Award
} from 'lucide-react';
import { sounds } from '@/lib/audio';
import { YouTubeLogo } from '@/components/Logos';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;

  const [task, setTask] = useState<VideoTask | null>(null);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [nextTasks, setNextTasks] = useState<VideoTask[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    const loadTask = async () => {
      let currentTask = getTaskById(taskId);
      if (!currentTask) {
        try {
          const res = await fetch('/api/tasks');
          if (res.ok) {
            const data = await res.json();
            currentTask = (data.tasks || []).find((t: VideoTask) => t.id === taskId);
          }
        } catch {}
      }

      if (!currentTask) {
        router.push('/tasks');
        return;
      }

      setTask(currentTask);
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setIsCompleted(currentUser?.completedTasksToday?.includes(taskId) || false);

      const all = getTasks();
      setNextTasks(all.filter((t) => t.id !== taskId && t.active).slice(0, 3));
    };

    loadTask();
  }, [taskId, router]);

  if (!task) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#12544F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64748B] text-xs">Loading task player...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/tasks"
          onClick={() => sounds.playClick()}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Daily Tasks</span>
        </Link>

        {isCompleted && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8BBB92]/25 border border-[#8BBB92]/40 text-[#12544F] text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Task Already Completed Today</span>
          </div>
        )}
      </div>

      {/* Main Grid: Player on Left, Info & Queue on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        
        {/* Left 2 Cols: Player */}
        <div className="lg:col-span-2 space-y-6">
          <YouTubeTaskPlayer task={task} isAlreadyCompleted={isCompleted} />

          {/* Task Metadata Card with comfortable breathing room */}
          <div className="ivory-card rounded-2xl p-6 sm:p-7 bg-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-md bg-[#8BBB92]/20 text-[#12544F] text-xs font-bold uppercase">
                  {task.category}
                </span>
                <span className="text-xs text-[#64748B] flex items-center gap-1.5 font-medium">
                  <YouTubeLogo className="w-4 h-4 shrink-0" />
                  <span>{task.channelName}</span>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="px-3.5 py-1.5 rounded-xl bg-[#8BBB92]/20 border border-[#8BBB92]/40 text-[#12544F] text-xs font-black flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Rs. {task.rewardPKR} PKR Reward</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#F8F9F8] border border-black/[0.04] text-[#111827] text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#12544F]" />
                  <span>{task.durationMinutes} Minutes Required</span>
                </div>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#111827] leading-snug">
              {task.title}
            </h1>

            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed whitespace-pre-line font-medium">
              {task.description}
            </p>
          </div>
        </div>

        {/* Right 1 Col: Anti Cheat Rules & More Tasks */}
        <div className="space-y-6">
          
          {/* Active Anti-Cheat Status */}
          <div className="ivory-card rounded-2xl p-5 sm:p-6 bg-white space-y-3.5">
            <div className="flex items-center gap-2 text-amber-700">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Anti-Cheat Active Rules</h3>
            </div>
            <ul className="text-xs text-[#64748B] space-y-2.5 leading-relaxed font-medium">
              <li className="flex items-start gap-2.5">
                <span className="text-[#12544F] font-bold">•</span>
                <span>Keep this browser tab focused & active throughout the video.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#12544F] font-bold">•</span>
                <span>Do not fast-forward or skip the video. Timer pauses if video stops.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#12544F] font-bold">•</span>
                <span>Full watch verification credits Rs. {task.rewardPKR} PKR directly to your balance.</span>
              </li>
            </ul>
          </div>

          {/* More Daily Tasks */}
          <div className="ivory-card rounded-2xl p-5 sm:p-6 bg-white space-y-3.5">
            <div className="flex items-center justify-between border-b border-black/[0.04] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#12544F]" />
                <h3 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Next Daily Tasks</h3>
              </div>
              <Link
                href="/tasks"
                className="text-xs text-[#12544F] hover:underline font-bold"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {nextTasks.map((item) => (
                <TaskCard
                  key={item.id}
                  task={item}
                  isCompletedToday={user?.completedTasksToday?.includes(item.id)}
                />
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
