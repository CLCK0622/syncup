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
      <div className="login-card-fixed-width mx-auto my-8 p-4 space-y-4 bg-card rounded-lg shadow-lg border border-border">
        <h1 className="text-xl font-bold text-center text-foreground">Login</h1>
        <p className="text-sm text-center text-muted-foreground leading-tight">
          Please use a new username, and use this username for all subsequent entries.
        </p>
        <form onSubmit={handleSubmit} className="flex items-center space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Username"
            className="input text-sm w-full"
          />
          <button type="submit" className="btn w-1/2 text-sm ml-1">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
