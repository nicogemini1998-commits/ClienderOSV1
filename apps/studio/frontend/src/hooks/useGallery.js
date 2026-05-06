import { useState, useCallback } from 'react';

export function useGallery(token) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const load = useCallback(async ({ clientId, type } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientId) params.set('clientId', clientId);
      if (type) params.set('type', type);
      params.set('limit', '100');
      const res = await fetch(`/api/gallery?${params}`, { headers });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally { setLoading(false); }
  }, [token]);

  const addItem = useCallback((item) => {
    setItems(prev => [item, ...prev]);
    setTotal(t => t + 1);
  }, []);

  const deleteItem = useCallback(async (id) => {
    await fetch(`/api/gallery/${id}`, { method: 'DELETE', headers });
    setItems(prev => prev.filter(i => i.id !== id));
    setTotal(t => t - 1);
  }, [token]);

  return { items, total, loading, load, addItem, deleteItem };
}
