'use client';

import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Gift, Coins, AlertCircle, ArrowRight, Wallet, CheckCircle2, XCircle } from 'lucide-react';
import { getCurrentUser, saveUser } from '@/lib/storage';
import { sounds } from '@/lib/audio';
import Link from 'next/link';

// Wheel board slices sequence: STRICTLY ALTERNATING: ONE EMPTY, ONE REWARD!
// Sequence on the board:
// Slice 0: Khaali ❌
// Slice 1: Rs. 1 PKR 🎁 (15% chance)
// Slice 2: Khaali ❌
// Slice 3: Rs. 3 PKR 🌟 (2% chance)
// Slice 4: Khaali ❌
// Slice 5: Rs. 2 PKR 💰 (2% chance)
// Slice 6: Khaali ❌
// Slice 7: Rs. 5 PKR ⭐ (1% chance)
const WHEEL_SLICES = [
  { label: 'Khaali ❌', value: 0, isEmpty: true, color: '#334155' },
  { label: 'Rs. 1 PKR', value: 1, isEmpty: false, color: '#10b981' },
  { label: 'Khaali ❌', value: 0, isEmpty: true, color: '#475569' },
  { label: 'Rs. 3 PKR', value: 3, isEmpty: false, color: '#8b5cf6' },
  { label: 'Khaali ❌', value: 0, isEmpty: true, color: '#334155' },
  { label: 'Rs. 2 PKR', value: 2, isEmpty: false, color: '#f59e0b' },
  { label: 'Khaali ❌', value: 0, isEmpty: true, color: '#475569' },
  { label: 'Rs. 5 PKR 🌟', value: 5, isEmpty: false, color: '#ec4899' },
];

const SPIN_COST_PKR = 1;

export default function DailySpinWheel() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWonReward, setLastWonReward] = useState<{ value: number; label: string; isEmpty: boolean } | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const rotationAngleRef = useRef(0);

  // Sync user status & balance
  const syncUser = () => {
    const user = getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
      setUserBalance(user.balancePKR || 0);
    } else {
      setIsLoggedIn(false);
      setUserBalance(0);
    }
  };

  useEffect(() => {
    syncUser();
    const handleUpdate = () => syncUser();
    window.addEventListener('watch-earn-update', handleUpdate);
    return () => window.removeEventListener('watch-earn-update', handleUpdate);
  }, []);

  // Draw wheel on canvas with upright readable text
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 14;
    const numSlices = WHEEL_SLICES.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, size, size);

    // Outer dark-emerald rim
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#090d16';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#12544F';
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
      ctx.fillStyle = WHEEL_SLICES[i].color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#090d16';
      ctx.stroke();

      // Text label inside slice - ensure always clearly readable
      ctx.save();
      const midAngle = startAngle + sliceAngle / 2;
      ctx.rotate(midAngle);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = WHEEL_SLICES[i].isEmpty ? '#cbd5e1' : '#ffffff';
      ctx.fillText(WHEEL_SLICES[i].label, radius - 16, 0);

      ctx.restore();
    }

    ctx.restore();

    // Center Hub (Gold & Emerald)
    ctx.beginPath();
    ctx.arc(center, center, 34, 0, 2 * Math.PI);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#8BBB92';
    ctx.stroke();

    // Center Hub Text
    ctx.fillStyle = '#8BBB92';
    ctx.font = '900 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Rs. 1', center, center - 6);
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('SPIN', center, center + 8);
  };

  useEffect(() => {
    drawWheel(rotationAngleRef.current);
  }, []);

  // Spin Logic with 100% Precise Math & Exact Odds:
  // - 80% chance: Khaali (0 PKR) -> Lands on slices 0, 2, 4, or 6
  // - 15% chance: Rs. 1 PKR -> Lands on slice 1
  // - 2% chance: Rs. 3 PKR -> Lands on slice 3
  // - 2% chance: Rs. 2 PKR -> Lands on slice 5
  // - 1% chance: Rs. 5 PKR -> Lands on slice 7
  const spinWheel = () => {
    if (isSpinning) return;

    const user = getCurrentUser();
    if (!user) {
      setErrorMessage('Pehle apna account login ya register karein taake aap spin kar sakein!');
      return;
    }

    if ((user.balancePKR || 0) < SPIN_COST_PKR) {
      setErrorMessage(`Spin karne ke liye kam az kam Rs. ${SPIN_COST_PKR} balance hona zaroori hai. Pehle videos dekh kar balance kamayein!`);
      sounds.playWarningSound();
      return;
    }

    setErrorMessage(null);
    setLastWonReward(null);

    // 1. Deduct 1 PKR for the spin immediately
    user.balancePKR -= SPIN_COST_PKR;
    saveUser(user);
    setUserBalance(user.balancePKR);
    sounds.playClick();
    setIsSpinning(true);

    // 2. Pick target slice based on exact mathematical odds
    const rand = Math.random() * 100; // 0 to 100
    let targetSliceIndex = 0;

    if (rand < 80) {
      // 80% Chance: Khaali (Empty) -> random slice from [0, 2, 4, 6]
      const emptySlices = [0, 2, 4, 6];
      targetSliceIndex = emptySlices[Math.floor(Math.random() * emptySlices.length)];
    } else if (rand < 95) {
      // 15% Chance: Rs. 1 PKR
      targetSliceIndex = 1;
    } else if (rand < 97) {
      // 2% Chance: Rs. 3 PKR
      targetSliceIndex = 3;
    } else if (rand < 99) {
      // 2% Chance: Rs. 2 PKR
      targetSliceIndex = 5;
    } else {
      // 1% Chance: Rs. 5 PKR
      targetSliceIndex = 7;
    }

    const numSlices = WHEEL_SLICES.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    // Center of target slice inside the wheel:
    const targetSliceCenter = targetSliceIndex * sliceAngle + sliceAngle / 2;

    // Top pointer is at 12 o'clock (angle: 3 * Math.PI / 2 or 270 degrees)
    // We need (targetSliceCenter + finalAngle) % (2 * Math.PI) = 3 * Math.PI / 2
    // Therefore: targetAngle = 3 * Math.PI / 2 - targetSliceCenter (mod 2*PI)
    const desiredNormalizedAngle = (((3 * Math.PI / 2 - targetSliceCenter) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Current angle normalized to [0, 2*PI)
    const currentAngle = rotationAngleRef.current;
    const currentNormalized = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Calculate clockwise distance to target
    let forwardDelta = desiredNormalizedAngle - currentNormalized;
    if (forwardDelta <= 0.05) {
      forwardDelta += 2 * Math.PI;
    }

    // 6 complete spins + exact forward delta to ensure perfect center alignment
    const fullSpins = 6 * 2 * Math.PI;
    const totalRotationDelta = fullSpins + forwardDelta;
    const finalAngle = currentAngle + totalRotationDelta;

    const startTime = performance.now();
    const duration = 4300; // 4.3 seconds smooth spin
    let lastTickSlice = -1;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth Ease-Out Cubic Curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const curAngle = currentAngle + totalRotationDelta * easeOut;
      rotationAngleRef.current = curAngle;

      drawWheel(curAngle);

      // Mechanical tick sound whenever slice boundary passes pointer
      const normalizedForTick = ((curAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const currentPointerSlice = Math.floor((((3 * Math.PI / 2 - normalizedForTick) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / sliceAngle);
      if (currentPointerSlice !== lastTickSlice) {
        sounds.playTick();
        lastTickSlice = currentPointerSlice;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ensure exact final angle is set and drawn
        rotationAngleRef.current = finalAngle;
        drawWheel(finalAngle);
        setIsSpinning(false);

        // Verification: Calculate physically which slice is directly under the pointer:
        const finalNormalized = ((finalAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const pointerLocalAngle = (((3 * Math.PI / 2 - finalNormalized) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const physicalLandedIndex = Math.floor(pointerLocalAngle / sliceAngle) % numSlices;
        const finalReward = WHEEL_SLICES[physicalLandedIndex];

        setLastWonReward({
          value: finalReward.value,
          label: finalReward.label,
          isEmpty: finalReward.isEmpty,
        });

        const updatedUser = getCurrentUser();
        if (updatedUser) {
          if (finalReward.value > 0) {
            // Prize Won! Add to balance
            updatedUser.balancePKR += finalReward.value;
            updatedUser.totalEarnedPKR += finalReward.value;
            saveUser(updatedUser);
            setUserBalance(updatedUser.balancePKR);

            sounds.playCashRegisterSound();
            setTimeout(() => sounds.playSuccessFanfare(), 300);

            confetti({
              particleCount: 170,
              spread: 85,
              origin: { y: 0.6 },
              colors: ['#12544F', '#8BBB92', '#f59e0b', '#ec4899', '#3b82f6'],
            });
          } else {
            // Khaali (Empty): 0 PKR
            sounds.playWarningSound();
          }
        }
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      
      {/* Wallet Balance & Cost Status Pill */}
      <div className="mb-4 w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#8BBB92]/20 flex items-center justify-center text-[#8BBB92]">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aap Ka Wallet Balance</div>
            <div className="text-sm font-black text-white">Rs. {userBalance.toFixed(2)} PKR</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Keemat / Fee</div>
          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
            Rs. 1.00 PKR
          </span>
        </div>
      </div>

      {/* Pointer Arrow on Top (Emerald Marker Pointing Directly Down) */}
      <div className="relative mb-1 z-10">
        <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[26px] border-t-[#8BBB92] filter drop-shadow(0 4px 8px rgba(0,0,0,0.65))" />
      </div>

      {/* Wheel Canvas Container */}
      <div className="relative p-2.5 rounded-full bg-slate-900 border-2 border-[#12544F]/50 shadow-2xl shadow-[#12544F]/25">
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          className="rounded-full select-none cursor-pointer"
          onClick={spinWheel}
        />
      </div>

      {/* Low Balance Alert (Shown only when not spinning and balance < 1) */}
      {errorMessage && !isSpinning && (
        <div className="mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 w-full animate-in zoom-in-95">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold leading-relaxed">{errorMessage}</p>
            {userBalance < SPIN_COST_PKR && (
              <Link
                href="/tasks"
                className="inline-flex items-center gap-1 font-black text-red-800 underline hover:text-red-900"
              >
                <span>Videos dekh kar balance kamayein</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Spin Action Button */}
      <div className="mt-5 flex flex-col items-center gap-3 w-full">
        <button
          onClick={spinWheel}
          disabled={isSpinning}
          className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all ${
            isSpinning
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : userBalance >= SPIN_COST_PKR
              ? 'bg-[#12544F] hover:bg-[#0E423E] text-white hover:scale-[1.02] active:scale-[0.98] shadow-[#12544F]/25'
              : 'bg-amber-600 hover:bg-amber-500 text-white hover:scale-[1.02] shadow-amber-600/20'
          }`}
        >
          {isSpinning ? (
            <>
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>Wheel Ghum Raha Hai...</span>
            </>
          ) : userBalance >= SPIN_COST_PKR ? (
            <>
              <Gift className="w-5 h-5 text-[#8BBB92]" />
              <span>SPIN WHEEL (Fee: Rs. 1 PKR)</span>
            </>
          ) : (
            <>
              <Coins className="w-5 h-5" />
              <span>Need Rs. 1 PKR to Spin</span>
            </>
          )}
        </button>

        {/* Won / Empty Result Banner - 100% Guaranteed to Match Wheel Pointer! */}
        {lastWonReward && !isSpinning && (
          <div
            className={`mt-3 p-4 rounded-2xl border text-center w-full animate-in zoom-in-95 duration-200 ${
              lastWonReward.isEmpty
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-[#8BBB92]/20 border-[#8BBB92]/50 text-[#12544F]'
            }`}
          >
            {lastWonReward.isEmpty ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-slate-800 text-base font-black">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span>Khaali Nikla! ❌</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Kismat ne sath nahi diya. Dobara koshish karein aur inam jeetein!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-[#12544F] text-base font-black">
                  <CheckCircle2 className="w-5 h-5 text-[#12544F]" />
                  <span>+{lastWonReward.label} Jeet Liya! 🎉</span>
                </div>
                <p className="text-xs text-[#12544F]/85 font-semibold">
                  Mubarak ho! Inam foran aapke wallet balance me add kar diya gaya hai!
                </p>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
