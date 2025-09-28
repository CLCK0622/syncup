
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  const { name } = await request.json();

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    // Explicitly select id, name, and the new group_id
    let userResult = await pool.query('SELECT id, name, group_id FROM users WHERE name = $1', [name]);

    if (userResult.rows.length === 0) {
      // Create the user if they don't exist, returning the same fields
      userResult = await pool.query('INSERT INTO users (name) VALUES ($1) RETURNING id, name, group_id', [name]);
    }

    // The user object now includes group_id (which can be null)
    const user = userResult.rows[0];

    return NextResponse.json(user);
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
