import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smart_library_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  async function fetchCurrentUser() {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Failed to load user profile, logging out:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(identifier, password) {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.success && res.token) {
      localStorage.setItem('smart_library_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  }

  async function register(userData) {
    const res = await api.post('/auth/register', userData);
    if (res.success && res.token) {
      localStorage.setItem('smart_library_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  }

  function logout() {
    localStorage.removeItem('smart_library_token');
    setToken(null);
    setUser(null);
  }

  async function switchDemoUser(role) {
    const accounts = {
      'STUDENT': { identifier: 'karthik.r@mit.edu', password: 'Password@123' },
      'LIBRARIAN': { identifier: 'librarian@mit.edu', password: 'Password@123' },
      'HOD': { identifier: 'hod.it@mit.edu', password: 'Password@123' },
      'ADMIN': { identifier: 'admin@mit.edu', password: 'Password@123' }
    };

    const creds = accounts[role];
    if (creds) {
      return await login(creds.identifier, creds.password);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      switchDemoUser,
      refreshUser: fetchCurrentUser
    }}>
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
