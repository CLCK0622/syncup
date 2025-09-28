
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

interface Params {
  groupId: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const { groupId } = params;

  if (!groupId) {
    return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
  }

  try {
    const id = parseInt(groupId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid Group ID' }, { status: 400 });
    }

    const { rows } = await pool.query(
      'SELECT id, name FROM users WHERE group_id = $1 ORDER BY name ASC',
      [id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(`Error fetching members for group ${groupId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch group members' }, { status: 500 });
  }
}
