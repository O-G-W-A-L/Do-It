import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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
  AlertCircle,
  FilePlus,
  Video,
  HelpCircle,
  FileText
} from 'lucide-react';
import Button from '../ui/Button';
import { coursesService } from '../../services/courses';
import CourseCreationModal from './CourseCreationModal';
import LessonContentEditor from './LessonContentEditor';
import VideoLinkDisplay from '../course/VideoLinkDisplay';

const CourseBuilder = ({ onSave, onPublish }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingLessonTitle, setEditingLessonTitle] = useState(null);
  const [lessonTitleInput, setLessonTitleInput] = useState('');

  // Loading states
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [saving, setSaving] = useState(false);

  // Error states
  const [coursesError, setCoursesError] = useState(null);
  const [modulesError, setModulesError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Modal states
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);

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

  const addModule = async () => {
    if (!selectedCourse) return;

    // Create temporary module in local state first
    const tempModule = {
      id: `temp-${Date.now()}`,
      title: 'New Module',
      description: '',
      order: modules.length + 1,
      lessons: [],
      _isNew: true
    };

    setModules([...modules, tempModule]);
    setHasUnsavedChanges(true);
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

  const saveLessonContent = async (lessonId, contentData) => {
    try {
      const result = await coursesService.updateLesson(lessonId, contentData);
      if (result.success) {
        // Update local state with saved data
        const moduleId = modules.find(m => m.lessons.some(l => l.id === lessonId))?.id;
        if (moduleId) {
          updateLesson(moduleId, lessonId, result.data);
        }
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw new Error('Failed to save lesson content');
    }
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

  const startEditingLessonTitle = (lesson) => {
    setEditingLessonTitle(lesson.id);
    setLessonTitleInput(lesson.title);
  };

  const saveLessonTitle = (moduleId, lessonId) => {
    if (lessonTitleInput.trim() === '') {
      toast.error('Lesson title cannot be empty');
      return;
    }

    updateLesson(moduleId, lessonId, { title: lessonTitleInput.trim() });
    setEditingLessonTitle(null);
    setLessonTitleInput('');
    toast.success('Lesson title updated');
  };

  const cancelEditingLessonTitle = () => {
    setEditingLessonTitle(null);
    setLessonTitleInput('');
  };

  const handleSave = async () => {
    if (!selectedCourse) return;

    const loadingToast = toast.loading('Saving course...');

    try {
      setSaving(true);
      setSaveError(null);

      let savedModules = 0;
      let savedLessons = 0;
      let errors = [];

      // 1. Save all modified modules
      for (const module of modules) {
        try {
          if (module.id.toString().startsWith('temp-') || module._isNew) {
            // Validate required fields for new module
            if (!module.title || module.title.trim() === '') {
              errors.push(`Module "${module.title || 'Untitled'}" must have a title`);
              continue;
            }

            // Create new module
            const result = await coursesService.createModule({
              course: selectedCourse.id,
              title: module.title.trim(),
              description: module.description || '',
              order: module.order
            });

            if (result.success) {
              // Update local state with real ID from backend
              module.id = result.data.id;
              delete module._isNew;
              savedModules++;

              // 2. Save all lessons for this module
              for (const lesson of module.lessons) {
                try {
                  if (lesson.id.toString().startsWith('temp-') || lesson._isNew) {
                    // Validate required fields for new lesson
                    if (!lesson.title || lesson.title.trim() === '') {
                      errors.push(`Lesson in module "${module.title}" must have a title`);
                      continue;
                    }

                    // Create new lesson
                    const lessonResult = await coursesService.createLesson({
                      module: module.id,
                      title: lesson.title.trim(),
                      content: lesson.content || '',
                      content_type: lesson.content_type || 'text',
                      order: lesson.order
                    });

                    if (lessonResult.success) {
                      lesson.id = lessonResult.data.id;
                      delete lesson._isNew;
                      savedLessons++;
                    } else {
                      errors.push(`Failed to save lesson "${lesson.title}": ${lessonResult.error}`);
                    }
                  } else {
                    // Update existing lesson
                    const lessonResult = await coursesService.updateLesson(lesson.id, {
                      title: lesson.title || lesson.title,
                      content: lesson.content || '',
                      content_type: lesson.content_type || 'text',
                      order: lesson.order
                    });

                    if (lessonResult.success) {
                      savedLessons++;
                    } else {
                      errors.push(`Failed to update lesson "${lesson.title}": ${lessonResult.error}`);
                    }
                  }
                } catch (lessonError) {
                  errors.push(`Error saving lesson "${lesson.title}": ${lessonError.message}`);
                }
              }
            } else {
              errors.push(`Failed to save module "${module.title}": ${result.error}`);
            }
          } else {
            // Update existing module
            const result = await coursesService.updateModule(module.id, {
              title: module.title || module.title,
              description: module.description || '',
              order: module.order
            });

            if (result.success) {
              savedModules++;
            } else {
              errors.push(`Failed to update module "${module.title}": ${result.error}`);
            }

            // Save lessons for existing modules
            for (const lesson of module.lessons) {
              try {
                if (lesson.id.toString().startsWith('temp-') || lesson._isNew) {
                  // Validate required fields for new lesson
                  if (!lesson.title || lesson.title.trim() === '') {
                    errors.push(`Lesson in module "${module.title}" must have a title`);
                    continue;
                  }

                  // Create new lesson
                  const lessonResult = await coursesService.createLesson({
                    module: module.id,
                    title: lesson.title.trim(),
                    content: lesson.content || '',
                    content_type: lesson.content_type || 'text',
                    order: lesson.order
                  });

                  if (lessonResult.success) {
                    lesson.id = lessonResult.data.id;
                    delete lesson._isNew;
                    savedLessons++;
                  } else {
                    errors.push(`Failed to save lesson "${lesson.title}": ${lessonResult.error}`);
                  }
                } else {
                  // Update existing lesson
                  const lessonResult = await coursesService.updateLesson(lesson.id, {
                    title: lesson.title || lesson.title,
                    content: lesson.content || '',
                    content_type: lesson.content_type || 'text',
                    order: lesson.order
                  });

                  if (lessonResult.success) {
                    savedLessons++;
                  } else {
                    errors.push(`Failed to update lesson "${lesson.title}": ${lessonResult.error}`);
                  }
                }
              } catch (lessonError) {
                errors.push(`Error saving lesson "${lesson.title}": ${lessonError.message}`);
              }
            }
          }
        } catch (moduleError) {
          errors.push(`Error saving module "${module.title}": ${moduleError.message}`);
        }
      }

      // Reload modules to get fresh data from backend
      await loadModules(selectedCourse.id);

      // Show results
      toast.dismiss(loadingToast);

      if (errors.length === 0) {
        setHasUnsavedChanges(false);
        toast.success(`Course saved successfully! (${savedModules} modules, ${savedLessons} lessons)`);
        onSave?.();
      } else {
        // Show partial success with errors
        const errorMessage = errors.length > 3
          ? `${errors.length} errors occurred. Check details.`
          : errors.join('\n');

        toast.error(`Saved with errors: ${savedModules} modules, ${savedLessons} lessons`);
        setSaveError(errorMessage);

        // Still mark as saved if at least something was saved
        if (savedModules > 0 || savedLessons > 0) {
          setHasUnsavedChanges(false);
        }
      }

    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMsg = error.message || 'Failed to save course';
      toast.error(errorMsg);
      setSaveError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedCourse) return;

    // Validate course has description before publishing
    if (!selectedCourse.description || selectedCourse.description.trim() === '') {
      toast.error('Course must have a description to be published');
      return;
    }

    const loadingToast = toast.loading('Publishing course...');

    try {
      setSaving(true);
      setSaveError(null);

      const result = await coursesService.publishCourse(selectedCourse.id);

      if (result.success) {
        // Update local course status
        setSelectedCourse({ ...selectedCourse, status: 'published' });
        setCourses(courses.map(c =>
          c.id === selectedCourse.id ? { ...c, status: 'published' } : c
        ));
        setHasUnsavedChanges(false);
        onPublish?.();

        toast.dismiss(loadingToast);
        toast.success('Course published successfully!');
      } else {
        toast.dismiss(loadingToast);
        toast.error(result.error || 'Failed to publish course');
        setSaveError(result.error);
      }

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to publish course');
      setSaveError('Failed to publish course');
    } finally {
      setSaving(false);
    }
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

  // Get current lesson data from modules state (not stale selectedLesson)
  const getCurrentLesson = () => {
    if (!selectedLesson) return null;
    return modules
      .flatMap(module => module.lessons)
      .find(lesson => lesson.id === selectedLesson.id) || selectedLesson;
  };

  return (
    <div className="h-full flex">
      {/* Course Structure Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Course Selector */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Course
            </label>
            <Button
              onClick={() => setShowCreateCourseModal(true)}
              size="sm"
              variant="outline"
              icon={FilePlus}
            >
              Create Course
            </Button>
          </div>
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
            <div className="flex items-center gap-2">
              {selectedCourse && (
                <>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    icon={Save}
                    disabled={saving || !hasUnsavedChanges}
                    loading={saving}
                  >
                    {saving ? 'Saving...' : 'Save Course'}
                  </Button>
                  <Button
                    onClick={addModule}
                    size="sm"
                    icon={Plus}
                    disabled={loadingModules}
                  >
                    Add Module
                  </Button>
                </>
              )}
            </div>
          </div>
          {modulesError && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{modulesError}</span>
            </div>
          )}
          {saveError && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{saveError}</span>
            </div>
          )}
          {hasUnsavedChanges && (
            <div className="mt-2 flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">You have unsaved changes</span>
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
                          className="group flex items-center justify-between p-2 rounded hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <GripVertical className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{getLessonTypeIcon(lesson)}</span>

                            {editingLessonTitle === lesson.id ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={lessonTitleInput}
                                  onChange={(e) => setLessonTitleInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveLessonTitle(module.id, lesson.id);
                                    } else if (e.key === 'Escape') {
                                      cancelEditingLessonTitle();
                                    }
                                  }}
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  autoFocus
                                />
                                <button
                                  onClick={() => saveLessonTitle(module.id, lesson.id)}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  title="Save title"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={cancelEditingLessonTitle}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Cancel editing"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div
                                className="flex items-center gap-2 flex-1 cursor-pointer"
                                onClick={() => setSelectedLesson(lesson)}
                              >
                                <span className="text-sm text-gray-700 flex-1">{lesson.title}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingLessonTitle(lesson);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Edit title"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLesson(module.id, lesson.id);
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete lesson"
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
                  <span className="text-lg">{getLessonTypeIcon(selectedLesson)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedLesson.title}</h3>
                    <p className="text-sm text-gray-600 capitalize">{(selectedLesson.content_type || selectedLesson.type || 'text')} Lesson</p>
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
            <div className="flex-1 overflow-y-auto">
              <LessonContentEditor
                lesson={selectedLesson}
                onSave={async (contentData) => {
                  try {
                    await saveLessonContent(selectedLesson.id, contentData);
                    toast.success('Lesson saved successfully!');
                  } catch (error) {
                    toast.error('Failed to save lesson');
                  }
                }}
                onChange={(contentData) => {
                  // Update local state
                  const moduleId = modules.find(m => m.lessons.some(l => l.id === selectedLesson.id))?.id;
                  if (moduleId) {
                    updateLesson(moduleId, selectedLesson.id, contentData);
                  }
                }}
              />
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

        <div className="flex-1 overflow-y-auto p-4">
          {(() => {
            const currentLesson = getCurrentLesson();
            return currentLesson ? (
              <div className="bg-gray-50 rounded-lg p-4 min-h-full">
                {/* Lesson Preview Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getLessonTypeIcon(currentLesson.content_type || currentLesson.type)}</span>
                    <h4 className="text-lg font-semibold text-gray-900">{currentLesson.title}</h4>
                  </div>
                  {currentLesson.description && (
                    <p className="text-sm text-gray-600">{currentLesson.description}</p>
                  )}
                </div>

                {/* Lesson Content Preview */}
                <div className="prose prose-sm max-w-none">
                  {(currentLesson.content_type === 'video' || currentLesson.type === 'video') && currentLesson.video_url ? (
                    <div className="space-y-4">
                      <VideoLinkDisplay
                        videoUrl={currentLesson.video_url}
                        title="Lesson Video"
                        className="w-full"
                      />
                      {currentLesson.content && (
                        <div className="mt-4">
                          <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                        </div>
                      )}
                    </div>
                  ) : currentLesson.content ? (
                    <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                  ) : (currentLesson.content_type === 'quiz' || currentLesson.type === 'quiz') ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Quiz</span>
                      </div>
                      {currentLesson.content ? (
                        <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                      ) : (
                        <p className="text-gray-600 italic">Quiz instructions will appear here</p>
                      )}
                    </div>
                  ) : (currentLesson.content_type === 'assignment' || currentLesson.type === 'assignment') ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900">Assignment</span>
                      </div>
                      {currentLesson.content ? (
                        <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                      ) : (
                        <p className="text-gray-600 italic">Assignment details will appear here</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Lesson content will appear here</p>
                      <p className="text-sm text-gray-500 mt-1">Start editing to see the preview</p>
                    </div>
                  )}
                </div>

                {/* Preview Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Lesson {currentLesson.order || 1}</span>
                    <span>{currentLesson.content_type || currentLesson.type || 'text'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 min-h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Eye className="w-8 h-8 mx-auto mb-2" />
                  <p>Select a lesson to preview</p>
                  <p className="text-xs mt-1">Changes update in real-time</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Course Creation Modal */}
      <CourseCreationModal
        isOpen={showCreateCourseModal}
        onClose={() => setShowCreateCourseModal(false)}
        onCourseCreated={(newCourse) => {
          setCourses([...courses, newCourse]);
          setSelectedCourse(newCourse);
          setShowCreateCourseModal(false);
        }}
      />
    </div>
  );
};

export default CourseBuilder;
