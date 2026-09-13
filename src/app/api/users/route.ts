import { NextResponse } from 'next/server';
import { getCloudData, setCloudData } from '@/lib/cloudStorage';
import { UserAccount } from '@/types';

const USERS_KEY = 'watch_earn_users_v1';

const DEFAULT_USERS: UserAccount[] = [
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

export async function GET() {
  const users = await getCloudData<UserAccount[]>(USERS_KEY, DEFAULT_USERS);
  // Strip passwords for safety
  const safeUsers = users.map(({ password, ...u }) => u);
  return NextResponse.json({ success: true, users: safeUsers });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, phone, email, password } = body;
    const users = await getCloudData<UserAccount[]>(USERS_KEY, DEFAULT_USERS);

    if (action === 'register') {
      const cleanPhone = (phone || '').trim();
      const existing = users.find((u) => u.phone === cleanPhone);

      if (existing) {
        return NextResponse.json({ success: false, error: 'An account with this phone number already exists!' }, { status: 400 });
      }

      const newUser: UserAccount = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name || 'New Worker',
        email: email || `${cleanPhone}@worker.pk`,
        phone: cleanPhone,
        password: password || '123456',
        balancePKR: 0,
        totalEarnedPKR: 0,
        totalWithdrawnPKR: 0,
        withdrawalCount: 0,
        completedTasksToday: [],
        taskHistory: [],
        createdAt: new Date().toISOString(),
        role: 'user',
      };

      const updated = [...users, newUser];
      await setCloudData(USERS_KEY, updated);

      const { password: _, ...safeUser } = newUser;
      return NextResponse.json({ success: true, user: safeUser, users: updated.map(({ password: _, ...u }) => u) });
    }

    if (action === 'login') {
      const cleanPhone = (phone || '').trim();
      const user = users.find((u) => u.phone === cleanPhone && (!password || u.password === password));

      if (!user) {
        return NextResponse.json({ success: false, error: 'Invalid phone number or credentials!' }, { status: 401 });
      }

      const { password: _, ...safeUser } = user;
      return NextResponse.json({ success: true, user: safeUser });
    }

    // Direct sync of user object
    if (body.user && body.user.id) {
      const userIndex = users.findIndex((u) => u.id === body.user.id);
      let updated: UserAccount[];
      if (userIndex >= 0) {
        updated = users.map((u) => (u.id === body.user.id ? { ...u, ...body.user } : u));
      } else {
        updated = [...users, body.user];
      }
      await setCloudData(USERS_KEY, updated);
      return NextResponse.json({ success: true, user: body.user });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json({ success: false, error: 'Missing userId or updates' }, { status: 400 });
    }

    const users = await getCloudData<UserAccount[]>(USERS_KEY, DEFAULT_USERS);
    const updated = users.map((u) => {
      if (u.id === userId) {
        return { ...u, ...updates };
      }
      return u;
    });

    await setCloudData(USERS_KEY, updated);
    const updatedUser = updated.find((u) => u.id === userId);
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
