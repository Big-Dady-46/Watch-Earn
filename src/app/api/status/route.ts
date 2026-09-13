import { NextResponse } from 'next/server';
import { checkCloudStatus } from '@/lib/cloudStorage';

export async function GET() {
  const status = await checkCloudStatus();
  return NextResponse.json({
    success: true,
    connected: status.connected,
    provider: status.provider,
    timestamp: new Date().toISOString(),
  });
}
