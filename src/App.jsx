// src/App.jsx
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CRMDashboard from './components/CRMDashboard';

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <CRMDashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;