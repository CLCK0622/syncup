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
    <div className="main-container flex flex-col items-center justify-center min-h-screen">
      <div className="text-center p-8 bg-card rounded-lg shadow-lg border border-border">
        <h1 className="text-3xl font-semibold mb-6">Enter your name</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="input"
          />
          <button type="submit" className="btn">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
