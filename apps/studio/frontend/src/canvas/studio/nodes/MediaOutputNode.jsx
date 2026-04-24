import React, { useState, useContext } from 'react';
import { Handle, Position } from '@xyflow/react';
import { StudioContext } from '../StudioContext.jsx';

function MediaCard({ item, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const isVideo = item.type === 'video';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `cliender-${item.type}-${item.id}.${isVideo ? 'mp4' : 'png'}`;
    a.target = '_blank';
    a.click();
  };

  return (
    <>
      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          onClick={() => setFullscreen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'oklch(5% 0 0 / 0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          {isVideo
            ? <video src={item.url} controls autoPlay style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }} />
            : <img src={item.url} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          }
        </div>
      )}

      <div style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'oklch(12% 0 0)',
        boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.06)',
        cursor: 'pointer',
      }}>
        {/* Thumbnail */}
        <div
          onClick={() => setFullscreen(true)}
          style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', position: 'relative' }}
        >
          {isVideo
            ? <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
            : <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 300ms' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }} />
          }
          <div style={{ position: 'absolute', top: 5, left: 5, fontSize: 10, background: 'oklch(0% 0 0 / 0.6)', borderRadius: 4, padding: '2px 5px', color: 'oklch(75% 0 0)' }}>
            {isVideo ? '🎬' : '🖼'} {item.style_name || '—'}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1, fontSize: 9, color: 'oklch(40% 0 0)', fontFamily: 'IBM Plex Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.client_name || '—'}
          </div>
          <button onClick={handleDownload} title="Descargar" style={{ background: 'none', border: 'none', color: 'oklch(50% 0 0)', cursor: 'pointer', fontSize: 12, padding: 3, borderRadius: 4, transition: 'color 150ms' }} onMouseEnter={e => { e.currentTarget.style.color = 'oklch(75% 0 0)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'oklch(50% 0 0)'; }}>↓</button>
          {!confirmDelete
            ? <button onClick={() => setConfirmDelete(true)} title="Eliminar" style={{ background: 'none', border: 'none', color: 'oklch(45% 0 0)', cursor: 'pointer', fontSize: 11, padding: 3, borderRadius: 4, transition: 'color 150ms' }} onMouseEnter={e => { e.currentTarget.style.color = 'oklch(62% 0.22 25)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'oklch(45% 0 0)'; }}>✕</button>
            : <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <button onClick={() => onDelete(item.id)} style={{ fontSize: 9, color: 'oklch(62% 0.22 25)', background: 'none', border: 'none', cursor: 'pointer' }}>Sí</button>
                <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 9, color: 'oklch(45% 0 0)', background: 'none', border: 'none', cursor: 'pointer' }}>No</button>
              </div>
          }
        </div>
      </div>
    </>
  );
}

export function MediaOutputNode({ data }) {
  const { recentMedia, deleteMediaItem } = useContext(StudioContext);
  const items = recentMedia || [];

  return (
    <div style={{
      width: 320,
      background: 'oklch(15% 0.01 155 / 0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: 14,
      boxShadow: `inset 0 0 0 1px oklch(70% 0.18 155 / 0.2), 0 8px 28px -4px oklch(0% 0 0 / 0.32)`,
      overflow: 'hidden',
    }}>
      <Handle type="target" position={Position.Left} />

      {/* Header */}
      <div style={{ padding: '11px 14px 9px', borderBottom: '1px solid oklch(100% 0 0 / 0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, oklch(55% 0.18 155), oklch(42% 0.2 165))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🖼</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'oklch(92% 0 0)' }}>Output</div>
          <div style={{ fontSize: 10, color: 'oklch(45% 0 0)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 1 }}>
            {items.length > 0 ? `${items.length} generados` : 'En espera'}
          </div>
        </div>
        {items.length > 0 && (
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'oklch(70% 0.18 155)', boxShadow: '0 0 8px oklch(70% 0.18 155 / 0.6)' }} />
        )}
      </div>

      <div style={{ padding: 12 }}>
        {items.length === 0 ? (
          <div style={{ fontSize: 12, color: 'oklch(30% 0 0)', textAlign: 'center', padding: '20px 0', fontFamily: 'IBM Plex Mono, monospace' }}>— sin media —</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {items.map(item => (
              <MediaCard key={item.id} item={item} onDelete={deleteMediaItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
