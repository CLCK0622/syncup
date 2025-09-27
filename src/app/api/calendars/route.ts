
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import ICAL from 'ical.js';

export async function POST(request: Request) {
  const { userId, icsContent } = await request.json();

  if (!userId || !icsContent) {
    return NextResponse.json({ error: 'User ID and ICS content are required' }, { status: 400 });
  }

  try {
    const jcalData = ICAL.parse(icsContent);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents('vevent');

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      await pool.query(
        'INSERT INTO events (user_id, summary, dtstart, dtend, location) VALUES ($1, $2, $3, $4, $5)',
        [
          userId,
          event.summary,
          event.startDate.toJSDate(),
          event.endDate.toJSDate(),
          event.location,
        ]
      );
    }

    return NextResponse.json({ message: 'Calendar uploaded successfully' });
  } catch (error) {
    console.error('Calendar upload API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT u.name, e.summary, e.dtstart, e.dtend, e.location
      FROM events e
      JOIN users u ON e.user_id = u.id
      ORDER BY e.dtstart
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Get calendars API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
