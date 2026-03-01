import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseContext } from '../contexts/CourseContext';

export default function MyCourses() {
  const navigate = useNavigate();
  const { enrollments } = useCourseContext();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Enrolled Courses</h2>
        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No enrolled courses yet.</p>
            <button
              onClick={() => navigate('/courses')}
              className="bg-brand-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-light transition-colors"
            >
              Browse Available Courses
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {Array.isArray(enrollments) && enrollments.map(enrollment => {
              if (!enrollment || !enrollment.id) return null;
              return (
                <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {enrollment.course_title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          enrollment.status === 'completed' ? 'bg-green-100 text-green-700' :
                          enrollment.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {enrollment.status}
                        </span>
                        <span>Progress: {Number(enrollment.progress_percentage || 0)}%</span>
                        <span>Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-brand-blue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progress_percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/course/${enrollment.course}`)}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                    >
                      Continue Learning
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
