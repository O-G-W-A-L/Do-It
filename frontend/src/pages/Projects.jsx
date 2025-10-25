import React, { useState, useEffect, useCallback } from 'react';
import { useCourseContext } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';
import {
  FolderOpen, ChevronDown, ChevronRight, CheckCircle,
  BookOpen, Loader2, AlertCircle
} from 'lucide-react';

export default function Projects() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [courseModules, setCourseModules] = useState({});
  const [modulesLoading, setModulesLoading] = useState({});

  // Course context for course-specific functionality
  const { enrollments, courses, getCourseModules } = useCourseContext();
  const { user } = useAuth();

  // Load modules for enrolled courses
  const loadCourseModules = useCallback(async (courseId) => {
    if (courseModules[courseId] || modulesLoading[courseId]) return;

    setModulesLoading(prev => ({ ...prev, [courseId]: true }));
    try {
      const modules = await getCourseModules(courseId);
      if (modules) {
        setCourseModules(prev => ({ ...prev, [courseId]: modules }));
      }
    } catch (error) {
      console.error('Failed to load course modules:', error);
    } finally {
      setModulesLoading(prev => ({ ...prev, [courseId]: false }));
    }
  }, [courseModules, modulesLoading, getCourseModules]);

  // Load modules when enrollments change
  useEffect(() => {
    enrollments.forEach(enrollment => {
      const course = courses.find(c => c.id === enrollment.course);
      if (course) {
        loadCourseModules(course.id);
      }
    });
  }, [enrollments, courses, loadCourseModules]);

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
            {Array.isArray(enrollments) && enrollments.map(enrollment => {
              if (!enrollment || !enrollment.id) return null;
              return (
                <option key={enrollment.id} value={enrollment.id}>
                  {enrollment.course_title} ({enrollment.progress_percentage || 0}%)
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
          {Array.isArray(enrollments) && enrollments
            .filter(enrollment => !selectedCourse || enrollment.id === selectedCourse)
            .map(enrollment => {
              if (!enrollment || !enrollment.id) return null;
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
                          {enrollment.course_title}
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Started: {new Date(enrollment.enrolled_at).toLocaleDateString()}</p>
                        <p>Deadline: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                        {Number(enrollment.progress_percentage || 0).toFixed(1)}% done
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          {(!Array.isArray(enrollments) || enrollments.length === 0) && (
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
          {Array.isArray(enrollments) && enrollments
            .filter(enrollment => !selectedCourse || enrollment.id === selectedCourse)
            .map(enrollment => {
              if (!enrollment || !enrollment.id) return null;
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
                        {enrollment.course_title} - Introduction Modules
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {enrollment.progress_percentage || 0}% complete
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {modulesLoading[enrollment.course] ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                          <span className="ml-2 text-sm text-gray-500">Loading modules...</span>
                        </div>
                      ) : courseModules[enrollment.course]?.length > 0 ? (
                        courseModules[enrollment.course].map(module => (
                          <div key={module.id} className="border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-center p-3 bg-gray-50">
                              <span className="text-sm font-medium text-gray-900">{module.title}</span>
                              <span className="text-xs text-gray-500">{module.lessons_count || 0} lessons</span>
                            </div>
                            {module.lessons && module.lessons.length > 0 && (
                              <div className="px-3 pb-3 space-y-2">
                                {module.lessons.map(lesson => (
                                  <div key={lesson.id} className="flex justify-between items-center p-2 bg-white rounded border">
                                    <span className="text-xs text-gray-700">{lesson.title}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className="bg-brand-blue h-1.5 rounded-full"
                                          style={{ width: `${Math.min(100, Math.max(0, (enrollment.progress_percentage || 0) - (module.order - 1) * 20))}%` }}
                                        ></div>
                                      </div>
                                      {(enrollment.progress_percentage || 0) >= (module.order * 20) && (
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-xs">No modules available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
