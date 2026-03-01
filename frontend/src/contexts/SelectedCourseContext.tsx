import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Course } from '../types/api/course';

interface SelectedCourseContextType {
  selectedCourse: Course | null;
  selectedCourseId: number | null;
  setSelectedCourse: (course: Course | null) => void;
  setSelectedCourseId: (id: number | null) => void;
}

const SelectedCourseContext = createContext<SelectedCourseContextType | undefined>(undefined);

interface SelectedCourseProviderProps {
  children: ReactNode;
}

export function SelectedCourseProvider({ children }: SelectedCourseProviderProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  return (
    <SelectedCourseContext.Provider value={{ 
      selectedCourse, 
      selectedCourseId,
      setSelectedCourse,
      setSelectedCourseId
    }}>
      {children}
    </SelectedCourseContext.Provider>
  );
}

export const useSelectedCourse = (): SelectedCourseContextType => {
  const context = useContext(SelectedCourseContext);
  if (context === undefined) {
    throw new Error('useSelectedCourse must be used within a SelectedCourseProvider');
  }
  return context;
};

export const useSelectedCourseContext = (): SelectedCourseContextType => {
  const context = useContext(SelectedCourseContext);
  if (context === undefined) {
    throw new Error('useSelectedCourseContext must be used within a SelectedCourseProvider');
  }
  return context;
};
