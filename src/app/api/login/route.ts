
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  const { name } = await request.json();

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    let user = await pool.query('SELECT * FROM users WHERE name = $1', [name]);

    if (user.rows.length === 0) {
      user = await pool.query('INSERT INTO users (name) VALUES ($1) RETURNING *', [name]);
    }

    return NextResponse.json(user.rows[0]);
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
