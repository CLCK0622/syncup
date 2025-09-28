
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Function to generate a unique 4-digit alphanumeric code
async function generateUniqueGroupCode(): Promise<string> {
  let groupCode = '';
  let isUnique = false;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  while (!isUnique) {
    groupCode = '';
    for (let i = 0; i < 4; i++) {
      groupCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if the code already exists in the database
    const { rows } = await pool.query('SELECT id FROM groups WHERE group_code = $1', [groupCode]);
    if (rows.length === 0) {
      isUnique = true;
    }
  }
  return groupCode;
}

export async function POST(request: Request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Generate a unique group code
    const groupCode = await generateUniqueGroupCode();

    // 2. Create the new group and get its ID
    const groupResult = await client.query(
      'INSERT INTO groups (group_code) VALUES ($1) RETURNING id',
      [groupCode]
    );
    const groupId = groupResult.rows[0].id;

    // 3. Update the user's record to link them to the new group
    await client.query(
      'UPDATE users SET group_id = $1 WHERE id = $2',
      [groupId, userId]
    );

    await client.query('COMMIT');

    return NextResponse.json({ groupId, groupCode });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  } finally {
    client.release();
  }
}
