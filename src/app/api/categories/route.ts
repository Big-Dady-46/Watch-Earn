import { NextResponse } from 'next/server';
import { getCloudData, setCloudData } from '@/lib/cloudStorage';

const CATEGORIES_KEY = 'watch_earn_categories_v1';

const DEFAULT_CATEGORIES: string[] = [
  'Technology',
  'Earning',
  'Music',
  'Gaming',
  'Tutorials',
  'Entertainment',
];

export async function GET() {
  const categories = await getCloudData<string[]>(CATEGORIES_KEY, DEFAULT_CATEGORIES);
  return NextResponse.json({ success: true, categories });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = (body.name || '').trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Missing category name' }, { status: 400 });
    }

    const categories = await getCloudData<string[]>(CATEGORIES_KEY, DEFAULT_CATEGORIES);
    const exists = categories.some((c) => c.toLowerCase() === name.toLowerCase());

    let updated = categories;
    if (!exists) {
      updated = [...categories, name];
      await setCloudData(CATEGORIES_KEY, updated);
    }

    return NextResponse.json({ success: true, category: name, categories: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ success: false, error: 'Missing category name' }, { status: 400 });
    }

    const categories = await getCloudData<string[]>(CATEGORIES_KEY, DEFAULT_CATEGORIES);
    const updated = categories.filter((c) => c.toLowerCase() !== name.toLowerCase());
    const finalCategories = updated.length > 0 ? updated : ['General'];

    await setCloudData(CATEGORIES_KEY, finalCategories);
    return NextResponse.json({ success: true, categories: finalCategories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
