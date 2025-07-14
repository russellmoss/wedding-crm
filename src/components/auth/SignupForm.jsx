// src/components/auth/SignupForm.jsx
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SignupForm = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const { data, error } = await signUp(email, password);
    if (error) {
      setError(error.message);
    } else if (data?.user && !data.user.email_confirmed_at) {
      setSuccess('Check your email for a confirmation link!');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'Cochin, serif' }}>
          Create Account
        </h1>
        <p className="text-sm sm:text-base text-[#3e2f1c]/70">Join the Milea Estate CRM system</p>
      </div>

      <div className="space-y-5 sm:space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 text-green-700 text-sm">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#3e2f1c]/50" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-4 sm:py-3 border border-[#3e2f1c]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c]/20 focus:border-[#3e2f1c] text-base min-h-[44px]"
              placeholder="Enter your email"
              disabled={loading}
              autoComplete="email"
              inputMode="email"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#3e2f1c]/50" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-4 sm:py-3 border border-[#3e2f1c]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c]/20 focus:border-[#3e2f1c] text-base min-h-[44px]"
              placeholder="Create a password"
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#3e2f1c]/50 hover:text-[#3e2f1c] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#3e2f1c]/50" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-4 sm:py-3 border border-[#3e2f1c]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c]/20 focus:border-[#3e2f1c] text-base min-h-[44px]"
              placeholder="Confirm your password"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#3e2f1c] text-white py-4 sm:py-3 rounded-lg hover:bg-[#3e2f1c]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-[44px] text-base font-medium"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Create Account
            </>
          )}
        </button>
      </div>

      <div className="mt-6 text-center">
        <div className="text-sm text-[#3e2f1c]/70">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-[#3e2f1c] hover:underline font-medium py-2 min-h-[44px]"
            disabled={loading}
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;