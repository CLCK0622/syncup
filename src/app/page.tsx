'use client';

import { useState } from 'react';
import LoginPage from '@/components/login-page';
import Dashboard from '@/components/dashboard';

export default function Home() {
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);

  const handleLogin = async (name: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Login request error:', error);
    }
  };

  return (
    <div>
      {user ? (
        <Dashboard user={user} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}
