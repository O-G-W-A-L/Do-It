import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CourseProvider } from './contexts/CourseContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { NotificationProvider } from './contexts/NotificationContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import Hub from './pages/Hub';
import CourseDiscovery from './pages/CourseDiscovery';
import EmailVerification from './pages/EmailVerification';
import ProfilePage from './pages/ProfilePage';
import Settings from './pages/Settings';
import Support from './pages/Support';
import AcceptInvitation from './pages/AcceptInvitation';
import AdminPortal from './pages/AdminPortal';



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
          <CourseProvider>
            <PaymentProvider>
              <AnalyticsProvider>
                <NotificationProvider>
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

                      <Route
                        path="/hub"
                        element={
                          <Protected>
                            <Hub />
                          </Protected>
                        }
                      />

                      <Route
                        path="/courses"
                        element={
                          <Protected>
                            <CourseDiscovery />
                          </Protected>
                        }
                      />

                      <Route path="/verify-email/:key" element={<EmailVerification />} />
                      <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

                      <Route
                        path="/admin"
                        element={
                          <Protected>
                            <AdminPortal />
                          </Protected>
                        }
                      />

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
                </NotificationProvider>
              </AnalyticsProvider>
            </PaymentProvider>
          </CourseProvider>
        </AuthProvider>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px',
            zIndex: 9999,
          },
          success: {
            style: {
              background: '#10B981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
        }}
      />
    </GoogleOAuthProvider>
  );
}
