
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
    <div className="page-container">
      <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
        <h1 className="card-title">Enter your name</h1>
        <form onSubmit={handleSubmit} className="inline-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Your name"
          />
          <button type="submit" className="button">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
