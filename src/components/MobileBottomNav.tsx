'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckSquare, Wallet, ShieldCheck, User, Plus, Play } from 'lucide-react';
import { sounds } from '@/lib/audio';
import { getAdminNotifications } from '@/lib/storage';
import { useState, useEffect } from 'react';

interface MobileBottomNavProps {
  onOpenAuth: () => void;
}

export default function MobileBottomNav({ onOpenAuth }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    const update = () => {
      const notifs = getAdminNotifications();
      setUnreadNotifs(notifs.filter((n) => !n.read).length);
    };
    update();
    window.addEventListener('watch-earn-update', update);
    return () => window.removeEventListener('watch-earn-update', update);
  }, []);

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-black/[0.06] rounded-[32px] px-3 py-2 flex items-center justify-between gap-1 shadow-2xl shadow-black/10 w-full max-w-sm">
        
        {/* Home */}
        <Link
          href="/"
          onClick={() => sounds.playClick()}
          className={`p-2.5 rounded-2xl flex flex-col items-center transition-all ${
            pathname === '/' ? 'text-[#191C21] font-bold bg-black/[0.04]' : 'text-[#64748B] hover:text-[#191C21]'
          }`}
          title="Dashboard"
        >
          <Home className="w-5 h-5" />
        </Link>

        {/* Tasks */}
        <Link
          href="/tasks"
          onClick={() => sounds.playClick()}
          className={`p-2.5 rounded-2xl flex flex-col items-center transition-all ${
            pathname === '/tasks' ? 'text-[#191C21] font-bold bg-black/[0.04]' : 'text-[#64748B] hover:text-[#191C21]'
          }`}
          title="Daily Tasks"
        >
          <CheckSquare className="w-5 h-5" />
        </Link>

        {/* Center Main Action Pill Button (Exact match with reference screenshot) */}
        <Link
          href="/tasks"
          onClick={() => sounds.playClick()}
          className="w-12 h-12 rounded-full bg-[#191C21] text-white flex items-center justify-center shadow-lg shadow-black/20 hover:scale-105 active:scale-95 transition-transform mx-1"
          title="Start Watch Task"
        >
          <Play className="w-5 h-5 fill-white ml-0.5" />
        </Link>

        {/* Wallet */}
        <Link
          href="/wallet"
          onClick={() => sounds.playClick()}
          className={`p-2.5 rounded-2xl flex flex-col items-center transition-all ${
            pathname === '/wallet' ? 'text-[#191C21] font-bold bg-black/[0.04]' : 'text-[#64748B] hover:text-[#191C21]'
          }`}
          title="Wallet"
        >
          <Wallet className="w-5 h-5" />
        </Link>

        {/* Admin / Account */}
        <Link
          href="/admin"
          onClick={() => sounds.playClick()}
          className={`relative p-2.5 rounded-2xl flex flex-col items-center transition-all ${
            pathname === '/admin' ? 'text-[#191C21] font-bold bg-black/[0.04]' : 'text-[#64748B] hover:text-[#191C21]'
          }`}
          title="Admin"
        >
          <ShieldCheck className="w-5 h-5" />
          {unreadNotifs > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
          )}
        </Link>

      </div>
    </div>
  );
}
