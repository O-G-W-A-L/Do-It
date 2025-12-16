import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Upload, Video, FileText, HelpCircle, Save } from 'lucide-react';
import Button from '../ui/Button';
import VideoPlayer from '../course/player/VideoPlayer';

const LessonContentEditor = ({ lesson, onSave, onChange }) => {
  const [content, setContent] = useState(lesson?.content || '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [attachments, setAttachments] = useState(lesson?.attachments || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(lesson?.content || '');
    setVideoUrl(lesson?.video_url || '');
    setAttachments(lesson?.attachments || []);
  }, [lesson]);

  // Map lesson type to content_type for editor
  const getLessonContentType = () => {
    if (lesson?.content_type) return lesson.content_type;
    if (lesson?.type) return lesson.type;
    return 'text';
  };

  const handleContentChange = (value) => {
    setContent(value);
    onChange?.({
      content: value,
      video_url: videoUrl,
      attachments
    });
  };

  const handleVideoUrlChange = (url) => {
    setVideoUrl(url);
    onChange?.({
      content,
      video_url: url,
      attachments
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.({
        content,
        video_url: videoUrl,
        attachments
      });
    } finally {
      setSaving(false);
    }
  };



  const renderContentEditor = () => {
    switch (getLessonContentType()) {
      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => handleVideoUrlChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported: YouTube, Vimeo, or direct video URLs
              </p>
            </div>

            {videoUrl && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Video Preview</h4>
                <div className="bg-gray-50 rounded p-2">
                  <VideoPlayer
                    lesson={{
                      id: 'preview',
                      title: 'Video Preview',
                      video_url: videoUrl,
                      content_type: 'video'
                    }}
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This is how the video will appear to students
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Description
              </label>
              <MDEditor
                value={content}
                onChange={handleContentChange}
                preview="edit"
                hideToolbar={false}
                data-color-mode="light"
                textareaProps={{
                  placeholder: "Add video description, transcript, or additional notes..."
                }}
              />
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-medium text-gray-700">Quiz Builder</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Quiz functionality will be implemented here. For now, add quiz instructions:
              </p>
              <MDEditor
                value={content}
                onChange={handleContentChange}
                preview="edit"
                hideToolbar={false}
                data-color-mode="light"
                textareaProps={{
                  placeholder: "Add quiz instructions, questions will be created separately..."
                }}
              />
            </div>
          </div>
        );

      case 'assignment':
        return (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-green-600" />
                <h4 className="text-sm font-medium text-gray-700">Assignment Details</h4>
              </div>
              <MDEditor
                value={content}
                onChange={handleContentChange}
                preview="edit"
                hideToolbar={false}
                data-color-mode="light"
                textareaProps={{
                  placeholder: "Describe the assignment requirements, objectives, and submission guidelines..."
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Drop files here or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, Images up to 10MB</p>
              </div>
            </div>
          </div>
        );

      default: // text
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Content
              </label>
              <MDEditor
                value={content}
                onChange={handleContentChange}
                preview="edit"
                hideToolbar={false}
                data-color-mode="light"
                textareaProps={{
                  placeholder: "Write your lesson content here..."
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Drop files here or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOC, Images up to 10MB</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderContentEditor()}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button onClick={handleSave} loading={saving} icon={Save}>
          {saving ? 'Saving...' : 'Save Content'}
        </Button>
      </div>
    </div>
  );
};

export default LessonContentEditor;
