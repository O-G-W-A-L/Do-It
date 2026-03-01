import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressService } from '../services/progress';
import type { LessonProgress, AssignmentSubmission } from '../types/api/progress';

interface ModuleWithProgress {
  id: number;
  title: string;
  order: number;
  lessons: Array<{
    id: number;
    title: string;
    order: number;
    content_type: string;
  }>;
}

interface CurrentProjectsSectionProps {
  modules: ModuleWithProgress[];
  selectedCourseId: number | null;
  progress?: LessonProgress[];
  assignments?: AssignmentSubmission[];
}

export default function CurrentProjectsSection({ 
  modules, 
  selectedCourseId,
  progress = [],
  assignments = []
}: CurrentProjectsSectionProps) {
  const navigate = useNavigate();

  // Build progress map from API data
  const progressMap = useMemo(() => {
    const map: Record<number, LessonProgress> = {};
    progress.forEach(p => {
      map[p.lesson] = p;
    });
    return map;
  }, [progress]);

  // Build assignment map from API data
  const assignmentMap = useMemo(() => {
    const map: Record<number, AssignmentSubmission> = {};
    assignments.forEach(a => {
      map[a.lesson] = a;
    });
    return map;
  }, [assignments]);

  const handleProjectClick = (moduleId: number) => {
    if (!selectedCourseId) return;
    const path = `/courses/${selectedCourseId}/modules/${moduleId}`;
    navigate(path);
  };

  // Filter to show modules that have lessons (potential projects)
  const projectModules = useMemo(() => {
    return modules.filter(m => m.lessons && m.lessons.length > 0);
  }, [modules]);

  if (!selectedCourseId) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p>No course selected</p>
        <p className="text-sm mt-1">Select a course to view your projects</p>
      </div>
    );
  }

  if (projectModules.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p>No active projects</p>
        <p className="text-sm mt-1">Select a course to view available projects</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projectModules.map(module => {
        // Calculate module progress from lessons
        const moduleLessonIds = module.lessons.map(l => l.id);
        const completedLessons = module.lessons.filter(l => progressMap[l.id]?.status === 'completed').length;
        const totalLessons = module.lessons.length;
        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        // Check for assignment submissions in this module
        const hasAssignment = module.lessons.some(l => l.content_type === 'assignment');
        const assignmentSubmission = hasAssignment 
          ? module.lessons.find(l => l.content_type === 'assignment')
          : null;
        const submissionStatus = assignmentSubmission ? assignmentMap[assignmentSubmission.id] : null;

        return (
          <div key={module.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div
                className="cursor-pointer flex-1"
                onClick={() => handleProjectClick(module.id)}
              >
                <h4 className="font-medium text-gray-900 hover:text-brand-blue">
                  {module.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {totalLessons} lessons • {completedLessons} completed
                </p>
              </div>
              <span className="text-sm font-medium text-gray-600 ml-4">
                {progressPercent}% done
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${
                  progressPercent === 100 ? 'bg-green-500' : 'bg-brand-blue'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Show assignment status if exists */}
            {hasAssignment && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Assignment:</span>
                  {submissionStatus ? (
                    <span className="text-sm font-medium text-green-600">
                      {submissionStatus.status === 'submitted' ? 'Submitted' : 'Graded'}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-orange-600">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
