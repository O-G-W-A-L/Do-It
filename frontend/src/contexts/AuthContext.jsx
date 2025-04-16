import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../axiosInstance';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On mount: if we have a token, fetch the user
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/api/auth/user/')
        .then(res => setUser(res.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login: store tokens and fetch profile
  const login = async (username, password) => {
    setError(null);
    try {
      const { data } = await api.post('/api/auth/login/', { username, password });
      const { access, refresh } = data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      const me = await api.get('/api/auth/user/');
      setUser(me.data);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials');
    }
  };

  // Signup: register, then send to login page
  const signup = async (username, email, password1, password2) => {
    setError(null);
    try {
      await api.post('/api/auth/register/', { username, email, password1, password2 });
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const [field] = Object.keys(data);
        setError(data[field][0]);
      } else {
        setError('Registration failed');
      }
    }
  };

  // Logout: drop tokens & user
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
