import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import FileUpload from '../ui/FileUpload';
import { coursesService } from '../../services/courses';

const CourseCreationModal = ({ isOpen, onClose, onCourseCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    level: 'beginner',
    duration_weeks: 8,
    is_free: true,
    price: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create course first
      const courseData = {
        title: formData.title,
        description: formData.description,
        short_description: formData.short_description,
        level: formData.level,
        duration_weeks: formData.duration_weeks,
        is_free: formData.is_free,
        price: formData.is_free ? 0 : formData.price
      };

      const result = await coursesService.createCourse(courseData);
      if (result.success) {
        const newCourse = result.data;

        // Upload thumbnail if provided
        if (formData.thumbnail && newCourse.id) {
          try {
            const formDataWithFile = new FormData();
            formDataWithFile.append('thumbnail', formData.thumbnail);

            // Use fetch directly for file upload since coursesService.createCourse doesn't handle files
            const response = await fetch(`/api/courses/courses/${newCourse.id}/upload_thumbnail/`, {
              method: 'POST',
              body: formDataWithFile,
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              }
            });

            if (response.ok) {
              const uploadResult = await response.json();
              newCourse.thumbnail = uploadResult.thumbnail;
            } else {
              console.warn('Thumbnail upload failed, but course was created');
            }
          } catch (uploadError) {
            console.warn('Thumbnail upload failed, but course was created:', uploadError);
          }
        }

        onCourseCreated(newCourse);
        onClose();

        // Reset form
        setFormData({
          title: '',
          description: '',
          short_description: '',
          level: 'beginner',
          duration_weeks: 8,
          is_free: true,
          price: 0
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      setError('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Course">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Introduction to Python Programming"
          />
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Description
          </label>
          <input
            type="text"
            value={formData.short_description}
            onChange={(e) => handleInputChange('short_description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief course summary (max 300 chars)"
            maxLength={300}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Description *
          </label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Detailed course description..."
          />
        </div>

        {/* Level and Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <select
              value={formData.level}
              onChange={(e) => handleInputChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (Weeks)
            </label>
            <input
              type="number"
              min="1"
              max="52"
              value={formData.duration_weeks}
              onChange={(e) => handleInputChange('duration_weeks', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Pricing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pricing
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_free"
                checked={formData.is_free}
                onChange={(e) => handleInputChange('is_free', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_free" className="text-sm text-gray-700">
                Free Course
              </label>
            </div>

            {!formData.is_free && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Price (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Thumbnail
          </label>
          <FileUpload
            onFileSelect={(file) => handleInputChange('thumbnail', file)}
            accept="image/*"
            maxSize={5 * 1024 * 1024} // 5MB
            placeholder="Upload course thumbnail"
            showPreview={true}
          />
          <p className="text-xs text-gray-500 mt-1">
            Recommended: 1280x720px, JPEG/PNG/WebP, max 5MB
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {loading ? 'Creating...' : 'Create Course'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CourseCreationModal;
