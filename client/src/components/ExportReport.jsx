import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch, buildApiUrl } from '../utils/apiFetch';

const ExportReport = () => {
  const { logout } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCSV = async () => {
    try {
      setIsDownloading(true);

      const response = await apiFetch(buildApiUrl('/api/reports/csv'), {
        method: 'GET',
        headers: {}
      }, logout);

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'habit-stability-tracker_activity_report.csv');

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Could not download the report. Please try again later.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Data Export</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Download your raw tracking history for external analysis.</p>
        </div>

        <button
          onClick={handleDownloadCSV}
          disabled={isDownloading}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? 'Generating...' : 'Download CSV'}
        </button>
      </div>
    </div>
  );
};

export default ExportReport;

