import { useState, useEffect } from 'react';
import axios from 'axios';
import { authHeader } from './useAdminAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Reads the server's configuration. It is read-only: everything is set through
 * environment variables, so there is no update path from the browser.
 */
export function useAdminConfig() {
  const [config, setConfig] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/config`, {
        headers: authHeader()
      });
      setConfig(response.data.config);
      setProblems(response.data.problems || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load configuration');
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Sends the admin to Google's consent screen. The callback renders its own
  // result page, so there is nothing to handle back here.
  const connectGoogle = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/google`, {
        headers: authHeader()
      });
      window.location.href = data.authUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start the Google connection.');
    }
  };

  return { config, problems, loading, error, connectGoogle, refetch: fetchConfig };
}
