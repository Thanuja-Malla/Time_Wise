import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('timewise_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('timewise_token'));
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authService.getMe();
          setUser(res.user);
          localStorage.setItem('timewise_user', JSON.stringify(res.user));
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('timewise_token', data.token);
    localStorage.setItem('timewise_user', JSON.stringify(data.user));
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('timewise_token');
      localStorage.removeItem('timewise_user');
    }
  };

  const updateUserState = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    localStorage.setItem('timewise_user', JSON.stringify(merged));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff' || user?.role === 'admin',
    login,
    logout,
    updateUser: updateUserState
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
