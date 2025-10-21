import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronRight, X, Bell, Grid3X3, User, Settings, HelpCircle, Moon, LogOut, BookOpen, TrendingUp, Award, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCourseContext } from '../contexts/CourseContext';
import { useAnalyticsContext } from '../contexts/AnalyticsContext';
import { usePaymentContext } from '../contexts/PaymentContext';
import { useNotificationContext } from '../contexts/NotificationContext';

import Footer from '../components/Footer';

export default function CourseLanding() {
  const { user, logout } = useAuth();
  const { enrollments, courses, enrollInCourse, isLoading: coursesLoading, error: coursesError } = useCourseContext();
  const { dashboardStats, isLoading: analyticsLoading } = useAnalyticsContext();
  const { hasActiveSubscription, subscriptions, isLoading: paymentsLoading } = usePaymentContext();
  const { unreadCount, getRecentNotifications, isLoading: notificationsLoading } = useNotificationContext();

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [showAllCourses, setShowAllCourses] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getUserInitials = (username) => {
    if (!username) return 'U';
    return username.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2);
  };

  const getFirstName = (username) => {
    if (!username) return 'User';
    return username.split(' ')[0];
  };

  // Get enrolled courses with progress data
  const enrolledCourses = enrollments.map(enrollment => ({
    id: enrollment.id,
    courseId: enrollment.course,
    title: enrollment.course_title || 'Course Title',
    status: enrollment.status,
    progress: enrollment.progress_percentage || 0,
    enrolledAt: enrollment.enrolled_at,
    completedAt: enrollment.completed_at,
    currentModule: enrollment.current_module,
    currentLesson: enrollment.current_lesson,
    amountPaid: enrollment.amount_paid
  }));

  // Get available courses (not enrolled in)
  const enrolledCourseIds = new Set(enrollments.map(e => e.course));
  const availableCourses = courses.filter(course => !enrolledCourseIds.has(course.id));

  // Handle course enrollment
  const handleEnroll = async (courseId) => {
    setEnrollingCourseId(courseId);
    try {
      await enrollInCourse(courseId);
      // Enrollment successful - courses context will update automatically
    } catch (error) {
      console.error('Enrollment failed:', error);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const getDaysUntil = (dateStr) => {
    const start = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-3 border-b border-gray-200' : 'bg-white py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="text-gray-900 font-bold text-2xl">Do-It</div>
          <div className="flex items-center gap-6">
            <Link to="/hub" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue transition-colors text-sm">
              <Grid3X3 className="w-4 h-4" />
              Workspace
            </Link>
            <button className="text-gray-600 hover:text-brand-blue">
              <Bell className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center text-white font-semibold text-sm hover:bg-brand-blue-light transition-colors"
              >
                {getUserInitials(user?.username)}
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>

                  <div className="py-1">
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <User className="w-4 h-4 mr-3" />
                      Manage your account
                    </button>

                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <Moon className="w-4 h-4 mr-3" />
                      Dark Theme
                    </button>

                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <User className="w-4 h-4 mr-3" />
                      View Profile
                    </button>

                    <Link to="/settings" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>

                    <Link to="/support" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <HelpCircle className="w-4 h-4 mr-3" />
                      Support
                    </Link>
                  </div>

                  <div className="border-t border-gray-200 py-1">
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Welcome Section */}
      <section className="bg-gray-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-cyan/30 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <p className="text-accent-cyan text-sm font-medium mb-2">Welcome to Do-It Learning</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Your Learning Journey Starts Here</h1>
          <p className="text-gray-300 text-lg">Build real skills, ship production code, advance your career.</p>
        </div>
      </section>

      {/* Greeting */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Hello {getFirstName(user?.username)}!</h2>
              <p className="text-gray-600">Ready to level up? Your next course is waiting.</p>
            </div>

          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* My Courses Section */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
            <button className="text-sm text-brand-blue hover:text-brand-blue-light font-medium flex items-center gap-1">
              View More <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Payment Status Banner */}
          {paymentsLoading ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-400 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-300 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          ) : hasActiveSubscription() ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div className="flex-1">
                <p className="text-green-900 font-medium text-sm">Subscription Active</p>
                <p className="text-green-700 text-sm">Full access to all courses and premium features.</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">!</span>
              </div>
              <div className="flex-1">
                <p className="text-amber-900 font-medium text-sm">Free Plan Active</p>
                <p className="text-amber-700 text-sm">Upgrade to unlock premium courses and features.</p>
                <Link to="/pricing" className="text-amber-700 hover:text-amber-900 text-sm font-medium underline mt-1 inline-block">
                  View Plans →
                </Link>
              </div>
            </div>
          )}

          {coursesLoading ? (
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-300 rounded animate-pulse mb-3 w-3/4"></div>
                      <div className="flex flex-wrap gap-4">
                        <div className="h-4 bg-gray-300 rounded animate-pulse w-20"></div>
                        <div className="h-4 bg-gray-300 rounded animate-pulse w-16"></div>
                        <div className="h-4 bg-gray-300 rounded animate-pulse w-18"></div>
                      </div>
                    </div>
                    <div className="h-10 bg-gray-300 rounded animate-pulse w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6">Start your learning journey by enrolling in a course below.</p>
              <Link to="#available-courses" className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-light transition-colors">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {enrolledCourses.map(course => (
                <div key={course.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                        <span className={`px-2.5 py-1 text-xs font-medium rounded ${
                          course.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : course.status === 'active'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {course.status === 'completed' ? 'Completed' :
                           course.status === 'active' ? 'In Progress' : 'Enrolled'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-brand-blue h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>Enrolled {formatDate(course.enrolledAt)}</span>
                        </div>
                        {course.currentModule && (
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            <span>{course.currentModule}</span>
                          </div>
                        )}
                        {course.completedAt && (
                          <div className="flex items-center gap-1.5">
                            <Award className="w-4 h-4" />
                            <span>Completed {formatDate(course.completedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        to="/hub"
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors whitespace-nowrap text-center"
                      >
                        {course.status === 'completed' ? 'Review Course' : 'Continue Learning'}
                      </Link>
                      {course.amountPaid > 0 && (
                        <div className="text-xs text-gray-500 text-center">
                          Paid: ${course.amountPaid}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Available Courses Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Courses
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({showAllCourses ? availableCourses.length : Math.min(6, availableCourses.length)} of {availableCourses.length} courses)
              </span>
            </h2>
            {availableCourses.length > 6 && (
              <button
                onClick={() => setShowAllCourses(!showAllCourses)}
                className="text-sm text-brand-blue hover:text-brand-blue-light font-medium flex items-center gap-1"
              >
                {showAllCourses ? 'Show Less' : 'View All'} <ChevronRight className={`w-4 h-4 transition-transform ${showAllCourses ? 'rotate-90' : ''}`} />
              </button>
            )}
            {availableCourses.length <= 6 && (
              <div className="text-sm text-gray-500 font-medium">
                All courses shown
              </div>
            )}
          </div>

          {coursesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="p-6">
                    <div className="h-5 bg-gray-300 rounded animate-pulse mb-4 w-3/4"></div>
                    <div className="space-y-2.5 mb-5">
                      <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
                      <div className="h-4 bg-gray-300 rounded animate-pulse w-24"></div>
                      <div className="h-4 bg-gray-300 rounded animate-pulse w-28"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-10 bg-gray-300 rounded animate-pulse"></div>
                      <div className="flex-1 h-10 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : availableCourses.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600 mb-6">You've enrolled in all available courses. Check back later for new content.</p>
              <Link to="/hub" className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-light transition-colors">
                Go to Workspace
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(showAllCourses ? availableCourses : availableCourses.slice(0, 6)).map(course => (
                <div key={course.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 leading-tight flex-1 mr-2">{course.title}</h3>
                      {course.level && (
                        <span className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${
                          course.level === 'beginner' ? 'bg-green-100 text-green-700' :
                          course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {course.level}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 mb-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Created {formatDate(course.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{course.duration_weeks} weeks</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{course.enrollment_count || 0} enrolled</span>
                      </div>
                      {course.average_rating > 0 && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Award className="w-4 h-4 flex-shrink-0" />
                          <span>{course.average_rating.toFixed(1)} ★</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollingCourseId === course.id}
                        className={`flex-1 py-2 rounded-lg font-medium transition-colors text-sm ${
                          enrollingCourseId === course.id
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : course.is_free
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-cyan-600 text-white hover:bg-cyan-700'
                        }`}
                      >
                        {enrollingCourseId === course.id ? 'Enrolling...' :
                         course.is_free ? 'Enroll Free' : 'Enroll Now'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCourse(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">{selectedCourse.title}</h2>
              <button onClick={() => setSelectedCourse(null)} className="text-slate-500 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                  <p className="text-xs text-slate-500 mb-1">Starts</p>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(selectedCourse.created_at)}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                  <p className="text-xs text-slate-500 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedCourse.duration_weeks} weeks</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <Users className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                  <p className="text-xs text-slate-500 mb-1">Enrolled</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedCourse.enrollment_count || 0} students</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-2">About this course</h3>
                <p className="text-slate-600 leading-relaxed">{selectedCourse.description || 'No description available.'}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Course Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-900">Level:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                      selectedCourse.level === 'beginner' ? 'bg-green-100 text-green-700' :
                      selectedCourse.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedCourse.level || 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                      selectedCourse.status === 'published' ? 'bg-green-100 text-green-700' :
                      selectedCourse.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedCourse.status || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Price:</span>
                    <span className="ml-2 text-slate-600">
                      {selectedCourse.is_free ? 'Free' : `$${selectedCourse.price || 'N/A'}`}
                    </span>
                  </div>
                  {selectedCourse.average_rating > 0 && (
                    <div>
                      <span className="font-medium text-slate-900">Rating:</span>
                      <span className="ml-2 text-slate-600">
                        {selectedCourse.average_rating.toFixed(1)} ★ ({selectedCourse.review_count || 0} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedCourse.prerequisites && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-1 text-sm">Prerequisites:</h3>
                  <p className="text-blue-800 text-sm">{selectedCourse.prerequisites}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleEnroll(selectedCourse.id)}
                  disabled={enrollingCourseId === selectedCourse.id}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    enrollingCourseId === selectedCourse.id
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : selectedCourse.is_free
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-cyan-600 text-white hover:bg-cyan-700'
                  }`}
                >
                  {enrollingCourseId === selectedCourse.id ? 'Enrolling...' :
                   selectedCourse.is_free ? 'Enroll Free' : 'Enroll Now'}
                </button>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
