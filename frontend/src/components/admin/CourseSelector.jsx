import React, { useState, useEffect } from 'react';
import { FilePlus } from 'lucide-react';
import Button from '../ui/Button';
import { coursesService } from '../../services/courses';
import CourseCreationModal from './CourseCreationModal';

/**
 * Simple course selector with creation capability
 * Single responsibility: Course selection and creation
 */
const CourseSelector = ({ selectedCourse, onCourseSelect, onCourseCreated }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await coursesService.getCourses();
      if (result.success) {
        setCourses(result.data.results || result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseCreated = (newCourse) => {
    setCourses(prev => [...prev, newCourse]);
    onCourseCreated?.(newCourse);
    setShowCreateModal(false);
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Course
        </label>
        <Button
          onClick={() => setShowCreateModal(true)}
          size="sm"
          variant="outline"
          icon={FilePlus}
        >
          Create Course
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm">Loading courses...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600">
          <div className="w-4 h-4">⚠️</div>
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <select
          value={selectedCourse?.id || ''}
          onChange={(e) => {
            const courseId = e.target.value;
            const course = courses.find(c => c.id.toString() === courseId);
            onCourseSelect(course || null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a course to edit...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} ({course.status})
            </option>
          ))}
        </select>
      )}

      <CourseCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCourseCreated={handleCourseCreated}
      />
    </div>
  );
};

export default CourseSelector;
