'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  PlaySquare, 
  Wallet, 
  ShieldCheck, 
  CheckSquare, 
  User, 
  LogOut, 
  LogIn, 
  Bell, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { getCurrentUser, logoutUser, getAdminNotifications } from '@/lib/storage';
import { UserAccount } from '@/types';
import { sounds } from '@/lib/audio';
import AuthModal from './AuthModal';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserAccount | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const updateState = () => {
    setUser(getCurrentUser());
    const notifs = getAdminNotifications();
    setUnreadNotifs(notifs.filter((n) => !n.read).length);
  };

  useEffect(() => {
    updateState();
    window.addEventListener('watch-earn-update', updateState);
    window.addEventListener('storage', updateState);
    return () => {
      window.removeEventListener('watch-earn-update', updateState);
      window.removeEventListener('storage', updateState);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Daily Tasks', href: '/tasks', badge: '1 PKR/Min' },
    { name: 'Withdrawal', href: '/wallet' },
    { name: 'Admin Portal', href: '/admin', notificationCount: unreadNotifs },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-black/[0.05]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* User Profile / Logo */}
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                onClick={() => sounds.playClick()}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img
                    src="/logo.svg"
                    alt="Watch & Earn Logo"
                    className="w-10 h-10 object-contain drop-shadow-md"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-[#64748B] font-semibold tracking-wide">
                    {user ? `Welcome,` : `Watch & Earn`}
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-[#111827] tracking-tight">
                    {user ? user.name : 'Worker Portal'}
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1.5 bg-[#F8F9F8] p-1.5 rounded-2xl border border-black/[0.04]">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => sounds.playClick()}
                    className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#12544F] text-white shadow-sm'
                        : 'text-[#64748B] hover:text-[#111827] hover:bg-white'
                    }`}
                  >
                    <span>{item.name}</span>
                    {item.badge && !isActive && (
                      <span className="px-1.5 py-0.5 text-[9px] uppercase font-black rounded-md bg-[#8BBB92]/20 text-[#12544F]">
                        {item.badge}
                      </span>
                    )}
                    {item.notificationCount ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-[#12544F] text-white animate-pulse">
                        {item.notificationCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* Redesigned Header Balance Widget (Ultra Modern Fintech Pill) */}
              <Link
                href="/wallet"
                onClick={() => sounds.playClick()}
                title="Wallet & Cashout Portal"
                className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white border border-black/[0.08] hover:border-[#12544F]/40 shadow-xs hover:shadow-md hover:shadow-[#12544F]/10 transition-all duration-200 group cursor-pointer"
              >
                {/* Modern Vector Wallet Badge */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#12544F] via-[#165E58] to-[#8BBB92] text-white flex items-center justify-center shadow-xs ring-2 ring-[#8BBB92]/20 group-hover:scale-105 group-hover:ring-[#8BBB92]/40 transition-all">
                  <Wallet className="w-4 h-4 text-white" />
                </div>

                {/* Amount & Status Typography */}
                <div className="text-left">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12544F] animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#64748B]">
                      Balance
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs sm:text-sm font-black text-[#111827] tracking-tight">
                      Rs. {user ? user.balancePKR : 0}
                    </span>
                    <span className="text-[9px] font-extrabold text-[#12544F]">PKR</span>
                  </div>
                </div>

                {/* Quick Action Interactive Arrow */}
                <div className="hidden sm:flex w-5 h-5 rounded-lg bg-[#F8F9F8] group-hover:bg-[#12544F] group-hover:text-white text-[#64748B] items-center justify-center transition-all ml-0.5">
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>

              {/* Admin Bell */}
              <Link
                href="/admin"
                onClick={() => sounds.playClick()}
                className="relative p-2.5 rounded-2xl bg-white border border-black/[0.06] text-[#111827] hover:bg-slate-50 transition-colors shadow-sm"
                title="Admin Notifications"
              >
                <Bell className="w-4 h-4 text-[#111827]" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#12544F] text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {unreadNotifs}
                  </span>
                )}
              </Link>

              {/* Login / Profile */}
              {user ? (
                <button
                  onClick={() => {
                    sounds.playClick();
                    logoutUser();
                  }}
                  title="Logout"
                  className="p-2.5 rounded-2xl bg-white border border-black/[0.06] text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    sounds.playClick();
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-[#12544F] hover:bg-[#0E423E] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              )}

            </div>

          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
