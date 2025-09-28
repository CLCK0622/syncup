import { NextRequest, NextResponse } from 'next/server';
import { saveVote } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { vote } = await req.json();
    let ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Use a sample IP for local development
    if (ip === '::1' || ip === '127.0.0.1') {
      ip = '8.8.8.8'; // Google's public DNS server IP
    }
    
    const newVote = {
      ip,
      vote,
      timestamp: new Date().toISOString(),
    };

    await saveVote(newVote);

    return NextResponse.json({ message: 'Vote recorded' });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json({ message: 'Error recording vote' }, { status: 500 });
  }
}
