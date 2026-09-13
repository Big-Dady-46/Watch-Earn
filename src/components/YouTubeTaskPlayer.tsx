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
  Volume2,
  VolumeX,
  Volume1,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { VideoTask } from '@/types';
import { completeVideoTask, getCurrentUser } from '@/lib/storage';
import { sounds } from '@/lib/audio';
import { formatDuration } from '@/lib/youtube';
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
  
  // Custom Controls State (No timeline scrubber allowed!)
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [seekWarning, setSeekWarning] = useState<string | null>(null);
  
  const playerRef = useRef<any>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLegitTimeRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      // playerVars:
      // controls: 0 hides YouTube's native scrubber / forward-backward line completely!
      // disablekb: 1 disables keyboard seeking shortcuts (arrow keys, J, L, 0-9).
      // fs: 0 disables fullscreen mode where native seeker might reappear.
      playerRef.current = new window.YT.Player(`yt-player-${task.id}`, {
        videoId: task.youtubeId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,       // NO timeline seekbar/controls!
          disablekb: 1,      // No keyboard seeking
          fs: 0,             // No fullscreen seeking
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: origin,
          modestbranding: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event: any) => {
            if (isMounted) {
              try {
                event.target.setVolume(80);
              } catch {}
            }
          },
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

  // Anti-Cheat & Anti-Forward-Seek Interceptor
  useEffect(() => {
    if (!isPlaying || isCompleted) return;

    const antiSkipInterval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          // If playback somehow jumped ahead by more than 2.0 seconds
          if (currentTime > lastLegitTimeRef.current + 2.0) {
            playerRef.current.seekTo(lastLegitTimeRef.current, true);
            setSeekWarning('Video aage karne ki ijazat nahi hai! Video poori watch karein.');
            sounds.playWarningSound();
            setTimeout(() => setSeekWarning(null), 3500);
          } else {
            lastLegitTimeRef.current = Math.max(lastLegitTimeRef.current, currentTime);
          }
        } catch {}
      }
    }, 400);

    return () => clearInterval(antiSkipInterval);
  }, [isPlaying, isCompleted]);

  // Tab switch auto-pause
  useEffect(() => {
    const handleVisibilityChange = () => {
      const active = !document.hidden;
      setTabActive(active);
      if (!active && playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Timer countdown: strictly counts down only when video is actively playing and tab is focused
  useEffect(() => {
    if (isCompleted) return;

    if (isPlaying && tabActive) {
      timerIntervalRef.current = setInterval(() => {
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
  }, [isPlaying, tabActive, isCompleted]);

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

  // Custom Controls Handlers
  const togglePlayPause = () => {
    sounds.playClick();
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Play/pause error:', err);
    }
  };

  const toggleMute = () => {
    sounds.playClick();
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume || 80);
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (err) {}
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (!playerRef.current) return;
    try {
      playerRef.current.setVolume(newVol);
      if (newVol === 0) {
        playerRef.current.mute();
        setIsMuted(true);
      } else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    } catch (err) {}
  };

  const progressPercent = Math.min(
    100,
    Math.round(((task.durationSeconds - remainingSeconds) / task.durationSeconds) * 100)
  );

  return (
    <div className="space-y-4">
      
      {/* Video Player Container */}
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black shadow-xl border border-black/[0.08]">
        <div id={`yt-player-${task.id}`} className="w-full h-full" />

        {/* Floating Anti-Skip Warning Banner */}
        {seekWarning && (
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-center animate-bounce">
            <div className="px-4 py-2 rounded-xl bg-red-600/95 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 shadow-2xl border border-red-400">
              <ShieldAlert className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>{seekWarning}</span>
            </div>
          </div>
        )}

        {/* Tab Pause Overlay when user leaves tab */}
        {!tabActive && (
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

        {/* Center Big Play Button if video is paused & not completed */}
        {!isPlaying && !isCompleted && tabActive && (
          <div 
            onClick={togglePlayPause}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer z-10 group transition-all"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#12544F] group-hover:bg-[#0E423E] text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
            </div>
            <p className="mt-3 text-xs sm:text-sm font-extrabold text-white tracking-wide drop-shadow-md">
              Click Here to Play & Start Earning
            </p>
          </div>
        )}
      </div>

      {/* Custom Control Bar (Play/Pause, Sound/Mute/Volume, Anti-Skip Indicator - NO TIMELINE SCRUBBER) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#111827] text-white border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Play/Pause & Sound Controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Custom Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlayPause}
            disabled={isCompleted}
            className={`px-4 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow transition-all ${
              isCompleted
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white hover:scale-105 active:scale-95'
                : 'bg-[#12544F] hover:bg-[#0E423E] text-white hover:scale-105 active:scale-95'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          {/* Sound Controls Divider */}
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Mute / Unmute Button */}
          <button
            type="button"
            onClick={toggleMute}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4 text-[#8BBB92]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#8BBB92]" />
            )}
          </button>

          {/* Volume Slider */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-16 sm:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#8BBB92]"
              title="Volume"
            />
            <span className="text-[11px] font-mono text-slate-400 w-8">
              {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>
        </div>

        {/* Right: Anti-Skip Locked Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/70 text-[11px] font-bold text-slate-300">
          <Lock className="w-3.5 h-3.5 text-[#8BBB92]" />
          <span>Timeline Scrubber Locked</span>
        </div>

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
                    : isPlaying
                    ? 'Video is Playing - Verifying Watch Minutes...'
                    : 'Video is Paused'}
                </h4>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#8BBB92]/20 text-[#12544F] font-bold">
                  <ShieldCheck className="w-3 h-3 text-[#12544F]" />
                  Anti-Cheat Protection
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                {isCompleted
                  ? `Reward of Rs. ${task.rewardPKR} PKR credited to your balance!`
                  : isPlaying
                  ? 'Keep watching continuously. Video scrubber is locked to ensure full watch time.'
                  : 'Click Play button above to start watching and earn your reward.'}
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

        {/* Watch Progress Bar (Read-only countdown progress) */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[#64748B] font-bold">
            <span>Verified Watch Progress</span>
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
                  Video view successfully verified without skipping. Keep completing tasks to cashout!
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
