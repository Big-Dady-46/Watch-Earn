export type PaymentMethod = 'easypaisa' | 'jazzcash' | 'bank';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  balancePKR: number;
  totalEarnedPKR: number;
  totalWithdrawnPKR: number;
  withdrawalCount: number; // For progressive threshold (1st = 100, 2nd = 200, 3rd = 300...)
  completedTasksToday: string[]; // Task IDs completed in current 24-hour cycle
  taskHistory: {
    taskId: string;
    videoTitle: string;
    minutesWatched: number;
    earnedPKR: number;
    completedAt: string;
  }[];
  createdAt: string;
  role: 'user' | 'admin';
}

export interface VideoTask {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  durationMinutes: number;
  durationSeconds: number;
  rewardPKR: number; // 1 PKR per minute
  category: string;
  channelName: string;
  thumbnailUrl: string;
  active: boolean;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amountPKR: number;
  paymentMethod: PaymentMethod;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  note?: string;
  tierLevel: number; // 1 = 100 PKR, 2 = 200 PKR, 3 = 300 PKR etc.
}

export interface AdminNotification {
  id: string;
  type: 'withdrawal' | 'task_completed' | 'new_user';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  amountPKR?: number;
}

// Backward compatibility aliases
export type VideoItem = VideoTask;
export type UserProfile = UserAccount;
export interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  coins: number;
  videosWatched: number;
  isCurrentUser?: boolean;
}

