import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AuthGate from './components/AuthGate';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Settings from './pages/Settings';
import PeerInsights from './pages/PeerInsights';
import Reports from './pages/Reports';
import People from './pages/People';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthGate />} />
          <Route
            path="/"
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/settings"
            element={(
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/peer-insights"
            element={(
              <ProtectedRoute>
                <PeerInsights />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/reports"
            element={(
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/people"
            element={(
              <ProtectedRoute>
                <People />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

function App() {
  return (
   <ThemeProvider>
     <AuthProvider>
       <AppContent />
     </AuthProvider>
   </ThemeProvider>
  );
}

export default App;
