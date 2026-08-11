import React, { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';

const PETALS = ['🌸','🌺','🌼','🌹','🌷','💐','🌸','🌺','🌼','🌻'];

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
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials. Please try again.');
      const data = await res.json();
      onLoginSuccess(data.token, data.username, data.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Floating petals */}
      <div className="petal-bg">
        {PETALS.map((p, i) => (
          <span key={i} className="petal">{p}</span>
        ))}
      </div>

      {/* Blurred ambient corner blooms */}
      <span className="bloom-corner tr">🌺</span>
      <span className="bloom-corner bl">🌸</span>

      {/* Login card */}
      <div
        className="anim-fade-up"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 380,
          background: 'rgba(255,250,246,0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg), 0 0 0 1px rgba(255,255,255,0.7) inset',
          overflow: 'hidden',
        }}
      >
        {/* Rainbow accent stripe */}
        <div style={{
          height: 4,
          background: 'linear-gradient(90deg, var(--c5) 0%, var(--c3) 50%, var(--c5) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
        }} />

        {/* Header */}
        <div style={{
          padding: '36px 36px 28px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          background: 'linear-gradient(to bottom, var(--c2), var(--c1))',
        }}>
          {/* Logo mark */}
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #ffe0e0, var(--c4))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 38,
            boxShadow: '0 4px 20px rgba(255,97,97,0.18)',
            border: '1.5px solid rgba(255,97,97,0.12)',
            animation: 'leafSway 5s ease-in-out infinite',
          }}>
            🌸
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.3px',
              marginBottom: 4,
            }}>
              BloomBoard
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Your perishable inventory, beautifully managed
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 36px 32px' }}>
          {error && (
            <div style={{
              marginBottom: 18,
              background: 'var(--crimson-bg)',
              border: '1px solid rgba(184,50,50,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--crimson)',
              fontSize: 13,
              animation: 'fadeUp 0.2s ease',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="field-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{
                  position: 'absolute', left: 13, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-faint)',
                }} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  className="field-input"
                  style={{ paddingLeft: 36 }}
                  id="login-username"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{
                  position: 'absolute', left: 13, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-faint)',
                }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="field-input"
                  style={{ paddingLeft: 36 }}
                  id="login-password"
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            id="btn-login-submit"
            style={{ width: '100%', justifyContent: 'center', marginTop: 24, padding: '13px', fontSize: 15 }}
          >
            {loading
              ? <><span style={{ animation: 'leafSway 0.8s ease infinite', display: 'inline-block' }}>🌸</span>&nbsp; Signing in…</>
              : 'Sign In'}
          </button>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span>Florist Admin: <strong style={{ color: 'var(--text-muted)' }}>admin</strong> / <strong style={{ color: 'var(--text-muted)' }}>password</strong></span>
            <span>Customer Shop: <strong style={{ color: 'var(--text-muted)' }}>alice</strong> / <strong style={{ color: 'var(--text-muted)' }}>password</strong></span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
