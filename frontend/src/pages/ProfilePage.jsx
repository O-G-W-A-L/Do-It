import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axiosInstance';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile]           = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);
  const [phoneNumber, setPhoneNumber]   = useState('');
  const [isEditMode, setIsEditMode]     = useState(false);
  const [cacheBuster, setCacheBuster]   = useState(Date.now());  // ← new

  const resolveImageUrl = (url) => {
    if (!url) return '/default-avatar.png';
    const abs = url.startsWith('http') ? url : `http://localhost:8000${url}`;
    // append cacheBuster to force reload
    return `${abs}?t=${cacheBuster}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/api/users/me/');
        console.log('Fetched profile.image:', data.profile_image);  // ← debug
        setProfile(data);
        setPhoneNumber(data.phone_number || '');
      } catch (error) {
        if (error.response?.status === 401) {
          navigate('/login');
        } else {
          console.error('Failed loading profile:', error);
        }
      }
    };
    fetchProfile();
  }, [navigate, cacheBuster]);

  const handleImageChange = e => {
    const file = e.target.files[0];
    setProfileImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handlePhoneNumberChange = e => setPhoneNumber(e.target.value);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (profileImage)  formData.append('profile_image', profileImage);
      if (phoneNumber)   formData.append('phone_number', phoneNumber);

      await api.patch('/api/users/me/', formData);

      // bump cacheBuster so the re-rendered <img> sees a new URL
      setCacheBuster(Date.now());

      const { data } = await api.get('/api/users/me/');
      console.log('After save profile.image:', data.profile_image);  // ← debug

      setProfile(data);
      setPhoneNumber(data.phone_number || '');
      setIsEditMode(false);
      setPreviewUrl(null);
      setProfileImage(null);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  if (!profile) {
    return <div className="text-center py-16">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              My Profile
            </h1>
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded"
              >
                Edit
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm text-white bg-green-600 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setPreviewUrl(null);
                    setProfileImage(null);
                  }}
                  className="px-4 py-2 text-sm text-white bg-gray-600 rounded"
                >
                  Cancel
                </button>
              </div>
            )}
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm text-white bg-gray-600 rounded"
            >
              Back
            </button>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <img
                src={
                  isEditMode
                    ? (previewUrl || resolveImageUrl(profile.profile_image))
                    : resolveImageUrl(profile.profile_image)
                }
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
              />
              {isEditMode && (
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white text-sm rounded-full p-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
              />
            </div>

            {isEditMode && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
