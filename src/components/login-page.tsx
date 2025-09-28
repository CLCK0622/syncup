import { useState } from 'react';

interface LoginPageProps {
  onLogin: (name: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm p-8 space-y-6 bg-card rounded-lg shadow-lg border border-border">
        <h1 className="text-3xl font-bold text-center text-foreground">Login</h1>
        <p className="text-sm text-center text-muted-foreground">
          Please use a new username, and use this username for all subsequent entries.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your username"
            className="input"
          />
          <button type="submit" className="btn w-full">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
