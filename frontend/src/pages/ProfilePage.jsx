import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { FiCamera, FiArrowLeft, FiEdit2, FiSave, FiX } from 'react-icons/fi';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);

  const resolveImageUrl = (url) => {
    if (!url) return '/default-avatar.png';
    const base = api.defaults.baseURL.replace(/\/$/, '');
    const full = url.startsWith('http') ? url : `${base}${url}`;
    return `${full}?t=${cacheBuster}`;
  };

  useEffect(() => {
    setIsLoading(true);
    api.get('/api/users/me/')
      .then(({ data }) => {
        console.log('Fetched profile.image:', data.profile_image);
        setProfile(data);
        setPhoneNumber(data.phone_number || '');
        setIsLoading(false);
      })
      .catch(err => {
        if (err.response?.status === 401) navigate('/login');
        else console.error('Failed loading profile:', err);
        setIsLoading(false);
      });
  }, [navigate, cacheBuster]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
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
            <p className="text-indigo-100 text-sm">Manage your personal information</p>
            
            {/* Avatar - positioned to overlap the header and content */}
            <div className="absolute -bottom-16 left-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                  <img
                    src={
                      isEditMode
                        ? (previewUrl || resolveImageUrl(profile.profile_image))
                        : resolveImageUrl(profile.profile_image)
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/default-avatar.png';
                    }}
                  />
                </div>
                {isEditMode && (
                  <label className="absolute bottom-0 right-0 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-full p-2 cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <FiCamera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                )}
              </div>
            </div>
            
            {/* Edit/Save buttons */}
            <div className="absolute top-6 right-6 flex space-x-2">
              {!isEditMode ? (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 flex items-center bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium transition-all"
                >
                  <FiEdit2 className="mr-1" /> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 flex items-center bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium transition-all"
                  >
                    <FiSave className="mr-1" /> Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(false);
                      setPreviewUrl(null);
                      setProfileImage(null);
                    }}
                    className="p-2 flex items-center bg-white/20 hover:bg-white/30 text-white rounded-full text-sm transition-all"
                  >
                    <FiX />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Profile content */}
          <div className="px-6 pt-20 pb-8">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Username */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500">
                  Username
                </label>
                <input
                  type="text"
                  value={profile.username}
                  disabled
                  className="w-full px-5 py-3 rounded-full border border-gray-200 bg-gray-50 text-gray-700 font-medium"
                />
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-500">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-5 py-3 rounded-full border border-gray-200 bg-gray-50 text-gray-700 font-medium"
                />
              </div>
              
              {/* Phone number - only shown in edit mode */}
              {isEditMode && (
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full px-5 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>
              )}
            </div>
            
            {/* Account info section */}
            <div className="mt-10 pt-6 border-t border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Account Created</div>
                  <div className="font-medium">
                    {new Date(profile.date_joined || Date.now()).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Account Status</div>
                  <div className="font-medium flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
