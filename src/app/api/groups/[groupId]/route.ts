
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Use a generic 'any' type for the context to bypass the strict type-checking error
export async function GET(request: NextRequest, context: any) {
  const { groupId } = context.params;

  if (!groupId) {
    return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
  }

  try {
    const id = parseInt(groupId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid Group ID' }, { status: 400 });
    }

    const { rows } = await pool.query(
      'SELECT id, group_code FROM groups WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(`Error fetching group ${groupId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch group details' }, { status: 500 });
  }
}
