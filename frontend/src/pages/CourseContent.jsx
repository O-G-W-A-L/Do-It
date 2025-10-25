import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseContext } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ChevronLeft, ChevronRight, PlayCircle, CheckCircle,
  BookOpen, FileText, Video, HelpCircle
} from 'lucide-react';

export default function CourseContent() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollments, getCourseModules } = useCourseContext();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(false);
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Course Modules */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h3>

          <div className="space-y-2">
            {Array.isArray(modules) && modules.map(module => (
              <div key={module.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleModuleExpansion(module.id)}
                  className="w-full flex justify-between items-center p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        Module {module.order}: {module.title}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {module.total_lessons || 0} lessons • {module.duration_hours}h
                    </div>
                  </div>
                  {expandedModules[module.id] ? (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {expandedModules[module.id] && (
                  <div className="px-3 pb-3 space-y-1">
                    {module.lessons && module.lessons.map(lesson => (
                      <button
                        key={lesson.id}
                        onClick={() => setCurrentLesson(lesson)}
                        className={`w-full flex items-center gap-3 p-2 rounded text-left hover:bg-gray-50 transition-colors ${
                          currentLesson?.id === lesson.id ? 'bg-brand-blue/10 border-l-4 border-brand-blue' : ''
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
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Current Lesson */}
      <div className="lg:col-span-3">
        {currentLesson ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span>Module {currentLesson.module?.order}</span>
                <span>•</span>
                <span>Lesson {currentLesson.order}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentLesson.title}</h2>
              <p className="text-gray-600">{currentLesson.description}</p>
            </div>

            {/* Lesson Content */}
            <div className="prose max-w-none mb-8">
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
                    <h3 className="text-lg font-semibold text-blue-900">Quiz</h3>
                  </div>
                  <p className="text-blue-800">Interactive quiz content will be displayed here.</p>
                </div>
              )}

              {currentLesson.content_type === 'assignment' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">Assignment</h3>
                  </div>
                  <p className="text-green-800">Assignment instructions and submission area will be displayed here.</p>
                </div>
              )}
            </div>

            {/* Lesson Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft className="w-5 h-5" />
                Previous Lesson
              </button>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Lesson {currentLesson.order} of {currentLesson.module?.total_lessons || 0}
                </span>
                <button className="bg-brand-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-blue-light transition-colors flex items-center gap-2">
                  Mark as Complete
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>

              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                Next Lesson
                <ChevronRight className="w-5 h-5" />
              </button>
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
  );
}
