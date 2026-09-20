import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QrCode, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';
import Toast from '../components/Toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setToast({ type: 'warning', message: 'Please enter both email and password' });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@timewise.edu');
      setPassword('Admin@123');
    } else {
      setEmail('staff@timewise.edu');
      setPassword('Staff@123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Subtle background glow effect */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100/20 p-8 sm:p-10 relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-600/30 mb-4 transform hover:scale-105 transition-transform">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Time<span className="text-indigo-600">Wise</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Smart Mobile Barcode-Based Late Entry Management
          </p>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
            One-Click Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 border border-slate-200/80 shadow-2xs transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemo('staff')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl bg-white hover:bg-emerald-50 hover:text-emerald-600 text-slate-700 border border-slate-200/80 shadow-2xs transition"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Staff Demo
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@timewise.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <span>Verifying credentials...</span>
            ) : (
              <>
                <span>Sign In to Gate Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security footer notice */}
        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Authorized Personnel Only • Secure Server Authoritative Logging
          </p>
        </div>
      </div>
    </div>
  );
}
