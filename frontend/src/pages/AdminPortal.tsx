import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminBottomBar from '../components/admin/AdminBottomBar';
import CourseBuilder from '../components/admin/CourseBuilder';
import UsersManagement from '../components/admin/UsersManagement';
import TestVideoPlayer from '../components/TestVideoPlayer';
import progressService from '../services/progress';
import api from '../services/api';
import toast from 'react-hot-toast';
import type { MentorDashboardResponse, CohortDetail, CohortSubmission } from '../types/api/progress';
import { Users, BookOpen, Shield, UserPlus, Check, X } from 'lucide-react';

/**
 * Full Admin Portal
 * - Admin/Curriculum: Full access to courses, users, analytics
 * - Mentor: Limited access to assigned cohorts, learner progress, grading queue
 */
export default function AdminPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.profile?.role;
  const isMentor = userRole === 'mentor';
  const isAdminOrInstructor = userRole === 'admin' || userRole === 'instructor';
  
  // Default section based on role
  const defaultSection = isMentor ? 'mentor-dashboard' : 'courses';
  const [activeSection, setActiveSection] = useState(defaultSection);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Mentor-specific state
  const [mentorDashboard, setMentorDashboard] = useState<MentorDashboardResponse | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<CohortDetail | null>(null);
  const [cohortSubmissions, setCohortSubmissions] = useState<CohortSubmission[]>([]);
  const [loading, setLoading] = useState(false);

  // Redirect if not admin/instructor/mentor
  useEffect(() => {
    if (!user || (!isAdminOrInstructor && !isMentor)) {
      navigate('/dashboard');
    }
  }, [user, navigate, isAdminOrInstructor, isMentor]);

  // Load mentor dashboard data
  useEffect(() => {
    if (isMentor && activeSection === 'mentor-dashboard') {
      loadMentorDashboard();
    }
  }, [isMentor, activeSection]);

  const loadMentorDashboard = async () => {
    setLoading(true);
    const result = await progressService.getMentorDashboard();
    if (result.success && result.data) {
      setMentorDashboard(result.data);
    }
    setLoading(false);
  };

  const loadCohortDetails = async (cohortId: number) => {
    setLoading(true);
    const result = await progressService.getCohortDetails(cohortId);
    if (result.success && result.data) {
      setSelectedCohort(result.data);
      // Also load submissions for this cohort
      const submissionsResult = await progressService.getCohortSubmissions(cohortId);
      if (submissionsResult.success && submissionsResult.data) {
        setCohortSubmissions(submissionsResult.data.submissions || []);
      }
    }
    setLoading(false);
  };

  // Handler functions
  const handleSave = () => {
    // Trigger save in the active component
    setHasUnsavedChanges(false);
    setLastSaved(new Date());
  };

  const handlePublish = () => {
    // Trigger publish in the active component
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setHasUnsavedChanges(false);
    }, 2000);
  };

  const handleUndo = () => {
    // TODO: Implement undo logic
    setHasUnsavedChanges(false);
  };

  // ========== MENTOR RENDER FUNCTIONS ==========

  // Render Mentor Dashboard - shows assigned cohorts
  const renderMentorDashboard = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      );
    }

    const cohorts = mentorDashboard?.cohorts || [];

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h2>
          <span className="text-sm text-gray-500">Welcome, {user?.first_name}</span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{cohorts.length}</div>
            <div className="text-sm text-gray-600">Assigned Cohorts</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {cohorts.reduce((sum, c) => sum + (c.enrolled_students || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Learners</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {cohorts.reduce((sum, c) => sum + (c.pending_submissions || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Pending Submissions</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">
              {cohorts.filter((c: { is_active: boolean }) => c.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active Cohorts</div>
          </div>
        </div>

        {/* Cohorts List */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Assigned Cohorts</h3>
        {cohorts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No cohorts assigned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cohorts.map((cohort: { id: number; name: string; course: { title: string }; start_date: string; enrolled_students: number; pending_submissions: number; is_active: boolean }) => (
              <div 
                key={cohort.id}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  loadCohortDetails(cohort.id);
                  setActiveSection('mentor-cohort');
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{cohort.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded ${cohort.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {cohort.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{cohort.course.title}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{cohort.enrolled_students} learners</span>
                  <span className="text-orange-600">{cohort.pending_submissions} pending</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Cohort Detail - learner progress
  const renderCohortDetail = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      );
    }

    const cohort = selectedCohort?.cohort;
    const members = selectedCohort?.members || [];

    return (
      <div className="p-8">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => {
              setSelectedCohort(null);
              setActiveSection('mentor-dashboard');
            }}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{cohort?.name || 'Cohort Details'}</h2>
        </div>

        {cohort && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{cohort.course.title}</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Start Date:</span>
                  <span className="ml-2">{new Date(cohort.start_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Learners:</span>
                  <span className="ml-2">{members.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${cohort.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {cohort.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Learner Progress Table */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Learner Progress</h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Learner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member: { id: number; student: { full_name: string; username: string }; progress: { lessons_completed: number; total_lessons: number; percentage: number }; submissions: { total: number; pending: number; graded: number }; enrolled: boolean }) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{member.student.full_name || member.student.username}</div>
                        <div className="text-sm text-gray-500">{member.student.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${member.progress.percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {member.progress.lessons_completed}/{member.progress.total_lessons} lessons
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{member.submissions.total}</span>
                        <span className="text-gray-500"> ({member.submissions.pending} pending, {member.submissions.graded} graded)</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded ${member.enrolled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {member.enrolled ? 'Enrolled' : 'Not Enrolled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render Grading Queue - submissions to grade
  const renderGradingQueue = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      );
    }

    const pendingSubmissions = cohortSubmissions.filter((s: { status: string }) => s.status === 'pending');

    return (
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Grading Queue</h2>

        {pendingSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No pending submissions to grade.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSubmissions.map((submission: { id: number; student: { full_name: string; username: string }; lesson: { title: string }; submitted_at: string; submission_text: string }) => (
              <div key={submission.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{submission.student.full_name || submission.student.username}</h4>
                    <p className="text-sm text-gray-500">{submission.lesson.title}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.submission_text.substring(0, 500)}...</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {/* TODO: Implement grade */}}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Grade Submission
                  </button>
                  <button 
                    onClick={() => {/* TODO: Implement override */}}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Override Grade
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render different content based on active section
  const renderMainContent = () => {
    switch (activeSection) {
      case 'courses':
        return <CourseBuilder onSave={handleSave} onPublish={handlePublish} />;
      case 'users':
        return <UsersManagement onSave={handleSave} />;
      case 'dashboard':
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">1,234</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-green-600">12</div>
                <div className="text-sm text-gray-600">Active Courses</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">8</div>
                <div className="text-sm text-gray-600">To Grade</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-yellow-600">$5,420</div>
                <div className="text-sm text-gray-600">Revenue</div>
              </div>
            </div>
            <p className="text-gray-600">Dashboard metrics will be implemented with real analytics data.</p>
          </div>
        );
      case 'test-video': // New case for testing
        return <TestVideoPlayer />;
      
      // ========== MENTOR DASHBOARD ==========
      case 'mentor-dashboard':
        return renderMentorDashboard();
      
      case 'mentor-cohort':
        return renderCohortDetail();
      
      case 'grading-queue':
        return renderGradingQueue();
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Section
              </h3>
              <p className="text-gray-600">This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* LEFT SIDEBAR */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={logout}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {renderMainContent()}
        </main>

        {/* BOTTOM BAR - Only show for Courses section */}
        {activeSection === 'courses' && (
          <AdminBottomBar
            onSave={handleSave}
            onPublish={handlePublish}
            onUndo={handleUndo}
            hasUnsavedChanges={hasUnsavedChanges}
            isPublishing={isPublishing}
            lastSaved={lastSaved}
          />
        )}
      </div>


    </div>
  );
}
