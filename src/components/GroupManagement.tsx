
import { useState } from 'react';

interface User {
  id: number;
  name: string;
  group_id: number | null;
}

interface GroupManagementProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export default function GroupManagement({ user, onUserUpdate }: GroupManagementProps) {
  const [joinCode, setJoinCode] = useState('');
  const [createdGroupCode, setCreatedGroupCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateGroup = async () => {
    setError(null);
    try {
      const response = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      if (response.ok) {
        setCreatedGroupCode(data.groupCode);
        onUserUpdate({ ...user, group_id: data.groupId });
      } else {
        setError(data.error || 'Failed to create group');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!joinCode.trim()) {
      setError('Please enter a group code.');
      return;
    }

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, groupCode: joinCode }),
      });

      const data = await response.json();
      if (response.ok) {
        onUserUpdate({ ...user, group_id: data.groupId });
      } else {
        setError(data.error || 'Failed to join group');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  return (
    <div className="page-container">
      <div className="group-management-card">
        <h1 className="login-title">Welcome, {user.name}!</h1>
        <p className="login-description">
          You are not yet in a group. Create a new one or join an existing group to continue.
        </p>

        <div className="form-section">
          <h2 className="form-title">Create a New Group</h2>
          {createdGroupCode ? (
            <div style={{ textAlign: 'center' }}>
              <p className="login-description">Your new group code is:</p>
              <p className="group-code">{createdGroupCode}</p>
              <p className="group-code-remark">Share this code with your friends!</p>
            </div>
          ) : (
            <button onClick={handleCreateGroup} className="btn">
              Create Group
            </button>
          )}
        </div>

        <div className="form-section">
          <h2 className="form-title">Join an Existing Group</h2>
          <form onSubmit={handleJoinGroup} className="login-form">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 4-digit code"
              maxLength={4}
              className="login-input"
              style={{ textAlign: 'center' }}
            />
            <button type="submit" className="btn btn-outline">
              Join Group
            </button>
          </form>
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
