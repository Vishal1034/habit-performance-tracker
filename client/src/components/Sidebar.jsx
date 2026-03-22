import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = () => {
  const { userEmail, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
       isActive ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-200 dark:hover:bg-slate-800'
    }`;

  return (
     <div className="h-screen w-64 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex flex-col fixed top-0 left-0 border-r border-slate-200 dark:border-slate-700">
      <div className="p-6">
         <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
          <span className="text-indigo-500">âš¡</span> Habit Stability Tracker
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <NavLink to="/" end className={navClass}>
          <span>ðŸ“Š</span> Dashboard
        </NavLink>
        <NavLink to="/settings" className={navClass}>
          <span>âš™ï¸</span> Habit Config
        </NavLink>
        <NavLink to="/peer-insights" className={navClass}>
          <span>ðŸ†</span> Peer Insights
        </NavLink>
        <NavLink to="/people" className={navClass}>
          <span>ðŸ‘¥</span> People
        </NavLink>
        <NavLink to="/reports" className={navClass}>
          <span>ðŸ“„</span> Reports
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <button
            onClick={toggleTheme}
             className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg transition-colors text-sm"
          >
            {isDark ? 'â˜€ï¸ Light Mode' : 'ðŸŒ™ Dark Mode'}
          </button>
        
         <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
           <p className="text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-400">Active Email</p>
           <p className="mt-1 text-sm text-slate-900 dark:text-slate-100 break-all">{userEmail || 'Not logged in'}</p>
           <p className="mt-2 text-xs text-amber-500 dark:text-amber-300">Use this same email in extension popup.</p>
        </div>

        <button
          onClick={logout}
           className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg transition-colors text-sm"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

