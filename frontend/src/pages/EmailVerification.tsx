import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

export default function EmailVerification() {
  const { key } = useParams();
  const [status, setStatus] = useState('Verifying...');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await api.post('/api/auth/verify-email/', { key });
        setStatus('Email verified successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('Verification failed. This link may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [key, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-2xl font-semibold mb-4">{status}</h2>
    </div>
  );
}
