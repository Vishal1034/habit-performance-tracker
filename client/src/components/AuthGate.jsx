import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl } from '../utils/apiFetch';

const AuthGate = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loginWithBackend = async (mode) => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, mode })
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Login failed.');
      }

      login(result?.user?.email || email);
    } catch (apiError) {
      setError(apiError.message || 'Unable to login right now.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
       <div className="w-full max-w-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-lg">
         <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Habit Stability Tracker Login</h1>
         <p className="text-slate-600 dark:text-slate-400 mb-6">Login with your email and password.</p>

        <div className="space-y-3 mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
             className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
             className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Password"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => loginWithBackend('real')}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-60"
            >
              {isLoading ? 'Signing In...' : 'Login (Configured Real Email)'}
            </button>
            <button
              type="button"
              onClick={() => loginWithBackend('dummy')}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-60"
            >
              {isLoading ? 'Signing In...' : 'Login (Dummy Email)'}
            </button>
          </div>
        </div>
        {error ? <p className="text-rose-400 text-sm">{error}</p> : null}
      </div>
    </div>
  );
};

export default AuthGate;

