import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../axiosInstance';
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
      const res = await api.get('/api/auth/user/');
      setUser(res.data);
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
      const { data } = await api.post('/api/auth/login/', { username, password });
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      await fetchUser();
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials or unverified email');
    }
  };

  const signup = async (username, email, password1, password2) => {
    setError(null);
    setInfoMessage(null);
    try {
      await api.post('/auth/registration/', { username, email, password1, password2 });
      setInfoMessage('Registration successful! Check your email to verify your account.');
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      const field = Object.keys(data || {})[0];
      setError(data?.[field]?.[0] || 'Registration failed');
    }
  };

  const resendVerification = async (email) => {
    setError(null);
    setInfoMessage(null);
    try {
      await api.post('/auth/resend-verification/', { email });
      setInfoMessage('Verification email resent. Check your inbox.');
    } catch (err) {
      setError(err.response?.data?.email?.[0] || 'Could not resend verification');
    }
  };

  const requestPasswordReset = async (email) => {
    setError(null);
    setInfoMessage(null);
    try {
      await api.post('/auth/password-reset/', { email });
      setInfoMessage('Password reset link sent. Check your email.');
    } catch (err) {
      setError(err.response?.data?.email?.[0] || 'Could not send reset link');
    }
  };

  const confirmPasswordReset = async (token, newPassword) => {
    setError(null);
    setInfoMessage(null);
    try {
      await api.post('/auth/password-reset-confirm/', { token, new_password: newPassword });
      setInfoMessage('Password reset successful! You may now log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.token?.[0] || 'Reset failed');
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
