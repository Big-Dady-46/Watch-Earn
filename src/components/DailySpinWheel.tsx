'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Gift, Clock, Coins } from 'lucide-react';
import { getUserProfile, saveUserProfile, creditCoins } from '@/lib/storage';
import { sounds } from '@/lib/audio';

const REWARDS = [
  { label: 'Rs. 2 PKR', value: 2, color: '#f59e0b' },
  { label: 'Rs. 5 PKR', value: 5, color: '#3b82f6' },
  { label: 'Rs. 1 PKR', value: 1, color: '#10b981' },
  { label: 'Rs. 3 PKR', value: 3, color: '#8b5cf6' },
  { label: 'Rs. 10 PKR', value: 10, color: '#ec4899' },
  { label: 'Rs. 4 PKR', value: 4, color: '#06b6d4' },
  { label: 'Rs. 8 PKR', value: 8, color: '#f97316' },
  { label: 'Rs. 15 PKR 🌟', value: 15, color: '#eab308' },
];

export default function DailySpinWheel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonReward, setWonReward] = useState<number | null>(null);
  const [canSpin, setCanSpin] = useState(true);
  const [cooldownText, setCooldownText] = useState('');
  const rotationAngleRef = useRef(0);

  // Check spin availability
  useEffect(() => {
    const checkSpinAvailability = () => {
      const user = getUserProfile();
      if (!user.lastSpinDate) {
        setCanSpin(true);
        return;
      }

      const last = new Date(user.lastSpinDate).getTime();
      const now = Date.now();
      const diffMs = now - last;
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (diffMs < twentyFourHours) {
        setCanSpin(false);
        const remainingMs = twentyFourHours - diffMs;
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        setCooldownText(`${hours}h ${mins}m remaining`);
      } else {
        setCanSpin(true);
      }
    };

    checkSpinAvailability();
    const interval = setInterval(checkSpinAvailability, 60000);
    return () => clearInterval(interval);
  }, []);

  // Draw the wheel
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 15;
    const numSlices = REWARDS.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // Outer glow rim
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Slices
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle);

    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.fillStyle = REWARDS[i].color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#090d16';
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px system-ui';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(REWARDS[i].label, radius - 20, 5);
      ctx.restore();
    }

    ctx.restore();

    // Center Hub
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#090d16';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Center text
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', center, center + 4);
  };

  useEffect(() => {
    drawWheel(rotationAngleRef.current);
  }, []);

  // Spin Logic
  const spinWheel = () => {
    if (isSpinning || !canSpin) return;

    sounds.playClick();
    setIsSpinning(true);
    setWonReward(null);

    // Pick random slice
    const winningIndex = Math.floor(Math.random() * REWARDS.length);
    const winningReward = REWARDS[winningIndex];

    const numSlices = REWARDS.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    // Arrow pointer is at top (angle 3*PI/2)
    // We want the winning slice center to align with top
    const targetSliceCenter = winningIndex * sliceAngle + sliceAngle / 2;
    const desiredTargetAngle = (3 * Math.PI) / 2 - targetSliceCenter;

    const fullSpins = 6 * 2 * Math.PI; // 6 full rotations
    const totalRotation = fullSpins + desiredTargetAngle;

    const startTime = performance.now();
    const duration = 4000; // 4 seconds spin
    const startAngle = rotationAngleRef.current % (2 * Math.PI);
    let lastTickAngle = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalRotation * easeOut;
      rotationAngleRef.current = currentAngle;

      drawWheel(currentAngle);

      // Mechanical tick sound
      if (Math.abs(currentAngle - lastTickAngle) > sliceAngle) {
        sounds.playTick();
        lastTickAngle = currentAngle;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setWonReward(winningReward.value);

        // Credit coins
        creditCoins(winningReward.value, `Daily Lucky Wheel: Won ${winningReward.label}`);

        // Update last spin date
        const user = getUserProfile();
        user.lastSpinDate = new Date().toISOString();
        saveUserProfile(user);

        setCanSpin(false);
        setCooldownText('24h 0m remaining');

        // Fanfare & Confetti
        sounds.playCoinSound();
        setTimeout(() => sounds.playSuccessFanfare(), 300);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#eab308'],
        });
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Pointer arrow on top */}
      <div className="relative mb-2 z-10">
        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-amber-400 filter drop-shadow(0 4px 6px rgba(0,0,0,0.5))" />
      </div>

      {/* Wheel Canvas */}
      <div className="relative p-2 rounded-full bg-slate-900/80 border-2 border-amber-500/30 shadow-2xl shadow-amber-500/20">
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          className="rounded-full select-none cursor-pointer"
          onClick={spinWheel}
        />
      </div>

      {/* Action Button */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          onClick={spinWheel}
          disabled={isSpinning || !canSpin}
          className={`px-8 py-3.5 rounded-2xl font-black text-base flex items-center gap-2.5 shadow-xl transition-all ${
            canSpin && !isSpinning
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-amber-500/30 hover:scale-105 active:scale-95'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
          }`}
        >
          {isSpinning ? (
            <>
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>Spinning Wheel...</span>
            </>
          ) : canSpin ? (
            <>
              <Gift className="w-5 h-5" />
              <span>SPIN FOR FREE COINS!</span>
            </>
          ) : (
            <>
              <Clock className="w-5 h-5" />
              <span>Already Claimed Today</span>
            </>
          )}
        </button>

        {!canSpin && cooldownText && (
          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Next free spin available in: <strong className="text-amber-300">{cooldownText}</strong></span>
          </p>
        )}

        {/* Won Banner */}
        {wonReward !== null && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/50 text-center animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center gap-2 text-amber-400 text-lg font-black">
              <Coins className="w-5 h-5" />
              <span>+{wonReward} COINS WON!</span>
            </div>
            <p className="text-xs text-zinc-300 mt-1">
              Your reward has been added to your wallet balance!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
