import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { FiCamera, FiArrowLeft, FiEdit2, FiSave, FiX, FiUser, FiBookOpen, FiShield, FiSettings } from 'react-icons/fi';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [securityData, setSecurityData] = useState(null);
  const [learningData, setLearningData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const resolveImageUrl = (url) => {
    if (!url) return '/default-avatar.png';
    const base = api.defaults.baseURL.replace(/\/$/, '');
    const full = url.startsWith('http') ? url : `${base}${url}`;
    return `${full}?t=${cacheBuster}`;
  };

  // Load all profile data
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        const [profileRes, preferencesRes, securityRes, learningRes] = await Promise.allSettled([
          api.get('/api/users/me/'),
          api.get('/api/profile/preferences/'),
          api.get('/api/profile/security/'),
          api.get('/api/profile/learning-data/')
        ]);

        if (profileRes.status === 'fulfilled') {
          const profileData = profileRes.value.data;
          setProfile(profileData);
          setPhoneNumber(profileData.phone_number || '');
          setBio(profileData.bio || '');
          setLocation(profileData.location || '');
        }

        if (preferencesRes.status === 'fulfilled') {
          setPreferences(preferencesRes.value.data);
        }

        if (securityRes.status === 'fulfilled') {
          setSecurityData(securityRes.value.data);
        }

        if (learningRes.status === 'fulfilled') {
          setLearningData(learningRes.value.data);
        }

      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
        else console.error('Failed loading profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [navigate]);

  const handleImageChange = e => {
    const file = e.target.files[0];
    setProfileImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const formData = new FormData();
    if (profileImage) formData.append('profile_image', profileImage);
    if (phoneNumber) formData.append('phone_number', phoneNumber);

    try {
      // Update backend
      const { data } = await api.patch('/api/users/me/', formData);
      console.log('After save profile.image:', data.profile_image);

      // Update state and bust cache
      setProfile(prev => ({ ...prev, ...data }));
      setCacheBuster(Date.now());
      setIsEditMode(false);
      setPreviewUrl(null);
      setProfileImage(null);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center p-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-xl">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-800 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // Tab components
  const PersonalTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors flex items-center"
        >
          <FiEdit2 className="mr-2" />
          {isEditMode ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500">Username</label>
          <input
            type="text"
            value={profile.username}
            disabled
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500">Email</label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500">Phone Number</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={!isEditMode}
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
              isEditMode
                ? 'border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                : 'border-gray-200 bg-gray-50'
            }`}
            placeholder="Enter your phone number"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={!isEditMode}
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
              isEditMode
                ? 'border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                : 'border-gray-200 bg-gray-50'
            }`}
            placeholder="Your location"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-500">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={!isEditMode}
            rows={4}
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
              isEditMode
                ? 'border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                : 'border-gray-200 bg-gray-50'
            }`}
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>

      {isEditMode && (
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={() => setIsEditMode(false)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );

  const LearningTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Learning Progress</h2>

      {learningData ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Courses</h3>
              <FiBookOpen className="text-blue-600" size={24} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Enrolled</span>
                <span className="font-medium">{learningData.enrolled_courses_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-medium">{learningData.completed_courses_count || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Skills</h3>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="space-y-2">
              {learningData.skills && learningData.skills.length > 0 ? (
                learningData.skills.slice(0, 3).map((skill, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-sm text-gray-600">{skill.name}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {skill.level}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No skills yet</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Achievements</h3>
              <span className="text-2xl">🏆</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningData.achievements && learningData.achievements.length > 0 ? (
                learningData.achievements.slice(0, 4).map((achievement, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="font-medium text-sm">{achievement.title}</div>
                    <div className="text-xs text-gray-500">{achievement.description}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  <span className="text-4xl mb-2 block">🎓</span>
                  <p>Complete courses to earn achievements!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading learning data...</p>
        </div>
      )}
    </div>
  );

  const SecurityTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Security & Privacy</h2>

      {securityData ? (
        <div className="space-y-6">
          {/* Security Score */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Security Score</h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{securityData.security_score || 0}%</div>
                <div className="text-sm text-gray-600">Account Security</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${securityData.security_score || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Active Sessions</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-800">
                Logout All
              </button>
            </div>
            <div className="space-y-3">
              {securityData.active_sessions && securityData.active_sessions.length > 0 ? (
                securityData.active_sessions.map((session, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium text-sm">{session.ip_address}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(session.last_activity).toLocaleString()}
                      </div>
                    </div>
                    <button className="text-xs text-red-600 hover:text-red-800">
                      Logout
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No active sessions</p>
              )}
            </div>
          </div>

          {/* Recent Login History */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Recent Login Activity</h3>
            <div className="space-y-3">
              {securityData.recent_login_history && securityData.recent_login_history.length > 0 ? (
                securityData.recent_login_history.map((login, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        login.event_type === 'success' ? 'bg-green-500' :
                        login.event_type === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <div className="font-medium text-sm capitalize">{login.event_type.replace('_', ' ')}</div>
                        <div className="text-xs text-gray-500">
                          {login.ip_address} • {new Date(login.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security data...</p>
        </div>
      )}
    </div>
  );

  const PreferencesTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Preferences & Settings</h2>

      {preferences ? (
        <div className="space-y-6">
          {/* Language & Localization */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Language & Localization</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500">Language</label>
                <select
                  value={preferences.language || 'en'}
                  onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500">Timezone</label>
                <select
                  value={preferences.timezone || 'UTC'}
                  onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Europe/Berlin">Berlin</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                  <option value="Australia/Sydney">Sydney</option>
                  <option value="Africa/Kampala">Kampala</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Notifications</h3>
            <div className="space-y-4">
              {[
                { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive notifications in-app' },
                { key: 'study_reminders', label: 'Study Reminders', desc: 'Get reminded about your learning goals' },
                { key: 'course_updates', label: 'Course Updates', desc: 'Notifications about course changes' },
                { key: 'achievement_notifications', label: 'Achievement Notifications', desc: 'Celebrate your progress' }
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <h4 className="font-medium text-gray-800">{label}</h4>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[key] || false}
                      onChange={(e) => setPreferences({...preferences, [key]: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Preferences */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Learning Preferences</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500">Weekly Study Goal (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={preferences.weekly_study_goal || 10}
                  onChange={(e) => setPreferences({...preferences, weekly_study_goal: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500">Learning Style</label>
                <select
                  value={preferences.learning_style || 'visual'}
                  onChange={(e) => setPreferences({...preferences, learning_style: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="visual">Visual</option>
                  <option value="auditory">Auditory</option>
                  <option value="reading">Reading/Writing</option>
                  <option value="kinesthetic">Kinesthetic</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Save Preferences
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preferences...</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-indigo-700 hover:text-indigo-900 transition-colors font-medium"
        >
          <FiArrowLeft className="mr-2" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Profile header with gradient */}
          <div className="bg-gradient-to-r from-indigo-900 to-cyan-700 px-6 py-8 text-white relative">
            <h1 className="text-2xl font-bold mb-1">My Profile</h1>
            <p className="text-indigo-100 text-sm">Manage your learning journey and account settings</p>

            {/* Avatar */}
            <div className="absolute -bottom-16 left-6">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                <img
                  src={resolveImageUrl(profile.profile_image)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/default-avatar.png';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-20">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { id: 'personal', label: 'Personal', icon: <FiUser /> },
                { id: 'learning', label: 'Learning', icon: <FiBookOpen /> },
                { id: 'security', label: 'Security', icon: <FiShield /> },
                { id: 'preferences', label: 'Preferences', icon: <FiSettings /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-indigo-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-8">
            {activeTab === 'personal' && <PersonalTab />}
            {activeTab === 'learning' && <LearningTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
