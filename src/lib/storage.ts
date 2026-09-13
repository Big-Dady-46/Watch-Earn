import { UserAccount, VideoTask, WithdrawalRequest, AdminNotification, PaymentMethod } from '@/types';
import { getYouTubeThumbnail, calculateRewardPKR } from './youtube';

const STORAGE_KEYS = {
  USERS: 'we_prod_users_v1',
  CURRENT_USER: 'we_prod_current_user_v1',
  TASKS: 'we_prod_tasks_v1',
  WITHDRAWALS: 'we_prod_withdrawals_v1',
  NOTIFICATIONS: 'we_prod_notifications_v1',
  LAST_RESET_DATE: 'we_prod_last_reset_v1',
};

// Automatic one-time purge of all previous dummy/test data stored in browser localStorage
if (typeof window !== 'undefined') {
  const legacyKeys = [
    'we_users_v2',
    'we_tasks_v2',
    'we_withdrawals_v2',
    'we_notifications_v2',
    'we_current_user_id',
    'we_last_reset_date',
    'we_users',
    'we_tasks',
    'we_withdrawals',
    'we_notifications',
    'watch_earn_tasks',
    'watch_earn_user',
    'we_user_profile',
    'we_daily_spin',
  ];
  legacyKeys.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
}

// Clean production launch state - strictly 0 dummy videos, 0 withdrawals, 0 initial balance
export const DEFAULT_TASKS: VideoTask[] = [];

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'admin-root',
    name: 'Platform Administrator',
    email: 'admin@watchandearn.pk',
    phone: '03000000000',
    password: 'admin',
    balancePKR: 0,
    totalEarnedPKR: 0,
    totalWithdrawnPKR: 0,
    withdrawalCount: 0,
    completedTasksToday: [],
    taskHistory: [],
    createdAt: new Date().toISOString(),
    role: 'admin',
  },
];

export const DEFAULT_WITHDRAWALS: WithdrawalRequest[] = [];

export const DEFAULT_NOTIFICATIONS: AdminNotification[] = [];

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('watch-earn-update'));
  }
}

// ----------------- MIDNIGHT RESET ENGINE -----------------
function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function checkAndRunMidnightRefresh() {
  if (typeof window === 'undefined') return;
  const today = getTodayDateString();
  const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);

  if (lastReset !== today) {
    // Midnight has passed! Reset daily completed tasks for all users
    const users = getAllUsers();
    const updated = users.map((u) => ({
      ...u,
      completedTasksToday: [],
    }));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, today);
    notifyChange();
  }
}

// ----------------- USER AUTH & RECORDS -----------------
export function getAllUsers(): UserAccount[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
}

export function getCurrentUser(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!currentId) return null;
    const users = getAllUsers();
    return users.find((u) => u.id === currentId) || null;
  } catch {
    return null;
  }
}

export function saveUser(user: UserAccount) {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    notifyChange();
  }
}

export function registerUser(name: string, email: string, phone: string, password: string): { success: boolean; message: string; user?: UserAccount } {
  const users = getAllUsers();
  const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
  const cleanEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'This email is already registered. Please login.' };
  }
  if (users.some((u) => u.phone.replace(/[^0-9]/g, '') === cleanPhone)) {
    return { success: false, message: 'This mobile number is already registered. Please login.' };
  }

  const newUser: UserAccount = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    password,
    balancePKR: 0,
    totalEarnedPKR: 0,
    totalWithdrawnPKR: 0,
    withdrawalCount: 0,
    completedTasksToday: [],
    taskHistory: [],
    createdAt: new Date().toISOString(),
    role: 'user',
  };

  users.push(newUser);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, newUser.id);
    notifyChange();
  }

  createAdminNotification({
    type: 'new_user',
    title: 'New User Registered',
    message: `${newUser.name} (${newUser.phone}) joined Watch & Earn.`,
  });

  return { success: true, message: 'Account created successfully!', user: newUser };
}

export function loginUser(emailOrPhone: string, password: string): { success: boolean; message: string; user?: UserAccount } {
  const users = getAllUsers();
  const query = emailOrPhone.trim().toLowerCase();
  const queryCleanPhone = query.replace(/[^0-9]/g, '');

  const user = users.find(
    (u) =>
      (u.email.toLowerCase() === query || (queryCleanPhone && u.phone.replace(/[^0-9]/g, '') === queryCleanPhone)) &&
      (!u.password || u.password === password)
  );

  if (!user) {
    return { success: false, message: 'Invalid email/phone or password.' };
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.id);
    notifyChange();
  }

  return { success: true, message: `Welcome back, ${user.name}!`, user };
}

export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    notifyChange();
  }
}

// ----------------- TASKS ENGINE (1 Minute = 1 PKR) -----------------
export function getTasks(): VideoTask[] {
  if (typeof window === 'undefined') return DEFAULT_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
      return DEFAULT_TASKS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TASKS;
  }
}

export function getTaskById(id: string): VideoTask | null {
  const tasks = getTasks();
  return tasks.find((t) => t.id === id) || null;
}

export function addTask(taskData: {
  youtubeId: string;
  title: string;
  description: string;
  durationMinutes: number;
  durationSeconds: number;
  category: string;
  channelName: string;
}): VideoTask {
  const tasks = getTasks();
  // 1 Minute = 1 PKR
  const rewardPKR = calculateRewardPKR(taskData.durationMinutes);

  const newTask: VideoTask = {
    id: `task-${Date.now()}`,
    youtubeId: taskData.youtubeId,
    title: taskData.title,
    description: taskData.description,
    durationMinutes: taskData.durationMinutes,
    durationSeconds: taskData.durationSeconds,
    rewardPKR,
    category: taskData.category,
    channelName: taskData.channelName,
    thumbnailUrl: getYouTubeThumbnail(taskData.youtubeId, 'hq'),
    active: true,
    createdAt: new Date().toISOString(),
  };

  const updated = [newTask, ...tasks];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    notifyChange();
  }
  return newTask;
}

export function deleteTask(id: string): boolean {
  const tasks = getTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
    notifyChange();
  }
  return true;
}

export function toggleTaskStatus(id: string): boolean {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  tasks[idx].active = !tasks[idx].active;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    notifyChange();
  }
  return true;
}

// Complete a video task: Credit user account with PKR
export function completeVideoTask(userId: string, task: VideoTask): { success: boolean; earnedPKR: number } {
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return { success: false, earnedPKR: 0 };

  // Check if already completed today
  if (user.completedTasksToday.includes(task.id)) {
    return { success: false, earnedPKR: 0 };
  }

  user.balancePKR += task.rewardPKR;
  user.totalEarnedPKR += task.rewardPKR;
  user.completedTasksToday.push(task.id);
  user.taskHistory.unshift({
    taskId: task.id,
    videoTitle: task.title,
    minutesWatched: task.durationMinutes,
    earnedPKR: task.rewardPKR,
    completedAt: new Date().toISOString(),
  });

  saveUser(user);

  createAdminNotification({
    type: 'task_completed',
    title: 'Task Completed',
    message: `${user.name} completed "${task.title}" and earned Rs. ${task.rewardPKR} PKR.`,
    amountPKR: task.rewardPKR,
  });

  return { success: true, earnedPKR: task.rewardPKR };
}

// ----------------- PROGRESSIVE WITHDRAWAL ENGINE -----------------
/**
 * Calculates current minimum withdrawal required for user:
 * 1st Withdrawal: Rs. 100
 * 2nd Withdrawal: Rs. 200
 * 3rd Withdrawal: Rs. 300
 * Formula: 100 + (withdrawalCount * 100)
 */
export function getMinimumWithdrawal(user: UserAccount | null): number {
  if (!user) return 100;
  return 100 + ((user.withdrawalCount || 0) * 100);
}

export function getWithdrawals(): WithdrawalRequest[] {
  if (typeof window === 'undefined') return DEFAULT_WITHDRAWALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(DEFAULT_WITHDRAWALS));
      return DEFAULT_WITHDRAWALS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_WITHDRAWALS;
  }
}

export function createWithdrawalRequest(params: {
  userId: string;
  amountPKR: number;
  paymentMethod: PaymentMethod;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
}): { success: boolean; message: string; withdrawal?: WithdrawalRequest } {
  const users = getAllUsers();
  const user = users.find((u) => u.id === params.userId);
  if (!user) {
    return { success: false, message: 'Please log in to submit a withdrawal request.' };
  }

  const minRequired = getMinimumWithdrawal(user);
  if (params.amountPKR < minRequired) {
    return {
      success: false,
      message: `Minimum withdrawal for Tier ${user.withdrawalCount + 1} is Rs. ${minRequired} PKR. You entered Rs. ${params.amountPKR}.`,
    };
  }

  if (user.balancePKR < params.amountPKR) {
    return {
      success: false,
      message: `Insufficient balance! Your current balance is Rs. ${user.balancePKR} PKR.`,
    };
  }

  // Deduct from user's current balance
  user.balancePKR -= params.amountPKR;
  saveUser(user);

  const tierLevel = user.withdrawalCount + 1;

  const newWithdrawal: WithdrawalRequest = {
    id: `w-${Date.now()}`,
    userId: user.id,
    userName: params.accountTitle,
    userPhone: user.phone,
    amountPKR: params.amountPKR,
    paymentMethod: params.paymentMethod,
    accountTitle: params.accountTitle,
    accountNumber: params.accountNumber,
    bankName: params.bankName,
    status: 'pending',
    createdAt: new Date().toISOString(),
    tierLevel,
    note: `Tier ${tierLevel} Cashout Request`,
  };

  const list = getWithdrawals();
  const updated = [newWithdrawal, ...list];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(updated));
  }

  // Send High Priority Notification to Admin
  createAdminNotification({
    type: 'withdrawal',
    title: `🚨 Withdrawal Request: Rs. ${params.amountPKR} PKR`,
    message: `${user.name} submitted a Rs. ${params.amountPKR} PKR cashout via ${params.paymentMethod.toUpperCase()} (${params.accountNumber}).`,
    amountPKR: params.amountPKR,
  });

  notifyChange();
  return {
    success: true,
    message: `Withdrawal of Rs. ${params.amountPKR} PKR submitted! Admin will verify and transfer within 24 hours.`,
    withdrawal: newWithdrawal,
  };
}

export function updateWithdrawalStatus(id: string, status: 'approved' | 'rejected', note?: string): boolean {
  const list = getWithdrawals();
  const idx = list.findIndex((w) => w.id === id);
  if (idx === -1) return false;

  const item = list[idx];
  const users = getAllUsers();
  const user = users.find((u) => u.id === item.userId);

  if (status === 'approved' && item.status !== 'approved') {
    if (user) {
      user.totalWithdrawnPKR += item.amountPKR;
      // Advance to next progressive tier level!
      user.withdrawalCount = (user.withdrawalCount || 0) + 1;
      saveUser(user);
    }
  } else if (status === 'rejected' && item.status !== 'rejected') {
    // Refund PKR back to user
    if (user) {
      user.balancePKR += item.amountPKR;
      saveUser(user);
    }
  }

  list[idx] = {
    ...item,
    status,
    note: note || (status === 'approved' ? 'Payment sent successfully' : 'Request rejected by admin'),
    processedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(list));
    notifyChange();
  }
  return true;
}

// ----------------- ADMIN NOTIFICATIONS -----------------
export function getAdminNotifications(): AdminNotification[] {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

export function createAdminNotification(data: Omit<AdminNotification, 'id' | 'read' | 'timestamp'>) {
  const list = getAdminNotifications();
  const newNotif: AdminNotification = {
    ...data,
    id: `notif-${Date.now()}`,
    read: false,
    timestamp: new Date().toISOString(),
  };
  const updated = [newNotif, ...list];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    notifyChange();
  }
}

export function markAllNotificationsRead() {
  const list = getAdminNotifications();
  const updated = list.map((n) => ({ ...n, read: true }));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    notifyChange();
  }
}

// ----------------- BONUS & COMPATIBILITY HELPERS (PKR) -----------------
export function getUserProfile() {
  const u = getCurrentUser();
  if (!u) {
    return {
      id: 'guest',
      name: 'Guest Worker',
      email: 'guest@watchandearn.pk',
      coinsBalance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      watchedVideoIds: [],
      referralCode: 'EARN100',
      referralsCount: 0,
      joinedAt: new Date().toISOString(),
    };
  }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    coinsBalance: u.balancePKR,
    totalEarned: u.totalEarnedPKR,
    totalWithdrawn: u.totalWithdrawnPKR,
    watchedVideoIds: u.completedTasksToday,
    referralCode: u.phone ? `REF${u.phone.slice(-4)}` : 'EARN100',
    referralsCount: 0,
    joinedAt: u.createdAt,
    lastSpinDate: (u as any).lastSpinDate,
  };
}

export function saveUserProfile(profile: any) {
  const u = getCurrentUser();
  if (u) {
    (u as any).lastSpinDate = profile.lastSpinDate;
    saveUser(u);
  }
}

export function creditCoins(amountPKR: number, reason: string) {
  const u = getCurrentUser();
  if (u) {
    u.balancePKR += amountPKR;
    u.totalEarnedPKR += amountPKR;
    saveUser(u);
  }
}

export function getLeaderboard() {
  const users = getAllUsers().filter((u) => u.role !== 'admin');
  if (users.length === 0) return [];
  return users
    .sort((a, b) => b.totalEarnedPKR - a.totalEarnedPKR)
    .map((u, idx) => ({
      rank: idx + 1,
      name: u.name,
      avatar: idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🌟',
      coins: u.balancePKR,
      videosWatched: u.taskHistory?.length || 0,
      isCurrentUser: false,
    }));
}

// ----------------- RESET STORAGE -----------------
export function resetStorage() {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    notifyChange();
  }
}
