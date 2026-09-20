import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import Toast from '../components/Toast';
import { User, Lock, Save, ShieldCheck, Mail, Phone, Building2 } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [toast, setToast] = useState(null);

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await authService.updateProfile({ name, phone });
      updateUser(res.user);
      setToast({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ type: 'warning', message: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ type: 'warning', message: 'Password must be at least 6 characters' });
      return;
    }

    setUpdatingPassword(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setToast({ type: 'success', message: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Account & Security
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal staff credentials and login password
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-indigo-600/20 mb-4">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>

          <div className="mt-3">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                user?.role === 'admin'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {user?.role} Account
            </span>
          </div>

          <div className="w-full mt-6 pt-4 border-t border-slate-100 text-xs text-left space-y-2.5 text-slate-600">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>{user?.department?.name || 'Institutional Gate Station'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{user?.phone || 'No phone registered'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="truncate">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Edit Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Update Personal Information
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-indigo-600/20 transition text-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{updatingProfile ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              Change Login Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition text-xs disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{updatingPassword ? 'Updating...' : 'Change Password'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
