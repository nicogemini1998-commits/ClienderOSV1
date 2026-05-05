import React, { useState, useEffect } from 'react';
import { useGallery } from '../../../hooks/useGallery.js';

function GalleryItem({ item, onDelete }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isVideo = item.type === 'video';

  const handleDownload = (e) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `cliender-${item.type}-${item.id}.${isVideo ? 'mp4' : 'png'}`;
    a.target = '_blank';
    a.click();
  };

  return (
    <>
      {fullscreen && (
        <div
          onClick={() => setFullscreen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'oklch(3% 0 0 / 0.97)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            gap: 16,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {isVideo
              ? <video src={item.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 24px 72px oklch(0% 0 0 / 0.5)' }} />
              : <img src={item.url} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 24px 72px oklch(0% 0 0 / 0.5)' }} />
            }
          </div>
          {item.prompt && (
            <div style={{ maxWidth: 700, fontSize: 12, color: 'oklch(65% 0 0)', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.6, padding: '0 32px', marginBottom: 12 }}>
              "{item.prompt.slice(0, 250)}{item.prompt.length > 250 ? '...' : ''}"
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setFullscreen(false); }}
            style={{ position: 'absolute', top: 20, right: 20, background: 'oklch(0% 0 0 / 0.5)', border: 'none', color: 'oklch(90% 0 0)', fontSize: 24, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, transition: 'all 200ms', backdropFilter: 'blur(8px)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'oklch(0% 0 0 / 0.7)'}
            onMouseLeave={e => e.currentTarget.style.background = 'oklch(0% 0 0 / 0.5)'}
          >✕</button>
        </div>
      )}
      <div style={{ borderRadius: 8, overflow: 'hidden', background: 'oklch(12% 0 0)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.06)', cursor: 'pointer' }}>
        <div onClick={() => setFullscreen(true)} style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
          {isVideo
            ? <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
            : <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 300ms' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }} />
          }
          <div style={{ position: 'absolute', top: 5, left: 5, fontSize: 9, background: 'oklch(0% 0 0 / 0.65)', borderRadius: 4, padding: '2px 5px', color: 'oklch(70% 0 0)', fontFamily: 'IBM Plex Mono, monospace' }}>
            {isVideo ? '🎬' : '🖼'} {item.style_name || '—'}
          </div>
          {item.client_name && (
            <div style={{ position: 'absolute', bottom: 5, left: 5, fontSize: 9, background: 'oklch(0% 0 0 / 0.65)', borderRadius: 4, padding: '2px 5px', color: 'oklch(65% 0.18 155)', fontFamily: 'IBM Plex Mono, monospace' }}>
              👤 {item.client_name}
            </div>
          )}
        </div>
        <div style={{ padding: '5px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ flex: 1, fontSize: 9, color: 'oklch(38% 0 0)', fontFamily: 'IBM Plex Mono, monospace' }}>
            {new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
          </span>
          <button onClick={handleDownload} title="Descargar" style={{ background: 'none', border: 'none', color: 'oklch(48% 0 0)', cursor: 'pointer', fontSize: 12, padding: 2, borderRadius: 3 }} onMouseEnter={e => { e.currentTarget.style.color = 'oklch(75% 0 0)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'oklch(48% 0 0)'; }}>↓</button>
          {!confirmDelete
            ? <button onClick={e => { e.stopPropagation(); setConfirmDelete(true); }} title="Eliminar" style={{ background: 'none', border: 'none', color: 'oklch(42% 0 0)', cursor: 'pointer', fontSize: 10, padding: 2, borderRadius: 3 }} onMouseEnter={e => { e.currentTarget.style.color = 'oklch(62% 0.22 25)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'oklch(42% 0 0)'; }}>✕</button>
            : <div style={{ display: 'flex', gap: 3 }}>
                <button onClick={e => { e.stopPropagation(); onDelete(item.id); }} style={{ fontSize: 9, color: 'oklch(62% 0.22 25)', background: 'none', border: 'none', cursor: 'pointer' }}>Sí</button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(false); }} style={{ fontSize: 9, color: 'oklch(45% 0 0)', background: 'none', border: 'none', cursor: 'pointer' }}>No</button>
              </div>
          }
        </div>
      </div>
    </>
  );
}

export function GalleryPanel({ open, onClose, selectedClient }) {
  const { items, total, loading, load, deleteItem } = useGallery();
  const [filter, setFilter] = useState('all'); // all | image | video

  useEffect(() => {
    if (open) load({ clientId: selectedClient?.id, type: filter === 'all' ? undefined : filter });
  }, [open, selectedClient?.id, filter]);

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />}
      <div style={{
        position: 'fixed', top: 52, right: 0, bottom: 0, width: 340,
        background: 'oklch(12% 0.01 250 / 0.97)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: 'inset 1px 0 0 oklch(100% 0 0 / 0.07)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid oklch(100% 0 0 / 0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'oklch(90% 0 0)' }}>Galería</div>
            <div style={{ fontSize: 10, color: 'oklch(40% 0 0)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 1 }}>
              {total} elementos{selectedClient ? ` · ${selectedClient.name}` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'oklch(45% 0 0)', fontSize: 16, cursor: 'pointer', padding: 4, borderRadius: 6 }}>✕</button>
        </div>

        {/* Filters */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid oklch(100% 0 0 / 0.06)', display: 'flex', gap: 5 }}>
          {['all', 'image', 'video'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ flex: 1, padding: '5px', borderRadius: 7, border: 'none', background: filter === f ? 'oklch(65% 0.2 265 / 0.15)' : 'oklch(100% 0 0 / 0.04)', boxShadow: filter === f ? 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.35)' : 'inset 0 0 0 1px oklch(100% 0 0 / 0.07)', color: filter === f ? 'oklch(78% 0.18 265)' : 'oklch(48% 0 0)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}>
              {f === 'all' ? 'Todo' : f === 'image' ? '🖼 Imágenes' : '🎬 Videos'}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
          {loading ? (
            <div style={{ fontSize: 12, color: 'oklch(40% 0 0)', textAlign: 'center', padding: 24 }}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ fontSize: 12, color: 'oklch(32% 0 0)', textAlign: 'center', padding: '32px 0', fontFamily: 'IBM Plex Mono, monospace' }}>— sin resultados —</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
              {filtered.map(item => <GalleryItem key={item.id} item={item} onDelete={deleteItem} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
