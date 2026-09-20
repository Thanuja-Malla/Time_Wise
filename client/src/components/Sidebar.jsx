import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  QrCode,
  Clock,
  Users,
  Building2,
  FileText,
  BarChart3,
  UserCheck,
  User,
  ShieldAlert,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin } = useAuth();

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'staff']
    },
    {
      to: '/scan',
      label: 'Scan ID Card',
      icon: QrCode,
      roles: ['admin', 'staff'],
      highlight: true
    },
    {
      to: '/late-entries',
      label: 'Late Entries',
      icon: Clock,
      roles: ['admin', 'staff']
    },
    {
      to: '/students',
      label: 'Student Directory',
      icon: Users,
      roles: ['admin', 'staff']
    },
    {
      to: '/departments',
      label: 'Departments',
      icon: Building2,
      roles: ['admin', 'staff']
    },
    {
      to: '/reports',
      label: 'Reports & Export',
      icon: FileText,
      roles: ['admin', 'staff']
    },
    {
      to: '/analytics',
      label: 'Punctuality Analytics',
      icon: BarChart3,
      roles: ['admin', 'staff']
    },
    {
      to: '/users',
      label: 'Staff & Admin Users',
      icon: UserCheck,
      roles: ['admin'] // Admin only
    },
    {
      to: '/profile',
      label: 'My Account',
      icon: User,
      roles: ['admin', 'staff']
    }
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user?.role || 'staff')
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile-only Close Header (Hidden on Desktop to prevent duplicate TimeWise branding) */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between lg:hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Navigation Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? item.highlight
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-indigo-50/80 text-indigo-700 font-bold'
                      : item.highlight
                      ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? item.highlight
                            ? 'text-white'
                            : 'text-indigo-600'
                          : item.highlight
                          ? 'text-indigo-600'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.highlight && !isActive && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Institutional Campus Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 m-3 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Gate Server Online
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Barcodes are validated with live authoritative server timestamps.
          </p>
        </div>
      </aside>
    </>
  );
}
