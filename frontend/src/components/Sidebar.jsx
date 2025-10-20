import React from 'react';
import PropTypes from 'prop-types';
import {
  FiHome, FiGrid, FiAlertTriangle,
  FiCalendar, FiFolder, FiRepeat, FiBarChart2,
  FiPlus, FiLogOut, FiX, FiSettings, FiHelpCircle,
  FiCpu, FiBookOpen, FiUsers, FiMonitor, FiPlayCircle,
  FiMessageSquare, FiServer, FiBox, FiVideo, FiUserCheck
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

const MENU = [
  { key: 'home',              icon: FiHome,           label: 'Home' },
  { key: 'planning',          icon: FiCalendar,       label: 'My Planning' },
  { key: 'projects',          icon: FiFolder,         label: 'Projects' },
  { key: 'qa-reviews',        icon: FiAlertTriangle,  label: 'QA Reviews I can make' },
  { key: 'evaluation-quizzes', icon: FiBarChart2,     label: 'Evaluation quizzes' },
  { key: 'my-courses',        icon: FiBookOpen,       label: 'My courses' },
  { key: 'concepts',          icon: FiCpu,            label: 'Concepts' },
  { key: 'conference-rooms',  icon: FiMessageSquare,  label: 'Conference rooms' },
  { key: 'servers',           icon: FiServer,         label: 'Servers' },
  { key: 'sandboxes',         icon: FiBox,            label: 'Sandboxes' },
  { key: 'video-on-demand',   icon: FiVideo,          label: 'Video on demand' },
  { key: 'peers',             icon: FiUsers,          label: 'Peers' },
];

export default function Sidebar({ currentView, onViewChange, onAddTask, onClose }) {
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-white shadow-md h-screen flex flex-col">
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold text-indigo-900">Do‑It</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close sidebar"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Title */}
      <div className="hidden md:flex items-center justify-center p-6 bg-gradient-to-r from-indigo-900 to-cyan-700 text-white">
        <h2 className="text-2xl font-bold">Do‑It</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Main Navigation */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            Main
          </h3>
          {MENU.slice(0, 4).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              className={`flex items-center w-full px-3 py-2.5 mb-1 rounded-lg transition-colors ${
                currentView === key
                  ? 'bg-indigo-100 text-indigo-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className={`mr-3 ${currentView === key ? 'text-indigo-700' : 'text-gray-500'}`} /> 
              {label}
            </button>
          ))}
        </div>

        {/* Tools Section */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            Tools
          </h3>
          {MENU.slice(4, 8).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              className={`flex items-center w-full px-3 py-2.5 mb-1 rounded-lg transition-colors ${
                currentView === key
                  ? 'bg-indigo-100 text-indigo-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className={`mr-3 ${currentView === key ? 'text-indigo-700' : 'text-gray-500'}`} /> 
              {label}
            </button>
          ))}
        </div>

        {/* Settings Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            Account
          </h3>
          {MENU.slice(8).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => onViewChange(key)}
              className={`flex items-center w-full px-3 py-2.5 mb-1 rounded-lg transition-colors ${
                currentView === key
                  ? 'bg-indigo-100 text-indigo-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className={`mr-3 ${currentView === key ? 'text-indigo-700' : 'text-gray-500'}`} /> 
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <FiLogOut className="mr-3" /> Log Out
        </button>
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  currentView: PropTypes.string.isRequired,
  onViewChange: PropTypes.func.isRequired,
  onAddTask: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};
