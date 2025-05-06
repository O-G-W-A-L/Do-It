// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoutineProvider } from './contexts/RoutineContext';

// Pages
import LandingPage       from './pages/LandingPage';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import Dashboard         from './pages/Dashboard';
import EmailVerification from './pages/EmailVerification';

// ← Added these two imports for your existing pages:
import ProfilePage from './pages/ProfilePage';
import Settings          from './pages/Settings';
import Support           from './pages/Support';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:8000/api/hello/')
      .then(response => setMessage(response.data.message))
      .catch(error => console.error('There was an error!', error));
  }, []);

  return (
    <Router>
      <AuthProvider>
        <RoutineProvider>
          <div>
            <h1>{message}</h1>
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

              {/* ← New protected routes */}
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
          </div>
        </RoutineProvider>
      </AuthProvider>
    </Router>
  );
}
