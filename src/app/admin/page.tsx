'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Tv, 
  Coins, 
  Clock, 
  RotateCcw, 
  Lock, 
  Unlock,
  Bell,
  Users,
  Award,
  Sparkles,
  ExternalLink,
  Layers,
  Plus,
  Tag,
  RefreshCw
} from 'lucide-react';
import { 
  getTasks, 
  addTask, 
  deleteTask, 
  toggleTaskStatus, 
  getWithdrawals, 
  updateWithdrawalStatus, 
  getAllUsers, 
  getAdminNotifications, 
  markAllNotificationsRead,
  resetStorage,
  getCategories,
  addCategory,
  deleteCategory,
  syncWithCloud
} from '@/lib/storage';
import { VideoTask, WithdrawalRequest, UserAccount, AdminNotification } from '@/types';
import { extractYouTubeId, getYouTubeThumbnail, calculateRewardPKR, fetchYouTubeOEmbed } from '@/lib/youtube';
import { sounds } from '@/lib/audio';
import { YouTubeLogo, EasyPaisaLogo, JazzCashLogo, BankLogo } from '@/components/Logos';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<'tasks' | 'withdrawals' | 'users' | 'notifications'>('withdrawals');

  // Core Data
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  // Category Management State
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // 1-Click Add Task Form State
  const [videoUrl, setVideoUrl] = useState('');
  const [detectedId, setDetectedId] = useState<string | null>(null);
  const [autoTitle, setAutoTitle] = useState('');
  const [autoChannel, setAutoChannel] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(3);
  const [category, setCategory] = useState('Technology');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const loadData = () => {
    setTasks(getTasks());
    setWithdrawals(getWithdrawals());
    setUsers(getAllUsers());
    setNotifications(getAdminNotifications());
    const cats = getCategories();
    setCategories(cats);
    if (cats.length > 0 && (!category || !cats.includes(category))) {
      setCategory(cats[0]);
    }
  };

  useEffect(() => {
    const session = sessionStorage.getItem('we_admin_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
    loadData();
    syncWithCloud().then(() => loadData());

    // Real-time auto-polling every 4 seconds in Admin Portal
    const pollInterval = setInterval(() => {
      syncWithCloud().then(() => loadData());
    }, 4000);

    window.addEventListener('watch-earn-update', loadData);
    return () => {
      window.removeEventListener('watch-earn-update', loadData);
      clearInterval(pollInterval);
    };
  }, []);

  // When admin pastes a YouTube URL, analyze it automatically!
  useEffect(() => {
    const id = extractYouTubeId(videoUrl);
    setDetectedId(id);

    if (id) {
      setIsAnalyzing(true);
      fetchYouTubeOEmbed(id).then((info) => {
        setIsAnalyzing(false);
        if (info) {
          if (!autoTitle) setAutoTitle(info.title);
          if (!autoChannel) setAutoChannel(info.author_name);
        }
      });
    }
  }, [videoUrl]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === 'admin123' || pinInput === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('we_admin_auth', 'true');
      setPinError(false);
      sounds.playCashRegisterSound();
    } else {
      setPinError(true);
      sounds.playClick();
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('we_admin_auth');
    setPinInput('');
  };

  const handleAddCategorySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newCategoryInput.trim();
    if (!clean) return;
    const updated = addCategory(clean);
    setCategories(updated);
    setCategory(clean);
    setNewCategoryInput('');
    sounds.playClick();
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      alert('At least one category must exist!');
      return;
    }
    const updated = deleteCategory(catToDelete);
    setCategories(updated);
    if (category.toLowerCase() === catToDelete.toLowerCase()) {
      setCategory(updated[0] || 'General');
    }
    sounds.playClick();
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detectedId) {
      alert('Please enter a valid YouTube video link!');
      return;
    }

    const calculatedReward = calculateRewardPKR(durationMinutes);
    const durationSec = durationMinutes * 60;

    addTask({
      youtubeId: detectedId,
      title: autoTitle || 'Daily YouTube Watch Task',
      description: `Watch this full video (${durationMinutes} minutes) to verify your watch time and claim Rs. ${calculatedReward} PKR.`,
      durationMinutes,
      durationSeconds: durationSec,
      category,
      channelName: autoChannel || 'YouTube Creator',
    });

    sounds.playCashRegisterSound();
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 3000);

    // Reset Form
    setVideoUrl('');
    setDetectedId(null);
    setAutoTitle('');
    setAutoChannel('');
    setDurationMinutes(3);
  };

  const handleApprovePayout = (id: string) => {
    const ref = prompt('Optional: Enter Transaction Reference (TRX ID):', `TRX-${Date.now().toString().slice(-6)}`);
    updateWithdrawalStatus(id, 'approved', ref ? `Paid via TRX# ${ref}` : 'Payment Approved & Dispatched');
    sounds.playCashRegisterSound();
  };

  const handleRejectPayout = (id: string) => {
    const reason = prompt('Enter rejection reason (Funds will be refunded to user):', 'Incorrect Account Details / Verification issue');
    if (reason !== null) {
      updateWithdrawalStatus(id, 'rejected', reason || 'Request rejected by admin');
      sounds.playClick();
    }
  };

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="white-card p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900">Admin Control Portal</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter secure administrator PIN to manage video tasks, verify payouts, and view records.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter Master PIN"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-slate-900 font-mono text-lg focus:outline-none focus:border-emerald-500"
              autoFocus
            />

            {pinError && (
              <p className="text-xs text-red-600 font-bold">
                Access Denied! Incorrect security PIN entered.
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all"
            >
              Enter Admin Portal
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            Authorized administrative personnel only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Frontend Admin Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Platform Management & Notification Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add YouTube tasks with auto-calculated duration, approve user withdrawals, and manage worker accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={async () => {
              setIsSyncingCloud(true);
              sounds.playClick();
              await syncWithCloud();
              loadData();
              setTimeout(() => setIsSyncingCloud(false), 800);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 transition-all shadow-xs"
            title="Sync latest live workers, tasks, and withdrawals from cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingCloud ? 'animate-spin' : ''}`} />
            <span>{isSyncingCloud ? 'Syncing...' : 'Live Cloud Sync'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all data and start completely fresh for launch?')) {
                resetStorage();
                sounds.playClick();
                window.location.reload();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-xs text-slate-600 hover:text-red-700 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Wipe Data (Fresh Launch)</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs text-red-700 font-bold flex items-center gap-1.5"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('withdrawals');
            syncWithCloud().then(() => loadData());
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'withdrawals'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Withdrawals ({withdrawals.length})</span>
          {pendingWithdrawalsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
              {pendingWithdrawalsCount} New
            </span>
          )}
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('tasks');
            syncWithCloud().then(() => loadData());
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Video Tasks ({tasks.length})</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('users');
            syncWithCloud().then(() => loadData());
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Workers Directory ({users.length})</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('notifications');
            syncWithCloud().then(() => loadData());
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'notifications'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
          {unreadNotifsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
              {unreadNotifsCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: WITHDRAWALS APPROVAL */}
      {activeTab === 'withdrawals' && (
        <div className="white-card rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Worker Cashout Requests (Progressive Limit Monitored)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Approve valid EasyPaisa, JazzCash, or Bank payouts. Approving automatically advances the user to the next progressive tier.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold">
                {pendingWithdrawalsCount} Pending Review
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{w.id}</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-[#111827] font-bold text-xs capitalize border border-black/[0.05]">
                      {w.paymentMethod === 'easypaisa' && <EasyPaisaLogo className="w-3.5 h-3.5 rounded-full shrink-0" />}
                      {w.paymentMethod === 'jazzcash' && <JazzCashLogo className="w-3.5 h-3.5 rounded-full shrink-0" />}
                      {w.paymentMethod === 'bank' && <BankLogo className="w-3.5 h-3.5 text-[#12544F] shrink-0" />}
                      <span>{w.paymentMethod}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                      Tier {w.tierLevel} Cashout
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(w.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-base font-black text-slate-900">
                      {w.accountTitle}
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded">
                      {w.accountNumber}
                    </span>
                    {w.bankName && (
                      <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {w.bankName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Requested Amount:</span>
                    <span className="text-base font-black text-emerald-600">
                      Rs. {w.amountPKR} PKR
                    </span>
                    {w.userPhone && (
                      <span className="text-slate-400">
                        • Worker Mobile: {w.userPhone}
                      </span>
                    )}
                  </div>

                  {w.note && (
                    <div className="text-xs text-slate-500 italic mt-1">
                      Note: {w.note}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {w.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprovePayout(w.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Mark Paid</span>
                      </button>

                      <button
                        onClick={() => handleRejectPayout(w.id)}
                        className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : w.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approved & Dispatched</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-100 text-red-700 text-xs font-bold">
                      <XCircle className="w-4 h-4" />
                      <span>Rejected (Refunded)</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VIDEO TASKS & 1-CLICK LINK ADD */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 1 Col: 1-Click Task Input Form */}
          <div className="white-card p-6 rounded-3xl border border-slate-200 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>1-Click Add Daily Task</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Paste YouTube link below. The system automatically fetches metadata and calculates 1 PKR/minute!
              </p>
            </div>

            {addSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Task published to daily worker feed!</span>
              </div>
            )}

            <form onSubmit={handleAddTask} className="space-y-4">
              
              {/* YouTube Link */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <YouTubeLogo className="w-4 h-4 shrink-0" />
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Paste YouTube Video Link:
                  </label>
                </div>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or Shorts"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Auto Preview Thumbnail & Info */}
              {detectedId && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-700">Video ID: {detectedId}</span>
                    {isAnalyzing && <span className="text-slate-400 animate-pulse">Analyzing...</span>}
                  </div>
                  <img
                    src={getYouTubeThumbnail(detectedId, 'mq')}
                    alt="Preview"
                    className="w-full aspect-video rounded-lg object-cover"
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Video Task Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Auto detected or custom title"
                  value={autoTitle}
                  onChange={(e) => setAutoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Channel */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Channel Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Creator Channel"
                  value={autoChannel}
                  onChange={(e) => setAutoChannel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Duration in Minutes with Automatic PKR Reward Calculation */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Watch Minutes:
                  </label>
                  <span className="text-xs font-black text-emerald-700">
                    Reward: Rs. {calculateRewardPKR(durationMinutes)} PKR
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500">
                  ⚡ 1 Minute = Rs. 1 PKR automatically calculated.
                </p>
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Category:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddCategory ? 'Close' : '+ Add New Category'}</span>
                  </button>
                </div>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Inline Category Adder & Manager */}
                {showAddCategory && (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Create New Category</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Auto-saved</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Islamic, News, Sports, Vlogs..."
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategorySubmit();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCategorySubmit()}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all shrink-0"
                      >
                        Add
                      </button>
                    </div>

                    {/* Active Categories Badges */}
                    <div className="pt-1">
                      <div className="text-[10px] text-slate-500 font-semibold mb-1">Active Categories:</div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {categories.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700"
                          >
                            <span>{c}</span>
                            {categories.length > 1 && (
                              <button
                                type="button"
                                title={`Delete category ${c}`}
                                onClick={() => handleDeleteCategory(c)}
                                className="text-slate-400 hover:text-red-600 ml-0.5 text-xs font-bold leading-none"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
              >
                + Publish Daily Task (Rs. {calculateRewardPKR(durationMinutes)} PKR)
              </button>

            </form>
          </div>

          {/* Right 2 Cols: Manage Existing Tasks */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Active Daily Tasks Feed ({tasks.length})
              </h3>
              <span className="text-xs text-slate-400">
                Workers complete these tasks daily to earn PKR.
              </span>
            </div>

            <div className="space-y-3">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl white-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={t.thumbnailUrl}
                      alt={t.title}
                      className="w-20 h-14 object-cover rounded-xl bg-slate-100 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t.category}
                        </span>
                        <span className="text-xs text-slate-500">{t.channelName}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mt-1">
                        {t.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="font-black text-emerald-600">
                          Rs. {t.rewardPKR} PKR
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {t.durationMinutes} Minutes
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => toggleTaskStatus(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        t.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.active ? 'Active' : 'Paused'}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Delete this video task?')) {
                          deleteTask(t.id);
                          sounds.playClick();
                        }
                      }}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: REGISTERED WORKERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="white-card rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Registered Workers Directory & Earnings
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete record of worker accounts, current balances, and withdrawal history.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {users.length} Registered Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 pl-2">Worker</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Balance</th>
                  <th className="pb-3">Total Earned</th>
                  <th className="pb-3">Withdrawn</th>
                  <th className="pb-3">Tier Limit</th>
                  <th className="pb-3">Tasks Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-slate-900">
                      {u.name}
                      {u.role === 'admin' && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-white font-bold">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <div className="font-mono text-xs text-slate-900">{u.phone}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 font-black text-emerald-600">
                      Rs. {u.balancePKR} PKR
                    </td>
                    <td className="py-3.5 font-bold text-slate-800">
                      Rs. {u.totalEarnedPKR} PKR
                    </td>
                    <td className="py-3.5 font-bold text-slate-800">
                      Rs. {u.totalWithdrawnPKR} PKR ({u.withdrawalCount || 0}x)
                    </td>
                    <td className="py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
                        Tier {(u.withdrawalCount || 0) + 1} (Rs. {100 + ((u.withdrawalCount || 0) * 100)})
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-600">
                      {u.completedTasksToday?.length || 0} completed
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS CENTER */}
      {activeTab === 'notifications' && (
        <div className="white-card rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <span>Real-Time Admin Notifications</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Withdrawal alerts, new worker registrations, and task milestones.
              </p>
            </div>

            <button
              onClick={() => {
                markAllNotificationsRead();
                sounds.playClick();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
            >
              Mark All Read
            </button>
          </div>

          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  n.read
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-emerald-50/50 border-emerald-200 shadow-sm'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {new Date(n.timestamp).toLocaleString()}
                  </span>
                </div>

                {n.amountPKR && (
                  <span className="text-sm font-black text-emerald-600 shrink-0">
                    Rs. {n.amountPKR} PKR
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
