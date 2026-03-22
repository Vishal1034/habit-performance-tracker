import React from 'react';
import Sidebar from '../components/Sidebar';
import ExportReport from '../components/ExportReport';

const Reports = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <Sidebar />
      <div className="ml-64 flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-950">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Reports</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Download your activity history and review export snapshots.</p>
        <ExportReport />
      </div>
    </div>
  );
};

export default Reports;
