import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export const DEFAULT_USER = {
  name: 'Lead HSE Officer',
  email: 'hse.officer@safety.org',
  role: 'HSE_OFFICER',
  site: 'Enterprise Command Center',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sih_user');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });
  const [loading, setLoading] = useState(false);

  // Auto-authenticate with seeded HSE officer credentials if no token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('sih_auth_token');
      if (!token) {
        try {
          // Attempt silent auto-login for development and demonstration
          const data = await authService.login({
            email: 'hse.officer@safety.org',
            password: 'OfficerPassword123!',
          });
          if (data?.user) {
            setUser(data.user);
          }
        } catch {
          // Fallback to local default profile
          setUser(DEFAULT_USER);
        }
      } else {
        try {
          const profile = await authService.getMe();
          if (profile) setUser(profile);
        } catch {
          // Token might be expired, clear and reset
          localStorage.removeItem('sih_auth_token');
        }
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(DEFAULT_USER);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
