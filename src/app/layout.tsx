'use client';

import { useState, useEffect } from 'react';
import { Montserrat } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import AuthModal from '@/components/AuthModal';
import InteractiveBackground from '@/components/InteractiveBackground';
import Link from 'next/link';
import { PlaySquare, ShieldCheck, Clock, Award } from 'lucide-react';
import { checkAndRunMidnightRefresh } from '@/lib/storage';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    checkAndRunMidnightRefresh();
  }, []);

  return (
    <html lang="en" className={`${montserrat.variable} h-full`}>
      <head>
        <title>Watch & Earn - Real Rupees Payouts</title>
        <meta name="description" content="Watch verified YouTube videos and earn real money in PKR. Instant withdrawals via EasyPaisa, JazzCash, and Bank Accounts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={`${montserrat.className} min-h-full flex flex-col antialiased selection:bg-[#12544F] selection:text-white pb-20 md:pb-0 relative bg-[#F8F9F8] text-[#111827]`}>
        {/* Dynamic Interactive Cursor & Fluid Background (#12544F & #8BBB92) */}
        <InteractiveBackground />

        <Navbar />

        <main className="flex-1 relative z-10">
          {children}
        </main>

        <MobileBottomNav onOpenAuth={() => setAuthModalOpen(true)} />

        {/* Global Footer */}
        <footer className="border-t border-black/[0.06] bg-white/80 backdrop-blur-md mt-20 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-md shadow-[#12544F]/20 border border-amber-400/30">
                    <img
                      src="/logo.png"
                      alt="Watch & Earn Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-black text-lg tracking-tight text-[#111827]">
                    WATCH<span className="text-[#12544F]">&</span><span className="text-[#8BBB92]">EARN</span>
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed max-w-sm font-medium">
                  Verified video task rewards network. Watch assigned YouTube minutes and withdraw real Rupees via <strong>EasyPaisa</strong>, <strong>JazzCash</strong>, and <strong>Bank Transfers</strong>.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">
                  Worker Key Rules
                </h4>
                <ul className="space-y-2 text-xs text-[#64748B] font-medium">
                  <li className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-[#12544F]" />
                    <span>Rate: 1 Minute Watch Time = Rs. 1 PKR</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8BBB92]" />
                    <span>Daily tasks renew at 12:00 AM midnight</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#12544F]" />
                    <span>Progressive cashout: 100 PKR → 200 PKR → 300 PKR</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">
                  Quick Access
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link href="/" className="px-3.5 py-1.5 rounded-xl bg-white border border-black/[0.06] text-[#111827] font-semibold hover:border-[#12544F] transition-colors shadow-sm">
                    Dashboard
                  </Link>
                  <Link href="/tasks" className="px-3.5 py-1.5 rounded-xl bg-white border border-black/[0.06] text-[#111827] font-semibold hover:border-[#12544F] transition-colors shadow-sm">
                    Daily Tasks
                  </Link>
                  <Link href="/wallet" className="px-3.5 py-1.5 rounded-xl bg-white border border-black/[0.06] text-[#111827] font-semibold hover:border-[#12544F] transition-colors shadow-sm">
                    Withdrawal
                  </Link>
                  <Link href="/admin" className="px-3.5 py-1.5 rounded-xl bg-[#12544F]/10 text-[#12544F] font-bold border border-[#12544F]/20">
                    Admin Portal
                  </Link>
                </div>
              </div>

            </div>

            <div className="pt-8 mt-8 border-t border-black/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B] font-medium">
              <p>© {new Date().getFullYear()} Watch & Earn. All rights reserved.</p>
              <p>Supported: EasyPaisa • JazzCash • Bank Transfer</p>
            </div>
          </div>
        </footer>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </body>
    </html>
  );
}
