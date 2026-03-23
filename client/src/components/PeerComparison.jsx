import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, buildApiUrl } from '../utils/apiFetch';

const LIVE_REFRESH_MS = 10000;

const PeerComparison = () => {
  const { logout } = useAuth();
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPeerData = async () => {
      try {
        const response = await apiFetch(buildApiUrl('/api/analytics/peers'), {
          headers: {
            'Content-Type': 'application/json'
          }
        }, logout);
        const result = await response.json();
        if (result.success && isMounted) {
          setComparisonData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch peer data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPeerData();

    const intervalId = window.setInterval(() => {
      fetchPeerData();
    }, LIVE_REFRESH_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [logout]);

  if (loading) return <div className="text-slate-600 dark:text-slate-400 animate-pulse">Loading peer insights...</div>;
  if (!comparisonData) return null;

  const userTrackedSeconds = comparisonData.userTrackedTime ?? comparisonData.userFocusTime ?? 0;
  const peerTrackedSeconds = comparisonData.peerAverageTrackedTime ?? comparisonData.peerAverageTime ?? 0;
  const userMins = Math.round(userTrackedSeconds / 60);
  const peerMins = Math.round(peerTrackedSeconds / 60);

  const percentDiff = peerMins > 0
    ? Math.round(Math.abs((userMins - peerMins) / peerMins) * 100)
    : 0;

  const maxMins = Math.max(userMins, peerMins, 1);

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Global Peer Insights
        </h3>
        <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full">Anonymized Data</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            You have tracked <strong className="text-slate-900 dark:text-white">{userMins} mins</strong> total activity today (all visited sites).
          </p>
          <div className="mt-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            {comparisonData.isAboveAverage ? (
              <p className="text-emerald-400 font-medium">
                Top Tier! You are {percentDiff}% more active than the average Habit Stability Tracker user today. Keep it up!
              </p>
            ) : (
              <p className="text-indigo-400 font-medium">
                You are tracking {percentDiff}% below the community average today ({peerMins} mins). Time to focus!
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-indigo-700 dark:text-indigo-300 font-medium">You (all activity)</span>
              <span className="text-slate-600 dark:text-slate-400">{userMins}m</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-4">
              <div
                className="bg-indigo-500 h-4 rounded-full"
                style={{ width: `${Math.min((userMins / maxMins) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Community Average (all activity)</span>
              <span className="text-slate-600 dark:text-slate-400">{peerMins}m</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-4">
              <div
                className="bg-slate-600 h-4 rounded-full"
                style={{ width: `${Math.min((peerMins / maxMins) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerComparison;

