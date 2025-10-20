import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useCourseContext } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar, BookOpen, FolderOpen, BarChart3,
  ChevronDown, ChevronRight, CheckCircle, PlayCircle,
  Award, TrendingUp, ChevronUp, ChevronLeft
} from 'lucide-react';

export default function Hub() {
  const [view, setView] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedReports, setExpandedReports] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Course context for course-specific functionality
  const { enrollments, courses } = useCourseContext();
  const { user } = useAuth();

  const toggleReportExpansion = (courseId) => {
    setExpandedReports(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const handleViewChange = useCallback(v => {
    setView(v);
    setIsSidebarOpen(false);
  }, []);

  // Check for course-specific navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');
    if (courseId) {
      // If course ID is provided, switch to course view
      setView('my-courses');
    }
  }, []);

  const renderMain = () => {
    switch (view) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-white rounded-lg p-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.username || 'Learner'}!
                </h1>
                <p className="text-gray-600 mt-1">Ready to continue your learning journey?</p>
              </div>
              <button
                onClick={() => setView('my-courses')}
                className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-light transition-colors flex items-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                Resume Learning
              </button>
            </div>

            {/* Three-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Widest */}
              <div className="lg:col-span-2 space-y-6">
                {/* Upcoming Events */}
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    Upcoming events
                  </h3>
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No upcoming event</p>
                  </div>
                </div>

                {/* Current Learning */}
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-500" />
                    Current learning
                  </h3>
                  <div className="space-y-3">
                    {enrollments.slice(0, 3).map(enrollment => {
                      const course = courses.find(c => c.id === enrollment.course);
                      return (
                        <div key={enrollment.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{course?.title || 'Course Title'}</h4>
                            <p className="text-sm text-gray-600">Module {Math.floor(enrollment.progress_percentage / 20) + 1} • {enrollment.progress_percentage}% complete</p>
                          </div>
                          <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="text-brand-blue hover:text-brand-blue-light font-medium text-sm"
                          >
                            View
                          </button>
                        </div>
                      );
                    })}
                    {enrollments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No courses enrolled yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Projects */}
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-gray-500" />
                    Current projects
                  </h3>
                  <div className="space-y-4">
                    {/* Sample project cards - replace with real data later */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">AWS Architecture Project</h4>
                          <p className="text-sm text-gray-600">Due: Dec 15, 2024</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                          In Progress
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500">65% complete</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">React Component Library</h4>
                          <p className="text-sm text-gray-600">Due: Dec 20, 2024</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Not Started
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                      <p className="text-xs text-gray-500">0% complete</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Narrower */}
              <div className="space-y-6">
                {/* Reports */}
                <div className="bg-white rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
                    <span className="text-sm text-gray-600">1 report</span>
                  </div>

                  <div className="space-y-4">
                    {enrollments.slice(0, 2).map(enrollment => {
                      const course = courses.find(c => c.id === enrollment.course);
                      const isExpanded = expandedReports[enrollment.id];

                      return (
                        <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 text-sm">{course?.title || 'Course Title'}</h4>
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                  ✓ Validated
                                </span>
                              </div>
                              <p className="text-lg font-bold text-gray-900">{enrollment.progress_percentage}%</p>
                            </div>
                            <button
                              onClick={() => toggleReportExpansion(enrollment.id)}
                              className="text-brand-blue hover:text-brand-blue-light text-sm font-medium"
                            >
                              Score details
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="space-y-3 pt-3 border-t border-gray-200">
                              {/* Monthly breakdown - sample data */}
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">October 2024</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                                  </div>
                                  <span className="text-sm font-medium">85%</span>
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                </div>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">November 2024</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div className="bg-brand-blue h-2 rounded-full" style={{ width: `${enrollment.progress_percentage}%` }}></div>
                                  </div>
                                  <span className="text-sm font-medium">{enrollment.progress_percentage}%</span>
                                  {enrollment.progress_percentage === 100 && <CheckCircle className="w-4 h-4 text-green-500" />}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {enrollments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No reports available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'my-courses':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Enrolled Courses</h2>
              {enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No enrolled courses yet.</p>
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-light transition-colors"
                  >
                    Browse Available Courses
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {enrollments.map(enrollment => {
                    const course = courses.find(c => c.id === enrollment.course);
                    return (
                      <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {course?.title || 'Course Title'}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                enrollment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                enrollment.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {enrollment.status}
                              </span>
                              <span>Progress: {Number(enrollment.progress_percentage)}%</span>
                              <span>Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-brand-blue h-2 rounded-full transition-all duration-300"
                                style={{ width: `${enrollment.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                          >
                            Continue Learning
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'planning':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Planning</h2>
              <p className="text-gray-600">Course planning and scheduling features coming soon.</p>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-6">
            {/* Top Bar with Course Selector */}
            <div className="bg-white rounded-lg p-4 flex justify-between items-center border-b border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Course:</span>
                <select
                  value={selectedCourse || ''}
                  onChange={(e) => setSelectedCourse(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                >
                  <option value="">All Courses</option>
                  {enrollments.map(enrollment => {
                    const course = courses.find(c => c.id === enrollment.course);
                    return (
                      <option key={enrollment.id} value={enrollment.id}>
                        {course?.title || 'Course Title'} ({enrollment.progress_percentage}%)
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Average Progress</div>
                <div className="text-lg font-bold text-gray-900">
                  {enrollments.length > 0
                    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length)
                    : 0
                  }%
                </div>
              </div>
            </div>

            {/* My Projects Section */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Projects</h2>
              <div className="space-y-4">
                {enrollments
                  .filter(enrollment => !selectedCourse || enrollment.id === selectedCourse)
                  .map(enrollment => {
                    const course = courses.find(c => c.id === enrollment.course);
                    return (
                      <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                #{enrollment.id}
                              </span>
                              <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="text-brand-blue hover:text-brand-blue-light font-medium text-left"
                              >
                                {course?.title || 'Course Title'}
                              </button>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Started: {new Date(enrollment.enrolled_at).toLocaleDateString()}</p>
                              <p>Deadline: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                              {Number(enrollment.progress_percentage).toFixed(1)}% done
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {enrollments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No projects available</p>
                    <p className="text-sm mt-1">Enroll in courses to see your projects</p>
                  </div>
                )}
              </div>
            </div>

            {/* All Projects Section */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">All Projects</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const allKeys = enrollments.reduce((keys, enrollment) => {
                        // For now, we'll use enrollment ID as module key
                        // In a real implementation, this would be actual module IDs
                        keys[enrollment.id] = true;
                        return keys;
                      }, {});
                      setExpandedModules(allKeys);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Expand all
                  </button>
                  <button
                    onClick={() => setExpandedModules({})}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Collapse all
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {enrollments
                  .filter(enrollment => !selectedCourse || enrollment.id === selectedCourse)
                  .map(enrollment => {
                    const course = courses.find(c => c.id === enrollment.course);
                    const isExpanded = expandedModules[enrollment.id];

                    return (
                      <div key={enrollment.id} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => setExpandedModules(prev => ({
                            ...prev,
                            [enrollment.id]: !prev[enrollment.id]
                          }))}
                          className="w-full flex justify-between items-center p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                            <span className="font-medium text-gray-900">
                              {course?.title || 'Course Title'} - Introduction Modules
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {enrollment.progress_percentage}% complete
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-2">
                            {/* Sample module items - in real implementation, these would be actual course modules */}
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-900">Module 1: Getting Started</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </div>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-900">Module 2: Core Concepts</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div className="bg-brand-blue h-2 rounded-full" style={{ width: `${Math.max(0, enrollment.progress_percentage - 20)}%` }}></div>
                                </div>
                                {enrollment.progress_percentage >= 40 && <CheckCircle className="w-4 h-4 text-green-500" />}
                              </div>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-900">Module 3: Advanced Topics</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        );

      case 'qa-reviews':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">QA Reviews I can make</h2>
              <p className="text-gray-600">Code review and feedback features coming soon.</p>
            </div>
          </div>
        );

      case 'evaluation-quizzes':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Evaluation quizzes</h2>
              <p className="text-gray-600">Course assessments and quizzes will be available here.</p>
            </div>
          </div>
        );

      case 'concepts':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Concepts</h2>
              <p className="text-gray-600">Learning concepts and resources will be organized here.</p>
            </div>
          </div>
        );

      case 'conference-rooms':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Conference rooms</h2>
              <p className="text-gray-600">Live sessions and meetings will be scheduled here.</p>
            </div>
          </div>
        );

      case 'servers':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Servers</h2>
              <p className="text-gray-600">Development environments and server access.</p>
            </div>
          </div>
        );

      case 'sandboxes':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sandboxes</h2>
              <p className="text-gray-600">Practice environments for hands-on learning.</p>
            </div>
          </div>
        );

      case 'video-on-demand':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Video on demand</h2>
              <p className="text-gray-600">Course videos and recordings will be available here.</p>
            </div>
          </div>
        );

      case 'peers':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Peers</h2>
              <p className="text-gray-600">Study groups and collaboration features.</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Do-It Learning</h2>
            <p className="text-gray-600 mb-6">Select a section from the sidebar to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed z-40 h-screen w-64 transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <Sidebar
          currentView={view}
          onViewChange={handleViewChange}
          onAddTask={() => {}}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={
            view === 'my-courses'
              ? 'My Courses'
              : view.charAt(0).toUpperCase() + view.slice(1).replace('-', ' ')
          }
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="p-6 overflow-auto bg-gray-50">{renderMain()}</main>
      </div>
    </div>
  );
}
