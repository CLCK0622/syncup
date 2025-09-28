import { useState, useEffect } from 'react';
import TimeSlotList from './TimeSlotList';
import EventModal from './EventModal';
import MyCalendarModal from './MyCalendarModal';

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
  availableUsers: string[];
}

// Updated Invitation Interface to match DB schema (camelCase)
interface Invitation {
  id: number;
  senderUserId: number;
  recipientUserId: number;
  eventSummary: string;
  dtstart: string;
  dtend: string;
  gptSuggestion: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function Dashboard({ user }: DashboardProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [commonFreeTimeSlots, setCommonFreeTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: number; name: string }[]>([]);
  const [showMyCalendar, setShowMyCalendar] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [modalGptSuggestion, setModalGptSuggestion] = useState<string | null>(null);
  const [isLoadingGptSuggestion, setIsLoadingGptSuggestion] = useState<boolean>(false);

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
    try {
      const response = await fetch('/api/users'); // Call the new /api/users endpoint
      if (response.ok) {
        const data: { id: number; name: string }[] = await response.json();
        setAllUsers(data); // Set users directly from DB
      } else {
        console.error('Error fetching users:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const findCommonFreeTimeSlots = (allEvents: CalendarEvent[]) => {
    const allUserNames = [...new Set(allEvents.map(event => event.name))];
    const requiredMinDuration = 120; // 2 hours in minutes
    const intervalDuration = 30; // Check for new slots every 30 minutes

    const isBusy = (checkStart: Date, checkEnd: Date, eventList: CalendarEvent[]) => {
      return eventList.some(event => {
        const eventStart = new Date(event.dtstart);
        const eventEnd = new Date(event.dtend);
        // Check for overlap: (checkStart < eventEnd) && (checkEnd > eventStart)
        return checkStart < eventEnd && checkEnd > eventStart;
      });
    };

    const potential30MinFreeSlots: { start: Date; end: Date; availableUsers: string[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of today

    for (let i = 0; i < 7; i++) { // Check for the next 7 days
      const day = new Date(today);
      day.setDate(today.getDate() + i);

      // Iterate through potential 30-min intervals from 8 AM to 10 PM
      for (let totalMinutes = 8 * 60; totalMinutes < 22 * 60; totalMinutes += intervalDuration) {
        const intervalStart = new Date(day);
        intervalStart.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

        const intervalEnd = new Date(intervalStart);
        intervalEnd.setMinutes(intervalStart.getMinutes() + intervalDuration);

        const currentIntervalAvailableUsers: string[] = [];

        // Check if current user is free for this 30-min interval
        if (!isBusy(intervalStart, intervalEnd, allEvents.filter(event => event.name === user.name))) {
          currentIntervalAvailableUsers.push(user.name);

          // Check other users
          allUserNames.forEach(name => {
            if (name !== user.name) {
              if (!isBusy(intervalStart, intervalEnd, allEvents.filter(event => event.name === name))) {
                currentIntervalAvailableUsers.push(name);
              }
            }
          });
        }

        // Only consider intervals where at least 3 people are available (including current user)
        if (currentIntervalAvailableUsers.length >= 3) {
          potential30MinFreeSlots.push({
            start: intervalStart,
            end: intervalEnd,
            availableUsers: currentIntervalAvailableUsers,
          });
        }
      }
    }

    // Group contiguous 30-min free intervals into longer blocks
    const contiguousFreeBlocks: TimeSlot[] = [];
    if (potential30MinFreeSlots.length > 0) {
      let currentBlock: TimeSlot = { ...potential30MinFreeSlots[0] };

      for (let i = 1; i < potential30MinFreeSlots.length; i++) {
        const prevSlot = potential30MinFreeSlots[i - 1];
        const currentSlot = potential30MinFreeSlots[i];

        // Check if current slot is contiguous with the previous one
        // and has the exact same set of available users
        const isContiguous = currentSlot.start.getTime() === prevSlot.end.getTime();
        const sameUsers = JSON.stringify(currentSlot.availableUsers.sort()) === JSON.stringify(prevSlot.availableUsers.sort());

        if (isContiguous && sameUsers) {
          currentBlock.end = currentSlot.end;
        } else {
          // If the current block is long enough, add it
          if ((currentBlock.end.getTime() - currentBlock.start.getTime()) / (1000 * 60) >= requiredMinDuration) {
            contiguousFreeBlocks.push(currentBlock);
          }
          currentBlock = { ...currentSlot };
        }
      }
      // Add the last block if it's long enough
      if ((currentBlock.end.getTime() - currentBlock.start.getTime()) / (1000 * 60) >= requiredMinDuration) {
        contiguousFreeBlocks.push(currentBlock);
      }
    }

    setCommonFreeTimeSlots(contiguousFreeBlocks);
  };

  const fetchInvitations = async () => {
    try {
      // Fetch invitations for the current user from the database
      const response = await fetch(`/api/invitations?recipientUserId=${user.id}`);
      if (response.ok) {
        const data: any[] = await response.json(); // Use any[] for initial fetch
        // Map DB fields to camelCase for frontend
        const formattedInvitations: Invitation[] = data.map(inv => ({
          id: inv.id,
          senderUserId: inv.sender_user_id,
          recipientUserId: inv.recipient_user_id,
          eventSummary: inv.event_summary,
          dtstart: inv.dtstart,
          dtend: inv.dtend,
          gptSuggestion: inv.gpt_suggestion,
          status: inv.status,
          createdAt: inv.created_at,
        }));
        setPendingInvitations(formattedInvitations);
      } else {
        console.error('Error fetching invitations:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchUsers();
    fetchInvitations(); // Fetch invitations on component mount
  }, [user.id]); // Depend on user.id to refetch if user changes

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

  const handleSchedule = async (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setModalGptSuggestion(null); // Clear previous suggestion
    setIsLoadingGptSuggestion(true); // Start loading

    // Calculate duration in minutes
    const durationMinutes = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);

    try {
      const response = await fetch('/api/gpt-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: slot.start.toISOString(),
          endTime: slot.end.toISOString(),
          availableUsers: slot.availableUsers,
          duration: durationMinutes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setModalGptSuggestion(data.suggestion); // Set suggestion to be passed to modal
      } else {
        console.error('Error fetching GPT suggestion:', response.statusText);
        setModalGptSuggestion('Could not get suggestions at this time.');
      }
    } catch (error) {
      console.error('Error calling GPT suggestions API:', error);
      setModalGptSuggestion('Failed to connect to suggestion service.');
    } finally {
      setIsLoadingGptSuggestion(false); // End loading
    }
  };

  const handleCreateEvent = async (summary: string) => {
    if (!selectedSlot) return;

    // Get IDs of all available users for this slot
    const allParticipantUsers = allUsers
      .filter(u => selectedSlot.availableUsers.includes(u.name));

    // Filter out the current user to get recipients for invitations
    const recipientUsers = allParticipantUsers.filter(u => u.id !== user.id);
    const recipientUserIds = recipientUsers.map(u => u.id);

    try {
      // 1. Create event for the current user (the scheduler)
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          dtstart: selectedSlot.start.toISOString(),
          dtend: selectedSlot.end.toISOString(),
          userIds: [user.id], // Only current user for their calendar
        }),
      });

      // 2. Send invitations to other participants if there are any
      if (recipientUserIds.length > 0) {
        await fetch('/api/invitations/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderUserId: user.id,
            recipientUserIds,
            summary,
            dtstart: selectedSlot.start.toISOString(),
            dtend: selectedSlot.end.toISOString(),
            gptSuggestion: modalGptSuggestion || summary, // Use GPT suggestion if available, else summary
          }),
        });
        console.log(`Invitations sent to: ${recipientUsers.map(u => u.name).join(', ')}`);
      }

      setSelectedSlot(null);
      setModalGptSuggestion(null);
      fetchEvents(); // Refresh calendar to show the new event
      // No need to fetchInvitations here, as these are invitations *sent* by current user

    } catch (error) {
      console.error('Error creating event or sending invitations:', error);
    }
  };

  const handleAcceptInvitation = async (invitationId: number) => {
    const invitation = pendingInvitations.find(inv => inv.id === invitationId);
    if (!invitation) return;

    try {
      await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId: invitation.id,
          userId: user.id,
          summary: invitation.gptSuggestion || invitation.eventSummary, // Use GPT suggestion or event summary
          dtstart: invitation.dtstart,
          dtend: invitation.dtend,
          // availableUserIds: allUsers.filter(u => invitation.timeSlot.availableUsers.includes(u.name)).map(u => u.id), // This was for old TimeSlot interface
          // For now, we'll pass the recipientUserId as the only user for the event creation in the backend
          availableUserIds: [user.id], // Only the accepting user for their calendar
        }),
      });

      fetchInvitations(); // Refresh pending invitations
      fetchEvents(); // Refresh calendar to show the new event
      console.log(`Invitation ${invitationId} accepted and event created.`);
    } catch (error) {
      console.error(`Error accepting invitation ${invitationId}:`, error);
    }
  };

  const handleRejectInvitation = async (invitationId: number) => {
    const invitation = pendingInvitations.find(inv => inv.id === invitationId);
    if (!invitation) return;

    try {
      await fetch('/api/invitations/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId: invitation.id,
          userId: user.id,
        }),
      });

      fetchInvitations(); // Refresh pending invitations
      console.log(`Invitation ${invitationId} rejected.`);
    } catch (error) {
      console.error(`Error rejecting invitation ${invitationId}:`, error);
    }
  };

  const myUpcomingEvents = events.filter(event => event.name === user.name);

  return (
    <div className="main-container">
        <header className="dashboard-header">
            <div className="app-header">
                <img src="/logo-512x512.png" alt="SyncUP Logo" className="app-logo" />
                <h1 className="app-title">SyncUP</h1>
            </div>
            <div className="dashboard-actions">
                <button onClick={() => setShowMyCalendar(true)} className="btn btn-outline">
                    See My Calendar
                </button>
                <label className="upload-label">
                    Upload Calendar
                    <input type="file" accept=".ics" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                <button onClick={fetchEvents} className="btn btn-outline">
                    Refresh
                </button>
            </div>
        </header>

      <div className="dashboard-grid">
        <div className="dashboard-column">
          <h2>Common Free Time Slots (Group of 3+)</h2>
          <TimeSlotList timeSlots={commonFreeTimeSlots} onSelectSlot={handleSchedule} />
        </div>

        <div className="dashboard-column">
          {/* New section for Pending Invitations */}
          <div className="event-card">
              <h3 className="event-summary">Pending Invitations</h3>
              {pendingInvitations.length > 0 ? (
                  pendingInvitations.map(invitation => (
                      <div key={invitation.id} className="free-day-item flex-col items-start">
                          <div>
                              <span>{new Date(invitation.dtstart).toLocaleString()} - {new Date(invitation.dtend).toLocaleString()}</span>
                              <p className="text-sm text-muted-foreground">From: {allUsers.find(u => u.id === invitation.senderUserId)?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">Suggestion: {invitation.gptSuggestion || invitation.eventSummary}</p>
                          </div>
                          <div className="modal-actions mt-2 w-full justify-end">
                              <button onClick={() => handleAcceptInvitation(invitation.id)} className="btn btn-up mr-2">Accept</button>
                              <button onClick={() => handleRejectInvitation(invitation.id)} className="btn btn-down">Reject</button>
                          </div>
                      </div>
                  ))
              ) : (
                  <p className="text-muted-foreground">No pending invitations.</p>
              )}
          </div>
        </div>
      </div>

      {selectedSlot && (
        <EventModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onCreateEvent={handleCreateEvent}
          gptSuggestion={modalGptSuggestion}
          isLoadingGptSuggestion={isLoadingGptSuggestion}
        />
      )}

      {showMyCalendar && (
        <MyCalendarModal
          userEvents={myUpcomingEvents}
          onClose={() => setShowMyCalendar(false)}
        />
      )}
    </div>
  );
}
