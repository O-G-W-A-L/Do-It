import React, { useState, useEffect } from 'react';
import { useCourseContext } from '../contexts/CourseContext';
import { useSelectedCourseContext } from '../contexts/SelectedCourseContext';
import { useAuth } from '../contexts/AuthContext';
import CurrentProjectsSection from '../components/CurrentProjectsSection';
import {
  FolderOpen, ChevronDown, ChevronRight, CheckCircle,
  BookOpen, Loader2
} from 'lucide-react';

export default function Projects() {
  const [expandedModules, setExpandedModules] = useState({});
  const [modules, setModules] = useState([]);

  // Course context for course-specific functionality
  const { enrollments, getCourseModules } = useCourseContext();
  const { selectedCourseId } = useSelectedCourseContext();
  const { user } = useAuth();

  // Fetch modules when selected course changes
  useEffect(() => {
    if (selectedCourseId) {
      getCourseModules(selectedCourseId).then(result => {
        if (result) {
          setModules(result);
        }
      });
    } else {
      setModules([]);
    }
  }, [selectedCourseId, getCourseModules]);

  return (
    <div className="space-y-6">
      {/* My Projects Section - Exact duplicate of Hub Current Projects */}
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Projects</h2>
        <CurrentProjectsSection modules={modules} selectedCourseId={selectedCourseId} />
      </div>

      {/* All Projects Section */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">All Projects</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const allKeys = modules.reduce((keys, module) => {
                  keys[module.id] = true;
                  return keys;
                }, {});
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

        <div className="space-y-3">
          {Array.isArray(modules) && modules.length > 0 ? (
            modules.map(module => {
              const isExpanded = expandedModules[module.id];

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
                    <span className="text-sm text-gray-600">
                      Module {module.order || 1}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {/* Module content - lessons, assignments, quizzes */}
                      <div className="text-center py-4 text-gray-500">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Module content and assignments will be displayed here</p>
                        <p className="text-xs mt-1">This includes lessons, quizzes, and project assignments</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No projects available</p>
              <p className="text-sm mt-1">Select a course to view all projects</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
