// src/components/auth/AuthPage.jsx
import React, { useState } from 'react';
import { User } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const AuthPage = () => {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'forgot'

  return (
    <div className="min-h-screen bg-[#f5f1e3] flex items-center justify-center p-6" style={{ fontFamily: 'Avenir, sans-serif' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-[#3e2f1c]/10 p-8">
          {/* Logo/Brand Area */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#3e2f1c] rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[#3e2f1c]" style={{ fontFamily: 'Cochin, serif' }}>
              Milea Estate Vineyard
            </h2>
            <p className="text-sm text-[#3e2f1c]/70">Wedding CRM System</p>
          </div>

          {/* Authentication Forms */}
          {currentView === 'login' && (
            <LoginForm
              onSwitchToSignup={() => setCurrentView('signup')}
              onForgotPassword={() => setCurrentView('forgot')}
            />
          )}

          {currentView === 'signup' && (
            <SignupForm onSwitchToLogin={() => setCurrentView('login')} />
          )}

          {currentView === 'forgot' && (
            <ForgotPasswordForm onBack={() => setCurrentView('login')} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-[#3e2f1c]/60">
          <p>Secure access to your wedding lead management system</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;