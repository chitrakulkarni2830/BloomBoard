import React, { useState } from 'react';
import { Lock, User, AlertCircle, UserPlus, LogIn, Shield, Store, Truck } from 'lucide-react';
import { API_BASE_URL } from './config';

const PETALS = ['🌸','🌺','🌼','🌹','🌷','💐','🌸','🌺','🌼','🌻'];

const Login = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('ROLE_CUSTOMER');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegistering
      ? { username, password, role: selectedRole }
      : { username, password };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (isRegistering ? 'Registration failed. Try a different username.' : 'Invalid credentials. Please try again.'));
      }

      onLoginSuccess(data.token, data.username, data.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
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

      {/* Login / Register card */}
      <div
        className="anim-fade-up"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 420,
          background: 'rgba(255,250,246,0.92)',
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
          padding: '32px 36px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          background: 'linear-gradient(to bottom, var(--c2), var(--c1))',
        }}>
          {/* Logo mark */}
          <div style={{
            width: 68,
            height: 68,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #ffe0e0, var(--c4))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            boxShadow: '0 4px 20px rgba(255,97,97,0.18)',
            border: '1.5px solid rgba(255,97,97,0.12)',
            animation: 'leafSway 5s ease-in-out infinite',
          }}>
            🌸
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.3px',
              marginBottom: 4,
            }}>
              {isRegistering ? 'Create Account' : 'BloomBoard'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {isRegistering
                ? 'Join BloomBoard to shop or manage perishable inventory'
                : 'Your perishable inventory, beautifully managed'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 32px 28px' }}>
          {error && (
            <div style={{
              marginBottom: 16,
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isRegistering && (
              <div>
                <label className="field-label" style={{ marginBottom: 6, display: 'block' }}>Account Type / Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('ROLE_CUSTOMER')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      border: selectedRole === 'ROLE_CUSTOMER' ? '2px solid var(--c5)' : '1px solid var(--border)',
                      background: selectedRole === 'ROLE_CUSTOMER' ? 'var(--c2)' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: selectedRole === 'ROLE_CUSTOMER' ? 'var(--c5)' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Store size={18} />
                    <span>Customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('ROLE_ADMIN')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      border: selectedRole === 'ROLE_ADMIN' ? '2px solid var(--c5)' : '1px solid var(--border)',
                      background: selectedRole === 'ROLE_ADMIN' ? 'var(--c2)' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: selectedRole === 'ROLE_ADMIN' ? 'var(--c5)' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Shield size={18} />
                    <span>Florist Shop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('ROLE_DELIVERY')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      border: selectedRole === 'ROLE_DELIVERY' ? '2px solid var(--c5)' : '1px solid var(--border)',
                      background: selectedRole === 'ROLE_DELIVERY' ? 'var(--c2)' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: selectedRole === 'ROLE_DELIVERY' ? 'var(--c5)' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Truck size={18} />
                    <span>Delivery</span>
                  </button>
                </div>
              </div>
            )}

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
                  placeholder={isRegistering ? "new_user" : "admin"}
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
            style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '12px', fontSize: 14 }}
          >
            {loading ? (
              <><span style={{ animation: 'leafSway 0.8s ease infinite', display: 'inline-block' }}>🌸</span>&nbsp; {isRegistering ? 'Registering…' : 'Signing in…'}</>
            ) : (
              isRegistering ? <><UserPlus size={16} /> Register & Sign In</> : <><LogIn size={16} /> Sign In</>
            )}
          </button>

          {/* Toggle between Login and Register */}
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <button
              type="button"
              onClick={toggleMode}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--c5)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isRegistering ? 'Already have an account? Sign In' : 'New user? Register an account'}
            </button>
          </div>

          {/* Helper demo accounts */}
          {!isRegistering && (
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <span>Florist Shop: <strong style={{ color: 'var(--text-muted)' }}>admin</strong> / <strong style={{ color: 'var(--text-muted)' }}>password</strong></span>
              <span>Delivery Agent: <strong style={{ color: 'var(--text-muted)' }}>rider</strong> / <strong style={{ color: 'var(--text-muted)' }}>password</strong></span>
              <span>Customer: <strong style={{ color: 'var(--text-muted)' }}>alice</strong> / <strong style={{ color: 'var(--text-muted)' }}>password</strong></span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
