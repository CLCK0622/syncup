interface TimeSlot {
  start: Date;
  end: Date;
  availableUsers: string[]; // Added to store names of available users
}

interface TimeSlotListProps {
  timeSlots: TimeSlot[];
  onSelectSlot: (slot: TimeSlot) => void;
}

export default function TimeSlotList({ timeSlots, onSelectSlot }: TimeSlotListProps) {
  return (
    <div className="free-day-card">
      {timeSlots.length > 0 ? (
        timeSlots.map((slot, index) => (
          <div key={index} className="free-day-item">
            <div>
              <span>{slot.start.toLocaleString()} - {slot.end.toLocaleString()}</span>
              <p className="text-sm text-muted-foreground">Available: {slot.availableUsers.join(', ')}</p>
            </div>
            <button onClick={() => onSelectSlot(slot)} className="btn btn-outline">
              Schedule
            </button>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground">No common free time slots found in the next 7 days.</p>
      )}
    </div>
  );
}
