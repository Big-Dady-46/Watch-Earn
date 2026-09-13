'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  Share2, 
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { getCurrentUser } from '@/lib/storage';
import { UserAccount } from '@/types';
import { sounds } from '@/lib/audio';

export default function ReferPage() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const referralCode = user?.phone ? `PKR${user.phone.slice(-4)}` : 'EARN100';

  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://watchandearn.vercel.app/?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    sounds.playCashRegisterSound();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    sounds.playClick();
    const text = encodeURIComponent(
      `Watch YouTube videos and earn real cash! 1 Minute = Rs. 1 PKR. Instant EasyPaisa/JazzCash withdrawals! Join with my link: ${referralUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
          <Users className="w-3.5 h-3.5" />
          <span>Worker Referral Program</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900">
          Invite Friends & Earn{' '}
          <span className="text-emerald-600">Rs. 15 PKR Bonus</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Share your invite link with friends. When they register and complete their first daily task, you get <strong>Rs. 15 PKR</strong> added directly to your wallet!
        </p>
      </div>

      {/* Link Box */}
      <div className="white-card p-6 sm:p-10 rounded-3xl border border-slate-200 space-y-6">
        <div className="max-w-xl mx-auto space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
            Your Personal Invite Link:
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-mono truncate select-all">
              {referralUrl}
            </div>

            <button
              onClick={handleCopy}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 shrink-0 transition-all hover:scale-105"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center">
            <button
              onClick={handleWhatsAppShare}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bonus Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="white-card p-5 rounded-2xl text-center">
          <div className="text-2xl font-black text-slate-900">
            Rs. 15 PKR
          </div>
          <div className="text-xs text-slate-500 mt-1">Per Friend Invited</div>
        </div>

        <div className="white-card p-5 rounded-2xl text-center">
          <div className="text-2xl font-black text-emerald-600">
            Instant
          </div>
          <div className="text-xs text-slate-500 mt-1">Wallet Crediting</div>
        </div>

        <div className="white-card p-5 rounded-2xl text-center">
          <div className="text-2xl font-black text-blue-600">
            Unlimited
          </div>
          <div className="text-xs text-slate-500 mt-1">Referral Earnings</div>
        </div>
      </div>

    </div>
  );
}
