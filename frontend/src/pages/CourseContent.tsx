import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseContext } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';
import { coursesService } from '../services/courses';
import VideoPlayer from '../components/course/player/VideoPlayer';
import RichContentRenderer from '../components/course/content/RichContentRenderer';
import LiveProgressTracker from '../components/course/progress/LiveProgressTracker';
import QuizPlayer from '../components/course/assessment/QuizPlayer';
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
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Find enrollment for this course
  const enrollment = enrollments.find(e => e.course === parseInt(courseId));

  // Load course units and modules
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

      // Load course data with units using coursesService (includes auth)
      const courseResult = await coursesService.getCourse(courseId);
      
      if (!courseResult.success || !courseResult.data) {
        setError(courseResult.error || 'Failed to load course content');
        setLoading(false);
        return;
      }

      const courseData = courseResult.data;

      if (courseData.units && courseData.units.length > 0) {
        // Use units structure
        setUnits(courseData.units);
        setCourse({ id: Number(courseId), title: courseData.title });

        // Select first unit by default
        const firstUnit = courseData.units[0];
        setSelectedUnit(firstUnit);
        setModules(firstUnit.modules || []);
      } else {
        // Fallback to modules structure (backward compatibility)
        const modulesResult = await getCourseModules(Number(courseId));
        if (modulesResult && Array.isArray(modulesResult)) {
          setModules(modulesResult as any);
          setCourse({ id: Number(courseId), title: enrollment.course_title });
        } else {
          setError('Failed to load course content');
          setLoading(false);
          return;
        }
      }

      // Set current module/lesson from enrollment
      if (enrollment.current_module) {
        setCurrentModule(enrollment.current_module);
      }
      if (enrollment.current_lesson) {
        // Find the actual lesson object from modules data
        const allLessons = modules.flatMap(module => module.lessons || []);
        const lessonObject = allLessons.find(lesson => lesson.id === enrollment.current_lesson);
        if (lessonObject) {
          setCurrentLesson(lessonObject);
        }
      }

      // Auto-expand current module
      if (enrollment.current_module) {
        setExpandedModules(prev => ({
          ...prev,
          [enrollment.current_module]: true
        }));
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

  const handleUnitChange = (unitId) => {
    const unit = units.find(u => u.id === parseInt(unitId));
    if (unit) {
      setSelectedUnit(unit);
      setModules(unit.modules || []);
      // Reset expanded modules when switching units
      setExpandedModules({});
    }
  };

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
    // Check if lesson is completed based on progress tracking
    // This would typically come from a progress API call or context
    // For now, we'll simulate based on enrollment data
    if (enrollment && enrollment.progress_percentage > 0) {
      // Simple logic: assume lessons are completed in order
      // In a real implementation, you'd check specific lesson progress
      return 'completed';
    }
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

          {/* Unit Selector */}
          {units.length > 1 && (
            <div className="mb-4">
              <label htmlFor="unit-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Unit
              </label>
              <select
                id="unit-select"
                value={selectedUnit?.id || ''}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
              >
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Unit Title */}
          {selectedUnit && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedUnit.title}</h4>
              {selectedUnit.description && (
                <p className="text-sm text-gray-600 mt-1">{selectedUnit.description}</p>
              )}
            </div>
          )}

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
                        {module.title}
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
              {currentLesson.content_type === 'video' && (
                <div className="mb-6">
                  <VideoPlayer
                    lesson={currentLesson}
                    onProgress={(progressData) => {
                      // Handle progress updates
                      console.log('Video progress:', progressData);
                    }}
                    onComplete={(completionData) => {
                      // Handle lesson completion
                      console.log('Video completed:', completionData);
                    }}
                    className="w-full"
                  />
                </div>
              )}

              {currentLesson.content_type === 'text' && (
                <RichContentRenderer content={currentLesson.content} />
              )}

              {currentLesson.content_type === 'quiz' && (
                <QuizPlayer
                  lesson={currentLesson}
                  onSubmit={(result) => {
                    console.log('Quiz submitted:', result);
                    // Handle quiz completion
                  }}
                  onProgress={(progressData) => {
                    console.log('Quiz progress:', progressData);
                  }}
                  className="w-full"
                />
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
                <LiveProgressTracker
                  enrollment={enrollment}
                  currentLesson={currentLesson}
                  onProgressUpdate={(progressData) => {
                    console.log('Lesson progress updated:', progressData);
                    // Here you would update the UI to show completion status
                  }}
                />
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
