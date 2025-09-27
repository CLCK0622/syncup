
import { useState, useEffect } from 'react';
import { getEvents } from '@/lib/store';
import InvitationModal from './invitation-modal';

const fakeData = {
  similarPlans: [
    {
      name: 'Alice',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
      activity: 'Coffee break',
    },
    {
      name: 'Bob',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
      activity: 'Grabbing a coffee',
    },
    {
      name: 'Charlie',
      avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
      activity: 'Coffee meeting',
    },
  ],
};

export default function ResultsPage() {
  const [nextEvent, setNextEvent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const events = getEvents();
    if (events.length > 0) {
      const now = new Date();
      const upcomingEvents = events
        .map(event => ({
          event,
          startDate: new Date(event.getFirstPropertyValue('dtstart').toJSDate()),
        }))
        .filter(item => item.startDate > now)
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      if (upcomingEvents.length > 0) {
        setNextEvent(upcomingEvents[0].event);
      }
    }
  }, []);

  const handleDoubleClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-4">
      <InvitationModal isOpen={isModalOpen} onClose={closeModal} />
      <h2 className="text-2xl font-bold mb-4">Your next activity</h2>
      {nextEvent ? (
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <p className="text-lg font-semibold">{nextEvent.getFirstPropertyValue('summary')}</p>
          <p className="text-gray-600">
            {new Date(nextEvent.getFirstPropertyValue('dtstart').toJSDate()).toLocaleString()}
          </p>
          <p className="text-gray-600">{nextEvent.getFirstPropertyValue('location')}</p>
        </div>
      ) : (
        <p className="mb-8 text-gray-600">No upcoming events found.</p>
      )}
      <h2 className="text-2xl font-bold mb-4">People with similar plans</h2>
      <ul>
        {fakeData.similarPlans.map((person, index) => (
          <li
            key={index}
            className="flex items-center mb-4 cursor-pointer p-2 bg-white rounded-lg shadow"
            onDoubleClick={handleDoubleClick}
          >
            <img src={person.avatar} alt={person.name} className="w-12 h-12 rounded-full mr-4" />
            <div>
              <p className="text-lg font-semibold">{person.name}</p>
              <p className="text-gray-600">{person.activity}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
