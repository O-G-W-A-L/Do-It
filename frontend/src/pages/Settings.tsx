import React, { useState } from 'react';
import { FiSave, FiBell, FiLock, FiGlobe, FiMonitor, FiClock, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  
  // These states would be connected to actual settings in a real implementation
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState('english');
  const [timezone, setTimezone] = useState('UTC');
  
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
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900 to-cyan-700 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold mb-1">Settings</h1>
            <p className="text-indigo-100 text-sm">Customize your experience</p>
          </div>
          
          {/* Content */}
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="md:w-64 bg-gray-50 md:border-r border-gray-100">
              <nav className="p-4 md:p-6 space-y-1">
                {[
                  { id: 'general', label: 'General', icon: <FiMonitor /> },
                  { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
                  { id: 'security', label: 'Security', icon: <FiLock /> },
                  { id: 'preferences', label: 'Preferences', icon: <FiGlobe /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-indigo-100 text-indigo-900 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Main content */}
            <div className="flex-1 p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">General Settings</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Language
                      </label>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="english">English</option>
                        <option value="spanish">Spanish</option>
                        <option value="french">French</option>
                        <option value="german">German</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timezone
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiClock className="text-gray-400" />
                        </div>
                        <select 
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                          <option value="EST">EST (Eastern Standard Time)</option>
                          <option value="CST">CST (Central Standard Time)</option>
                          <option value="PST">PST (Pacific Standard Time)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <h3 className="font-medium text-gray-800">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive updates via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={emailNotifications}
                          onChange={() => setEmailNotifications(!emailNotifications)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <h3 className="font-medium text-gray-800">Push Notifications</h3>
                        <p className="text-sm text-gray-500">Receive notifications in-app</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={pushNotifications}
                          onChange={() => setPushNotifications(!pushNotifications)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Security Settings</h2>
                  
                  <div className="space-y-4">
                    <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors">
                      Change Password
                    </button>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mt-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            For enhanced security, we recommend enabling two-factor authentication.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferences</h2>
                  
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Configure your preferences and application settings.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">
                        More preference options coming soon.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Save button */}
              <div className="mt-8 flex justify-end">
                <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-full hover:shadow-lg transition-all flex items-center">
                  <FiSave className="mr-2" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}