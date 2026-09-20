import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { departmentService } from '../services/departmentService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  ShieldCheck,
  CheckCircle,
  Mail,
  Phone,
  Building2,
  ShieldAlert
} from 'lucide-react';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  const initialForm = {
    name: '',
    email: '',
    password: '',
    role: 'staff',
    department: '',
    phone: '',
    status: 'active'
  };
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentService.getDepartments();
      setDepartments(res.departments || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined
      };
      const res = await userService.getUsers(params);
      setUsers(res.users || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // leave empty if not changing
      role: user.role,
      department: user.department?._id || user.department || '',
      phone: user.phone || '',
      status: user.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setToast({ type: 'warning', message: 'Name and email are required.' });
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      setToast({ type: 'warning', message: 'Password must be at least 6 characters.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        await userService.updateUser(editingUser._id, formData);
        setToast({ type: 'success', message: 'User updated successfully' });
      } else {
        await userService.createUser(formData);
        setToast({ type: 'success', message: 'User created successfully' });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      await userService.deleteUser(deleteConfirmUser._id);
      setToast({ type: 'success', message: 'User deleted successfully' });
      setDeleteConfirmUser(null);
      fetchUsers();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            User & Staff Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized gate staff, security personnel, and institutional administrators
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Authorized User</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Fetching user accounts..." />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Users Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              No accounts match the specified criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {u.role === 'admin' ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.department?.name ? `${u.department.code} - ${u.department.name}` : 'Institutional Gate'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {u.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never logged in'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Edit User"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {currentUser?._id !== u._id && (
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            title="Delete User"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User Information' : 'Create Authorized User'}
        subtitle="Staff can scan student ID barcodes; Admins have full system control"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Officer Rajesh Kumar"
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="gate.officer@college.edu"
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
              Password {editingUser ? '(Leave blank to retain current)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="staff">Staff (Scanner & Logger)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Campus Gate / All</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        title="Confirm User Deletion"
        subtitle="This action will permanently revoke portal access"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to delete user{' '}
            <strong className="text-slate-900">{deleteConfirmUser?.name}</strong> (
            {deleteConfirmUser?.email})?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteConfirmUser(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
