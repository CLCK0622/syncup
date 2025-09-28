
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Update the user's group_id to NULL to remove them from the group
    await pool.query(
      'UPDATE users SET group_id = NULL WHERE id = $1',
      [userId]
    );

    return NextResponse.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
  }
}
