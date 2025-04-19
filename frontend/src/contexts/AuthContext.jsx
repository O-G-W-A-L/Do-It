import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../axiosInstance';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No token found');
      
      const res = await api.get('/api/auth/user/');
      setUser(res.data);
    } catch (err) {
      setUser(null);
      setError('Failed to fetch user');
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
      setError('Invalid credentials');
    }
  };

  const signup = async (username, email, password1, password2) => {
    setError(null);
    try {
      await api.post('/api/auth/register/', { username, email, password1, password2 });
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      const field = Object.keys(data || {})[0];
      setError(data?.[field]?.[0] || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);