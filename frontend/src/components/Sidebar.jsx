import React from 'react';

const views = [
  { key: 'today',      label: 'Today' },
  { key: 'upcoming',   label: 'Upcoming' },
  { key: 'highImpact', label: 'High Impact' },
  { key: 'focusMode',  label: 'Focus Mode' },
  { key: 'contexts',   label: 'Contexts' },
  { key: 'energy',     label: 'Energy Levels' },
  { key: 'all',        label: 'All Tasks' },
];

export default function Sidebar({ currentView, onViewChange }) {
  return (
    <aside className="w-64 bg-white border-r">
      <nav className="p-4 space-y-2">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => onViewChange(v.key)}
            className={`block w-full text-left px-3 py-2 rounded ${
              currentView === v.key
                ? 'bg-blue-100 font-semibold'
                : 'hover:bg-gray-100'
            }`}
          >
            {v.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

