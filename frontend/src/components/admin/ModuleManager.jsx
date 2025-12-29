import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import { coursesService } from '../../services/courses';

/**
 * Simple module manager with CRUD operations
 * Single responsibility: Module creation, editing, and organization
 */
const ModuleManager = ({ course, modules, onModulesChange, onLessonSelect }) => {
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleModuleExpansion = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const addModule = () => {
    if (!course) return;

    const newModule = {
      id: `temp-${Date.now()}`,
      title: 'New Module',
      description: '',
      order: modules.length + 1,
      lessons: [],
      _isNew: true
    };

    onModulesChange([...modules, newModule]);
  };

  const addLesson = (moduleId) => {
    const newLesson = {
      id: `temp-${Date.now()}`,
      title: 'New Lesson',
      content_type: 'text',
      content: '',
      order: modules.find(m => m.id === moduleId)?.lessons.length + 1 || 1,
      _isNew: true
    };

    const updatedModules = modules.map(module =>
      module.id === moduleId
        ? { ...module, lessons: [...module.lessons, newLesson] }
        : module
    );

    onModulesChange(updatedModules);
  };

  const updateModule = (moduleId, updates) => {
    const updatedModules = modules.map(module =>
      module.id === moduleId ? { ...module, ...updates } : module
    );
    onModulesChange(updatedModules);
  };

  const deleteModule = (moduleId) => {
    const updatedModules = modules.filter(module => module.id !== moduleId);
    onModulesChange(updatedModules);
  };

  const deleteLesson = (moduleId, lessonId) => {
    const updatedModules = modules.map(module =>
      module.id === moduleId
        ? { ...module, lessons: module.lessons.filter(lesson => lesson.id !== lessonId) }
        : module
    );
    onModulesChange(updatedModules);
  };

  const getLessonTypeIcon = (lesson) => {
    const type = lesson?.content_type || lesson?.type || 'text';
    switch (type) {
      case 'video': return '🎥';
      case 'quiz': return '📝';
      case 'assignment': return '📋';
      default: return '📄';
    }
  };

  if (!course) {
    return (
      <div className="p-8 text-center text-gray-500">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>Select a course to manage modules</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Course Structure</h2>
          <Button
            onClick={addModule}
            size="sm"
            icon={Plus}
            disabled={loading}
          >
            Add Module
          </Button>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-2 text-red-600">
            <div className="w-4 h-4">⚠️</div>
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="space-y-2">
          {modules.map((module) => (
            <div key={module.id} className="border border-gray-200 rounded-lg">
              {/* Module Header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleModuleExpansion(module.id)}
              >
                <div className="flex items-center gap-2">
                  {expandedModules.has(module.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">{module.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">{module.lessons.length} lessons</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteModule(module.id);
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Delete module"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Module Lessons */}
              {expandedModules.has(module.id) && (
                <div className="border-t border-gray-100">
                  <div className="p-2 space-y-1">
                    {module.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="group flex items-center justify-between p-2 rounded hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <GripVertical className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{getLessonTypeIcon(lesson)}</span>
                          <span className="text-sm text-gray-700 flex-1">{lesson.title}</span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onLessonSelect(lesson)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteLesson(module.id, lesson.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Delete lesson"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Lesson Button */}
                    <button
                      onClick={() => addLesson(module.id)}
                      className="w-full flex items-center justify-center gap-2 p-2 text-sm text-blue-600 hover:bg-blue-50 rounded border-2 border-dashed border-blue-200"
                    >
                      <Plus className="w-3 h-3" />
                      Add Lesson
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleManager;
