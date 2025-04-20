import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function TopBar() {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between bg-white p-4 shadow">
      <input
        type="text"
        placeholder="Search tasks…"
        className="border rounded px-3 py-1"
      />
      <div className="flex items-center space-x-4">
        <img
          src={user?.avatarUrl || '/assets/default-avatar.png'}
          alt="Profile"
          className="w-8 h-8 rounded-full"
        />
      </div>
    </header>
  );
}
