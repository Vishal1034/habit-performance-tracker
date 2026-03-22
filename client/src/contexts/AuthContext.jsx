import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail') || '');

  const login = (email) => {
    const normalized = String(email || '').trim().toLowerCase();
    localStorage.setItem('userEmail', normalized);
    setUserEmail(normalized);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setUserEmail('');
  };

  const value = useMemo(
    () => ({ userEmail, isAuthenticated: Boolean(userEmail), login, logout }),
    [userEmail]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
