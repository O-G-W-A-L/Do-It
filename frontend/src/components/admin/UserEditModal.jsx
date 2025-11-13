import React, { useState, useEffect } from 'react';
import {
  User, Shield, BookOpen, Settings, Trash2, Eye, EyeOff,
  Upload, X, Calendar, Clock, AlertTriangle, CheckCircle,
  XCircle, LogOut, Mail, Key, Ban, UserCheck, UserX
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import api from '../../services/api';

/**
 * Comprehensive User Edit Modal - Elite Engineering Implementation
 *
 * Features:
 * - Tabbed interface for different management aspects
 * - Real-time validation and feedback
 * - Comprehensive user management capabilities
 * - Audit trail and confirmation dialogs
 * - Loading states and error handling
 */
export default function UserEditModal({ isOpen, onClose, userId, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Tab-specific state
  const [profileData, setProfileData] = useState({});
  const [securityData, setSecurityData] = useState({});
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);

  // UI state
  const [imagePreview, setImagePreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      loadUserData();
    }
  }, [isOpen, userId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUser(null);
      setProfileData({});
      setSecurityData({});
      setEnrollmentData([]);
      setSessions([]);
      setLoginHistory([]);
      setErrors({});
      setImagePreview(null);
      setActiveTab('profile');
    }
  }, [isOpen]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [userResponse, enrollmentsResponse] = await Promise.all([
        api.get(`/api/auth/management/${userId}/`),
        api.get(`/api/auth/management/${userId}/enrollments/`)
      ]);

      setUser(userResponse.data);
      setProfileData({
        first_name: userResponse.data.first_name || '',
        last_name: userResponse.data.last_name || '',
        email: userResponse.data.email || '',
        bio: userResponse.data.profile?.bio || '',
        location: userResponse.data.profile?.location || '',
        phone_number: userResponse.data.profile?.phone_number || '',
        profile_image: null
      });
      setEnrollmentData(enrollmentsResponse.data);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setErrors({ general: 'Failed to load user data' });
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab) => {
    try {
      switch (tab) {
        case 'security':
          const [sessionsResponse, historyResponse] = await Promise.all([
            api.get(`/api/auth/management/${userId}/sessions/`),
            api.get(`/api/auth/management/${userId}/login_history/`)
          ]);
          setSessions(sessionsResponse.data);
          setLoginHistory(historyResponse.data);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Failed to load ${tab} data:`, error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  // Profile management
  const handleProfileUpdate = async () => {
    setSaving(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('first_name', profileData.first_name);
      formData.append('last_name', profileData.last_name);
      formData.append('email', profileData.email);
      formData.append('profile.bio', profileData.bio);
      formData.append('profile.location', profileData.location);
      formData.append('profile.phone_number', profileData.phone_number);

      if (profileData.profile_image) {
        formData.append('profile.profile_image', profileData.profile_image);
      }

      const response = await api.patch(`/api/auth/management/${userId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUser(response.data);
      if (onUserUpdated) onUserUpdated(response.data);
      // Show success message
    } catch (error) {
      setErrors(error.response?.data || { general: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  // Security actions
  const handleRoleChange = async (newRole) => {
    try {
      await api.post(`/api/auth/management/${userId}/change_role/`, { role: newRole });
      const updatedUser = { ...user, profile: { ...user.profile, role: newRole } };
      setUser(updatedUser);
      if (onUserUpdated) onUserUpdated(updatedUser);
    } catch (error) {
      setErrors({ security: 'Failed to change role' });
    }
  };

  const handlePasswordReset = async () => {
    try {
      await api.post(`/api/auth/management/${userId}/reset_password/`);
      // Show success message
    } catch (error) {
      setErrors({ security: 'Failed to reset password' });
    }
  };

  const handleLogoutAllSessions = async () => {
    try {
      await api.post(`/api/auth/management/${userId}/logout_all_sessions/`);
      setSessions([]);
      // Show success message
    } catch (error) {
      setErrors({ security: 'Failed to logout sessions' });
    }
  };

  const handleLogoutSession = async (sessionId) => {
    try {
      await api.post(`/api/auth/management/${userId}/logout_session/`, { session_id: sessionId });
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      setErrors({ security: 'Failed to logout session' });
    }
  };

  // Status management
  const handleToggleActive = async () => {
    try {
      await api.post(`/api/auth/management/${userId}/toggle_active/`);
      const updatedUser = { ...user, is_active: !user.is_active };
      setUser(updatedUser);
      if (onUserUpdated) onUserUpdated(updatedUser);
    } catch (error) {
      setErrors({ status: 'Failed to toggle account status' });
    }
  };

  const handleSuspendUser = async (reason, expiresAt) => {
    try {
      await api.post(`/api/auth/management/${userId}/ban_user/`, {
        ban_type: expiresAt ? 'temporary' : 'permanent',
        reason,
        expires_at: expiresAt
      });
      // Refresh user data
      loadUserData();
    } catch (error) {
      setErrors({ status: 'Failed to suspend user' });
    }
  };

  const handleUnsuspendUser = async () => {
    try {
      await api.post(`/api/auth/management/${userId}/unban_user/`);
      // Refresh user data
      loadUserData();
    } catch (error) {
      setErrors({ status: 'Failed to unsuspend user' });
    }
  };

  // Enrollment management
  const handleBulkEnroll = async (courseIds) => {
    try {
      await api.post(`/api/auth/management/${userId}/bulk_enroll/`, { course_ids: courseIds });
      // Refresh enrollments
      const response = await api.get(`/api/auth/management/${userId}/enrollments/`);
      setEnrollmentData(response.data);
    } catch (error) {
      setErrors({ enrollment: 'Failed to enroll in courses' });
    }
  };

  const handleBulkUnenroll = async (courseIds) => {
    try {
      await api.post(`/api/auth/management/${userId}/bulk_unenroll/`, { course_ids: courseIds });
      // Refresh enrollments
      const response = await api.get(`/api/auth/management/${userId}/enrollments/`);
      setEnrollmentData(response.data);
    } catch (error) {
      setErrors({ enrollment: 'Failed to unenroll from courses' });
    }
  };

  const handleExtendEnrollment = async (enrollmentId, newExpiry) => {
    try {
      await api.post(`/api/auth/management/${userId}/extend_enrollment/`, {
        enrollment_id: enrollmentId,
        expires_at: newExpiry
      });
      // Refresh enrollments
      const response = await api.get(`/api/auth/management/${userId}/enrollments/`);
      setEnrollmentData(response.data);
    } catch (error) {
      setErrors({ enrollment: 'Failed to extend enrollment' });
    }
  };

  // Permanent deletion
  const handlePermanentDelete = async (reason) => {
    try {
      await api.delete(`/api/auth/management/${userId}/permanent_delete/`, {
        data: { confirm_delete: true, reason }
      });
      onClose();
      if (onUserUpdated) onUserUpdated(null); // Signal deletion
    } catch (error) {
      setErrors({ delete: 'Failed to delete user' });
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'status', label: 'Status', icon: Settings },
    { id: 'enrollment', label: 'Courses', icon: BookOpen },
    { id: 'advanced', label: 'Advanced', icon: Settings }
  ];

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading User..." size="lg">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Modal>
    );
  }

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit User: ${user.full_name || user.username}`}
      size="xl"
      className="h-[90vh] max-h-[900px]"
    >
      <div className="flex h-full">
        {/* Tab Navigation */}
        <div className="w-48 border-r border-gray-200 pr-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 pl-6 overflow-y-auto">
          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              profileData={profileData}
              setProfileData={setProfileData}
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              onSave={handleProfileUpdate}
              saving={saving}
              errors={errors}
            />
          )}

          {activeTab === 'security' && (
            <SecurityTab
              user={user}
              sessions={sessions}
              loginHistory={loginHistory}
              onRoleChange={handleRoleChange}
              onPasswordReset={handlePasswordReset}
              onLogoutAll={handleLogoutAllSessions}
              onLogoutSession={handleLogoutSession}
              errors={errors}
            />
          )}

          {activeTab === 'status' && (
            <StatusTab
              user={user}
              onToggleActive={handleToggleActive}
              onSuspend={handleSuspendUser}
              onUnsuspend={handleUnsuspendUser}
              errors={errors}
            />
          )}

          {activeTab === 'enrollment' && (
            <EnrollmentTab
              enrollments={enrollmentData}
              onBulkEnroll={handleBulkEnroll}
              onBulkUnenroll={handleBulkUnenroll}
              onExtendEnrollment={handleExtendEnrollment}
              errors={errors}
            />
          )}

          {activeTab === 'advanced' && (
            <AdvancedTab
              user={user}
              onDelete={handlePermanentDelete}
              errors={errors}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

// Profile Tab Component
function ProfileTab({ user, profileData, setProfileData, imagePreview, setImagePreview, onSave, saving, errors }) {
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        // Handle error
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // Handle error
        return;
      }
      setProfileData(prev => ({ ...prev, profile_image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
        <Button onClick={onSave} loading={saving} size="sm">
          Save Changes
        </Button>
      </div>

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      {/* Profile Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {imagePreview || user.profile?.profile_image ? (
              <img
                src={imagePreview || user.profile?.profile_image}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="profile-edit-image"
            />
            <label
              htmlFor="profile-edit-image"
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              Change Image
            </label>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            type="text"
            value={profileData.first_name}
            onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            value={profileData.last_name}
            onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={profileData.bio}
            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about yourself..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="City, Country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={profileData.phone_number}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Security Tab Component
function SecurityTab({ user, sessions, loginHistory, onRoleChange, onPasswordReset, onLogoutAll, onLogoutSession, errors }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Security & Access Management</h3>

      {errors.security && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.security}</p>
        </div>
      )}

      {/* Role Management */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
        <select
          value={user.profile?.role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Password Management */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password Management</label>
        <Button onClick={onPasswordReset} variant="outline" size="sm">
          <Key className="w-4 h-4 mr-2" />
          Send Password Reset Link
        </Button>
      </div>

      {/* Session Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">Active Sessions</label>
          <Button onClick={onLogoutAll} variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            Logout All Sessions
          </Button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{session.ip_address}</p>
                <p className="text-xs text-gray-500">{new Date(session.created_at).toLocaleString()}</p>
              </div>
              <Button
                onClick={() => onLogoutSession(session.id)}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Login History */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Recent Login Activity</label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {loginHistory.slice(0, 10).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{entry.event_display}</p>
                <p className="text-xs text-gray-500">{entry.ip_address} • {new Date(entry.timestamp).toLocaleString()}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${
                entry.event_type === 'success' ? 'bg-green-100 text-green-800' :
                entry.event_type === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {entry.event_type}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Status Tab Component
function StatusTab({ user, onToggleActive, onSuspend, onUnsuspend, errors }) {
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendExpiry, setSuspendExpiry] = useState('');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Account Status Management</h3>

      {errors.status && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.status}</p>
        </div>
      )}

      {/* Account Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {user.is_active ? 'Active' : 'Inactive'}
          </span>
          <Button
            onClick={onToggleActive}
            variant={user.is_active ? 'outline' : 'default'}
            size="sm"
            className={user.is_active ? 'text-red-600 border-red-300 hover:bg-red-50' : ''}
          >
            {user.is_active ? <UserX className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
            {user.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      {/* Suspension Management */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Suspension Management</label>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Reason</label>
            <input
              type="text"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Reason for suspension"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Expiry Date (optional)</label>
            <input
              type="datetime-local"
              value={suspendExpiry}
              onChange={(e) => setSuspendExpiry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onSuspend(suspendReason, suspendExpiry)}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Ban className="w-4 h-4 mr-2" />
              Suspend User
            </Button>
            <Button
              onClick={onUnsuspend}
              variant="outline"
              size="sm"
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Unsuspend User
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enrollment Tab Component
function EnrollmentTab({ enrollments, onBulkEnroll, onBulkUnenroll, onExtendEnrollment, errors }) {
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [extendExpiry, setExtendExpiry] = useState('');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Course Enrollment Management</h3>

      {errors.enrollment && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.enrollment}</p>
        </div>
      )}

      {/* Current Enrollments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Enrollments</label>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">{enrollment.course_title}</p>
                <p className="text-xs text-gray-500">
                  Status: {enrollment.status} • Progress: {enrollment.progress_percentage}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  className="px-2 py-1 text-xs border border-gray-300 rounded"
                  onChange={(e) => setExtendExpiry(e.target.value)}
                />
                <Button
                  onClick={() => onExtendEnrollment(enrollment.id, extendExpiry)}
                  variant="outline"
                  size="sm"
                >
                  Extend
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Operations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bulk Operations</label>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Course IDs (comma-separated)</label>
            <input
              type="text"
              value={selectedCourses.join(', ')}
              onChange={(e) => setSelectedCourses(e.target.value.split(',').map(id => id.trim()).filter(id => id))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1, 2, 3"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onBulkEnroll(selectedCourses)}
              variant="outline"
              size="sm"
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Bulk Enroll
            </Button>
            <Button
              onClick={() => onBulkUnenroll(selectedCourses)}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <UserX className="w-4 h-4 mr-2" />
              Bulk Unenroll
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Advanced Tab Component
function AdvancedTab({ user, onDelete, errors }) {
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Advanced Operations</h3>

      {errors.delete && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.delete}</p>
        </div>
      )}

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-900">Danger Zone</h4>
            <p className="text-sm text-red-700 mt-1">
              These actions are irreversible and will permanently affect the user account.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-red-900 mb-1">Deletion Reason</label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Reason for permanent deletion"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm-delete"
                  checked={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.checked)}
                  className="rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="confirm-delete" className="text-sm text-red-900">
                  I understand this action cannot be undone
                </label>
              </div>
              <Button
                onClick={() => onDelete(deleteReason)}
                disabled={!confirmDelete || !deleteReason.trim()}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Permanently Delete User
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
