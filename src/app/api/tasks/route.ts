import { NextResponse } from 'next/server';
import { getCloudData, setCloudData } from '@/lib/cloudStorage';
import { VideoTask } from '@/types';
import { calculateRewardPKR, getYouTubeThumbnail } from '@/lib/youtube';

const TASKS_KEY = 'watch_earn_tasks_v1';

export async function GET() {
  const tasks = await getCloudData<VideoTask[]>(TASKS_KEY, []);
  return NextResponse.json({ success: true, tasks });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tasks = await getCloudData<VideoTask[]>(TASKS_KEY, []);

    if (body.action === 'bulk_sync' && Array.isArray(body.tasks)) {
      const merged = [...tasks];
      for (const t of body.tasks) {
        if (!merged.some((m) => m.id === t.id)) {
          merged.push(t);
        }
      }
      await setCloudData(TASKS_KEY, merged);
      return NextResponse.json({ success: true, tasks: merged });
    }

    const durationMinutes = Number(body.durationMinutes) || 1;
    const rewardPKR = calculateRewardPKR(durationMinutes);
    const durationSeconds = Number(body.durationSeconds) || durationMinutes * 60;

    const newTask: VideoTask = {
      id: body.id || `task-${Date.now()}`,
      youtubeId: body.youtubeId,
      title: body.title || 'Daily YouTube Watch Task',
      description: body.description || `Watch for ${durationMinutes} minutes to claim reward.`,
      durationMinutes,
      durationSeconds,
      rewardPKR,
      category: body.category || 'Technology',
      channelName: body.channelName || 'YouTube Creator',
      thumbnailUrl: body.thumbnailUrl || getYouTubeThumbnail(body.youtubeId, 'hq'),
      active: body.active !== undefined ? body.active : true,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const updated = [newTask, ...tasks.filter((t) => t.id !== newTask.id)];
    await setCloudData(TASKS_KEY, updated);

    return NextResponse.json({ success: true, task: newTask, tasks: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing task id' }, { status: 400 });
    }

    const tasks = await getCloudData<VideoTask[]>(TASKS_KEY, []);
    const updated = tasks.filter((t) => t.id !== id);
    await setCloudData(TASKS_KEY, updated);

    return NextResponse.json({ success: true, tasks: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, active } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing task id' }, { status: 400 });
    }

    const tasks = await getCloudData<VideoTask[]>(TASKS_KEY, []);
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return { ...t, active: active !== undefined ? active : !t.active };
      }
      return t;
    });

    await setCloudData(TASKS_KEY, updated);
    return NextResponse.json({ success: true, tasks: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
