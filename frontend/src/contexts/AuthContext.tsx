import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { authService } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types/api/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  infoMessage: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password1: string, password2: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Generate unique tab ID for session isolation
  const tabId = useMemo(() => {
    let id = sessionStorage.getItem('tabId');
    if (!id) {
      id = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('tabId', id);
    }
    return id;
  }, []);

  // Tab-specific localStorage helpers
  const getTabStorage = (key: string): string | null => localStorage.getItem(`${key}_${tabId}`);
  const setTabStorage = (key: string, value: string): void => localStorage.setItem(`${key}_${tabId}`, value);
  const removeTabStorage = (key: string): void => localStorage.removeItem(`${key}_${tabId}`);

  const fetchUser = async (): Promise<void> => {
    const token = getTabStorage('access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.data) {
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

  // Role-based redirect after login (only on auth state changes, not navigation)
  useEffect(() => {
    if (user && !loading) {
      const userRole = user.profile?.role;
      const currentPath = window.location.pathname;

      // Only redirect if we're on login/register pages, root, or accept-invitation
      const authPages = ['/', '/login', '/register', '/accept-invitation'];
      const shouldRedirect = authPages.some(page =>
        currentPath === page || currentPath.startsWith('/accept-invitation/')
      );

      if (shouldRedirect) {
        // ALX-style: admin and mentor go to /admin, students go to /dashboard
      const redirectPath = (userRole === 'admin' || userRole === 'mentor')
          ? '/admin'
          : '/dashboard';
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const login = async (username: string, password: string): Promise<void> => {
    setError(null);
    try {
      const result = await authService.login({ username, password });
      if (result.success && result.data) {
        setTabStorage('access_token', result.data.access);
        setTabStorage('refresh_token', result.data.refresh);
        await fetchUser();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('Login failed. Please try again.');
    }
  };

  const signup = async (username: string, email: string, password1: string, password2: string): Promise<void> => {
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
    } catch {
      setError('Registration failed. Please try again.');
    }
  };

  const resendVerification = async (email: string): Promise<void> => {
    setError(null);
    setInfoMessage(null);
    try {
      const result = await authService.resendVerification(email);
      if (result.success) {
        setInfoMessage('Verification email resent. Check your inbox.');
      } else {
        setError(result.error || 'Could not resend verification');
      }
    } catch {
      setError('Could not resend verification. Please try again.');
    }
  };

  const requestPasswordReset = async (email: string): Promise<void> => {
    setError(null);
    setInfoMessage(null);
    try {
      const result = await authService.resetPassword(email);
      if (result.success) {
        setInfoMessage('Password reset link sent. Check your email.');
      } else {
        setError(result.error || 'Could not send reset link');
      }
    } catch {
      setError('Could not send reset link. Please try again.');
    }
  };

  const confirmPasswordReset = async (token: string, newPassword: string): Promise<void> => {
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
    } catch {
      setError('Reset failed. Please try again.');
    }
  };

  const loginWithGoogle = async (token: string): Promise<void> => {
    setError(null);
    try {
      const result = await authService.googleLogin(token);
      if (result.success && result.data) {
        setTabStorage('access_token', result.data.access);
        setTabStorage('refresh_token', result.data.refresh);
        await fetchUser();
      } else {
        setError(result.error || 'Google login failed');
      }
    } catch {
      setError('Google login failed. Please try again.');
    }
  };

  const logout = (): void => {
    removeTabStorage('access_token');
    removeTabStorage('refresh_token');
    setUser(null);
    // Clear any cached enrollment/course data
    if (window.courseContextClearData) {
      window.courseContextClearData();
    }
    navigate('/');
  };

  const value = useMemo<AuthContextType>(() => ({
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
  }), [user, loading, error, infoMessage, navigate]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
