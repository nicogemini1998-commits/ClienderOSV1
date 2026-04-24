import { useState, useCallback } from 'react';

export function useGallery() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async ({ clientId, type, userId } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientId) params.set('clientId', clientId);
      if (type) params.set('type', type);
      if (userId) params.set('userId', userId);
      params.set('limit', '100');
      const res = await fetch(`/api/gallery?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally { setLoading(false); }
  }, []);

  const addItem = useCallback((item) => {
    setItems(prev => [item, ...prev]);
    setTotal(t => t + 1);
  }, []);

  const deleteItem = useCallback(async (id) => {
    await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
    setTotal(t => t - 1);
  }, []);

  return { items, total, loading, load, addItem, deleteItem };
}
