'use client';

import { useState, useEffect } from 'react';
import LoginPage from '@/components/login-page';
import Dashboard from '@/components/dashboard';

// The user object now includes groupId, which can be null
interface User {
  id: number;
  name: string;
  group_id: number | null;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // On initial load, check local storage for a saved user session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved user data:", error);
        localStorage.removeItem('user'); // Clear corrupted data
      }
    }
  }, []);

  const handleLogin = async (name: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const userData: User = await response.json();
        // Save the full user object to state and local storage
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Login request error:', error);
    }
  };

  const handleSignOut = () => {
    // Clear user state and remove from local storage
    setUser(null);
    localStorage.removeItem('user');
  };

  // This function will be passed to the group management component
  // to update the user object after joining or creating a group.
  const refreshUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }

  return (
    <div className="main-div-container">
      {user ? (
        <Dashboard user={user} onSignOut={handleSignOut} onUserUpdate={refreshUser} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}
