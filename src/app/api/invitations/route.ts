import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const recipientUserIdParam = searchParams.get('recipientUserId');

        if (!recipientUserIdParam) {
            return NextResponse.json({ error: 'Missing recipientUserId parameter' }, { status: 400 });
        }

        const recipientUserId = parseInt(recipientUserIdParam, 10);
        if (isNaN(recipientUserId)) {
            return NextResponse.json({ error: 'Invalid recipientUserId parameter' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const { rows } = await client.query(
                'SELECT id, sender_user_id, recipient_user_id, event_summary, dtstart, dtend, gpt_suggestion, status, created_at FROM invitations WHERE recipient_user_id = $1 AND status = \'pending\' ORDER BY created_at DESC',
                [recipientUserId]
            );

            return NextResponse.json(rows, { status: 200 });
        } catch (dbError) {
            // THIS IS THE CRUCIAL LOGGING PART
            console.error('Database error fetching invitations:', dbError);
            return NextResponse.json({ error: 'Failed to fetch invitations from database' }, { status: 500 });
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error in GET /api/invitations route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}