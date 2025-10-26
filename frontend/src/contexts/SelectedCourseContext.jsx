import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCourseContext } from './CourseContext';

const SelectedCourseContext = createContext();

const STORAGE_KEY = 'selected_course_id';

export function SelectedCourseProvider({ children }) {
  const { enrollments } = useCourseContext();
  const [selectedCourseId, setSelectedCourseId] = useState(() => {
    // Initialize from localStorage or null
    return localStorage.getItem(STORAGE_KEY) || null;
  });

  // Get the selected course object
  const selectedCourse = selectedCourseId
    ? enrollments.find(e => e.course === parseInt(selectedCourseId))
    : null;

  // Auto-select first enrolled course if none selected and enrollments exist
  useEffect(() => {
    if (!selectedCourseId && enrollments && enrollments.length > 0) {
      const firstEnrollment = enrollments[0];
      if (firstEnrollment && firstEnrollment.course) {
        setSelectedCourseId(firstEnrollment.course.toString());
      }
    }
  }, [selectedCourseId, enrollments]);

  // Validate selected course still exists
  useEffect(() => {
    if (selectedCourseId && enrollments) {
      const courseExists = enrollments.some(e => e.course === parseInt(selectedCourseId));
      if (!courseExists) {
        // Selected course no longer exists, clear selection
        setSelectedCourseId(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [selectedCourseId, enrollments]);

  const updateSelectedCourseId = (courseId) => {
    const id = courseId ? courseId.toString() : null;
    setSelectedCourseId(id);

    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Filter utilities for components
  const getFilteredEnrollments = () => {
    if (!selectedCourseId) return enrollments || [];
    return (enrollments || []).filter(e => e.course === parseInt(selectedCourseId));
  };

  const value = {
    selectedCourseId,
    selectedCourse,
    setSelectedCourseId: updateSelectedCourseId,
    getFilteredEnrollments,
    // Utility to check if a course is selected
    hasSelectedCourse: !!selectedCourseId,
  };

  return (
    <SelectedCourseContext.Provider value={value}>
      {children}
    </SelectedCourseContext.Provider>
  );
}

export function useSelectedCourseContext() {
  const context = useContext(SelectedCourseContext);
  if (!context) {
    throw new Error('useSelectedCourseContext must be used within a SelectedCourseProvider');
  }
  return context;
}
