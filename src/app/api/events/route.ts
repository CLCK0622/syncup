import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  const { summary, dtstart, dtend, userIds } = await request.json();

  if (!summary || !dtstart || !dtend || !userIds || !Array.isArray(userIds)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const userId of userIds) {
      await client.query(
        'INSERT INTO events (summary, dtstart, dtend, user_id) VALUES ($1, $2, $3, $4)',
        [summary, new Date(dtstart), new Date(dtend), userId]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Event created successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create event API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
