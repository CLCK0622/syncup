import { useState, useEffect } from 'react';
import TimeSlotList from './TimeSlotList';
import EventModal from './EventModal';

interface DashboardProps {
  user: { id: number; name: string };
}

interface CalendarEvent {
  name: string;
  summary: string;
  dtstart: string;
  dtend: string;
  location: string;
}

interface TimeSlot {
  start: Date;
  end: Date;
}

export default function Dashboard({ user }: DashboardProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [commonFreeTimeSlots, setCommonFreeTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: number; name: string }[]>([]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/calendars');
      if (response.ok) {
        const data: CalendarEvent[] = await response.json();
        const futureEvents = data.filter(event => new Date(event.dtstart) > new Date());
        setEvents(futureEvents);
        findCommonFreeTimeSlots(futureEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchUsers = async () => {
    // In a real app, you would fetch this from an API
    // For now, we'll extract it from the events
    const response = await fetch('/api/calendars');
    if (response.ok) {
        const data: CalendarEvent[] = await response.json();
        const users = Array.from(new Set(data.map(e => e.name))).map((name, index) => ({ id: index + 1, name }));
        setAllUsers(users);
    }
  };

  const findCommonFreeTimeSlots = (allEvents: CalendarEvent[]) => {
    const myEvents = allEvents.filter(event => event.name === user.name);
    const otherUsersEvents = allEvents.filter(event => event.name !== user.name);
    const otherUserNames = [...new Set(otherUsersEvents.map(event => event.name))];
    const meetingDuration = 30; // 30 minutes

    const isBusy = (slot: TimeSlot, eventList: CalendarEvent[]) => {
      return eventList.some(event => {
        const eventStart = new Date(event.dtstart);
        const eventEnd = new Date(event.dtend);
        return slot.start < eventEnd && slot.end > eventStart;
      });
    };

    const freeSlots: TimeSlot[] = [];
    const today = new Date();
    today.setHours(9, 0, 0, 0); // Start from 9 AM

    for (let i = 0; i < 7; i++) { // Check for the next 7 days
      const day = new Date(today);
      day.setDate(today.getDate() + i);

      for (let h = 9; h < 17; h++) { // Check from 9 AM to 5 PM
        for (let m = 0; m < 60; m += meetingDuration) {
          const slotStart = new Date(day);
          slotStart.setHours(h, m, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + meetingDuration);

          const slot = { start: slotStart, end: slotEnd };

          if (!isBusy(slot, myEvents)) {
            const freeGroupCount = otherUserNames.filter(name => {
              const userEvents = otherUsersEvents.filter(event => event.name === name);
              return !isBusy(slot, userEvents);
            }).length;

            if (freeGroupCount >= 2) {
              freeSlots.push(slot);
            }
          }
        }
      }
    }
    setCommonFreeTimeSlots(freeSlots);
  };

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const icsContent = e.target?.result as string;
        try {
          await fetch('/api/calendars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, icsContent }),
          });
          fetchEvents();
        } catch (error) {
          console.error('Error uploading calendar:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSchedule = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleCreateEvent = async (summary: string) => {
    if (!selectedSlot) return;

    const userIds = allUsers.map(u => u.id);

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          dtstart: selectedSlot.start.toISOString(),
          dtend: selectedSlot.end.toISOString(),
          userIds,
        }),
      });
      setSelectedSlot(null);
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  return (
    <div className="main-container">
        <header className="dashboard-header">
            <h1>Welcome, {user.name}!</h1>
            <div className="dashboard-actions">
                <label className="upload-label">
                    Upload Calendar
                    <input type="file" accept=".ics" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                <button onClick={fetchEvents} className="btn">
                    Refresh
                </button>
            </div>
        </header>

      <div className="dashboard-grid">
        <div className="dashboard-column">
          <h2>Upcoming Plans</h2>
            {events.map((event, index) => (
              <div key={index} className="event-card">
                <p className="event-summary">{event.summary}</p>
                <p>User: {event.name}</p>
                <p>Start: {new Date(event.dtstart).toLocaleString()}</p>
                <p>End: {new Date(event.dtend).toLocaleString()}</p>
                {event.location && <p>Location: {event.location}</p>}
              </div>
            ))}
        </div>

        <div className="dashboard-column">
          <h2>Common Free Time Slots (Group of 3+)</h2>
          <TimeSlotList timeSlots={commonFreeTimeSlots} onSelectSlot={handleSchedule} />
        </div>
      </div>

      {selectedSlot && (
        <EventModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onCreateEvent={handleCreateEvent}
        />
      )}
    </div>
  );
}
