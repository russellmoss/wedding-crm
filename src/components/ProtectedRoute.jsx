// src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from './auth/AuthPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f1e3] flex items-center justify-center">
        <div className="text-[#3e2f1c] text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return children;
};

export default ProtectedRoute;