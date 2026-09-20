import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ScanBarcode from './pages/ScanBarcode';
import LateEntries from './pages/LateEntries';
import Students from './pages/Students';
import Departments from './pages/Departments';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="scan" element={<ScanBarcode />} />
            <Route path="late-entries" element={<LateEntries />} />
            <Route path="students" element={<Students />} />
            <Route path="departments" element={<Departments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile" element={<Profile />} />

            {/* Admin-only Routes */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
