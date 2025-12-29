import React, { useState, useEffect } from 'react';
import { Edit3, Save, Eye } from 'lucide-react';
import Button from '../ui/Button';
import LessonContentEditor from './LessonContentEditor';

/**
 * Simple lesson editor with save functionality
 * Single responsibility: Lesson content editing and persistence
 */
const LessonEditor = ({ lesson, modules, onLessonChange, onSave }) => {
  const [currentLesson, setCurrentLesson] = useState(lesson);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCurrentLesson(lesson);
    setHasUnsavedChanges(false);
    setError(null);
  }, [lesson]);

  const handleContentChange = (contentData) => {
    const updatedLesson = { ...currentLesson, ...contentData };
    setCurrentLesson(updatedLesson);
    setHasUnsavedChanges(true);
    onLessonChange?.(updatedLesson);
  };

  const handleSave = async () => {
    if (!currentLesson) return;

    try {
      setSaving(true);
      setError(null);

      await onSave(currentLesson.id, currentLesson);
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  if (!currentLesson) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
        <div className="text-center">
          <Edit3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a Lesson to Edit
          </h3>
          <p className="text-gray-600">
            Choose a lesson from the course structure to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Lesson Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {currentLesson.content_type === 'video' ? '🎥' :
               currentLesson.content_type === 'quiz' ? '📝' :
               currentLesson.content_type === 'assignment' ? '📋' : '📄'}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{currentLesson.title}</h3>
              <p className="text-sm text-gray-600 capitalize">
                {currentLesson.content_type || currentLesson.type || 'text'} Lesson
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Eye} size="sm">
              Preview
            </Button>
            <Button
              onClick={handleSave}
              icon={Save}
              size="sm"
              loading={saving}
              disabled={!hasUnsavedChanges}
            >
              {saving ? 'Saving...' : 'Save Lesson'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-2 flex items-center gap-2 text-red-600">
            <div className="w-4 h-4">⚠️</div>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="mt-2 flex items-center gap-2 text-amber-600">
            <div className="w-4 h-4">⚠️</div>
            <span className="text-sm">You have unsaved changes</span>
          </div>
        )}
      </div>

      {/* Lesson Content Editor */}
      <div className="flex-1 overflow-y-auto">
        <LessonContentEditor
          lesson={currentLesson}
          onSave={handleSave}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
};

export default LessonEditor;
