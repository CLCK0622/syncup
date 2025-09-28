
import { useState } from 'react';

interface TimeSlot {
  start: Date;
  end: Date;
  availableUsers: string[];
}

interface EventModalProps {
  slot: TimeSlot;
  onClose: () => void;
  onCreateEvent: (summary: string) => void;
  gptSuggestion: string | null;
  isLoadingGptSuggestion: boolean; // Added isLoadingGptSuggestion prop
}

export default function EventModal({ slot, onClose, onCreateEvent, gptSuggestion, isLoadingGptSuggestion }: EventModalProps) {
  // Initialize the summary as a blank string, as requested.
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
        <p className="text-muted-foreground mb-2">Time: {slot.start.toLocaleString()} - {slot.end.toLocaleString()}</p>
        <p className="text-muted-foreground mb-4">Attendees: {slot.availableUsers.join(', ')}</p>
        {isLoadingGptSuggestion ? (
          <div className="mb-4 p-3 bg-muted rounded-md text-center">
            <p className="text-sm text-muted-foreground">Generating AI suggestion...</p>
          </div>
        ) : gptSuggestion && (
          <div className="mb-4 p-3 bg-muted rounded-md">
            <h3 className="font-semibold text-foreground text-sm mb-1">AI Suggestion:</h3>
            <p className="text-sm text-muted-foreground">{gptSuggestion}</p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Event summary"
            className="input"
            disabled={isLoadingGptSuggestion} // Disable input while loading
          />
          <div className="modal-actions">
            <button type="submit" className="btn" disabled={isLoadingGptSuggestion}>Create</button>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={isLoadingGptSuggestion}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
