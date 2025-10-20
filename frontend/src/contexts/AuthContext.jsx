import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.js';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [error, setError]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [infoMessage, setInfoMessage] = useState(null);
  const navigate                  = useNavigate();

  const fetchUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const result = await authService.getCurrentUser();
      if (result.success) {
        setUser(result.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const result = await authService.login({ username, password });
      if (result.success) {
        localStorage.setItem('access_token', result.data.access);
        localStorage.setItem('refresh_token', result.data.refresh);
        await fetchUser();
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const signup = async (username, email, password1, password2) => {
    setError(null);
    setInfoMessage(null);
    try {
      const result = await authService.register({
        username,
        email,
        password1,
        password2
      });
      if (result.success) {
        setInfoMessage('Registration successful! Check your email to verify your account.');
        navigate('/login');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
  };

  const resendVerification = async (email) => {
    setError(null);
    setInfoMessage(null);
    try {
      const result = await authService.resendVerification(email);
      if (result.success) {
        setInfoMessage('Verification email resent. Check your inbox.');
      } else {
        setError(result.error || 'Could not resend verification');
      }
    } catch (err) {
      setError('Could not resend verification. Please try again.');
    }
  };

  const requestPasswordReset = async (email) => {
    setError(null);
    setInfoMessage(null);
    try {
      const result = await authService.resetPassword(email);
      if (result.success) {
        setInfoMessage('Password reset link sent. Check your email.');
      } else {
        setError(result.error || 'Could not send reset link');
      }
    } catch (err) {
      setError('Could not send reset link. Please try again.');
    }
  };

  const confirmPasswordReset = async (token, newPassword) => {
    setError(null);
    setInfoMessage(null);
    try {
      const result = await authService.confirmPasswordReset({ token, new_password: newPassword });
      if (result.success) {
        setInfoMessage('Password reset successful! You may now log in.');
        navigate('/login');
      } else {
        setError(result.error || 'Reset failed');
      }
    } catch (err) {
      setError('Reset failed. Please try again.');
    }
  };

  const loginWithGoogle = async (token) => {
    setError(null);
    try {
      const result = await authService.googleLogin(token);
      if (result.success) {
        localStorage.setItem('access_token', result.data.access);
        localStorage.setItem('refresh_token', result.data.refresh);
        await fetchUser();
        navigate('/dashboard');
      } else {
        setError(result.error || 'Google login failed');
      }
    } catch (err) {
      setError('Google login failed. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      infoMessage,
      login,
      signup,
      loginWithGoogle,
      resendVerification,
      requestPasswordReset,
      confirmPasswordReset,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
