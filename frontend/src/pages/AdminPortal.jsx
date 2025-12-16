import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminBottomBar from '../components/admin/AdminBottomBar';
import CourseBuilder from '../components/admin/CourseBuilder';
import UsersManagement from '../components/admin/UsersManagement';
import TestVideoPlayer from '../components/TestVideoPlayer';

/**
 * Full Admin Portal
 */
export default function AdminPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('courses'); // Start with courses as the heart
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Redirect if not admin/instructor
  React.useEffect(() => {
    if (!user || (user.profile?.role !== 'admin' && user.profile?.role !== 'instructor')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
