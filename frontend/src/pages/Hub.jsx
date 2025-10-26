import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseContext } from '../contexts/CourseContext';
import { useSelectedCourseContext } from '../contexts/SelectedCourseContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar, BookOpen, FolderOpen, BarChart3,
  ChevronDown, CheckCircle, PlayCircle
} from 'lucide-react';

export default function Hub() {
  const [expandedReports, setExpandedReports] = useState({});
  const [modules, setModules] = useState([]);
  const navigate = useNavigate();

  // Course context for course-specific functionality
  const { enrollments, getCourseModules } = useCourseContext();
  const { selectedCourseId } = useSelectedCourseContext();
  const { user } = useAuth();

  // Filter enrollments by selected course
  const filteredEnrollments = selectedCourseId
    ? enrollments.filter(e => e.course === parseInt(selectedCourseId))
    : enrollments;

  // Fetch modules when selected course changes
  useEffect(() => {
    if (selectedCourseId) {
      getCourseModules(selectedCourseId).then(result => {
        if (result) {
          setModules(result);
        }
      });
    } else {
      setModules([]);
    }
  }, [selectedCourseId, getCourseModules]);

  const toggleReportExpansion = (courseId) => {
    setExpandedReports(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

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
          onClick={() => navigate('/my-courses')}
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
              {Array.isArray(modules) && modules.length > 0 ? (
                modules.map(module => (
                  <div key={module.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{module.title}</h4>
                    </div>
                    <button
                      onClick={() => {
                        // Dynamic path construction from data - NEVER hardcode
                        const path = `/courses/${selectedCourseId}/modules/${module.id}`;
                        navigate(path);
                      }}
                      className="text-brand-blue hover:text-brand-blue-light font-medium text-sm"
                    >
                      View
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No modules available</p>
                  <p className="text-sm mt-1">Select a course to view available modules</p>
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
              {Array.isArray(modules) && modules.length > 0 ? (
                modules.map((module, index) => {
                  const projectId = 103651 + index; // Generate project IDs starting from 103651
                  const deadline = new Date();
                  deadline.setDate(deadline.getDate() + 1); // Tomorrow
                  const timeUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60)); // Hours

                  return (
                    <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            // Dynamic path construction from data - NEVER hardcode
                            const path = `/courses/${selectedCourseId}/modules/${module.id}`;
                            navigate(path);
                          }}
                        >
                          <h4 className="font-medium text-red-600 hover:text-red-700">
                            {projectId} {module.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            started on Oct 13, 2025 12:00 AM, deadline before {deadline.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} 12:00 AM (in about {timeUntilDeadline} hours)
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-600">0.0% done</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: '0%' }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No active projects</p>
                  <p className="text-sm mt-1">Select a course to view available projects</p>
                </div>
              )}
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
              {Array.isArray(filteredEnrollments) && filteredEnrollments.slice(0, 2).map(enrollment => {
                if (!enrollment || !enrollment.id) return null;
                const isExpanded = expandedReports[enrollment.id];
                const enrolledDate = new Date(enrollment.enrolled_at);
                const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                const previousMonth = new Date(enrolledDate.getFullYear(), enrolledDate.getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                return (
                  <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">{enrollment.course_title}</h4>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            ✓ Validated
                          </span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{enrollment.progress_percentage || 0}%</p>
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
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{previousMonth}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <span className="text-sm font-medium">85%</span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{currentMonth}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-brand-blue h-2 rounded-full" style={{ width: `${enrollment.progress_percentage || 0}%` }}></div>
                            </div>
                            <span className="text-sm font-medium">{enrollment.progress_percentage || 0}%</span>
                            {(enrollment.progress_percentage || 0) === 100 && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {(!Array.isArray(filteredEnrollments) || filteredEnrollments.length === 0) && (
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
}
