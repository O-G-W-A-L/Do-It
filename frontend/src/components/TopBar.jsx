// TopBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiSun, FiMoon, FiUser, FiSettings, FiHelpCircle, FiLogOut } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function TopBar({ onLogout }) {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );
  const menuRef = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    const onClickOutside = e => {
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

  return (
    <header className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 shadow">
      <input
        type="text"
        placeholder="Search tasks…"
        className="border rounded px-3 py-1 w-64 focus:outline-none focus:ring"
      />

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center space-x-2 focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200">
            U
          </div>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10">
            <button
              onClick={toggleTheme}
              className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none"
            >
              {isDark ? <FiSun className="mr-2" /> : <FiMoon className="mr-2" />}
              {isDark ? 'Light Theme' : 'Dark Theme'}
            </button>
            <Link
              to="/profile"
              className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <FiUser className="mr-2" /> View Profile
            </Link>
            <Link
              to="/settings"
              className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <FiSettings className="mr-2" /> Settings
            </Link>
            <Link
              to="/support"
              className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <FiHelpCircle className="mr-2" /> Support
            </Link>
            <button
              onClick={onLogout}
              className="flex items-center w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none"
            >
              <FiLogOut className="mr-2" /> Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}