import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { invitationId, userId, summary, dtstart, dtend, availableUserIds } = await req.json();

        if (!invitationId || !userId || !summary || !dtstart || !dtend || !availableUserIds || !Array.isArray(availableUserIds)) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN'); // Start transaction

            // 1. Update invitation status to 'accepted'
            await client.query(
                'UPDATE invitations SET status = \'accepted\' WHERE id = $1 AND recipient_user_id = $2',
                [invitationId, userId]
            );

            // 2. Create event for the accepting user
            await client.query(
                'INSERT INTO events (user_id, summary, dtstart, dtend) VALUES ($1, $2, $3, $4)',
                [userId, summary, dtstart, dtend]
            );

            // In a real multi-user system, you might also create events for other participants
            // or update their invitation status if they are also recipients of this invitation.
            // For simplicity, this only adds to the accepting user's calendar.

            await client.query('COMMIT'); // Commit transaction
            return NextResponse.json({ message: 'Invitation accepted and event created' }, { status: 200 });
        } catch (error) {
            await client.query('ROLLBACK'); // Rollback on error
            console.error('Error accepting invitation:', error);
            return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in accept invitation API route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
