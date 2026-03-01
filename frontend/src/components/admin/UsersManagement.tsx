import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  UserCheck,
  UserX,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Shield,
  Mail,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import UserCreateModal from './UserCreateModal';
import UserEditModal from './UserEditModal';

const UsersManagement = ({ onSave }) => {
  const { user: currentUser } = useAuth();

  // State management
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_joined');
  const [sortOrder, setSortOrder] = useState('desc');

  // Bulk operations
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  // Reload users when filters change
  useEffect(() => {
    loadUsers();
  }, [searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('is_active', statusFilter === 'active' ? 'true' : 'false');
      params.append('ordering', `${sortOrder === 'desc' ? '-' : ''}${sortBy}`);

      const { data } = await api.get(`/api/auth/management/?${params.toString()}`);
      setUsers(data.results || data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const { data } = await api.get('/api/auth/management/stats/');
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleUserAction = async (userId, action, data = {}) => {
    try {
      setActionLoading(userId);
      const { data: responseData } = await api.post(`/api/auth/management/${userId}/${action}/`, data);

      // Update local state
      setUsers(users.map(u =>
        u.id === userId ? { ...u, ...responseData } : u
      ));

      // Reload stats
      loadStats();

      toast.success(`${action.replace('_', ' ')} successful`);
      onSave?.();
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
      toast.error(`Failed to ${action.replace('_', ' ')}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action, data = {}) => {
    if (selectedUsers.size === 0) return;

    try {
      setActionLoading('bulk');
      const promises = Array.from(selectedUsers).map(userId =>
        api.post(`/api/auth/management/${userId}/${action}/`, data)
      );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        loadUsers();
        loadStats();
        toast.success(`${action.replace('_', ' ')} applied to ${successCount} users`);
        onSave?.();
      }

      if (failCount > 0) {
        toast.error(`Failed to ${action.replace('_', ' ')} ${failCount} users`);
      }

      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } catch (err) {
      console.error('Bulk operation failed:', err);
      toast.error('Bulk operation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchQuery ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.profile?.role === roleFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'instructor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = (user) => {
    if (user.profile?.is_account_locked) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full text-xs font-medium">
          <Shield className="w-3 h-3" />
          Locked
        </span>
      );
    }
    if (user.is_active) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 border border-red-200 rounded-full text-xs font-medium">
        <UserX className="w-3 h-3" />
        Inactive
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statsLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))
          ) : stats ? (
            <>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">{stats.total_users || 0}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{stats.active_users || 0}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.students || 0}
                </div>
                <div className="text-sm text-gray-600">Students</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.instructors || 0}
                </div>
                <div className="text-sm text-gray-600">Instructors</div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-6 pb-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, username, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="instructor">Instructor</option>
                <option value="student">Student</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setSortBy('date_joined');
                  setSortOrder('desc');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="mx-6 mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('toggle_active', { is_active: true })}
                disabled={actionLoading === 'bulk'}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'bulk' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Activate'}
              </button>
              <button
                onClick={() => handleBulkAction('toggle_active', { is_active: false })}
                disabled={actionLoading === 'bulk'}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'bulk' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Deactivate'}
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-3 py-1.5 text-gray-600 border border-gray-300 text-sm rounded hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="mx-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                  } else {
                    setSelectedUsers(new Set());
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Users</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Users Found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedUsers);
                          if (e.target.checked) {
                            newSelected.add(user.id);
                          } else {
                            newSelected.delete(user.id);
                          }
                          setSelectedUsers(newSelected);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />

                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {user.full_name || user.username}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.profile?.role)}`}>
                            {user.profile?.role_display || user.profile?.role}
                          </span>
                          {getStatusBadge(user)}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Joined {formatDate(user.date_joined)}
                          </span>
                          {user.last_login && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Last login {formatDate(user.last_login)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View/Edit User"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUserAction(
                          user.id,
                          'toggle_active',
                          { is_active: !user.is_active }
                        )}
                        disabled={actionLoading === user.id}
                        className={`p-2 rounded-lg transition-colors ${
                          user.is_active
                            ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-green-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={user.is_active ? 'Deactivate User' : 'Activate User'}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : user.is_active ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Create Modal */}
      <UserCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={(newUser) => {
          // Add new user to the list and reload stats
          setUsers(prev => [newUser, ...prev]);
          loadStats();
          toast.success('User created successfully');
          onSave?.();
        }}
      />

      {/* User Edit Modal */}
      <UserEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        userId={selectedUserId}
        onUserUpdated={(updatedUser) => {
          if (updatedUser === null) {
            // User was deleted
            setUsers(prev => prev.filter(u => u.id !== selectedUserId));
          } else {
            // User was updated
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
          }
          loadStats();
          toast.success(updatedUser === null ? 'User deleted successfully' : 'User updated successfully');
          onSave?.();
        }}
      />
    </div>
  );
};

export default UsersManagement;
