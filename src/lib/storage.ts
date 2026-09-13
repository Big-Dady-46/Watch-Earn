import { UserAccount, VideoTask, WithdrawalRequest, AdminNotification, PaymentMethod } from '@/types';
import { getYouTubeThumbnail, calculateRewardPKR } from './youtube';

const STORAGE_KEYS = {
  USERS: 'we_prod_users_v1',
  CURRENT_USER: 'we_prod_current_user_v1',
  TASKS: 'we_prod_tasks_v1',
  WITHDRAWALS: 'we_prod_withdrawals_v1',
  NOTIFICATIONS: 'we_prod_notifications_v1',
  LAST_RESET_DATE: 'we_prod_last_reset_v1',
  CATEGORIES: 'we_prod_categories_v1',
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

export function normalizePhone(input?: string): string {
  if (!input) return '';
  let digits = input.replace(/[^0-9]/g, '');
  if (digits.startsWith('92') && digits.length === 12) {
    digits = '0' + digits.substring(2);
  } else if (digits.startsWith('0092') && digits.length === 14) {
    digits = '0' + digits.substring(4);
  } else if (digits.length === 10 && digits.startsWith('3')) {
    digits = '0' + digits;
  }
  return digits;
}

// ----------------- REAL-TIME CLOUD SYNCHRONIZATION -----------------
let isSyncing = false;

export async function syncWithCloud(): Promise<void> {
  if (typeof window === 'undefined' || isSyncing) return;
  isSyncing = true;
  try {
    // 1. Sync Tasks from Cloud (Merge & Re-hydrate, NEVER wipe)
    const tasksRes = await fetch('/api/tasks', { cache: 'no-store' });
    if (tasksRes.ok) {
      const data = await tasksRes.json();
      const localTasks = getTasks();
      if (Array.isArray(data.tasks)) {
        if (data.tasks.length > 0) {
          const mergedTasks = [...data.tasks];
          let rehydrated = false;
          for (const lt of localTasks) {
            if (!mergedTasks.some((t) => t.id === lt.id)) {
              mergedTasks.push(lt);
              rehydrated = true;
            }
          }
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(mergedTasks));
          if (rehydrated) {
            fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'bulk_sync', tasks: mergedTasks }),
            }).catch(() => {});
          }
        } else if (localTasks.length > 0) {
          // Cloud empty, re-hydrate from local
          fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'bulk_sync', tasks: localTasks }),
          }).catch(() => {});
        }
      }
    }

    // 2. Sync Workers Directory from Cloud (Preserve local passwords and balances)
    const usersRes = await fetch('/api/users', { cache: 'no-store' });
    if (usersRes.ok) {
      const data = await usersRes.json();
      const localUsers = getAllUsers();
      if (Array.isArray(data.users)) {
        if (data.users.length > 0) {
          const merged = [...localUsers];
          for (const cu of data.users) {
            const idx = merged.findIndex(
              (u) => u.id === cu.id || (u.phone && cu.phone && normalizePhone(u.phone) === normalizePhone(cu.phone))
            );
            if (idx >= 0) {
              merged[idx] = {
                ...merged[idx],
                ...cu,
                password: merged[idx].password || cu.password || '',
                balancePKR: Math.max(merged[idx].balancePKR || 0, cu.balancePKR || 0),
                totalEarnedPKR: Math.max(merged[idx].totalEarnedPKR || 0, cu.totalEarnedPKR || 0),
                taskHistory:
                  (merged[idx].taskHistory?.length || 0) >= (cu.taskHistory?.length || 0)
                    ? merged[idx].taskHistory
                    : cu.taskHistory,
                completedTasksToday:
                  (merged[idx].completedTasksToday?.length || 0) >= (cu.completedTasksToday?.length || 0)
                    ? merged[idx].completedTasksToday
                    : cu.completedTasksToday,
              };
            } else {
              merged.push(cu);
            }
          }
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
        } else if (localUsers.length > 0) {
          fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'bulk_sync', users: localUsers }),
          }).catch(() => {});
        }
      }
    }

    // 3. Sync Withdrawals from Cloud (Merge & Re-hydrate)
    const withRes = await fetch('/api/withdrawals', { cache: 'no-store' });
    if (withRes.ok) {
      const data = await withRes.json();
      const localWiths = getWithdrawals();
      if (Array.isArray(data.withdrawals)) {
        if (data.withdrawals.length > 0) {
          const mergedWiths = [...data.withdrawals];
          let rehydrated = false;
          for (const lw of localWiths) {
            if (!mergedWiths.some((w) => w.id === lw.id)) {
              mergedWiths.push(lw);
              rehydrated = true;
            }
          }
          localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(mergedWiths));
          if (rehydrated) {
            fetch('/api/withdrawals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'bulk_sync', withdrawals: mergedWiths }),
            }).catch(() => {});
          }
        } else if (localWiths.length > 0) {
          fetch('/api/withdrawals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'bulk_sync', withdrawals: localWiths }),
          }).catch(() => {});
        }
      }
    }

    // 4. Sync Categories from Cloud
    const catRes = await fetch('/api/categories', { cache: 'no-store' });
    if (catRes.ok) {
      const data = await catRes.json();
      const localCats = getCategories();
      if (Array.isArray(data.categories)) {
        if (data.categories.length > 0) {
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
        } else if (localCats.length > 0) {
          fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'bulk_sync', categories: localCats }),
          }).catch(() => {});
        }
      }
    }

    notifyChange();
  } catch (err) {
    console.warn('[Sync] Cloud sync error:', err);
  } finally {
    isSyncing = false;
  }
}

// Background auto-sync on load, interval and tab focus
if (typeof window !== 'undefined') {
  setTimeout(() => syncWithCloud(), 100);
  setInterval(() => syncWithCloud(), 8000);
  window.addEventListener('focus', () => syncWithCloud());
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

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    }).catch(console.warn);
  }
}

export function registerUser(name: string, email: string, phone: string, password: string): { success: boolean; message: string; user?: UserAccount } {
  const users = getAllUsers();
  const cleanPhone = normalizePhone(phone) || phone.trim().replace(/[^0-9]/g, '');
  const cleanEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'This email is already registered. Please login.' };
  }
  if (users.some((u) => normalizePhone(u.phone) === cleanPhone)) {
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

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        password: newUser.password,
      }),
    }).catch(console.warn);
  }

  createAdminNotification({
    type: 'new_user',
    title: 'New User Registered',
    message: `${newUser.name} (${newUser.phone}) joined Watch & Earn.`,
  });

  return { success: true, message: 'Account created successfully!', user: newUser };
}

export function findUserByCredentials(emailOrPhone: string, password?: string): UserAccount | null {
  const users = getAllUsers();
  const query = emailOrPhone.trim().toLowerCase();
  const queryPhone = normalizePhone(query);

  return (
    users.find((u) => {
      const userPhone = normalizePhone(u.phone);
      const matchesIdent =
        u.email.toLowerCase() === query ||
        (queryPhone && userPhone === queryPhone) ||
        (u.phone.replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, ''));

      if (!matchesIdent) return false;
      if (password !== undefined) {
        return !u.password || u.password === password;
      }
      return true;
    }) || null
  );
}

export function loginUser(emailOrPhone: string, password: string): { success: boolean; message: string; user?: UserAccount } {
  const user = findUserByCredentials(emailOrPhone, password);

  if (!user) {
    return { success: false, message: 'Invalid mobile number/email or password.' };
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.id);
    notifyChange();
  }

  return { success: true, message: `Welcome back, ${user.name}!`, user };
}

export async function loginUserAsync(
  emailOrPhone: string,
  password: string
): Promise<{ success: boolean; message: string; user?: UserAccount }> {
  // 1. Check local cache first
  const localMatch = findUserByCredentials(emailOrPhone, password);
  if (localMatch) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, localMatch.id);
      notifyChange();
    }
    return { success: true, message: `Welcome back, ${localMatch.name}!`, user: localMatch };
  }

  // 2. If not found or mismatch locally, try server-side cloud authentication
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        identifier: emailOrPhone,
        phone: emailOrPhone,
        password,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        // Save user into local storage
        saveUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, data.user.id);
          notifyChange();
        }
        return { success: true, message: `Welcome back, ${data.user.name}!`, user: data.user };
      }
      return { success: false, message: data.error || 'Invalid mobile number/email or password.' };
    } else {
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.error || 'Invalid mobile number/email or password.' };
    }
  } catch (err: any) {
    return { success: false, message: 'Login failed. Please check your internet connection.' };
  }
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
    title: taskData.title || 'Daily YouTube Watch Task',
    description: taskData.description || 'Watch to claim reward.',
    durationMinutes: taskData.durationMinutes,
    durationSeconds: taskData.durationSeconds,
    rewardPKR,
    category: taskData.category || 'Technology',
    channelName: taskData.channelName || 'YouTube Creator',
    thumbnailUrl: getYouTubeThumbnail(taskData.youtubeId, 'hq'),
    active: true,
    createdAt: new Date().toISOString(),
  };

  const updated = [newTask, ...tasks];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    notifyChange();

    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    }).catch(console.warn);
  }
  return newTask;
}

export function deleteTask(id: string): boolean {
  const tasks = getTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
    notifyChange();

    fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(console.warn);
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

    fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: tasks[idx].active }),
    }).catch(console.warn);
  }
  return true;
}

// ----------------- CATEGORY MANAGEMENT -----------------
export const DEFAULT_CATEGORIES: string[] = [
  'Technology',
  'Earning',
  'Music',
  'Gaming',
  'Tutorials',
  'Entertainment',
];

export function getCategories(): string[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function addCategory(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return getCategories();

  const current = getCategories();
  const exists = current.some((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exists) return current;

  const updated = [...current, trimmed];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    notifyChange();

    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    }).catch(console.warn);
  }
  return updated;
}

export function deleteCategory(name: string): string[] {
  const current = getCategories();
  const updated = current.filter((c) => c.toLowerCase() !== name.toLowerCase());
  const finalCategories = updated.length > 0 ? updated : ['General'];

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(finalCategories));

    // Re-assign any tasks with this category to a valid category
    const tasks = getTasks();
    let tasksModified = false;
    const fallbackCat = finalCategories[0] || 'General';
    const updatedTasks = tasks.map((t) => {
      if (t.category && t.category.toLowerCase() === name.toLowerCase()) {
        tasksModified = true;
        return { ...t, category: fallbackCat };
      }
      return t;
    });

    if (tasksModified) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_sync', tasks: updatedTasks }),
      }).catch(() => {});
    }

    notifyChange();

    fetch(`/api/categories?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }).catch(console.warn);
  }
  return finalCategories;
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

    fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newWithdrawal),
    }).catch(console.warn);
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

    fetch('/api/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, note }),
    }).catch(console.warn);
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
  const currentUser = getCurrentUser();
  const users = getAllUsers().filter((u) => u.role !== 'admin');
  if (users.length === 0) return [];
  return users
    .sort((a, b) => (b.totalEarnedPKR || 0) - (a.totalEarnedPKR || 0))
    .slice(0, 10)
    .map((u, idx) => ({
      rank: idx + 1,
      name: u.name,
      avatar: idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🌟',
      coins: u.balancePKR || 0,
      videosWatched: u.taskHistory?.length || 0,
      isCurrentUser: currentUser ? currentUser.id === u.id : false,
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
