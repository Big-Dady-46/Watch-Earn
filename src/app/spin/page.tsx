'use client';

import DailySpinWheel from '@/components/DailySpinWheel';
import { Gift, Sparkles, Coins, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function SpinPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8BBB92]/20 border border-[#8BBB92]/40 text-[#12544F] text-xs font-bold uppercase tracking-wider">
          <Gift className="w-3.5 h-3.5 text-[#12544F]" />
          <span>Daily Bonus Wheel</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[#111827] tracking-tight">
          Lucky Spin & Win
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto leading-relaxed font-medium">
          Har spin par sirf Rs. 1 PKR fee lagti hai. Wheel ghuma kar cash rewards jeetein!
        </p>
      </div>

      {/* Wheel Canvas Container */}
      <div className="ivory-card bg-white p-8 sm:p-12 rounded-3xl border border-black/[0.06] flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8BBB92]/15 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#12544F]/10 blur-[100px] pointer-events-none" />

        <DailySpinWheel />
      </div>

      {/* Rules & Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="ivory-card p-5 bg-white rounded-2xl flex items-start gap-3 border border-black/[0.05]">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#111827]">Fair Odds & Alternating Slices</h4>
            <p className="text-xs text-[#64748B] mt-1 font-medium leading-relaxed">
              Wheel board par aik slice Khaali aur aik Inam wala hota hai. Lucky workers Rs. 1, Rs. 2, ya Rs. 3+ jeet saktay hain!
            </p>
          </div>
        </div>

        <div className="ivory-card p-5 bg-white rounded-2xl flex items-start gap-3 border border-black/[0.05]">
          <div className="w-9 h-9 rounded-xl bg-[#12544F]/10 text-[#12544F] flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5 text-[#12544F]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#111827]">Instant Wallet Credit</h4>
            <p className="text-xs text-[#64748B] mt-1 font-medium leading-relaxed">
              Inam foran aapke wallet balance me add hota hai jisko aap EasyPaisa ya JazzCash me withdraw kar saktay hain.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
