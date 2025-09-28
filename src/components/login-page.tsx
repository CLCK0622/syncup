
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
    <div className="login-page-container">
      <div className="login-card">
        <img src="/logo-512x512.png" alt="SyncUP Logo" className="login-logo" />
        <h1 className="login-title">Login to SyncUp</h1>
        <p className="login-description">
          Enter a consistent username for all your sessions.
        </p>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Username"
            className="login-input"
          />
          <button type="submit" className="btn">
            Continue
          </button>
        </form>

        <div className="payment-section">
          <img src="/payment.png" alt="Payment Information" className="payment-image" />
          <p className="payment-remark">
            We need support. Make sure to type your User ID for social media X or phone number along with the payment so that we can get back to you later.
          </p>
        </div>
      </div>
    </div>
  );
}
