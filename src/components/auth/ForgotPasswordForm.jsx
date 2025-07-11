// src/components/auth/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPasswordForm = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Check your email for a password reset link!');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Cochin, serif' }}>
          Reset Password
        </h1>
        <p className="text-[#3e2f1c]/70">Enter your email to receive a reset link</p>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
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
              className="w-full pl-10 pr-4 py-3 border border-[#3e2f1c]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e2f1c]/20 focus:border-[#3e2f1c]"
              placeholder="Enter your email"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#3e2f1c] text-white py-3 rounded-lg hover:bg-[#3e2f1c]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Mail className="w-5 h-5" />
              Send Reset Link
            </>
          )}
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-[#3e2f1c] hover:underline text-sm flex items-center gap-1 mx-auto"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;