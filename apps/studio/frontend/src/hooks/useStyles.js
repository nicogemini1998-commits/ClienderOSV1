import { useState, useEffect, useCallback } from 'react';

export function useStyles() {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/styles');
      setStyles(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createStyle = useCallback(async (data) => {
    const res = await fetch('/api/styles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const s = await res.json();
    setStyles(prev => [...prev, s]);
    return s;
  }, []);

  const deleteStyle = useCallback(async (id) => {
    await fetch(`/api/styles/${id}`, { method: 'DELETE' });
    setStyles(prev => prev.filter(s => s.id !== id));
  }, []);

  return { styles, loading, createStyle, deleteStyle, reload: load };
}
