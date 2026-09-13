import { NextResponse } from 'next/server';
import { getCloudData, setCloudData } from '@/lib/cloudStorage';
import { WithdrawalRequest, UserAccount } from '@/types';

const WITHDRAWALS_KEY = 'watch_earn_withdrawals_v1';
const USERS_KEY = 'watch_earn_users_v1';

export async function GET() {
  const withdrawals = await getCloudData<WithdrawalRequest[]>(WITHDRAWALS_KEY, []);
  return NextResponse.json({ success: true, withdrawals });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const withdrawals = await getCloudData<WithdrawalRequest[]>(WITHDRAWALS_KEY, []);

    if (body.action === 'bulk_sync' && Array.isArray(body.withdrawals)) {
      const merged = [...withdrawals];
      for (const w of body.withdrawals) {
        if (!merged.some((m) => m.id === w.id)) {
          merged.push(w);
        }
      }
      await setCloudData(WITHDRAWALS_KEY, merged);
      return NextResponse.json({ success: true, withdrawals: merged });
    }

    const newRequest: WithdrawalRequest = {
      id: body.id || `w-${Date.now()}`,
      userId: body.userId,
      userName: body.userName,
      userPhone: body.userPhone,
      amountPKR: Number(body.amountPKR),
      paymentMethod: body.paymentMethod,
      accountTitle: body.accountTitle,
      accountNumber: body.accountNumber,
      bankName: body.bankName,
      status: 'pending',
      createdAt: body.createdAt || new Date().toISOString(),
      note: body.note,
      tierLevel: Number(body.tierLevel) || 1,
    };

    const updated = [newRequest, ...withdrawals];
    await setCloudData(WITHDRAWALS_KEY, updated);

    return NextResponse.json({ success: true, withdrawal: newRequest, withdrawals: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, note } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
    }

    const withdrawals = await getCloudData<WithdrawalRequest[]>(WITHDRAWALS_KEY, []);
    let targetWithdrawal: WithdrawalRequest | undefined;

    const updatedWithdrawals = withdrawals.map((w) => {
      if (w.id === id) {
        targetWithdrawal = {
          ...w,
          status,
          processedAt: new Date().toISOString(),
          note: note !== undefined ? note : w.note,
        };
        return targetWithdrawal;
      }
      return w;
    });

    await setCloudData(WITHDRAWALS_KEY, updatedWithdrawals);

    // If approved, update user's withdrawalCount and totalWithdrawnPKR in cloud
    if (status === 'approved' && targetWithdrawal) {
      const users = await getCloudData<UserAccount[]>(USERS_KEY, []);
      const updatedUsers = users.map((u) => {
        if (u.id === targetWithdrawal?.userId) {
          return {
            ...u,
            totalWithdrawnPKR: (u.totalWithdrawnPKR || 0) + targetWithdrawal.amountPKR,
            withdrawalCount: (u.withdrawalCount || 0) + 1,
          };
        }
        return u;
      });
      await setCloudData(USERS_KEY, updatedUsers);
    }

    return NextResponse.json({ success: true, withdrawal: targetWithdrawal, withdrawals: updatedWithdrawals });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
