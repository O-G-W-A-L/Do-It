import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseContext } from '../contexts/CourseContext';
import { useSelectedCourseContext } from '../contexts/SelectedCourseContext';
import { useAuth } from '../contexts/AuthContext';
import { progressService } from '../services/progress';
import {
  Calendar, BookOpen, FolderOpen, BarChart3,
  ChevronDown, ChevronRight, CheckCircle, PlayCircle, Lock
} from 'lucide-react';
import type { LessonProgress } from '../types/api/progress';

interface ModuleWithProgress {
  id: number;
  title: string;
  order: number;
  lessons: Array<{
    id: number;
    title: string;
    order: number;
    content_type: string;
    completed: boolean;
  }>;
  completedLessons: number;
  totalLessons: number;
}

export default function Hub() {
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [moduleProgress, setModuleProgress] = useState<Record<number, ModuleWithProgress>>({});
  const [progressLoading, setProgressLoading] = useState(false);
  const navigate = useNavigate();

  const { enrollments, getCourseModules } = useCourseContext();
  const { selectedCourseId } = useSelectedCourseContext();
  const { user } = useAuth();

  const selectedEnrollment = useMemo(() => {
    if (!selectedCourseId || !enrollments.length) return null;
    return enrollments.find(e => e.course === Number(selectedCourseId)) || null;
  }, [selectedCourseId, enrollments]);

  // Fetch modules when selected course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setModuleProgress({});
      return;
    }

  const fetchData = async () => {
    if (!selectedCourseId) return;
    
    setProgressLoading(true);
    try {
      // Fetch modules and progress in parallel
      const [modulesResult, progressResult] = await Promise.all([
        getCourseModules(selectedCourseId),
        progressService.getCourseProgress(Number(selectedCourseId))
      ]);

        // Build progress map from API response
        const progressMap: Record<number, boolean> = {};
        if (progressResult.success && progressResult.data) {
          progressResult.data.forEach((p: LessonProgress) => {
            if (p.status === 'completed') {
              progressMap[p.lesson] = true;
            }
          });
        }

        // Transform modules with progress data
        if (modulesResult && Array.isArray(modulesResult)) {
          const modulesWithProgress: Record<number, ModuleWithProgress> = {};
          
          modulesResult.forEach((module: any) => {
            const lessons = (module.lessons || []).map((lesson: any) => ({
              id: lesson.id,
              title: lesson.title,
              order: lesson.order,
              content_type: lesson.content_type,
              completed: progressMap[lesson.id] || false
            }));
            
            const completedLessons = lessons.filter(l => l.completed).length;
            
            modulesWithProgress[module.id] = {
              id: module.id,
              title: module.title,
              order: module.order,
              lessons,
              completedLessons,
              totalLessons: lessons.length
            };
          });
          
          setModuleProgress(modulesWithProgress);
        }
      } catch (error) {
        console.error('Error fetching hub data:', error);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchData();
  }, [selectedCourseId, getCourseModules]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const modules = Object.values(moduleProgress);
    if (!modules.length) return 0;
    
    const totalLessons = modules.reduce((sum, m) => sum + m.totalLessons, 0);
    const completedLessons = modules.reduce((sum, m) => sum + m.completedLessons, 0);
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }, [moduleProgress]);

  // Find next incomplete lesson for resume
  const nextLesson = useMemo(() => {
    const modules = Object.values(moduleProgress);
    for (const module of modules) {
      const incomplete = module.lessons.find(l => !l.completed);
      if (incomplete) {
        return { moduleId: module.id, lesson: incomplete };
      }
    }
    return null;
  }, [moduleProgress]);

  const toggleModuleExpansion = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleResume = () => {
    if (!selectedCourseId) {
      navigate('/my-courses');
      return;
    }

    // If we have a next incomplete lesson, go there
    if (nextLesson) {
      navigate(`/courses/${selectedCourseId}/modules/${nextLesson.moduleId}`);
      return;
    }

    // If course is complete (or no next lesson), go to first module to review
    const firstModule = Object.values(moduleProgress)[0];
    if (firstModule) {
      navigate(`/courses/${selectedCourseId}/modules/${firstModule.id}`);
    } else {
      navigate('/my-courses');
    }
  };

  const modulesList = Object.values(moduleProgress);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.username || 'Learner'}!
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedEnrollment 
              ? `${overallProgress}% complete - ${selectedEnrollment.course_title}`
              : 'Ready to continue your learning journey?'}
          </p>
        </div>
        <button
          onClick={handleResume}
          disabled={!selectedCourseId || progressLoading}
          className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-light transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlayCircle className="w-5 h-5" />
          {overallProgress === 100 ? 'Review Course' : 'Continue Learning'}
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
              <p>No upcoming events</p>
            </div>
          </div>

          {/* Current Learning - Collapsible Module Outline */}
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-500" />
              Current Learning
            </h3>
            
            {progressLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
              </div>
            ) : modulesList.length > 0 ? (
              <div className="space-y-2">
                {modulesList.map(module => {
                  const isExpanded = expandedModules[module.id];
                  const isComplete = module.completedLessons === module.totalLessons;
                  const hasIncomplete = module.completedLessons > 0 && !isComplete;

                  return (
                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Module Header */}
                      <button
                        onClick={() => toggleModuleExpansion(module.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          {/* Completion Indicator */}
                          {isComplete ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : hasIncomplete ? (
                            <div className="w-5 h-5 rounded-full bg-brand-blue/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-brand-blue">{module.completedLessons}</span>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0" />
                          )}
                          
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {module.title}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {module.completedLessons} of {module.totalLessons} lessons complete
                            </p>
                          </div>
                        </div>

                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Expandable Lesson List */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gray-50 p-2 space-y-1">
                          {module.lessons.map(lesson => (
                            <button
                              key={lesson.id}
                              onClick={() => navigate(`/courses/${selectedCourseId}/modules/${module.id}`)}
                              className="w-full flex items-center gap-3 p-3 rounded hover:bg-white transition-colors text-left"
                            >
                              {lesson.completed ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className={`text-sm ${lesson.completed ? 'text-gray-500' : 'text-gray-900'}`}>
                                  {lesson.title}
                                </span>
                              </div>
                              <span className="text-xs text-gray-400 capitalize">
                                {lesson.content_type}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No modules available</p>
                <p className="text-sm mt-1">Select a course to view available modules</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Narrower */}
        <div className="space-y-6">
          {/* Course Progress Card */}
          {selectedEnrollment && (
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Progress</h3>
              
              <div className="text-center mb-4">
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className={overallProgress === 100 ? 'text-green-500' : 'text-brand-blue'}
                      strokeDasharray={`${(overallProgress / 100) * 351} 351`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{overallProgress}%</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                {overallProgress === 100 
                  ? 'Course Completed!' 
                  : `${100 - overallProgress}% remaining`}
              </div>
            </div>
          )}

          {/* Reports */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
            </div>

            {selectedEnrollment ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Course</span>
                  <span className="text-sm font-medium text-gray-900">{selectedEnrollment.course_title}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-medium capitalize ${
                    selectedEnrollment.status === 'completed' ? 'text-green-600' : 'text-brand-blue'
                  }`}>
                    {selectedEnrollment.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Enrolled</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedEnrollment.enrolled_at 
                      ? new Date(selectedEnrollment.enrolled_at).toLocaleDateString()
                      : '-'}
                  </span>
                </div>
                {selectedEnrollment.completed_at && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium text-green-600">
                      {new Date(selectedEnrollment.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No course selected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
