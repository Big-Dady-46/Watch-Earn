'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Wallet, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Building, 
  Phone, 
  ShieldCheck, 
  History,
  TrendingUp,
  Award,
  LogIn
} from 'lucide-react';
import { 
  getCurrentUser, 
  getWithdrawals, 
  createWithdrawalRequest, 
  getMinimumWithdrawal 
} from '@/lib/storage';
import { UserAccount, WithdrawalRequest, PaymentMethod } from '@/types';
import { sounds } from '@/lib/audio';
import { EasyPaisaLogo, JazzCashLogo, BankLogo } from '@/components/Logos';
import AuthModal from '@/components/AuthModal';

export default function WalletPage() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const [method, setMethod] = useState<PaymentMethod>('easypaisa');
  const [amountPKR, setAmountPKR] = useState<number>(100);
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('Meezan Bank');
  
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    const u = getCurrentUser();
    setUser(u);
    setWithdrawals(getWithdrawals());
    if (u) {
      if (!accountTitle) setAccountTitle(u.name);
      if (!accountNumber && u.phone) setAccountNumber(u.phone);
      const min = getMinimumWithdrawal(u);
      setAmountPKR(min);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('watch-earn-update', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('watch-earn-update', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="ivory-card p-8 bg-white rounded-3xl space-y-4 shadow-sm border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-[#12544F]/10 text-[#12544F] flex items-center justify-center mx-auto">
            <Wallet className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-[#111827]">Worker Account Required</h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
            Please log in or register your worker account to view your balance and submit withdrawal requests to EasyPaisa, JazzCash, or Bank.
          </p>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                sounds.playClick();
                setAuthModalOpen(true);
              }}
              className="px-6 py-3 rounded-xl bg-[#12544F] text-white text-xs font-bold shadow-md hover:bg-[#0E423E] transition-all flex items-center gap-2 hover:scale-105"
            >
              <LogIn className="w-4 h-4" />
              <span>Login / Register Account</span>
            </button>
            <Link
              href="/"
              onClick={() => sounds.playClick()}
              className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  const currentMinRequired = getMinimumWithdrawal(user);
  const currentTier = (user.withdrawalCount || 0) + 1;
  const canWithdraw = user.balancePKR >= currentMinRequired;
  const progressPercent = Math.min(100, Math.round((user.balancePKR / currentMinRequired) * 100));

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (amountPKR < currentMinRequired) {
      sounds.playClick();
      setFeedback({
        type: 'error',
        message: `Tier ${currentTier} minimum withdrawal limit is Rs. ${currentMinRequired} PKR.`
      });
      return;
    }

    if (amountPKR > user.balancePKR) {
      sounds.playClick();
      setFeedback({
        type: 'error',
        message: `Insufficient balance! Your current balance is Rs. ${user.balancePKR} PKR.`
      });
      return;
    }

    if (!accountTitle.trim() || !accountNumber.trim()) {
      sounds.playClick();
      setFeedback({
        type: 'error',
        message: 'Please provide valid account title and number.'
      });
      return;
    }

    setIsSubmitting(true);
    sounds.playClick();

    setTimeout(() => {
      const res = createWithdrawalRequest({
        userId: user.id,
        amountPKR,
        paymentMethod: method,
        accountTitle,
        accountNumber,
        bankName: method === 'bank' ? bankName : undefined,
      });

      setIsSubmitting(false);

      if (res.success) {
        sounds.playCashRegisterSound();
        setFeedback({
          type: 'success',
          message: res.message
        });
      } else {
        sounds.playClick();
        setFeedback({
          type: 'error',
          message: res.message
        });
      }
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
      
      {/* Page Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#8BBB92]/20 border border-[#8BBB92]/40 text-[#12544F] text-xs font-bold uppercase tracking-wider mb-1">
          <Wallet className="w-3.5 h-3.5" />
          <span>Worker Payout Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#111827] tracking-tight leading-snug">
          Withdraw Funds in Pakistani Rupees (PKR)
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] font-medium leading-relaxed">
          Fast cashouts directly to your EasyPaisa, JazzCash, or Bank Account.
        </p>
      </div>

      {/* Wallet Balance & Tier Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Available Balance */}
        <div className="ivory-card p-5 sm:p-6 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Available Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#12544F]/10 text-[#12544F] flex items-center justify-center font-black text-xs">
              Rs
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
              Rs. {user.balancePKR}
            </span>
            <span className="text-xs font-bold text-[#12544F]">PKR</span>
          </div>
          <div className="text-xs text-[#64748B] font-medium">
            Ready to withdraw
          </div>
        </div>

        {/* Current Tier Limit */}
        <div className="ivory-card p-5 sm:p-6 bg-white flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Current Tier Limit
              </span>
              <span className="text-xs font-bold text-[#12544F] bg-[#8BBB92]/20 px-2.5 py-0.5 rounded-md border border-[#8BBB92]/30">
                Tier {currentTier}
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-[#111827]">
                Rs. {user.balancePKR} / {currentMinRequired}
              </span>
              <span className="text-xs font-bold text-[#64748B]">{progressPercent}%</span>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-black/[0.03]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                canWithdraw ? 'bg-[#12544F]' : 'bg-[#8BBB92]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Total Lifetime Earned */}
        <div className="ivory-card p-5 sm:p-6 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Total Lifetime Earned
            </span>
            <TrendingUp className="w-4 h-4 text-[#12544F]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
              Rs. {user.totalEarnedPKR}
            </span>
            <span className="text-xs font-bold text-[#64748B]">PKR</span>
          </div>
          <div className="text-xs text-[#64748B] font-medium leading-tight">
            From verified video watch minutes
          </div>
        </div>

        {/* Total Cashout */}
        <div className="ivory-card p-5 sm:p-6 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Total Withdrawn
            </span>
            <Award className="w-4 h-4 text-[#12544F]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
              Rs. {user.totalWithdrawnPKR}
            </span>
            <span className="text-xs font-bold text-[#64748B]">PKR</span>
          </div>
          <div className="text-xs text-[#12544F] font-semibold">
            {user.withdrawalCount || 0} Successful Payouts
          </div>
        </div>

      </div>

      {/* Form & Progressive Tier Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7">
        
        {/* Form */}
        <div className="lg:col-span-2 ivory-card p-6 sm:p-8 bg-white space-y-6">
          <div className="border-b border-black/[0.05] pb-4">
            <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2.5">
              <Wallet className="w-5 h-5 text-[#12544F]" />
              <span>Submit Cashout Request</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-1 font-medium leading-relaxed">
              Current required limit: <strong>Rs. {currentMinRequired} PKR</strong> (Tier {currentTier}).
            </p>
          </div>

          {feedback && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
              feedback.type === 'success'
                ? 'bg-[#8BBB92]/20 border-[#8BBB92]/40 text-[#12544F] font-bold'
                : 'bg-red-50 border-red-200 text-red-700 font-medium'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#12544F] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-6">
            
            {/* Payment Method Selector with Official Logos */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider">
                1. Select Payout Method:
              </label>
              <div className="grid grid-cols-3 gap-3.5">
                
                {/* EasyPaisa with official vector logo */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMethod('easypaisa');
                  }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2.5 transition-all min-h-[110px] ${
                    method === 'easypaisa'
                      ? 'bg-[#12544F]/5 border-[#12544F] ring-2 ring-[#12544F]/25 text-[#12544F] shadow-sm'
                      : 'bg-white border-black/[0.06] text-[#64748B] hover:bg-slate-50'
                  }`}
                >
                  <EasyPaisaLogo className="w-11 h-11 shadow-xs" />
                  <span className="text-xs font-extrabold text-[#111827]">EasyPaisa</span>
                </button>

                {/* JazzCash with real official logo */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMethod('jazzcash');
                  }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2.5 transition-all min-h-[110px] ${
                    method === 'jazzcash'
                      ? 'bg-[#12544F]/5 border-[#12544F] ring-2 ring-[#12544F]/25 text-[#12544F] shadow-sm'
                      : 'bg-white border-black/[0.06] text-[#64748B] hover:bg-slate-50'
                  }`}
                >
                  <JazzCashLogo className="w-11 h-11 shadow-xs" />
                  <span className="text-xs font-extrabold text-[#111827]">JazzCash</span>
                </button>

                {/* Bank Transfer with official vector logo */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMethod('bank');
                  }}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2.5 transition-all min-h-[110px] ${
                    method === 'bank'
                      ? 'bg-[#12544F]/5 border-[#12544F] ring-2 ring-[#12544F]/25 text-[#12544F] shadow-sm'
                      : 'bg-white border-black/[0.06] text-[#64748B] hover:bg-slate-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-[#12544F]/10 flex items-center justify-center border border-black/[0.06]">
                    <BankLogo className="w-6 h-6 text-[#12544F]" />
                  </div>
                  <span className="text-xs font-extrabold text-[#111827]">Bank Transfer</span>
                </button>

              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  2. Cashout Amount in PKR (Min Rs. {currentMinRequired}):
                </label>
                <span className="text-xs font-bold text-[#12544F]">
                  Available: Rs. {user.balancePKR} PKR
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#64748B]">
                  Rs.
                </span>
                <input
                  type="number"
                  min={currentMinRequired}
                  max={user.balancePKR}
                  value={amountPKR}
                  onChange={(e) => setAmountPKR(Number(e.target.value))}
                  className="w-full pl-12 pr-16 py-3 rounded-xl border border-black/[0.08] text-[#111827] font-bold text-base focus:outline-none focus:border-[#12544F]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B]">
                  PKR
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAmountPKR(currentMinRequired)}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#111827]"
                >
                  Min (Rs. {currentMinRequired})
                </button>
                <button
                  type="button"
                  onClick={() => setAmountPKR(user.balancePKR)}
                  className="px-3 py-1 rounded-lg bg-[#8BBB92]/20 hover:bg-[#8BBB92]/30 text-xs font-bold text-[#12544F]"
                >
                  Max All (Rs. {user.balancePKR})
                </button>
              </div>
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                  Account Title (Full Name):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Ali"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/[0.08] text-[#111827] text-xs sm:text-sm focus:outline-none focus:border-[#12544F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                  {method === 'bank' ? 'IBAN / Account Number:' : `${method === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'} Mobile Number:`}
                </label>
                <input
                  type="text"
                  required
                  placeholder={method === 'bank' ? 'PK00MEZN...' : '03001234567'}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/[0.08] text-[#111827] text-xs sm:text-sm focus:outline-none focus:border-[#12544F]"
                />
              </div>

              {method === 'bank' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-1.5">
                    Select Bank:
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/[0.08] text-[#111827] text-xs sm:text-sm focus:outline-none focus:border-[#12544F]"
                  >
                    <option value="Meezan Bank">Meezan Bank</option>
                    <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
                    <option value="United Bank Limited (UBL)">United Bank Limited (UBL)</option>
                    <option value="Allied Bank Limited (ABL)">Allied Bank Limited (ABL)</option>
                    <option value="MCB Bank">MCB Bank</option>
                    <option value="Bank Alfalah">Bank Alfalah</option>
                    <option value="SadaPay">SadaPay</option>
                    <option value="NayaPay">NayaPay</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !canWithdraw}
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                canWithdraw
                  ? 'bg-[#12544F] hover:bg-[#0E423E] text-white shadow-[#12544F]/20 hover:scale-[1.01]'
                  : 'bg-slate-100 text-[#94A3B8] border border-slate-200 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span>Submitting to Admin...</span>
              ) : canWithdraw ? (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Request Cashout (Rs. {amountPKR} PKR)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Need Rs. {currentMinRequired - user.balancePKR} more for Tier {currentTier}</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Tier Explanation */}
        <div className="space-y-6">
          <div className="ivory-card p-6 bg-white space-y-4">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#12544F]" />
              <span>Progressive Tier System</span>
            </h3>
            
            <p className="text-xs text-[#64748B] leading-relaxed font-medium">
              Each time you successfully cashout, the minimum threshold for your next withdrawal advances by <strong>Rs. 100 PKR</strong>:
            </p>

            <div className="space-y-2 pt-1 text-xs font-medium">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                currentTier === 1 ? 'bg-[#8BBB92]/20 border-[#8BBB92]/50 font-bold text-[#12544F]' : 'bg-[#F8F9F8] border-black/[0.04] text-[#64748B]'
              }`}>
                <span>1st Cashout (Tier 1)</span>
                <span>Min Rs. 100 PKR</span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                currentTier === 2 ? 'bg-[#8BBB92]/20 border-[#8BBB92]/50 font-bold text-[#12544F]' : 'bg-[#F8F9F8] border-black/[0.04] text-[#64748B]'
              }`}>
                <span>2nd Cashout (Tier 2)</span>
                <span>Min Rs. 200 PKR</span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                currentTier === 3 ? 'bg-[#8BBB92]/20 border-[#8BBB92]/50 font-bold text-[#12544F]' : 'bg-[#F8F9F8] border-black/[0.04] text-[#64748B]'
              }`}>
                <span>3rd Cashout (Tier 3)</span>
                <span>Min Rs. 300 PKR</span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                currentTier >= 4 ? 'bg-[#8BBB92]/20 border-[#8BBB92]/50 font-bold text-[#12544F]' : 'bg-[#F8F9F8] border-black/[0.04] text-[#64748B]'
              }`}>
                <span>Tier {currentTier >= 4 ? currentTier : 4}+</span>
                <span>+Rs. 100 Each Time</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-[#64748B] flex items-start gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#12544F] shrink-0 mt-0.5" />
              <span>Admin receives an instant notification upon submission and verifies payments within 24 hours.</span>
            </div>
          </div>
        </div>

      </div>

      {/* History Table */}
      <div className="ivory-card p-6 sm:p-8 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.04] pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#12544F]" />
            <h3 className="text-base font-bold text-[#111827]">Withdrawal History & Status</h3>
          </div>
          <span className="text-xs text-[#64748B] font-medium">
            {withdrawals.length} Total Records
          </span>
        </div>

        {withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-black/[0.04] text-[11px] text-[#64748B] uppercase tracking-wider font-bold">
                  <th className="pb-3 pl-2">ID</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Account Details</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-[#111827]">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-[#F8F9F8] transition-colors">
                    <td className="py-3.5 pl-2 font-mono text-xs text-[#64748B]">
                      {w.id}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F9F8] border border-black/[0.04] text-xs font-bold capitalize text-[#111827]">
                        {w.paymentMethod === 'easypaisa' && <EasyPaisaLogo className="w-4 h-4 rounded-full shrink-0" />}
                        {w.paymentMethod === 'jazzcash' && <JazzCashLogo className="w-4 h-4 rounded-full shrink-0" />}
                        {w.paymentMethod === 'bank' && <BankLogo className="w-4 h-4 text-[#12544F] shrink-0" />}
                        <span>{w.paymentMethod}</span>
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-[#111827]">{w.accountTitle}</div>
                      <div className="text-xs text-[#64748B] font-mono">{w.accountNumber}</div>
                    </td>
                    <td className="py-3.5 font-black text-[#12544F]">
                      Rs. {w.amountPKR} PKR
                    </td>
                    <td className="py-3.5">
                      {w.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8BBB92]/25 text-[#12544F] text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved
                        </span>
                      ) : w.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Review
                        </span>
                      )}
                      {w.note && (
                        <div className="text-[11px] text-[#64748B] mt-0.5 italic">
                          {w.note}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 text-xs text-[#64748B]">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-[#64748B] text-xs">
            No withdrawal requests submitted yet.
          </div>
        )}

      </div>

    </div>
  );
}
