import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth.jsx';

export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const load = useCallback(async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/templates', { headers });
      setTemplates(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const saveTemplate = useCallback(async (data) => {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(data),
    });
    const t = await res.json();
    setTemplates(prev => [...prev, t]);
    return t;
  }, [token]);

  const updateTemplate = useCallback(async (id, data) => {
    const res = await fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setTemplates(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }, [token]);

  const deleteTemplate = useCallback(async (id) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await fetch(`/api/templates/${id}`, { method: 'DELETE', headers });
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, [token]);

  return { templates, loading, saveTemplate, updateTemplate, deleteTemplate, reload: load };
}
