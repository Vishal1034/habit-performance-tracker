import React from 'react';

const HabitCard = ({ name, type, timeSpent, completionRate }) => {
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const isFocus = type === 'focus';
  const barColor = isFocus ? 'bg-emerald-500' : 'bg-rose-500';
  const badgeColor = isFocus ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400';

  return (
     <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
           <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{name}</h3>
           <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{formatTime(timeSpent)} logged today</p>
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${badgeColor}`}>
          {isFocus ? 'Focus' : 'Distraction'}
        </span>
      </div>

       <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2.5 mt-4">
        <div
          className={`${barColor} h-2.5 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(completionRate, 100)}%` }}
        ></div>
      </div>

      <div className="flex justify-end mt-2">
         <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{completionRate}% of daily goal</span>
      </div>
    </div>
  );
};

export default HabitCard;
