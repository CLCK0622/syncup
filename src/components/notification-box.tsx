
import { useState } from 'react';

const fakeInvitations = [
  {
    id: 1,
    name: 'David',
    activity: 'Coffee break',
  },
  {
    id: 2,
    name: 'Emily',
    activity: 'Grabbing a coffee',
  },
];

export default function NotificationBox() {
  const [invitations, setInvitations] = useState(fakeInvitations);

  const handleAccept = (id: number) => {
    setInvitations(invitations.filter((inv) => inv.id !== id));
  };

  const handleReject = (id: number) => {
    setInvitations(invitations.filter((inv) => inv.id !== id));
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Invitations</h2>
      {invitations.length === 0 ? (
        <p className="text-gray-600">No new invitations.</p>
      ) : (
        <ul>
          {invitations.map((invitation) => (
            <li key={invitation.id} className="mb-4 p-4 bg-white rounded-lg shadow">
              <p className="font-semibold">{invitation.name}</p>
              <p className="text-gray-600">{invitation.activity}</p>
              <div className="flex mt-2">
                <button
                  onClick={() => handleAccept(invitation.id)}
                  className="px-3 py-1 mr-2 text-sm text-white bg-green-500 rounded-md hover:bg-green-600"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleReject(invitation.id)}
                  className="px-3 py-1 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
