import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { coursesService } from '../services/courses';
import type { CourseListItem } from '../types/api/course';
import {
  Search, Filter, BookOpen, Users, Clock, Star,
  ChevronDown, Play, CheckCircle, Lock
} from 'lucide-react';

type SortOption = 'newest' | 'oldest' | 'title' | 'popular' | 'rating';
type LevelOption = '' | 'beginner' | 'intermediate' | 'advanced';

export default function CourseDiscovery() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<LevelOption>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Filter and sort courses when filters change
  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery, selectedLevel, selectedCategory, sortBy]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await coursesService.getCourses();
      if (result.success) {
        setCourses(result.data.results || result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Level filter
    if (selectedLevel) {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    // Category filter (if implemented)
    if (selectedCategory) {
      // filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'popular':
          return (b.enrollment_count || 0) - (a.enrollment_count || 0);
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        default:
          return 0;
      }
    });

    setFilteredCourses(filtered);
  };

  const handleEnroll = async (courseId) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    const loadingToast = toast.loading('Enrolling in course...');

    try {
      const result = await coursesService.enrollInCourse(courseId);
      if (result.success) {
        // Update course enrollment count locally
        setCourses(courses.map(course =>
          course.id === courseId
            ? { ...course, enrollment_count: (course.enrollment_count || 0) + 1 }
            : course
        ));

        toast.dismiss(loadingToast);
        toast.success('Successfully enrolled in course!');
      } else {
        toast.dismiss(loadingToast);
        toast.error(result.error || 'Failed to enroll in course');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to enroll in course');
    }
  };

  const isEnrolled = (courseId) => {
    // This would need to be implemented with enrollment context
    // For now, return false
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error loading courses</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadCourses}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Courses</h1>
            <p className="text-gray-600">Discover and enroll in courses to accelerate your learning journey</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="title">A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Course Thumbnail */}
                <div className="aspect-video bg-gray-200 flex items-center justify-center">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {course.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      course.level === 'beginner' ? 'bg-green-100 text-green-700' :
                      course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {course.level}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.short_description || course.description}
                  </p>

                  {/* Course Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.enrollment_count || 0} enrolled</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration_weeks} weeks</span>
                    </div>
                    {course.average_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-current text-yellow-400" />
                        <span>{course.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Instructor */}
                  <div className="text-sm text-gray-600 mb-4">
                    By {course.instructor_name || 'Professional Instructor'}
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-bold text-gray-900">
                      {course.is_free ? 'Free' : `$${course.price}`}
                    </div>
                    {course.status !== 'published' && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        {course.status}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleEnroll(course.id)}
                    disabled={course.status !== 'published'}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      course.status === 'published'
                        ? isEnrolled(course.id)
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {course.status !== 'published' ? (
                      <>
                        <Lock className="w-4 h-4 inline mr-2" />
                        Coming Soon
                      </>
                    ) : isEnrolled(course.id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Enrolled
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 inline mr-2" />
                        Enroll Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
