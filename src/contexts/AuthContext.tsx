import React, { useEffect, useMemo, useState } from 'react';
import { AuthContext, type User } from './auth-context';
import { api } from '../services/api';

const getStoredAuth = (): { user: User | null } => {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return { user: null };
  }

  try {
    return { user: JSON.parse(storedUser) as User };
  } catch {
    localStorage.removeItem('user');
    return { user: null };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialAuth = getStoredAuth();
  const [user, setUser] = useState<User | null>(initialAuth.user);
  const [token, setToken] = useState<string | null>(initialAuth.user ? 'cookie' : null);

  const login = (userData: User) => {
    setUser(userData);
    setToken('cookie');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    void api.post('/auth/logout').catch(() => undefined);

    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  useEffect(() => {
    if (!token || !user?.id) {
      return;
    }

    const sendHeartbeat = () => {
      void api.post('/auth/heartbeat').catch(() => undefined);
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, 30_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token, user?.id]);

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
