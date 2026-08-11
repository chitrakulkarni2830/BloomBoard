import React, { useState } from 'react';
import { Package, Lock, User, AlertCircle } from 'lucide-react';

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

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      onLoginSuccess(data.token, data.username, data.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8 pb-6 bg-slate-50 border-b border-slate-100 flex flex-col items-center">
          <div className="bg-rose-100 p-4 rounded-2xl mb-4 shadow-sm shadow-rose-200">
            <Package className="w-10 h-10 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">BloomBoard</h2>
          <p className="text-slate-500 mt-2 text-sm text-center">
            Sign in to access the perishable inventory system
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 border border-red-100 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-rose-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
