import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, Loader2 } from 'lucide-react';

/**
 * LiveProgressTracker - Simple lesson completion tracking
 *
 * Handles marking lessons complete and basic progress display.
 * No fancy features, just the core functionality.
 */
const LiveProgressTracker = ({
  enrollment,
  currentLesson,
  onProgressUpdate,
  className = ''
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  // Check if lesson is already completed
  const isCompleted = useCallback(() => {
    // This would check actual progress data
    // For now, just return false
    return false;
  }, []);

  // Mark lesson as complete
  const markComplete = useCallback(async () => {
    if (!currentLesson || isCompleted()) return;

    setIsCompleting(true);

    try {
      // Call progress API to mark lesson complete
      // This would integrate with the backend progress endpoint
      console.log('Marking lesson complete:', currentLesson.id);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update progress
      if (onProgressUpdate) {
        onProgressUpdate({
          lessonId: currentLesson.id,
          completed: true,
          progress: 100
        });
      }

    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
    } finally {
      setIsCompleting(false);
    }
  }, [currentLesson, isCompleted, onProgressUpdate]);

  if (!currentLesson) return null;

  const completed = isCompleted();

  return (
    <div className={className}>
      <button
        onClick={markComplete}
        disabled={isCompleting || completed}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          completed
            ? 'bg-green-600 text-white cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {isCompleting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Completing...
          </>
        ) : completed ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Completed
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            Mark as Complete
          </>
        )}
      </button>
    </div>
  );
};

LiveProgressTracker.propTypes = {
  enrollment: PropTypes.object,
  currentLesson: PropTypes.object,
  onProgressUpdate: PropTypes.func,
  className: PropTypes.string,
};

export default LiveProgressTracker;
