import React from 'react';
import Sidebar from '../components/Sidebar';
import HabitManager from '../components/HabitManager';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { logout } = useAuth();

  return (
     <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      <Sidebar />
       <div className="ml-64 flex-1 h-screen overflow-y-auto bg-white dark:bg-slate-950">
        <HabitManager onLogout={logout} />
      </div>
    </div>
  );
};

export default Settings;
