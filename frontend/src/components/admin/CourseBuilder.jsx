import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  GripVertical,
  Eye,
  Save,
  Upload,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import { coursesService } from '../../services/courses';

const CourseBuilder = ({ onSave, onPublish }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Loading states
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [saving, setSaving] = useState(false);

  // Error states
  const [coursesError, setCoursesError] = useState(null);
  const [modulesError, setModulesError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load modules when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadModules(selectedCourse.id);
    } else {
      setModules([]);
      setSelectedModule(null);
      setSelectedLesson(null);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      setCoursesError(null);
      const result = await coursesService.getCourses();
      if (result.success) {
        setCourses(result.data.results || result.data);
      } else {
        setCoursesError(result.error);
      }
    } catch (error) {
      setCoursesError('Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadModules = async (courseId) => {
    try {
      setLoadingModules(true);
      setModulesError(null);
      const result = await coursesService.getCourseModules(courseId);
      if (result.success) {
        // The API returns modules with lessons already included
        const courseModules = (result.data.results || result.data)
          .sort((a, b) => a.order - b.order);
        setModules(courseModules);
      } else {
        setModulesError(result.error);
      }
    } catch (error) {
      setModulesError('Failed to load course modules');
    } finally {
      setLoadingModules(false);
    }
  };

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
    const newModule = {
      id: Date.now(),
      title: 'New Module',
      description: '',
      order: modules.length + 1,
      lessons: []
    };
    setModules([...modules, newModule]);
    setHasUnsavedChanges(true);
  };

  const addLesson = (moduleId) => {
    const newLesson = {
      id: Date.now(),
      title: 'New Lesson',
      type: 'text',
      order: modules.find(m => m.id === moduleId)?.lessons.length + 1 || 1
    };

    setModules(modules.map(module =>
      module.id === moduleId
        ? { ...module, lessons: [...module.lessons, newLesson] }
        : module
    ));
    setHasUnsavedChanges(true);
  };

  const updateModule = (moduleId, updates) => {
    setModules(modules.map(module =>
      module.id === moduleId ? { ...module, ...updates } : module
    ));
    setHasUnsavedChanges(true);
  };

  const updateLesson = (moduleId, lessonId, updates) => {
    setModules(modules.map(module =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.map(lesson =>
              lesson.id === lessonId ? { ...lesson, ...updates } : lesson
            )
          }
        : module
    ));
    setHasUnsavedChanges(true);
  };

  const deleteModule = (moduleId) => {
    setModules(modules.filter(module => module.id !== moduleId));
    setHasUnsavedChanges(true);
  };

  const deleteLesson = (moduleId, lessonId) => {
    setModules(modules.map(module =>
      module.id === moduleId
        ? { ...module, lessons: module.lessons.filter(lesson => lesson.id !== lessonId) }
        : module
    ));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!selectedCourse) return;

    try {
      setSaving(true);
      setSaveError(null);

      // Save course updates if needed
      // For now, just mark as saved
      setHasUnsavedChanges(false);
      onSave?.();

    } catch (error) {
      setSaveError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedCourse) return;

    try {
      setSaving(true);
      setSaveError(null);

      const result = await coursesService.updateCourse(selectedCourse.id, {
        status: 'published'
      });

      if (result.success) {
        // Update local course status
        setSelectedCourse({ ...selectedCourse, status: 'published' });
        setCourses(courses.map(c =>
          c.id === selectedCourse.id ? { ...c, status: 'published' } : c
        ));
        setHasUnsavedChanges(false);
        onPublish?.();
      } else {
        setSaveError(result.error);
      }

    } catch (error) {
      setSaveError('Failed to publish course');
    } finally {
      setSaving(false);
    }
  };

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case 'video': return '🎥';
      case 'quiz': return '📝';
      case 'assignment': return '📋';
      default: return '📄';
    }
  };

  return (
    <div className="h-full flex">
      {/* Course Structure Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Course Selector */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course
          </label>
          {loadingCourses ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading courses...</span>
            </div>
          ) : coursesError ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{coursesError}</span>
            </div>
          ) : (
            <select
              value={selectedCourse?.id || ''}
              onChange={(e) => {
                const courseId = e.target.value;
                const course = courses.find(c => c.id.toString() === courseId);
                setSelectedCourse(course || null);
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
        </div>

        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Course Structure</h2>
            {selectedCourse && (
              <Button
                onClick={addModule}
                size="sm"
                icon={Plus}
                disabled={loadingModules}
              >
                Add Module
              </Button>
            )}
          </div>
          {modulesError && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{modulesError}</span>
            </div>
          )}
        </div>

        {/* Modules List */}
        <div className="flex-1 overflow-y-auto p-4">
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
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedLesson(lesson)}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{getLessonTypeIcon(lesson.type)}</span>
                            <span className="text-sm text-gray-700">{lesson.title}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLesson(module.id, lesson.id);
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
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

      {/* Content Editor Panel */}
      <div className="flex-1 bg-gray-50 p-6">
        {selectedLesson ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            {/* Lesson Editor Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getLessonTypeIcon(selectedLesson.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedLesson.title}</h3>
                    <p className="text-sm text-gray-600 capitalize">{selectedLesson.type} Lesson</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" icon={Eye}>
                    Preview
                  </Button>
                  <Button icon={Save}>
                    Save Lesson
                  </Button>
                </div>
              </div>
            </div>

            {/* Lesson Content Editor */}
            <div className="p-6 h-full">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    value={selectedLesson.title}
                    onChange={(e) => updateLesson(
                      modules.find(m => m.lessons.some(l => l.id === selectedLesson.id))?.id,
                      selectedLesson.id,
                      { title: e.target.value }
                    )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    value={selectedLesson.type}
                    onChange={(e) => updateLesson(
                      modules.find(m => m.lessons.some(l => l.id === selectedLesson.id))?.id,
                      selectedLesson.id,
                      { type: e.target.value }
                    )}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="text">Text Content</option>
                    <option value="video">Video</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>

                {/* Content Area - Placeholder for now */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Content Editor
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Rich text editor and media uploader will be implemented here
                  </p>
                  <Button variant="outline">
                    Add Content
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Lesson to Edit
              </h3>
              <p className="text-gray-600">
                Choose a lesson from the course structure to start editing
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Panel */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Live Preview</h3>
          <p className="text-sm text-gray-600">How students will see it</p>
        </div>

        <div className="flex-1 p-4">
          <div className="bg-gray-100 rounded-lg p-4 min-h-full">
            <div className="text-center text-gray-500">
              <Eye className="w-8 h-8 mx-auto mb-2" />
              <p>Preview will show here</p>
              <p className="text-xs mt-1">Changes update in real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseBuilder;
