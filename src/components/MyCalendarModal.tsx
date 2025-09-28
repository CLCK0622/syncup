import { useState } from 'react';

interface CalendarEvent {
  name: string;
  summary: string;
  dtstart: string;
  dtend: string;
  location: string;
}

interface MyCalendarModalProps {
  userEvents: CalendarEvent[];
  onClose: () => void;
}

export default function MyCalendarModal({ userEvents, onClose }: MyCalendarModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="text-center mb-4">My Calendar</h2>
        <div className="space-y-4 max-h-[400px] overflow-y-auto p-2 border border-border rounded-md bg-muted/20">
          {userEvents.length > 0 ? (
            userEvents.map((event, index) => (
              <div key={index} className="event-card p-3 border border-border rounded-md">
                <p className="font-semibold text-foreground">{event.summary}</p>
                <p className="text-sm text-muted-foreground">Start: {new Date(event.dtstart).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">End: {new Date(event.dtend).toLocaleString()}</p>
                {event.location && <p className="text-sm text-muted-foreground">Location: {event.location}</p>}
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">No upcoming events found.</p>
          )}
        </div>
        <div className="modal-actions mt-4">
          <button type="button" onClick={onClose} className="btn btn-outline">Close</button>
        </div>
      </div>
    </div>
  );
}
