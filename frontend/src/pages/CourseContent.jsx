import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseContext } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ChevronLeft, ChevronRight, PlayCircle, CheckCircle,
  BookOpen, Clock, FileText, Video, HelpCircle,
  BarChart3, Award, ArrowLeft
} from 'lucide-react';

export default function CourseContent() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollments, getCourseModules, isLoading: contextLoading } = useCourseContext();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Find enrollment for this course
  const enrollment = enrollments.find(e => e.course === parseInt(courseId));

  // Load course modules
  const loadCourseContent = useCallback(async () => {
    if (!courseId) return;

    setLoading(true);
    setError(null);

    try {
      // Check enrollment for this course
      const enrollment = enrollments.find(e => e.course === parseInt(courseId));

      // Get course details from enrollment
      if (!enrollment) {
        setError('You are not enrolled in this course');
        setLoading(false);
        return;
      }

      // Load modules for this course
      const modulesResult = await getCourseModules(courseId);
      if (modulesResult) {
        setModules(modulesResult);
        setCourse({ id: courseId, title: enrollment.course_title });

        // Set current module/lesson from enrollment
        if (enrollment.current_module) {
          setCurrentModule(enrollment.current_module);
        }
        if (enrollment.current_lesson) {
          setCurrentLesson(enrollment.current_lesson);
        }

        // Auto-expand current module
        if (enrollment.current_module) {
          setExpandedModules(prev => ({
            ...prev,
            [enrollment.current_module]: true
          }));
        }
      } else {
        setError('Failed to load course content');
      }
    } catch (err) {
      setError('Failed to load course content');
      console.error('Error loading course content:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, enrollments, getCourseModules]);

  useEffect(() => {
    loadCourseContent();
  }, [loadCourseContent]);

  const toggleModuleExpansion = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const getLessonIcon = (contentType) => {
    switch (contentType) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />;
      case 'assignment':
        return <FileText className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getLessonStatus = (lesson) => {
    // This would be determined by progress tracking
    // For now, just show as available
    return 'available';
  };

  // Remove loading spinner to avoid delays - show content immediately

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => navigate('/hub')}
            className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-light transition-colors"
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/hub')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Hub
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{course?.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Progress: {enrollment?.progress_percentage || 0}%</span>
                  <span>Status: {enrollment?.status}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Overall Progress</div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-brand-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${enrollment?.progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Navigation Sidebar */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">My Courses</h3>
              <nav className="space-y-2">
                <a href="/hub" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  <BookOpen className="w-4 h-4" />
                  Course Library
                </a>
                <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </a>
                <a href="/hub" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  <Award className="w-4 h-4" />
                  Certificates
                </a>
                <a href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  <FileText className="w-4 h-4" />
                  Settings
                </a>
              </nav>
            </div>
          </div>

          {/* Middle Section - Module Tree/Navigation */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 sticky top-24">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Content</h3>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-brand-blue focus:border-transparent">
                  <option>Fundamentals</option>
                  <option>Advanced Topics</option>
                </select>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {Array.isArray(modules) && modules.map(module => (
                  <details key={module.id} className="border-b border-gray-100 last:border-b-0" open={expandedModules[module.id]}>
                    <summary
                      className="cursor-pointer flex justify-between items-center p-4 hover:bg-gray-50 transition-colors text-left font-medium text-gray-900"
                      onClick={() => toggleModuleExpansion(module.id)}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">Module {module.order}: {module.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {module.total_lessons || 0} lessons • {module.duration_hours}h
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedModules[module.id] ? 'rotate-90' : ''}`} />
                    </summary>

                    <div className="px-4 pb-4 space-y-1">
                      {module.lessons && module.lessons.map(lesson => (
                        <button
                          key={lesson.id}
                          onClick={() => setCurrentLesson(lesson)}
                          className={`w-full flex items-center gap-3 p-2 rounded text-left hover:bg-gray-50 transition-colors ${
                            currentLesson?.id === lesson.id ? 'bg-red-50 border-l-4 border-red-500' : ''
                          }`}
                        >
                          {getLessonIcon(lesson.content_type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {lesson.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {lesson.estimated_duration ? `${lesson.estimated_duration} min` : 'Duration TBD'}
                            </div>
                          </div>
                          {getLessonStatus(lesson) === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area - Current Lesson */}
          <div className="xl:col-span-7">
            {currentLesson ? (
              <div className="space-y-6">
                {/* Header with Title and Deadline Banner */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentLesson.title}</h1>

                  {/* Project Deadline Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Project Deadline</span>
                      </div>
                      <div className="text-sm text-blue-800">
                        Start: {new Date().toLocaleDateString()} • End: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Sections in Cards */}
                <div className="space-y-6">
                  {/* Quiz Questions Section */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Quiz questions</h3>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-700">Completed</span>
                      </div>
                    </div>
                    <p className="text-gray-700">All quiz questions have been completed successfully.</p>
                  </div>

                  {/* Tasks Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h3>

                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">0. Module Overview</h4>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                            Mandatory
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm mb-3">
                          This module provides an overview of the fundamental concepts and learning objectives.
                          Understanding these basics is essential for progressing through the course successfully.
                        </p>
                        <div className="flex items-center gap-2">
                          <button className="text-brand-blue hover:text-brand-blue-dark text-sm font-medium">
                            View Details
                          </button>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">Estimated: 15 min</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lesson Content */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Content</h3>
                    <div className="prose max-w-none">
                      {currentLesson.content_type === 'video' && currentLesson.video_url && (
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                          <div className="text-center">
                            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">Video Content</p>
                            <button className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-light transition-colors flex items-center gap-2 mx-auto">
                              <PlayCircle className="w-5 h-5" />
                              Play Video
                            </button>
                          </div>
                        </div>
                      )}

                      {currentLesson.content_type === 'text' && (
                        <div className="text-gray-700 leading-relaxed">
                          {currentLesson.content || 'Lesson content will be displayed here.'}
                        </div>
                      )}

                      {currentLesson.content_type === 'quiz' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <HelpCircle className="w-6 h-6 text-blue-600" />
                            <h3 className="text-lg font-semibold text-blue-900">Interactive Quiz</h3>
                          </div>
                          <p className="text-blue-800">Take the quiz to test your understanding of this module.</p>
                          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            Start Quiz
                          </button>
                        </div>
                      )}

                      {currentLesson.content_type === 'assignment' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <FileText className="w-6 h-6 text-green-600" />
                            <h3 className="text-lg font-semibold text-green-900">Assignment</h3>
                          </div>
                          <p className="text-green-800">Complete the assignment and submit your work.</p>
                          <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                            Submit Assignment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-center">
                    <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        Lesson {currentLesson.order} of {currentLesson.module?.total_lessons || 0}
                      </span>
                      <button className="bg-brand-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-blue-light transition-colors flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Mark as Complete
                      </button>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      Next
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Lesson</h3>
                <p className="text-gray-600">Choose a lesson from the sidebar to start learning.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
