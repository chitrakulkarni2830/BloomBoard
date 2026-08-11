import React, { useState } from 'react';
import { Package, Lock, User, AlertCircle, Flower } from 'lucide-react';

const PETALS = ['🌸', '🌺', '🌼', '🌻', '🌹', '💐', '🌷', '🏵️', '🌸', '🌼'];

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) throw new Error('Invalid credentials. Please try again.');
      const data = await response.json();
      onLoginSuccess(data.token, data.username, data.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, var(--color-1) 0%, var(--color-2) 50%, var(--color-4) 100%)' }}
    >
      {/* Floating petals */}
      <div className="petal-bg">
        {PETALS.map((p, i) => (
          <span key={i} className="petal" style={{ left: `${(i * 10) + 2}%` }}>{p}</span>
        ))}
      </div>

      {/* Corner decorations */}
      <span className="bloom-decor top-left">🌸</span>
      <span className="bloom-decor top-right">🌺</span>
      <span className="bloom-decor bot-left">🌷</span>
      <span className="bloom-decor bot-right">💐</span>

      {/* Card */}
      <div
        className="w-full max-w-sm relative z-10 page-enter"
        style={{
          background: 'rgba(255,250,246,0.92)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid var(--color-border)',
          borderRadius: '28px',
          boxShadow: '0 20px 60px rgba(255,97,97,0.14), 0 4px 20px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--color-5), var(--color-3), var(--color-5))' }} />

        {/* Header */}
        <div className="pt-10 pb-6 px-8 flex flex-col items-center" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-2), var(--color-4))',
              borderRadius: '20px',
              width: 72,
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              marginBottom: 16,
              boxShadow: '0 4px 16px rgba(255,97,97,0.2)'
            }}
          >
            🌸
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px', marginBottom: 4 }}>
            BloomBoard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Your perishable inventory, beautifully managed
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7">
          {error && (
            <div
              className="mb-5 flex items-center gap-3 text-sm"
              style={{
                background: 'var(--color-2)',
                border: '1px solid #F4B8B8',
                borderRadius: 12,
                padding: '10px 14px',
                color: '#c0392b'
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Username</label>
            <div style={{ position: 'relative' }}>
              <User
                size={15}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
              />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="field-input"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label className="field-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={15}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field-input"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: 24, padding: '13px', fontSize: 15 }}
          >
            {loading ? '🌸 Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Bottom hint */}
        <div style={{ padding: '0 32px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            Default credentials: <strong>admin</strong> / <strong>password</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
