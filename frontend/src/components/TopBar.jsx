import React from 'react';
import { useCourseContext } from '../contexts/CourseContext';
import { useSelectedCourseContext } from '../contexts/SelectedCourseContext';

export default function TopBar() {
  const { enrollments } = useCourseContext();
  const { selectedCourseId, setSelectedCourseId } = useSelectedCourseContext();

  // Calculate average progress across all enrollments
  const averageProgress = enrollments && enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length)
    : 0;

  const handleCourseChange = (e) => {
    setSelectedCourseId(e.target.value || null);
  };

  return (
    <div className="bg-white rounded-lg p-4 flex justify-between items-center border-b border-gray-200">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Course:</span>
        <select
          value={selectedCourseId || ''}
          onChange={handleCourseChange}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
        >
          <option value="">All Courses</option>
          {Array.isArray(enrollments) && enrollments.map(enrollment => {
            if (!enrollment || !enrollment.id) return null;
            return (
              <option key={enrollment.id} value={enrollment.course}>
                {enrollment.course_title} ({enrollment.progress_percentage || 0}%)
              </option>
            );
          })}
        </select>
      </div>
      <div className="text-right">
        <div className="text-sm text-gray-600">Average Progress</div>
        <div className="text-lg font-bold text-gray-900">{averageProgress}%</div>
      </div>
    </div>
  );
}
