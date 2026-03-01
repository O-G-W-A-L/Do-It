import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Upload, Video, FileText, HelpCircle, Save, Eye, Edit } from 'lucide-react';
import Button from '../ui/Button';
import VideoLinkDisplay from '../course/VideoLinkDisplay';

const LessonContentEditor = ({ lesson, onSave, onChange }) => {
  const [content, setContent] = useState(lesson?.content?.markdown || '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [attachments, setAttachments] = useState(lesson?.attachments || []);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setContent(lesson?.content?.markdown || '');
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
      content: { markdown: value },
      video_url: videoUrl,
      attachments
    });
  };

  const handleVideoUrlChange = (url) => {
    setVideoUrl(url);
    onChange?.({
      content: { markdown: content },
      video_url: url,
      attachments
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.({
        content: { markdown: content },
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">Video Link Preview</h4>
                <VideoLinkDisplay
                  videoUrl={videoUrl}
                  title="Lesson Video"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This is how the video link will appear to students
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
                preview="live"
                hideToolbar={false}
                data-color-mode="light"
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
                preview="live"
                hideToolbar={false}
                data-color-mode="light"
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
                preview="live"
                hideToolbar={false}
                data-color-mode="light"
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Lesson Content
              </label>
              <Button
                onClick={() => setPreviewMode(!previewMode)}
                variant="outline"
                size="sm"
                icon={previewMode ? Edit : Eye}
              >
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>

            {previewMode ? (
              <div className="lesson-content prose prose-lg max-w-none border border-gray-200 rounded-lg p-4 bg-gray-50">
                <MDEditor.Markdown
                  source={content || 'Lesson content will be displayed here.'}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'inherit',
                    fontSize: '16px',
                    lineHeight: '1.7'
                  }}
                />
              </div>
            ) : (
              <MDEditor
                value={content}
                onChange={handleContentChange}
                preview="live"
                hideToolbar={false}
                data-color-mode="light"
              />
            )}

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
