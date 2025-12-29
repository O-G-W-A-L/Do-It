import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import Button from '../ui/Button';
import { coursesService } from '../../services/courses';
import CourseSelector from './CourseSelector';
import ModuleManager from './ModuleManager';
import LessonEditor from './LessonEditor';
import LivePreview from './LivePreview';

/**
 * Clean course builder orchestrator
 * Single responsibility: Coordinate focused components
 */
const CourseBuilder = ({ onSave, onPublish }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Load modules when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadModules(selectedCourse.id);
    } else {
      setModules([]);
      setSelectedLesson(null);
    }
  }, [selectedCourse]);

  const loadModules = async (courseId) => {
    try {
      const result = await coursesService.getCourseModules(courseId);
      if (result.success) {
        const courseModules = (result.data.results || result.data)
          .sort((a, b) => a.order - b.order);
        setModules(courseModules);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Failed to load course modules');
    }
  };

  const handleModulesChange = (updatedModules) => {
    setModules(updatedModules);
    setHasUnsavedChanges(true);
  };

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleLessonChange = (updatedLesson) => {
    // Update lesson in modules state
    const updatedModules = modules.map(module => ({
      ...module,
      lessons: module.lessons.map(lesson =>
        lesson.id === updatedLesson.id ? updatedLesson : lesson
      )
    }));
    setModules(updatedModules);
  };

  const handleLessonSave = async (lessonId, lessonData) => {
    try {
      const result = await coursesService.updateLesson(lessonId, lessonData);
      if (result.success) {
        // Update local state with saved data
        handleLessonChange(result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw new Error('Failed to save lesson content');
    }
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

      // Save modules and lessons sequentially
      for (const module of modules) {
        try {
          if (module.id.toString().startsWith('temp-') || module._isNew) {
            // Validate required fields
            if (!module.title || module.title.trim() === '') {
              errors.push(`Module must have a title`);
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
              module.id = result.data.id;
              delete module._isNew;
              savedModules++;
            } else {
              errors.push(`Failed to save module: ${result.error}`);
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
              errors.push(`Failed to update module: ${result.error}`);
            }
          }

          // Save lessons for this module
          for (const lesson of module.lessons) {
            try {
              if (lesson.id.toString().startsWith('temp-') || lesson._isNew) {
                // Validate required fields
                if (!lesson.title || lesson.title.trim() === '') {
                  errors.push(`Lesson must have a title`);
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
                  errors.push(`Failed to save lesson: ${lessonResult.error}`);
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
                  errors.push(`Failed to update lesson: ${lessonResult.error}`);
                }
              }
            } catch (lessonError) {
              errors.push(`Error saving lesson: ${lessonError.message}`);
            }
          }
        } catch (moduleError) {
          errors.push(`Error saving module: ${moduleError.message}`);
        }
      }

      // Reload modules to get fresh data
      await loadModules(selectedCourse.id);

      // Show results
      toast.dismiss(loadingToast);

      if (errors.length === 0) {
        setHasUnsavedChanges(false);
        toast.success(`Course saved successfully! (${savedModules} modules, ${savedLessons} lessons)`);
        onSave?.();
      } else {
        toast.error(`Saved with ${errors.length} errors`);
        setSaveError(errors.join('; '));
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
        setSelectedCourse({ ...selectedCourse, status: 'published' });
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

  return (
    <div className="h-full flex">
      {/* Course Structure Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <CourseSelector
          selectedCourse={selectedCourse}
          onCourseSelect={setSelectedCourse}
          onCourseCreated={setSelectedCourse}
        />

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
                </>
              )}
            </div>
          </div>
          {saveError && (
            <div className="mt-2 flex items-center gap-2 text-red-600">
              <div className="w-4 h-4">⚠️</div>
              <span className="text-sm">{saveError}</span>
            </div>
          )}
          {hasUnsavedChanges && (
            <div className="mt-2 flex items-center gap-2 text-amber-600">
              <div className="w-4 h-4">⚠️</div>
              <span className="text-sm">You have unsaved changes</span>
            </div>
          )}
        </div>

        <ModuleManager
          course={selectedCourse}
          modules={modules}
          onModulesChange={handleModulesChange}
          onLessonSelect={handleLessonSelect}
        />
      </div>

      {/* Content Editor Panel */}
      <div className="flex-1 bg-gray-50">
        <LessonEditor
          lesson={selectedLesson}
          modules={modules}
          onLessonChange={handleLessonChange}
          onSave={handleLessonSave}
        />
      </div>

      {/* Live Preview Panel */}
      <div className="w-96">
        <LivePreview
          lesson={selectedLesson}
          modules={modules}
        />
      </div>
    </div>
  );
};

export default CourseBuilder;
