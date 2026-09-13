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

function normalizePhone(input?: string): string {
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, phone, email, password } = body;
    const users = await getCloudData<UserAccount[]>(USERS_KEY, DEFAULT_USERS);

    if (action === 'register') {
      const cleanPhone = normalizePhone(phone);
      const cleanEmail = (email || '').trim().toLowerCase();
      const existing = users.find(
        (u) => (cleanPhone && normalizePhone(u.phone) === cleanPhone) || (cleanEmail && u.email.toLowerCase() === cleanEmail)
      );

      if (existing) {
        return NextResponse.json({ success: false, error: 'An account with this phone or email already exists!' }, { status: 400 });
      }

      const newUser: UserAccount = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name || 'New Worker',
        email: cleanEmail || `${cleanPhone}@worker.pk`,
        phone: cleanPhone || (phone || '').trim(),
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

      return NextResponse.json({ success: true, user: newUser, users: updated.map(({ password: _, ...u }) => u) });
    }

    if (action === 'login') {
      const ident = ((body.identifier || phone || email || '') as string).trim().toLowerCase();
      const normIdent = normalizePhone(ident);
      const user = users.find((u) => {
        const normU = normalizePhone(u.phone);
        const matchesIdent =
          u.email.toLowerCase() === ident ||
          (normIdent && normU === normIdent) ||
          (u.phone.replace(/[^0-9]/g, '') === ident.replace(/[^0-9]/g, ''));
        return matchesIdent && (!password || u.password === password);
      });

      if (!user) {
        return NextResponse.json({ success: false, error: 'Invalid mobile number/email or password!' }, { status: 401 });
      }

      return NextResponse.json({ success: true, user });
    }

    // Bulk sync for re-hydration
    if (action === 'bulk_sync' && Array.isArray(body.users)) {
      const merged = [...users];
      for (const bu of body.users) {
        const idx = merged.findIndex((u) => u.id === bu.id || (u.phone && bu.phone && normalizePhone(u.phone) === normalizePhone(bu.phone)));
        if (idx >= 0) {
          merged[idx] = {
            ...merged[idx],
            ...bu,
            password: bu.password || merged[idx].password,
            balancePKR: Math.max(merged[idx].balancePKR || 0, bu.balancePKR || 0),
            totalEarnedPKR: Math.max(merged[idx].totalEarnedPKR || 0, bu.totalEarnedPKR || 0),
          };
        } else {
          merged.push(bu);
        }
      }
      await setCloudData(USERS_KEY, merged);
      return NextResponse.json({ success: true, users: merged.map(({ password: _, ...u }) => u) });
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
