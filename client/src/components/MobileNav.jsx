import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, QrCode, Clock, Users, FileText } from 'lucide-react';

export default function MobileNav() {
  const links = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/late-entries', label: 'Entries', icon: Clock },
    { to: '/scan', label: 'Scan', icon: QrCode, isHero: true },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/reports', label: 'Reports', icon: FileText }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-4 py-1.5 flex items-center justify-around lg:hidden shadow-lg shadow-slate-900/10">
      {links.map((item) => {
        const Icon = item.icon;
        if (item.isHero) {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center -mt-5 transition-transform active:scale-95 ${
                  isActive ? 'scale-105' : ''
                }`
              }
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 border-4 border-white">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-indigo-600 mt-0.5">
                {item.label}
              </span>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
