import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Users, Shield, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

/**
 * Simple Admin Portal - Magic Link Invitation System
 * Clean, minimal interface for admin/instructor management
 */
export default function AdminPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'instructor'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Redirect if not admin/instructor
  React.useEffect(() => {
    if (!user || (user.profile?.role !== 'admin' && user.profile?.role !== 'instructor')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/admin/send-invitation/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(inviteForm)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Invitation sent successfully!');
        setInvitations(prev => [...prev, {
          id: data.invitation_id,
          email: inviteForm.email,
          role: inviteForm.role,
          sentAt: new Date(),
          status: 'sent'
        }]);
        setInviteForm({ email: '', role: 'instructor' });
        setShowInviteModal(false);
      } else {
        setMessage(data.detail || 'Failed to send invitation');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Courses',
      value: '12',
      icon: Shield,
      color: 'green'
    },
    {
      title: 'Invitations Sent',
      value: invitations.length,
      icon: Mail,
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
              <p className="text-gray-600">Manage platform users and send invitations</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Welcome,</p>
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500 capitalize">({user?.profile?.role})</p>
              </div>
              <Button
                variant="outline"
                onClick={logout}
                icon={LogOut}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => setShowInviteModal(true)}
              icon={Mail}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Send Invitation
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              icon={Users}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Recent Invitations */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Invitations</h2>
            <p className="text-sm text-gray-600 mt-1">Track invitation status and manage access</p>
          </div>

          <div className="p-6">
            {invitations.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No invitations sent yet</p>
                <p className="text-sm text-gray-400 mt-1">Send your first invitation to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invitation.email}</p>
                        <p className="text-sm text-gray-600 capitalize">{invitation.role} invitation</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {invitation.sentAt.toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Sent</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Send Admin Invitation"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitation}
              loading={loading}
              disabled={!inviteForm.email}
            >
              Send Invitation
            </Button>
          </>
        }
      >
        <form onSubmit={handleSendInvitation} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes('successfully')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={inviteForm.email}
              onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="instructor">Instructor</option>
              {user?.profile?.role === 'admin' && (
                <option value="admin">Admin</option>
              )}
            </select>
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>An invitation email will be sent to {inviteForm.email || 'the user'}</li>
              <li>The link expires in 24 hours for security</li>
              <li>Clicking the link automatically creates their account</li>
              <li>They'll be logged in and redirected to the admin dashboard</li>
            </ul>
          </div>
        </form>
      </Modal>
    </div>
  );
}
