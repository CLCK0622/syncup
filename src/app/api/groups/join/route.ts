
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  const { userId, groupCode } = await request.json();

  if (!userId || !groupCode) {
    return NextResponse.json({ error: 'User ID and group code are required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find the group by its code
    const groupResult = await client.query('SELECT id FROM groups WHERE group_code = $1', [groupCode.toUpperCase()]);

    if (groupResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid group code' }, { status: 404 });
    }
    const groupId = groupResult.rows[0].id;

    // 2. Update the user's record to link them to the group
    await client.query(
      'UPDATE users SET group_id = $1 WHERE id = $2',
      [groupId, userId]
    );

    await client.query('COMMIT');

    return NextResponse.json({ groupId, groupCode });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error joining group:', error);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  } finally {
    client.release();
  }
}
