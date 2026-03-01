import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * Page for accepting admin/instructor invitations
 * Handles magic link auto-login
 */
export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const acceptInvitation = async () => {
      try {
        // Call the backend endpoint to accept invitation
        const response = await fetch(`/api/auth/admin/accept-invitation/${token}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Auto-login the user with the returned tokens
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh);

          setUserData(data.user);
          setMessage(data.detail || 'Invitation accepted successfully!');
          setStatus('success');

          // Redirect after a short delay
          setTimeout(() => {
            navigate(data.redirect || '/admin');
          }, 3000);
        } else {
          setMessage(data.detail || 'Failed to accept invitation');
          setStatus('error');
        }
      } catch (error) {
        console.error('Error accepting invitation:', error);
        setMessage('Network error. Please try again.');
        setStatus('error');
      }
    };

    if (token) {
      acceptInvitation();
    } else {
      setMessage('Invalid invitation link');
      setStatus('error');
    }
  }, [token, navigate]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accepting Invitation
            </h1>
            <p className="text-gray-600">
              Please wait while we set up your account...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Do-It!
            </h1>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            {userData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Account:</strong> {userData.username}<br/>
                  <strong>Role:</strong> {userData.profile?.role}<br/>
                  <strong>Email:</strong> {userData.email}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Redirecting you to the admin dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invitation Error
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="w-full">
                Go Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
