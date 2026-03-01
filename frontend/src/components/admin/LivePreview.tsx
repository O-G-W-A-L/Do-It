import { Eye } from 'lucide-react';
import VideoLinkDisplay from '../course/VideoLinkDisplay';

/**
 * Simple live preview of lesson content
 * Single responsibility: Content preview and display
 */
const LivePreview = ({ lesson, modules }) => {
  // Get current lesson data from modules state
  const getCurrentLesson = () => {
    if (!lesson) return null;
    return modules
      .flatMap(module => module.lessons)
      .find(l => l.id === lesson.id) || lesson;
  };

  const currentLesson = getCurrentLesson();

  return (
    <div className="bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Live Preview</h3>
        <p className="text-sm text-gray-600">How students will see it</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {currentLesson ? (
          <div className="bg-gray-50 rounded-lg p-4 min-h-full">
            {/* Lesson Preview Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {currentLesson.content_type === 'video' ? '🎥' :
                   currentLesson.content_type === 'quiz' ? '📝' :
                   currentLesson.content_type === 'assignment' ? '📋' : '📄'}
                </span>
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
                    <span className="text-lg">📝</span>
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
                    <span className="text-lg">📋</span>
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
                  <span className="text-4xl">📄</span>
                  <p className="text-gray-600 mt-2">Lesson content will appear here</p>
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
        )}
      </div>
    </div>
  );
};

export default LivePreview;
