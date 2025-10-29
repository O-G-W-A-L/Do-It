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
import CourseContent from './pages/CourseContent';
import ModuleContent from './pages/ModuleContent';
import EmailVerification from './pages/EmailVerification';
import ProfilePage from './pages/ProfilePage';
import Settings from './pages/Settings';
import Support from './pages/Support';
import AcceptInvitation from './pages/AcceptInvitation';
import AdminPortal from './pages/AdminPortal';
import Calendar from './pages/Calendar';
import Projects from './pages/Projects';
import QAReviews from './pages/QAReviews';
import EvaluationQuizzes from './pages/EvaluationQuizzes';
import MyCourses from './pages/MyCourses';
import Concepts from './pages/Concepts';
import ConferenceRooms from './pages/ConferenceRooms';
import Servers from './pages/Servers';
import Sandboxes from './pages/Sandboxes';
import VideoOnDemand from './pages/VideoOnDemand';
import Peers from './pages/Peers';
import Layout from './components/Layout';
import { SelectedCourseProvider } from './contexts/SelectedCourseContext';



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
            <SelectedCourseProvider>
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
                            <Layout title="Learning Hub" currentView="hub">
                              <Hub />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/courses"
                        element={
                          <Protected>
                            <Layout title="Course Discovery" currentView="courses">
                              <CourseDiscovery />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/course/:courseId"
                        element={
                          <Protected>
                            <Layout title="Course Content" currentView="course">
                              <CourseContent />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/courses/:courseId/modules/:moduleId"
                        element={
                          <Protected>
                            <Layout title="Module Content" currentView="module">
                              <ModuleContent />
                            </Layout>
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
                            <Layout title="Profile" currentView="profile">
                              <ProfilePage />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/settings"
                        element={
                          <Protected>
                            <Layout title="Settings" currentView="settings">
                              <Settings />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/support"
                        element={
                          <Protected>
                            <Layout title="Support" currentView="support">
                              <Support />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/calendar"
                        element={
                          <Protected>
                            <Layout title="My Calendar" currentView="calendar">
                              <Calendar />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/projects"
                        element={
                          <Protected>
                            <Layout title="Projects" currentView="projects">
                              <Projects />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/qa-reviews"
                        element={
                          <Protected>
                            <Layout title="QA Reviews" currentView="qa-reviews">
                              <QAReviews />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/evaluation-quizzes"
                        element={
                          <Protected>
                            <Layout title="Evaluation Quizzes" currentView="evaluation-quizzes">
                              <EvaluationQuizzes />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/my-courses"
                        element={
                          <Protected>
                            <Layout title="My Courses" currentView="my-courses">
                              <MyCourses />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/concepts"
                        element={
                          <Protected>
                            <Layout title="Concepts" currentView="concepts">
                              <Concepts />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/conference-rooms"
                        element={
                          <Protected>
                            <Layout title="Conference Rooms" currentView="conference-rooms">
                              <ConferenceRooms />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/servers"
                        element={
                          <Protected>
                            <Layout title="Servers" currentView="servers">
                              <Servers />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/sandboxes"
                        element={
                          <Protected>
                            <Layout title="Sandboxes" currentView="sandboxes">
                              <Sandboxes />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/video-on-demand"
                        element={
                          <Protected>
                            <Layout title="Video on Demand" currentView="video-on-demand">
                              <VideoOnDemand />
                            </Layout>
                          </Protected>
                        }
                      />

                      <Route
                        path="/peers"
                        element={
                          <Protected>
                            <Layout title="Peers" currentView="peers">
                              <Peers />
                            </Layout>
                          </Protected>
                        }
                      />


                    </Routes>
                  </NotificationProvider>
                </AnalyticsProvider>
              </PaymentProvider>
            </SelectedCourseProvider>
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
