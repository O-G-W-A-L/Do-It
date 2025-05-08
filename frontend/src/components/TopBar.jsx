import React, { useState, useEffect, useRef } from 'react';
import {
  FiSun,
  FiMoon,
  FiUser,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiBell
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../axiosInstance';

export default function TopBar({ onLogout, onMenuToggle }) {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );
  const [profileImage, setProfileImage] = useState(null);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const menuRef = useRef();
  const searchRef = useRef();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch current user's profile (to get profile_image)
  useEffect(() => {
    api
      .get('/api/users/me/')
      .then(({ data }) => setProfileImage(data.profile_image))
      .catch((err) => console.error('Failed fetching profile:', err));
  }, [cacheBuster]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      setIsDark(true);
    }
  };

  // Resolve media URL (works in dev and production)
  const resolveImageUrl = (url) => {
    if (!url) return '/default-avatar.png';
    const base = api.defaults.baseURL.replace(/\/$/, '');
    return `${base}${url}?t=${cacheBuster}`;
  };

  return (
    <header className="bg-gradient-to-r from-indigo-900 to-cyan-700 shadow-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left section: Menu button and logo */}
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            
            <Link to="/" className="text-white font-bold text-xl ml-2 md:ml-0">
              Do-It
            </Link>
          </div>
          
          {/* Center section: Search */}
          <div className="hidden sm:flex flex-1 max-w-xl mx-4 relative">
            <div 
              className={`flex items-center w-full bg-white/10 rounded-full transition-all ${
                isSearchFocused ? 'bg-white/20 shadow-lg' : ''
              }`}
              ref={searchRef}
            >
              <FiSearch className="ml-4 text-white/70" />
              <input
                type="text"
                placeholder="Search tasks…"
                className="w-full px-3 py-2 bg-transparent border-none text-white placeholder-white/70 focus:outline-none focus:ring-0"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>
          </div>
          
          {/* Right section: Notifications and Profile */}
          <div className="flex items-center space-x-4">
            {/* Mobile search button */}
            <button className="sm:hidden p-2 text-white hover:bg-white/10 rounded-full">
              <FiSearch className="w-5 h-5" />
            </button>
            
            {/* Notifications */}
            <button className="p-2 text-white hover:bg-white/10 rounded-full relative">
              <FiBell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {/* Profile Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center focus:outline-none"
                aria-label="Open user menu"
              >
                <div className="w-9 h-9 rounded-full border-2 border-white/70 overflow-hidden hover:border-white transition-colors">
                  {profileImage ? (
                    <img
                      src={resolveImageUrl(profileImage) || "/placeholder.svg"}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-200 flex items-center justify-center text-indigo-700">
                      <FiUser />
                    </div>
                  )}
                </div>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-10 overflow-hidden border border-gray-100 dark:border-gray-700 animate-fadeIn">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="font-medium text-gray-800 dark:text-white">User Menu</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Manage your account</div>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={toggleTheme}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {isDark ? (
                        <FiSun className="mr-3 text-amber-500" />
                      ) : (
                        <FiMoon className="mr-3 text-indigo-600" />
                      )}
                      {isDark ? 'Light Theme' : 'Dark Theme'}
                    </button>

                    <Link
                      to="/profile"
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <FiUser className="mr-3 text-indigo-600 dark:text-indigo-400" /> View Profile
                    </Link>

                    <Link
                      to="/settings"
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <FiSettings className="mr-3 text-indigo-600 dark:text-indigo-400" /> Settings
                    </Link>

                    <Link
                      to="/support"
                      className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setOpen(false)}
                    >
                      <FiHelpCircle className="mr-3 text-indigo-600 dark:text-indigo-400" /> Support
                    </Link>
                  </div>
                  
                  <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                    <button
                      onClick={() => {
                        setOpen(false);
                        onLogout();
                      }}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <FiLogOut className="mr-3" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile search - only visible on small screens */}
      <div className="sm:hidden px-4 pb-3">
        <div className="flex items-center w-full bg-white/10 rounded-full">
          <FiSearch className="ml-4 text-white/70" />
          <input
            type="text"
            placeholder="Search tasks…"
            className="w-full px-3 py-2 bg-transparent border-none text-white placeholder-white/70 focus:outline-none focus:ring-0"
          />
        </div>
      </div>
    </header>
  );
}