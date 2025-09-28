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
    <div className="main-container">
      <div className="text-center">
        <h1>Enter your name</h1>
        <form onSubmit={handleSubmit} className="mt-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{ maxWidth: '400px', margin: '0 auto 1rem' }}
          />
          <button type="submit" className="btn">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
