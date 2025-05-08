// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoutineProvider } from './contexts/RoutineContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import EmailVerification from './pages/EmailVerification';
import ProfilePage from './pages/ProfilePage';
import Settings from './pages/Settings';
import Support from './pages/Support';

function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <AuthProvider>
          <RoutineProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route
                path="/dashboard"
                element={
                  <Protected>
                    <Dashboard />
                  </Protected>
                }
              />

              <Route path="/verify-email/:key" element={<EmailVerification />} />

              <Route
                path="/profile"
                element={
                  <Protected>
                    <ProfilePage />
                  </Protected>
                }
              />

              <Route
                path="/settings"
                element={
                  <Protected>
                    <Settings />
                  </Protected>
                }
              />

              <Route
                path="/support"
                element={
                  <Protected>
                    <Support />
                  </Protected>
                }
              />
            </Routes>
          </RoutineProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}
