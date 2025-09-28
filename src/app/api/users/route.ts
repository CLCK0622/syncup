import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            const { rows } = await client.query('SELECT id, name FROM users ORDER BY name ASC');
            return NextResponse.json(rows, { status: 200 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}