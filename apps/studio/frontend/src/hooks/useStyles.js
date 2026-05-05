import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';

export function useStyles() {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const load = useCallback(async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/styles', { headers });
      setStyles(await res.json());
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const createStyle = useCallback(async (data) => {
    const res = await fetch('/api/styles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(data),
    });
    const s = await res.json();
    setStyles(prev => [...prev, s]);
    return s;
  }, [token]);

  const deleteStyle = useCallback(async (id) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await fetch(`/api/styles/${id}`, { method: 'DELETE', headers });
    setStyles(prev => prev.filter(s => s.id !== id));
  }, [token]);

  return { styles, loading, createStyle, deleteStyle, reload: load };
}
