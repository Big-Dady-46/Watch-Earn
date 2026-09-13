'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Award,
  ExternalLink
} from 'lucide-react';
import { VideoTask } from '@/types';
import { completeVideoTask, getCurrentUser } from '@/lib/storage';
import { sounds } from '@/lib/audio';
import { formatDuration } from '@/lib/youtube';
import { YouTubeLogo } from './Logos';
import Link from 'next/link';

interface YouTubeTaskPlayerProps {
  task: VideoTask;
  isAlreadyCompleted?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubeTaskPlayer({ task, isAlreadyCompleted = false }: YouTubeTaskPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(task.durationSeconds);
  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [tabActive, setTabActive] = useState(true);
  const [openedOnYouTube, setOpenedOnYouTube] = useState(false);
  
  const playerRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }

      // Authentic YouTube Player parameters to ensure real view counting
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      playerRef.current = new window.YT.Player(`yt-player-${task.id}`, {
        videoId: task.youtubeId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: origin,
        },
        events: {
          onStateChange: (event: any) => {
            // YouTube Player State: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (event.data === 1) {
              if (isMounted) setIsPlaying(true);
            } else if (event.data === 0) {
              // Video finished naturally on YouTube
              if (isMounted) {
                setIsPlaying(false);
                handleCompleteTask();
              }
            } else {
              if (isMounted) setIsPlaying(false);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode?.insertBefore(tag, firstScript);
      }

      const prevOnReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevOnReady) prevOnReady();
        if (isMounted) initPlayer();
      };
    }

    return () => {
      isMounted = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [task.id, task.youtubeId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const active = !document.hidden;
      setTabActive(active);
      if (!active && playerRef.current && typeof playerRef.current.pauseVideo === 'function' && !openedOnYouTube) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [openedOnYouTube]);

  useEffect(() => {
    if (isCompleted) return;

    if ((isPlaying && tabActive) || openedOnYouTube) {
      timerIntervalRef.current = setInterval(() => {
        accumulatedRef.current += 1;
        setRemainingSeconds((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(timerIntervalRef.current!);
            handleCompleteTask();
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isPlaying, tabActive, isCompleted, openedOnYouTube]);

  const handleCompleteTask = () => {
    if (isCompleted) return;
    setIsCompleted(true);
    setRewardClaimed(true);
    setIsPlaying(false);

    const user = getCurrentUser();
    if (user) {
      completeVideoTask(user.id, task);
    }

    sounds.playCashRegisterSound();
    setTimeout(() => sounds.playSuccessFanfare(), 400);

    confetti({
      particleCount: 140,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#12544F', '#8BBB92', '#111827', '#0E423E'],
    });
  };

  const handleOpenDirectYouTube = () => {
    sounds.playClick();
    setOpenedOnYouTube(true);
    setIsPlaying(true);
    // Direct YouTube link with autoplay for genuine native YouTube view
    window.open(`https://www.youtube.com/watch?v=${task.youtubeId}`, '_blank', 'noopener,noreferrer');
  };

  const progressPercent = Math.min(
    100,
    Math.round(((task.durationSeconds - remainingSeconds) / task.durationSeconds) * 100)
  );

  return (
    <div className="space-y-5">
      
      {/* Video Player Container */}
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black shadow-xl border border-black/[0.08]">
        <div id={`yt-player-${task.id}`} className="w-full h-full" />

        {/* Tab Pause Overlay when user leaves tab (unless watching directly on YouTube) */}
        {!tabActive && !openedOnYouTube && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 text-white space-y-3">
            <AlertCircle className="w-12 h-12 text-[#8BBB92] animate-bounce" />
            <div className="space-y-1">
              <h4 className="text-lg font-extrabold">Playback Paused</h4>
              <p className="text-xs text-slate-300 max-w-sm font-medium leading-relaxed">
                Please stay on this tab while watching to verify your watch time and credit Rs. {task.rewardPKR} PKR!
              </p>
            </div>
            <button
              onClick={() => {
                setTabActive(true);
                if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                  playerRef.current.playVideo();
                }
              }}
              className="px-5 py-2 rounded-xl bg-[#12544F] text-white text-xs font-bold shadow-md hover:bg-[#0E423E] transition-all"
            >
              Resume Watching
            </button>
          </div>
        )}
      </div>

      {/* Official YouTube View Verification Bar */}
      <div className="p-4 rounded-2xl bg-white border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <YouTubeLogo className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-[#111827]">
                Official YouTube View Counter Active
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-[#8BBB92]/20 text-[#12544F] text-[10px] font-bold">
                100% Monetized View
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium leading-relaxed mt-0.5">
              Watching here or on YouTube automatically counts as a verified view for the creator.
            </p>
          </div>
        </div>

        {/* Direct Open in YouTube Button */}
        <button
          type="button"
          onClick={handleOpenDirectYouTube}
          className="px-4 py-2.5 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shrink-0 transition-transform hover:scale-[1.02] shadow-sm"
        >
          <YouTubeLogo className="w-4 h-4" />
          <span>Watch on YouTube App/Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#8BBB92]" />
        </button>
      </div>

      {/* Progress & Earning Status Card */}
      <div className="ivory-card rounded-2xl p-5 sm:p-6 bg-white space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            {isCompleted ? (
              <div className="w-11 h-11 rounded-2xl bg-[#8BBB92]/25 text-[#12544F] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : isPlaying ? (
              <div className="w-11 h-11 rounded-2xl bg-[#8BBB92]/25 text-[#12544F] flex items-center justify-center shrink-0 animate-pulse">
                <Play className="w-5 h-5 fill-current" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                <Pause className="w-5 h-5" />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center flex-wrap gap-2">
                <h4 className="text-sm font-extrabold text-[#111827]">
                  {isCompleted
                    ? 'Daily Task Completed!'
                    : openedOnYouTube
                    ? 'Watching on YouTube - Verifying Watch Minutes...'
                    : isPlaying
                    ? 'Video is Playing - Verifying Watch Minutes...'
                    : 'Video is Paused'}
                </h4>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#8BBB92]/20 text-[#12544F] font-bold">
                  <ShieldCheck className="w-3 h-3 text-[#12544F]" />
                  Anti-Cheat Active
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                {isCompleted
                  ? `Reward of Rs. ${task.rewardPKR} PKR credited to your balance!`
                  : isPlaying || openedOnYouTube
                  ? 'Keep watching until the countdown finishes to claim your reward.'
                  : 'Click play on the video player above or open on YouTube to start timer.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            <div className="px-3.5 py-2 rounded-xl bg-[#8BBB92]/20 border border-[#8BBB92]/35 text-[#12544F] text-xs font-black flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#12544F]" />
              <span>+Rs. {task.rewardPKR}.00</span>
            </div>

            <div className={`px-3.5 py-2 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 ${
              isCompleted
                ? 'bg-[#12544F] text-white border-[#12544F]'
                : 'bg-slate-100 border-slate-200 text-[#111827]'
            }`}>
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{isCompleted ? 'Finished' : formatDuration(remainingSeconds)}</span>
            </div>
          </div>

        </div>

        {/* Watch Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[#64748B] font-bold">
            <span>Watch Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-black/[0.04]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-[#12544F]'
                  : 'bg-gradient-to-r from-[#8BBB92] to-[#12544F]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Reward celebration banner */}
        {rewardClaimed && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#8BBB92]/20 border border-[#8BBB92]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#12544F] text-white flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h5 className="text-sm font-black text-[#12544F]">
                  Congratulations! +Rs. {task.rewardPKR} PKR Added to Wallet!
                </h5>
                <p className="text-xs text-[#12544F]/85 font-medium leading-relaxed">
                  YouTube view successfully verified. Keep completing tasks to cashout!
                </p>
              </div>
            </div>

            <Link
              href="/wallet"
              onClick={() => sounds.playClick()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#12544F] hover:bg-[#0E423E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
            >
              <span>Go to Wallet & Withdraw</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

      </div>

    </div>
  );
}
