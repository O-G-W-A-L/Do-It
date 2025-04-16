import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Toggle from '../components/Toggle';

export default function Settings() {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [themeDark, setThemeDark] = useState(false);

  const handleSave = () => {
    updateProfile(profile);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded space-y-6">
      <h2 className="text-2xl font-semibold">Settings</h2>

      <section>
        <h3 className="font-medium mb-2">Profile</h3>
        <input
          type="text"
          value={profile.name}
          onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
          className="w-full border rounded p-2 mb-4"
        />
        <input
          type="email"
          value={profile.email}
          onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
          className="w-full border rounded p-2"
        />
      </section>

      <section>
        <h3 className="font-medium mb-2">Preferences</h3>
        <div className="flex items-center justify-between mb-4">
          <span>Dark Mode</span>
          <Toggle checked={themeDark} onChange={setThemeDark} />
        </div>
        {/* Add more toggles: notifications, calendar sync, etc. */}
      </section>

      <div className="flex justify-end space-x-2">
        <button onClick={logout} className="px-4 py-2">Log Out</button>
        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
      </div>
    </div>
  );
}

