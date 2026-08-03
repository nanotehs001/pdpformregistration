import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const STORAGE_KEY = 'pdp_admin_token';

export function getStoredToken() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Authorization header for admin API calls, or {} when signed out. */
export function authHeader() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAdminAuth() {
  const [authRequired, setAuthRequired] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loginError, setLoginError] = useState('');

  const checkSession = useCallback(async () => {
    setChecking(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/admin-session`, {
        headers: authHeader()
      });
      setAuthRequired(data.authRequired);
      setAuthenticated(data.authenticated);
    } catch {
      setAuthenticated(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (password) => {
    setLoginError('');
    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/admin-login`, { password });
      sessionStorage.setItem(STORAGE_KEY, data.token);
      setAuthenticated(true);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Could not sign in.';
      setLoginError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthenticated(false);
  };

  return { authRequired, authenticated, checking, loginError, login, logout };
}
