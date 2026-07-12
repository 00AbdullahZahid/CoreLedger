'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) { router.push('/dashboard'); router.refresh(); }
    else setError('Wrong password.');
  }

  return (
    <div className="login-body">
      <div className="login-card">
        <h1>CFT Budget</h1>
        <p className="muted" style={{ marginTop: 4 }}>Sign in to manage your budget.</p>
        {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} autoFocus required />
          <button type="submit">Sign in</button>
        </form>
      </div>
    </div>
  );
}
