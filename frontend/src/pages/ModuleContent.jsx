import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseContext } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';
import { useSelectedCourseContext } from '../contexts/SelectedCourseContext';
import { progressService } from '../services/progress';
import {
  ChevronLeft, ChevronRight, PlayCircle, CheckCircle,
  BookOpen, FileText, Video, HelpCircle, ArrowLeft
} from 'lucide-react';

export default function ModuleContent() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enrollments, getCourseModules } = useCourseContext();
  const { selectedCourseId } = useSelectedCourseContext();

  const [course, setCourse] = useState(null);
  const [module, setModule] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Find enrollment for this course
  const enrollment = enrollments.find(e => e.course === parseInt(courseId));

  // Load module data
  const loadModuleContent = useCallback(async () => {
    if (!courseId || !moduleId) return;

    setLoading(true);
    setError(null);

    try {
      // Validate enrollment for this course
      const enrollment = enrollments.find(e => e.course === parseInt(courseId));
      if (!enrollment) {
        setError('You are not enrolled in this course');
        setLoading(false);
        return;
      }

      // Load all modules for this course
      const modulesResult = await getCourseModules(courseId);
      if (modulesResult && Array.isArray(modulesResult)) {
        setModules(modulesResult);

        // Find the specific module
        const targetModule = modulesResult.find(m => m.id === parseInt(moduleId));
        if (targetModule) {
          setModule(targetModule);
          setCourse({ id: courseId, title: enrollment.course_title });

          // Set current lesson (first lesson or from progress)
          if (targetModule.lessons && targetModule.lessons.length > 0) {
            // For now, just set the first lesson
            // In a real implementation, this would check progress
            setCurrentLesson(targetModule.lessons[0]);
          }
        } else {
          setError('Module not found');
        }
      } else {
        setError('Failed to load module content');
      }
    } catch (err) {
      setError('Failed to load module content');
      console.error('Error loading module content:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, moduleId, enrollments, getCourseModules]);

  useEffect(() => {
    loadModuleContent();
  }, [loadModuleContent]);

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

  const navigateToCourse = () => {
    navigate(`/course/${courseId}`);
  };

  const navigateToNextModule = () => {
    if (!module || !modules.length) return;

    const currentIndex = modules.findIndex(m => m.id === module.id);
    if (currentIndex < modules.length - 1) {
      const nextModule = modules[currentIndex + 1];
      navigate(`/courses/${courseId}/modules/${nextModule.id}`);
    }
  };

  const navigateToPreviousModule = () => {
    if (!module || !modules.length) return;

    const currentIndex = modules.findIndex(m => m.id === module.id);
    if (currentIndex > 0) {
      const prevModule = modules[currentIndex - 1];
      navigate(`/courses/${courseId}/modules/${prevModule.id}`);
    }
  };

  // Lesson navigation within module
  const navigateToPreviousLesson = () => {
    if (!module || !module.lessons || !currentLesson) return;

    const currentIndex = module.lessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex > 0) {
      setCurrentLesson(module.lessons[currentIndex - 1]);
    }
  };

  const navigateToNextLesson = () => {
    if (!module || !module.lessons || !currentLesson) return;

    const currentIndex = module.lessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex < module.lessons.length - 1) {
      setCurrentLesson(module.lessons[currentIndex + 1]);
    }
  };

  // Mark lesson as complete
  const markLessonComplete = async () => {
    if (!currentLesson || !courseId) return;

    try {
      const result = await progressService.markLessonComplete(courseId, currentLesson.id);
      if (result.success) {
        // Update lesson status in local state
        const updatedLessons = module.lessons.map(lesson =>
          lesson.id === currentLesson.id
            ? { ...lesson, completed: true }
            : lesson
        );
        setModule({ ...module, lessons: updatedLessons });

        // Show success message
        // You could add a toast notification here
        console.log('Lesson marked as complete');
      } else {
        console.error('Failed to mark lesson complete:', result.error);
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/hub')}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Back to Hub
            </button>
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-light transition-colors"
            >
              View Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Module Not Found</h3>
          <p className="text-gray-600 mb-4">The requested module could not be found.</p>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-light transition-colors"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={navigateToCourse}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Course
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course?.title}</h1>
              <p className="text-gray-600">Module {module.order}: {module.title}</p>
            </div>
          </div>

          {/* Module Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={navigateToPreviousModule}
              disabled={!module || modules.findIndex(m => m.id === module.id) === 0}
              className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 px-3">
              Module {module.order} of {modules.length}
            </span>
            <button
              onClick={navigateToNextModule}
              disabled={!module || modules.findIndex(m => m.id === module.id) === modules.length - 1}
              className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Module Progress */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-brand-blue h-2 rounded-full transition-all duration-300"
            style={{ width: `${module.progress_percentage || 0}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">{module.progress_percentage || 0}% complete</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Module Lessons */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Content</h3>

            <div className="space-y-2">
              {module.lessons && module.lessons.map(lesson => (
                <button
                  key={lesson.id}
                  onClick={() => setCurrentLesson(lesson)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
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
          </div>
        </div>

        {/* Main Content - Current Lesson */}
        <div className="lg:col-span-3">
          {currentLesson ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span>Module {module.order}</span>
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
                <button
                  onClick={navigateToPreviousLesson}
                  disabled={!currentLesson || !module.lessons || module.lessons.findIndex(l => l.id === currentLesson.id) === 0}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous Lesson
                </button>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Lesson {currentLesson?.order || 1} of {module.lessons?.length || 0}
                  </span>
                  <button
                    onClick={markLessonComplete}
                    className="bg-brand-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-blue-light transition-colors flex items-center gap-2"
                  >
                    Mark as Complete
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={navigateToNextLesson}
                  disabled={!currentLesson || !module.lessons || module.lessons.findIndex(l => l.id === currentLesson.id) === module.lessons.length - 1}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
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
    </div>
  );
}
