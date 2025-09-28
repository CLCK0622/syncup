
import { useState, useEffect } from 'react';
import TimeSlotList from './TimeSlotList';
import EventModal from './EventModal';
import MyCalendarModal from './MyCalendarModal';
import GroupManagement from './GroupManagement';

interface User {
  id: number;
  name: string;
  group_id: number | null;
}

interface DashboardProps {
  user: User;
  onSignOut: () => void;
  onUserUpdate: (user: User) => void;
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

interface GroupInfo {
    id: number;
    group_code: string;
}

export default function Dashboard({ user, onSignOut, onUserUpdate }: DashboardProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [commonFreeTimeSlots, setCommonFreeTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: number; name: string }[]>([]);
  const [groupMembers, setGroupMembers] = useState<{ id: number; name: string }[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMyCalendar, setShowMyCalendar] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [modalGptSuggestion, setModalGptSuggestion] = useState<string | null>(null);
  const [isLoadingGptSuggestion, setIsLoadingGptSuggestion] = useState<boolean>(false);

  // Refactored into a single, reusable data fetching function
  const fetchAllData = async () => {
    if (!user.group_id) return;
    setIsLoading(true);
    try {
      const [groupMembersRes, groupInfoRes, eventsRes, usersRes, invitationsRes] = await Promise.all([
        fetch(`/api/groups/${user.group_id}/members`),
        fetch(`/api/groups/${user.group_id}`),
        fetch('/api/calendars'),
        fetch('/api/users'),
        fetch(`/api/invitations?recipientUserId=${user.id}`)
      ]);

      const groupMembersData = await groupMembersRes.json();
      const groupInfoData = await groupInfoRes.json();
      const allEventsData: CalendarEvent[] = await eventsRes.json();
      const allUsersData = await usersRes.json();
      const allInvitationsData = await invitationsRes.json();

      setGroupMembers(groupMembersData);
      setGroupInfo(groupInfoData);
      setAllUsers(allUsersData);

      const groupMemberNames = groupMembersData.map((m: User) => m.name);
      const futureEvents = allEventsData.filter(event => new Date(event.dtstart) > new Date());
      const groupEvents = futureEvents.filter(event => groupMemberNames.includes(event.name));
      setEvents(groupEvents);

      const groupMemberIds = groupMembersData.map((m: User) => m.id);
      const groupInvitations = allInvitationsData.filter((inv: any) => groupMemberIds.includes(inv.sender_user_id));
      setPendingInvitations(groupInvitations.map((inv: any) => ({ ...inv, senderUserId: inv.sender_user_id, recipientUserId: inv.recipient_user_id, eventSummary: inv.event_summary, gptSuggestion: inv.gpt_suggestion, createdAt: inv.created_at })));

      // Recalculate time slots with the new data
      findCommonFreeTimeSlots(groupEvents, groupMemberNames);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user.group_id) {
      fetchAllData();
    }
  }, [user.group_id]);

  const findCommonFreeTimeSlots = (groupEvents: CalendarEvent[], groupMemberNames: string[]) => {
    // This logic remains the same...
    const requiredMinDuration = 120;
    const intervalDuration = 30;
    const isBusy = (checkStart: Date, checkEnd: Date, eventList: CalendarEvent[]) => {
      return eventList.some(event => {
        const eventStart = new Date(event.dtstart);
        const eventEnd = new Date(event.dtend);
        return checkStart < eventEnd && checkEnd > eventStart;
      });
    };
    const potentialSlots: TimeSlot[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const day = new Date(today); day.setDate(today.getDate() + i);
      for (let totalMinutes = 8 * 60; totalMinutes < 22 * 60; totalMinutes += intervalDuration) {
        const start = new Date(day); start.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
        const end = new Date(start); end.setMinutes(start.getMinutes() + intervalDuration);
        const availableInInterval = groupMemberNames.filter(name => 
          !isBusy(start, end, groupEvents.filter(e => e.name === name))
        );
        if (availableInInterval.length >= 3) {
          potentialSlots.push({ start, end, availableUsers: availableInInterval });
        }
      }
    }
    const contiguousBlocks: TimeSlot[] = [];
    if (potentialSlots.length > 0) {
      let currentBlock = { ...potentialSlots[0] };
      for (let i = 1; i < potentialSlots.length; i++) {
        const prev = potentialSlots[i - 1];
        const current = potentialSlots[i];
        if (current.start.getTime() === prev.end.getTime() && JSON.stringify(current.availableUsers.sort()) === JSON.stringify(prev.availableUsers.sort())) {
          currentBlock.end = current.end;
        } else {
          if ((currentBlock.end.getTime() - currentBlock.start.getTime()) / 60000 >= requiredMinDuration) {
            contiguousBlocks.push(currentBlock);
          }
          currentBlock = { ...current };
        }
      }
      if ((currentBlock.end.getTime() - currentBlock.start.getTime()) / 60000 >= requiredMinDuration) {
        contiguousBlocks.push(currentBlock);
      }
    }
    setCommonFreeTimeSlots(contiguousBlocks);
  };

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        const response = await fetch('/api/groups/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) });
        if (response.ok) onUserUpdate({ ...user, group_id: null });
      } catch (error) { console.error('Error leaving group:', error); }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await fetch('/api/calendars', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, icsContent: e.target?.result as string }) });
        // CORRECTED: Call the single, reliable data fetching function
        fetchAllData();
      } catch (error) { console.error('Error uploading calendar:', error); }
    };
    reader.readAsText(file);
  };

  const handleSchedule = async (slot: TimeSlot) => {
    // This logic remains the same...
    setSelectedSlot(slot);
    setIsLoadingGptSuggestion(true);
    try {
      const response = await fetch('/api/gpt-suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startTime: slot.start.toISOString(), endTime: slot.end.toISOString(), availableUsers: slot.availableUsers, duration: (slot.end.getTime() - slot.start.getTime()) / 60000 }) });
      if (response.ok) setModalGptSuggestion((await response.json()).suggestion);
      else setModalGptSuggestion('Could not get suggestions at this time.');
    } catch (error) { setModalGptSuggestion('Failed to connect to suggestion service.'); }
    finally { setIsLoadingGptSuggestion(false); }
  };

  const handleCreateEvent = async (summary: string) => {
    // This logic remains the same...
    if (!selectedSlot) return;
    const recipientIds = allUsers.filter(u => selectedSlot.availableUsers.includes(u.name) && u.id !== user.id).map(u => u.id);
    try {
      await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary, dtstart: selectedSlot.start.toISOString(), dtend: selectedSlot.end.toISOString(), userIds: [user.id] }) });
      if (recipientIds.length > 0) {
        await fetch('/api/invitations/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senderUserId: user.id, recipientUserIds: recipientIds, summary, dtstart: selectedSlot.start.toISOString(), dtend: selectedSlot.end.toISOString(), gptSuggestion: modalGptSuggestion || summary }) });
      }
      setSelectedSlot(null);
      fetchAllData();
    } catch (error) { console.error('Error creating event or sending invitations:', error); }
  };

  const handleAcceptInvitation = async (invitationId: number) => {
    const inv = pendingInvitations.find(i => i.id === invitationId);
    if (!inv) return;
    try {
      // CORRECTED: Added the missing 'availableUserIds' field to the request body
      await fetch('/api/invitations/accept', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          invitationId, 
          userId: user.id, 
          summary: inv.gptSuggestion || inv.eventSummary, 
          dtstart: inv.dtstart, 
          dtend: inv.dtend,
          availableUserIds: [user.id] // The backend requires this field
        }) 
      });
      fetchAllData();
    } catch (error) { console.error(`Error accepting invitation ${invitationId}:`, error); }
  };

  const handleRejectInvitation = async (invitationId: number) => {
    // This logic remains the same...
    try {
      await fetch('/api/invitations/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invitationId, userId: user.id }) });
      fetchAllData();
    } catch (error) { console.error(`Error rejecting invitation ${invitationId}:`, error); }
  };

  if (!user.group_id) {
    // Pass the onSignOut prop down to the GroupManagement component
    return <GroupManagement user={user} onUserUpdate={onUserUpdate} onSignOut={onSignOut} />;
  }

  return (
    <div className="main-container">
      <header className="dashboard-header">
        <div className="app-header">
          <img src="/logo-512x512.png" alt="SyncUP Logo" className="app-logo" />
          <h1 className="app-title">SyncUP</h1>
        </div>
        <div className="dashboard-actions">
          <button onClick={() => setShowMyCalendar(true)} className="btn btn-outline">My Calendar</button>
          <label className="upload-label"><input type="file" accept=".ics" onChange={handleFileUpload} style={{ display: 'none' }} />Upload</label>
          <button onClick={fetchAllData} className="btn btn-outline">Refresh</button>
          <button onClick={onSignOut} className="btn btn-ghost">Sign Out</button>
        </div>
      </header>

      {isLoading ? (
        <p>Loading dashboard...</p>
      ) : (
        <div className="dashboard-grid">
          <div className="dashboard-column">
            <h2>Common Free Time Slots</h2>
            <TimeSlotList timeSlots={commonFreeTimeSlots} onSelectSlot={handleSchedule} />
          </div>

          <div className="dashboard-column">
            <div className="event-card mb-4">
              <div className="card-header">
                <h3 className="event-summary">Your Group (Code: {groupInfo?.group_code || '...'})</h3>
                <button onClick={handleLeaveGroup} className="btn btn-down btn-sm">Leave</button>
              </div>
              <div className="list-container">
                {groupMembers.length > 0 ? (
                  groupMembers.map(member => (
                    <div key={member.id} className="free-day-item"><span>{member.name}</span></div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No members found.</p>
                )}
              </div>
            </div>

            <div className="event-card">
              <h3 className="event-summary">Pending Invitations</h3>
              {pendingInvitations.length > 0 ? (
                pendingInvitations.map(invitation => (
                  <div key={invitation.id} className="invitation-item">
                    <div>
                      <span>{new Date(invitation.dtstart).toLocaleString()} - {new Date(invitation.dtend).toLocaleString()}</span>
                      <p>From: {allUsers.find(u => u.id === invitation.senderUserId)?.name || 'Unknown'}</p>
                      <p>Suggestion: {invitation.gptSuggestion || invitation.eventSummary}</p>
                    </div>
                    <div className="modal-actions">
                      <button onClick={() => handleAcceptInvitation(invitation.id)} className="btn btn-up btn-auto">Accept</button>
                      <button onClick={() => handleRejectInvitation(invitation.id)} className="btn btn-down btn-auto">Reject</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No pending invitations.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedSlot && <EventModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} onCreateEvent={handleCreateEvent} gptSuggestion={modalGptSuggestion} isLoadingGptSuggestion={isLoadingGptSuggestion} />}
      {showMyCalendar && <MyCalendarModal userEvents={events.filter(e => e.name === user.name)} onClose={() => setShowMyCalendar(false)} />}
    </div>
  );
}
