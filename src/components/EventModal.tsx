import { useState } from 'react';

interface TimeSlot {
  start: Date;
  end: Date;
}

interface EventModalProps {
  slot: TimeSlot;
  onClose: () => void;
  onCreateEvent: (summary: string) => void;
}

export default function EventModal({ slot, onClose, onCreateEvent }: EventModalProps) {
  const [summary, setSummary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (summary.trim()) {
      onCreateEvent(summary.trim());
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Schedule Event</h2>
        <p>Time: {slot.start.toLocaleString()}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Event summary"
          />
          <div className="modal-actions">
            <button type="submit" className="btn">Create</button>
            <button type="button" onClick={onClose} className="btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
