import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export async function POST(req: Request) {
    try {
        const { invitationId, userId } = await req.json();

        if (!invitationId || !userId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Update invitation status to 'rejected'
            await client.query(
                'UPDATE invitations SET status = \'rejected\' WHERE id = $1 AND recipient_user_id = $2',
                [invitationId, userId]
            );
            return NextResponse.json({ message: 'Invitation rejected' }, { status: 200 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error rejecting invitation:', error);
        return NextResponse.json({ error: 'Failed to reject invitation' }, { status: 500 });
    }
}