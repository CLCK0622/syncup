
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

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/calendars');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
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
          fetchEvents(); // Refresh events after upload
        } catch (error) {
          console.error('Error uploading calendar:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user.name}!</h1>
        <div>
          <input type="file" accept=".ics" onChange={handleFileUpload} className="mr-4" />
          <button onClick={fetchEvents} className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600">
            Refresh
          </button>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">All Calendars</h2>
        {events.map((event, index) => (
          <div key={index} className="mb-4 p-4 bg-white rounded-lg shadow">
            <p className="font-semibold">{event.summary}</p>
            <p className="text-gray-600">User: {event.name}</p>
            <p className="text-gray-600">Start: {new Date(event.dtstart).toLocaleString()}</p>
            <p className="text-gray-600">End: {new Date(event.dtend).toLocaleString()}</p>
            {event.location && <p className="text-gray-600">Location: {event.location}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
