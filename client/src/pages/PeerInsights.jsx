import React from 'react';
import Sidebar from '../components/Sidebar';
import PeerComparison from '../components/PeerComparison';

const PeerInsights = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <Sidebar />
      <div className="ml-64 flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-950">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Peer Insights</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Compare your focus consistency against anonymized community averages.</p>
        <PeerComparison />
      </div>
    </div>
  );
};

export default PeerInsights;
