import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { senderUserId, recipientUserIds, summary, dtstart, dtend, gptSuggestion } = await req.json();

        console.log('Received request to send invitations:', { senderUserId, recipientUserIds, summary, dtstart, dtend, gptSuggestion });

        if (!senderUserId || !recipientUserIds || !Array.isArray(recipientUserIds) || recipientUserIds.length === 0 || !summary || !dtstart || !dtend) {
            console.error('Missing required parameters for sending invitations.');
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const insertPromises = recipientUserIds.map(async (recipientUserId: number) => {
                console.log(`Attempting to insert invitation for recipient ${recipientUserId}`);
                return client.query(
                    'INSERT INTO invitations (sender_user_id, recipient_user_id, event_summary, dtstart, dtend, gpt_suggestion) VALUES ($1, $2, $3, $4, $5, $6)',
                    [senderUserId, recipientUserId, summary, dtstart, dtend, gptSuggestion]
                );
            });
            await Promise.all(insertPromises);
            console.log('All invitations inserted successfully.');
            return NextResponse.json({ message: 'Invitations sent successfully' }, { status: 200 });
        } catch (dbError) {
            console.error('Database error sending invitations:', dbError); // Log the specific DB error
            return NextResponse.json({ error: 'Failed to send invitations to database' }, { status: 500 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in POST /api/invitations/send route:', error); // Log general route error
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}