import React from 'react';
import {
  FiHome, FiGrid, FiAlertTriangle,
  FiCalendar, FiFolder, FiRepeat, FiBarChart2,
  FiPlus, FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

const MENU = [
  { key: 'home',       icon: FiHome,          label: 'Home' },
  { key: 'mytasks',    icon: FiGrid,          label: 'My Tasks' },
  { key: 'priorities', icon: FiAlertTriangle, label: 'Priorities' },
  { key: 'calendar',   icon: FiCalendar,      label: 'My Calender' },
  { key: 'projects',   icon: FiFolder,        label: 'Projects' },
  { key: 'routine',    icon: FiRepeat,        label: 'Routine Tracker' },
  { key: 'progress',   icon: FiBarChart2,     label: 'My Progress' },
];

export default function Sidebar({ currentView, onViewChange, onAddTask }) {
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-white shadow-md h-screen flex flex-col p-4">
      <h2 className="text-2xl font-bold mb-6">Do‑It</h2>

      {/* Navigation Buttons */}
      {MENU.slice(0, 3).map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onViewChange(key)}
          className={`flex items-center w-full px-3 py-2 mb-1 rounded-md transition ${
            currentView === key
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Icon className="mr-2" /> {label}
        </button>
      ))}

      {/* Add Task Button */}
      <button
        onClick={onAddTask}
        className="flex items-center w-full px-3 py-2 mt-2 mb-4 rounded-md text-green-600 hover:bg-green-50 transition"
      >
        <FiPlus className="mr-2" /> Add Task
      </button>

      {/* Other Sections */}
      <nav className="flex-1">
        {MENU.slice(3).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={`flex items-center w-full px-3 py-2 mb-1 rounded-md transition ${
              currentView === key
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="mr-2" /> {label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="mt-4 flex items-center w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition"
      >
        <FiLogOut className="mr-2" /> Log Out
      </button>
    </aside>
  );
}
