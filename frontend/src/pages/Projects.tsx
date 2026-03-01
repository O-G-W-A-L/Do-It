import React, { useState, useEffect, useMemo } from 'react';
import { useCourseContext } from '../contexts/CourseContext';
import { useSelectedCourseContext } from '../contexts/SelectedCourseContext';
import { useAuth } from '../contexts/AuthContext';
import { progressService } from '../services/progress';
import CurrentProjectsSection from '../components/CurrentProjectsSection';
import type { LessonProgress, AssignmentSubmission } from '../types/api/progress';
import {
  FolderOpen, ChevronDown, ChevronRight, BookOpen
} from 'lucide-react';

export default function Projects() {
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [modules, setModules] = useState<any[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  // Course context for course-specific functionality
  const { enrollments, getCourseModules } = useCourseContext();
  const { selectedCourseId } = useSelectedCourseContext();
  const { user } = useAuth();

  // Fetch data when selected course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setModules([]);
      setProgress([]);
      setAssignments([]);
      return;
    }

    const fetchData = async () => {
      if (!selectedCourseId) return;

      setLoading(true);
      try {
        const [modulesResult, progressResult, _assignmentsResult] = await Promise.all([
          getCourseModules(selectedCourseId),
          progressService.getCourseProgress(selectedCourseId),
          // Get assignment submissions - would need API endpoint
          Promise.resolve({ success: true, data: [] })
        ]);

        if (modulesResult && Array.isArray(modulesResult)) {
          setModules(modulesResult);
        }

        if (progressResult.success && progressResult.data) {
          setProgress(progressResult.data);
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCourseId, getCourseModules]);

  // Calculate progress for each module
  const moduleProgress = useMemo(() => {
    const progressMap: Record<number, { completed: number; total: number }> = {};
    
    modules.forEach(module => {
      const lessons = module.lessons || [];
      const completed = lessons.filter((l: any) => 
        progress.some(p => p.lesson === l.id && p.status === 'completed')
      ).length;
      progressMap[module.id] = { completed, total: lessons.length };
    });
    
    return progressMap;
  }, [modules, progress]);

  return (
    <div className="space-y-6">
      {/* My Projects Section */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Projects</h2>
        <CurrentProjectsSection 
          modules={modules} 
          selectedCourseId={selectedCourseId}
          progress={progress}
          assignments={assignments}
        />
      </div>

      {/* All Projects Section */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Projects</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const allKeys: Record<number, boolean> = {};
                modules.forEach((module: any) => {
                  allKeys[module.id] = true;
                });
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue"></div>
          </div>
        ) : Array.isArray(modules) && modules.length > 0 ? (
          <div className="space-y-3">
            {modules.map((module: any) => {
              const isExpanded = expandedModules[module.id];
              const moduleStats = moduleProgress[module.id] || { completed: 0, total: 0 };
              const progressPercent = moduleStats.total > 0 
                ? Math.round((moduleStats.completed / moduleStats.total) * 100) 
                : 0;

              return (
                <div key={module.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setExpandedModules(prev => ({
                      ...prev,
                      [module.id]: !prev[module.id]
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
                        {module.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {moduleStats.completed}/{moduleStats.total} lessons
                      </span>
                      <span className={`text-sm font-medium ${
                        progressPercent === 100 ? 'text-green-600' : 'text-brand-blue'
                      }`}>
                        {progressPercent}%
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-gray-100">
                      {module.lessons && module.lessons.length > 0 ? (
                        module.lessons.map((lesson: any) => {
                          const lessonProgress = progress.find(p => p.lesson === lesson.id);
                          const isCompleted = lessonProgress?.status === 'completed';
                          
                          return (
                            <div 
                              key={lesson.id} 
                              className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                }`}></span>
                                <span className="text-sm text-gray-700">{lesson.title}</span>
                                <span className="text-xs text-gray-400 capitalize">({lesson.content_type})</span>
                              </div>
                              {isCompleted && (
                                <span className="text-xs text-green-600">Completed</span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">No lessons in this module</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No projects available</p>
            <p className="text-sm mt-1">Select a course to view all projects</p>
          </div>
        )}
      </div>
    </div>
  );
}
