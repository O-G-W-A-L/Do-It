import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Use the correct endpoint
    axios.get('auth/hello/')
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error('There was an error!', error);
      });
  }, []);

  return (
    <Router>
      <AuthProvider>
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
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}