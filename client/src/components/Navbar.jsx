import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QrCode, LogOut, User as UserIcon, Bell, Menu, X, ShieldCheck, Clock } from 'lucide-react';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Sidebar Toggle + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl lg:hidden transition"
            aria-label="Toggle Navigation"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                Time<span className="text-indigo-600">Wise</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider text-slate-400 -mt-1 block">
                Oops, You’re Late! 😜
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Live Server/Campus Clock */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/60 text-xs text-slate-600 font-mono">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-semibold text-slate-800">{formattedTime}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">{formattedDate}</span>
        </div>

        {/* Right: Scan Shortcut + User Profile Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/scan"
            className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan ID</span>
          </Link>

          {/* User Status Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition group"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition">
                  {user?.name || 'User'}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-indigo-500' : 'bg-emerald-500'
                      }`}
                  />
                  <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                    {user?.role || 'Staff'}
                  </span>
                </div>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
