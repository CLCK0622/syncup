
import { useState, useEffect } from 'react';

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

export default function Dashboard({ user }: DashboardProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [commonFreeDays, setCommonFreeDays] = useState<Date[]>([]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/calendars');
      if (response.ok) {
        const data: CalendarEvent[] = await response.json();
        const futureEvents = data.filter(event => new Date(event.dtstart) > new Date());
        setEvents(futureEvents);
        findCommonFreeDays(futureEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const findCommonFreeDays = (allEvents: CalendarEvent[]) => {
    const myEvents = allEvents.filter(event => event.name === user.name);
    const otherUsersEvents = allEvents.filter(event => event.name !== user.name);
    const otherUserNames = [...new Set(otherUsersEvents.map(event => event.name))];

    const isBusy = (date: Date, eventList: CalendarEvent[]) => {
      return eventList.some(event => {
        const start = new Date(event.dtstart);
        const end = new Date(event.dtend);
        return date >= start && date <= end;
      });
    };

    const freeDays: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);

      if (!isBusy(day, myEvents)) {
        const freeGroupCount = otherUserNames.filter(name => {
          const userEvents = otherUsersEvents.filter(event => event.name === name);
          return !isBusy(day, userEvents);
        }).length;

        if (freeGroupCount >= 2) {
          freeDays.push(day);
        }
      }
    }
    setCommonFreeDays(freeDays);
  };

  useEffect(() => {
    fetchEvents();
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

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="page-title">Welcome, {user.name}!</h1>
        <div className="dashboard-actions">
          <label className="upload-label">
            Upload Calendar
            <input type="file" accept=".ics" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={fetchEvents} className="button">
            Refresh
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-column-main">
          <h2 className="card-title">Upcoming Plans</h2>
          <div className="list-container">
            {events.map((event, index) => (
              <div key={index} className="glass-card">
                <p className="event-summary">{event.summary}</p>
                <p>User: {event.name}</p>
                <p>Start: {new Date(event.dtstart).toLocaleString()}</p>
                <p>End: {new Date(event.dtend).toLocaleString()}</p>
                {event.location && <p>Location: {event.location}</p>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="card-title">Common Free Days (Group of 3+)</h2>
          <div className="glass-card">
            <div className="list-container">
              {commonFreeDays.length > 0 ? (
                commonFreeDays.map((day, index) => (
                  <p key={index} className="free-day-item">{day.toLocaleDateString()}</p>
                ))
              ) : (
                <p>No common free days found in the next month.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
