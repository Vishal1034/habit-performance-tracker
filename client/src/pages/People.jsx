import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, buildApiUrl } from '../utils/apiFetch';

const People = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const response = await apiFetch(buildApiUrl('/api/users'), {}, logout);
        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Failed to fetch users');
        }

        if (isMounted) {
          setUsers(Array.isArray(result.data) ? result.data : []);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.message || 'Unable to load users');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <Sidebar />
      <div className="ml-64 flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-950">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">People</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">All users who logged in using dummy or real email.</p>

        <div className="mt-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-slate-700 dark:text-slate-300">Loading users...</div>
          ) : error ? (
            <div className="p-6 text-rose-600 dark:text-rose-400">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-slate-600 dark:text-slate-400">No users have logged in yet.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 text-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Last Login</th>
                  <th className="px-4 py-3 font-medium">Login Count</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3 capitalize">{user.mode}</td>
                    <td className="px-4 py-3">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '--'}
                    </td>
                    <td className="px-4 py-3">{user.loginCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default People;
