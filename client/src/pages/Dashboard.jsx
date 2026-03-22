import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import HabitCard from '../components/HabitCard';
import PeerComparison from '../components/PeerComparison';
import ExportReport from '../components/ExportReport';
import DailyAnalyticsPanel from '../components/DailyAnalyticsPanel';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, buildApiUrl } from '../utils/apiFetch';

const LIVE_REFRESH_MS = 10000;

const Dashboard = () => {
  const { logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async ({ silent = false } = {}) => {
      try {
        const response = await apiFetch(buildApiUrl('/api/analytics/today'), {
          headers: {
            'Content-Type': 'application/json'
          }
        }, logout);
        const result = await response.json();

        if (result.success && isMounted) {
          setAnalytics(result.data);
          setLastSyncedAt(new Date());
          setSyncError('');
        } else if (isMounted) {
          setSyncError(result?.message || 'Sync failed');
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        if (isMounted) {
          setSyncError('Connection issue while syncing');
        }
      } finally {
        if (!silent && isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    const intervalId = window.setInterval(() => {
      fetchAnalytics({ silent: true });
    }, LIVE_REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [logout]);

  if (loading) {
     return <div className="min-h-screen bg-white dark:bg-slate-950 flex justify-center items-center text-slate-900 dark:text-white">Loading Habit Stability Tracker...</div>;
  }

  return (
     <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <Sidebar />

       <div className="ml-64 flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-950">

        <header className="mb-8">
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Today's Overview</h2>
           <p className="text-slate-600 dark:text-slate-400 mt-2">Track your focus and manage digital distractions.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              Auto-sync every {Math.round(LIVE_REFRESH_MS / 1000)}s
            </span>
            <span className={`px-3 py-1 rounded-full border ${syncError ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300' : 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'}`}>
              {syncError
                ? syncError
                : `Last synced: ${lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'waiting...'}`}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg border border-indigo-500/30 text-white relative overflow-hidden">
            <h3 className="text-indigo-100 font-medium mb-1">Stability Score</h3>
            <div className="text-5xl font-bold">{analytics?.hasCategorizedData ? analytics.stabilityScore : '--'}</div>
            <p className="text-indigo-200 text-sm mt-2">Target: {'>'} 75</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-slate-600 dark:text-slate-400 font-medium mb-1">Total Focus Time</h3>
            <div className="text-3xl font-bold text-emerald-400">
              {Math.round((analytics?.totalFocusTime || 0) / 60)} <span className="text-lg text-slate-500 dark:text-slate-500 font-normal">mins</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-slate-600 dark:text-slate-400 font-medium mb-1">Total Distraction</h3>
            <div className="text-3xl font-bold text-rose-400">
               {Math.round((analytics?.totalDistractionTime || 0) / 60)} <span className="text-lg text-slate-500 dark:text-slate-500 font-normal">mins</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Habit Breakdown</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics?.detailedProgress?.length > 0 ? (
              analytics.detailedProgress.map((habit, index) => (
                <HabitCard
                  key={index}
                  name={habit.name}
                  type={habit.type}
                  timeSpent={habit.timeSpent}
                  completionRate={habit.completionRate}
                />
              ))
            ) : (
              <div className="col-span-2 bg-slate-50 dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
                No activity tracked yet today. Make sure your extension is running!
              </div>
            )}
          </div>
        </div>

        <PeerComparison />

        <DailyAnalyticsPanel />

        <ExportReport />

      </div>
    </div>
  );
};

export default Dashboard;

