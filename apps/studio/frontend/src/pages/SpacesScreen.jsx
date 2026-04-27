import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { ClientPicker } from '../canvas/panels/ClientPicker.jsx';

const TOOL_LABELS = {
  design: { icon: '✦', title: 'Design', sub: 'Content Studio', color: 265 },
};

function SpaceCard({ space, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nodeCount = space.nodes?.length || 0;
  const edgeCount = space.edges?.length || 0;
  const updatedAt = space.updated_at ? new Date(space.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  const previewNodes = (space.nodes || []).slice(0, 6);
  const typeColors = { image: 265, video: 155, prompt: 50, mediaOutput: 310 };

  return (
    <div
      onClick={() => !confirmDelete && onClick(space)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
      style={{
        borderRadius: 14,
        background: hovered ? 'oklch(18% 0.015 265 / 0.95)' : 'oklch(15% 0.012 265 / 0.85)',
        boxShadow: hovered
          ? 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.35), 0 8px 32px -4px oklch(0% 0 0 / 0.4)'
          : 'inset 0 0 0 1px oklch(100% 0 0 / 0.07), 0 2px 12px -2px oklch(0% 0 0 / 0.25)',
        cursor: 'pointer',
        transition: 'all 220ms cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Preview area */}
      <div style={{
        height: 130,
        background: 'oklch(10% 0.01 265)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {previewNodes.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, padding: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {previewNodes.map((n, i) => {
              const c = typeColors[n.type] || 265;
              return (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `oklch(55% 0.2 ${c} / 0.2)`,
                  boxShadow: `inset 0 0 0 1px oklch(65% 0.2 ${c} / 0.4)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15,
                  animation: `fadeIn 300ms ease ${i * 60}ms both`,
                }}>
                  {n.type === 'image' ? '🖼' : n.type === 'video' ? '🎬' : n.type === 'prompt' ? '✦' : '◎'}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 28, opacity: 0.15 }}>✦</div>
        )}
        {/* Delete button */}
        <button
          onClick={e => {
            e.stopPropagation();
            if (confirmDelete) { onDelete(space); }
            else setConfirmDelete(true);
          }}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 26, height: 26, borderRadius: 6,
            background: confirmDelete ? 'oklch(62% 0.22 25 / 0.85)' : 'oklch(62% 0.22 25 / 0.15)',
            border: 'none', color: confirmDelete ? 'oklch(98% 0 0)' : 'oklch(65% 0.2 25)',
            cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
            transition: 'all 150ms',
            opacity: hovered ? 1 : 0,
          }}
        >{confirmDelete ? '¿Sí?' : '✕'}</button>
      </div>

      {/* Meta */}
      <div style={{ padding: '10px 14px 12px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'oklch(90% 0 0)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {space.name}
        </div>
        {space.description && (
          <div style={{ fontSize: 10, color: 'oklch(42% 0 0)', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {space.description}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: 'oklch(35% 0 0)', fontFamily: 'IBM Plex Mono, monospace' }}>
            {nodeCount} nodo{nodeCount !== 1 ? 's' : ''} · {edgeCount} conex.
          </span>
          {updatedAt && (
            <>
              <span style={{ fontSize: 9, color: 'oklch(28% 0 0)' }}>·</span>
              <span style={{ fontSize: 9, color: 'oklch(35% 0 0)', fontFamily: 'IBM Plex Mono, monospace' }}>{updatedAt}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AnimatedNodePreview() {
  return (
    <div style={{ position: 'relative', width: 460, height: 280 }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <circle cx="3" cy="3" r="2" fill="oklch(65% 0.2 265 / 0.5)" />
          </marker>
        </defs>
        <path d="M 95 80 C 145 80 165 140 215 140" stroke="oklch(65% 0.2 265 / 0.3)" strokeWidth="1.5" fill="none" strokeDasharray="5 4" style={{ animation: 'flow-dash 1.5s linear infinite' }} />
        <path d="M 95 80 C 145 80 165 200 215 200" stroke="oklch(65% 0.2 155 / 0.3)" strokeWidth="1.5" fill="none" strokeDasharray="5 4" style={{ animation: 'flow-dash 1.5s linear infinite 0.5s' }} />
        <path d="M 315 140 C 355 140 375 170 415 170" stroke="oklch(65% 0.2 265 / 0.25)" strokeWidth="1.5" fill="none" strokeDasharray="5 4" style={{ animation: 'flow-dash 1.5s linear infinite 1s' }} />
        <path d="M 315 200 C 355 200 375 170 415 170" stroke="oklch(65% 0.2 155 / 0.25)" strokeWidth="1.5" fill="none" strokeDasharray="5 4" style={{ animation: 'flow-dash 1.5s linear infinite 0.75s' }} />
      </svg>

      {/* Prompt node */}
      <div style={{ position: 'absolute', left: 10, top: 50, width: 88, borderRadius: 10, background: 'oklch(18% 0.015 265 / 0.9)', boxShadow: 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.3), 0 4px 16px -2px oklch(0% 0 0 / 0.4)', padding: '8px 10px', animation: 'nodeFloat 6s ease-in-out infinite' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: 'linear-gradient(135deg, oklch(55% 0.22 265), oklch(42% 0.24 280))', fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✦</div>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'oklch(88% 0 0)' }}>Prompt</span>
        </div>
        <div style={{ fontSize: 7, color: 'oklch(45% 0 0)', lineHeight: 1.4 }}>Producto de lujo<br />para marca de relojes</div>
      </div>

      {/* Image node */}
      <div style={{ position: 'absolute', left: 200, top: 100, width: 110, borderRadius: 10, background: 'oklch(16% 0.015 265 / 0.9)', boxShadow: 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.25), 0 4px 16px -2px oklch(0% 0 0 / 0.4)', overflow: 'hidden', animation: 'nodeFloat 6s ease-in-out infinite 1s' }}>
        <div style={{ padding: '6px 8px 5px', borderBottom: '1px solid oklch(100% 0 0 / 0.06)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9 }}>🖼</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'oklch(88% 0 0)' }}>Imagen</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, padding: 6 }}>
          {[265, 280, 295, 265].map((c, i) => (
            <div key={i} style={{ aspectRatio: '1', borderRadius: 5, background: `oklch(${35 + i * 5}% 0.15 ${c} / 0.5)` }} />
          ))}
        </div>
      </div>

      {/* Video node */}
      <div style={{ position: 'absolute', left: 200, top: 175, width: 110, borderRadius: 10, background: 'oklch(16% 0.015 155 / 0.9)', boxShadow: 'inset 0 0 0 1px oklch(55% 0.18 155 / 0.3), 0 4px 16px -2px oklch(0% 0 0 / 0.4)', padding: '6px 8px', animation: 'nodeFloat 6s ease-in-out infinite 2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
          <span style={{ fontSize: 9 }}>🎬</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'oklch(88% 0 0)' }}>Video</span>
          <span style={{ marginLeft: 'auto', fontSize: 7, color: 'oklch(55% 0.18 155)', background: 'oklch(55% 0.18 155 / 0.15)', padding: '1px 4px', borderRadius: 3 }}>2.0</span>
        </div>
        <div style={{ height: 28, borderRadius: 5, background: 'oklch(55% 0.18 155 / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10 }}>▶</span>
        </div>
      </div>

      {/* Output node */}
      <div style={{ position: 'absolute', left: 355, top: 130, width: 90, borderRadius: 10, background: 'oklch(16% 0.012 50 / 0.9)', boxShadow: 'inset 0 0 0 1px oklch(65% 0.2 50 / 0.25), 0 4px 16px -2px oklch(0% 0 0 / 0.4)', padding: '6px 8px', animation: 'nodeFloat 6s ease-in-out infinite 1.5s' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: 'oklch(88% 0 0)', marginBottom: 4 }}>◎ Output</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {[265, 155].map((c, i) => (
            <div key={i} style={{ flex: 1, height: 20, borderRadius: 4, background: `oklch(55% 0.18 ${c} / 0.25)` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SpacesScreen({ onOpenCanvas, onOpenSpace, selectedClient, onSelectClient }) {
  const { user, token, logout } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSpaces = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/content-templates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSpaces(data);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSpaces(); }, [fetchSpaces]);

  const handleCreateSpace = async () => {
    const name = newName.trim() || `Espacio ${spaces.length + 1}`;
    try {
      const res = await fetch('/api/content-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, nodes: [], edges: [] }),
      });
      if (res.ok) {
        const space = await res.json();
        onOpenSpace(space.id, name);
      }
    } catch {}
    setCreating(false);
    setNewName('');
  };

  const handleDeleteSpace = async (space) => {
    try {
      await fetch(`/api/content-templates/${space.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSpaces(s => s.filter(x => x.id !== space.id));
    } catch {}
  };

  const filtered = spaces.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'oklch(10% 0.01 265)',
      display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, "Helvetica Neue", Inter, sans-serif',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{
        height: 52, display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 10, flexShrink: 0,
        borderBottom: '1px solid oklch(100% 0 0 / 0.06)',
        background: 'oklch(11% 0.012 265 / 0.9)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.jpg" alt="Cliender" style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover' }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'oklch(90% 0 0)', letterSpacing: '-0.02em' }}>CLIENDER</span>
            <span style={{ fontSize: 11, color: 'oklch(38% 0 0)', marginLeft: 5 }}>Design</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar espacios..."
            style={{
              width: 200, padding: '6px 10px 6px 30px',
              background: 'oklch(100% 0 0 / 0.05)',
              border: 'none', borderRadius: 8,
              boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)',
              color: 'oklch(80% 0 0)', fontSize: 12,
              fontFamily: 'inherit', outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'oklch(40% 0 0)' }}>⌕</span>
        </div>

        {/* Client picker */}
        <ClientPicker selectedClient={selectedClient} onSelect={onSelectClient} />

        {/* User avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, oklch(55% 0.22 265), oklch(42% 0.24 280))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', cursor: 'pointer', userSelect: 'none' }} title={user?.name || 'Usuario'}>
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'oklch(40% 0 0)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 6, transition: 'color 150ms' }} onMouseEnter={e => e.currentTarget.style.color = 'oklch(65% 0 0)'} onMouseLeave={e => e.currentTarget.style.color = 'oklch(40% 0 0)'}>
            Salir
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{
        background: `radial-gradient(ellipse at 70% 50%, oklch(22% 0.05 265 / 0.5) 0%, transparent 65%), oklch(10% 0.01 265)`,
        padding: '48px 56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid oklch(100% 0 0 / 0.06)',
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 56, fontWeight: 900, color: 'oklch(92% 0 0)', margin: 0, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
            Espacios
          </h1>
          <p style={{ fontSize: 14, color: 'oklch(42% 0 0)', margin: '10px 0 24px', maxWidth: 360, lineHeight: 1.6 }}>
            Empieza desde cero o abre un espacio existente. Conecta nodos, genera imágenes y videos con IA.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {creating ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateSpace(); if (e.key === 'Escape') setCreating(false); }}
                  placeholder="Nombre del espacio..."
                  style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: 'oklch(100% 0 0 / 0.08)', boxShadow: 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.4)', color: 'oklch(90% 0 0)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 220 }}
                />
                <button onClick={handleCreateSpace} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))', color: 'oklch(97% 0 0)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Crear
                </button>
                <button onClick={() => setCreating(false)} style={{ padding: '9px 12px', borderRadius: 10, border: 'none', background: 'oklch(100% 0 0 / 0.06)', color: 'oklch(50% 0 0)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'oklch(100% 0 0 / 0.07)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.12)', color: 'oklch(85% 0 0)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.11)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.07)'; }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nuevo espacio
              </button>
            )}
            <button
              onClick={onOpenCanvas}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))', color: 'oklch(97% 0 0)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px oklch(55% 0.2 265 / 0.3)', transition: 'all 150ms' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px oklch(55% 0.2 265 / 0.45)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px oklch(55% 0.2 265 / 0.3)'}
            >
              Canvas libre →
            </button>
          </div>
        </div>
        <div style={{ flexShrink: 0, opacity: 0.85 }}>
          <AnimatedNodePreview />
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, padding: '0 56px', borderBottom: '1px solid oklch(100% 0 0 / 0.06)', flexShrink: 0 }}>
          {[['my', 'Mis espacios'], ['templates', 'Plantillas']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '12px 16px',
                background: 'none', border: 'none',
                borderBottom: activeTab === key ? '2px solid oklch(65% 0.2 265)' : '2px solid transparent',
                color: activeTab === key ? 'oklch(78% 0.18 265)' : 'oklch(42% 0 0)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'color 150ms',
                marginBottom: -1,
              }}
            >{label}</button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 56px 48px', position: 'relative' }}>
          {loading ? (
            <div style={{ color: 'oklch(35% 0 0)', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>Cargando espacios...</div>
          ) : activeTab === 'templates' ? (
            <div>
              <div style={{ fontSize: 13, color: 'oklch(40% 0 0)', marginBottom: 24 }}>
                Plantillas predefinidas disponibles próximamente.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                {[
                  { name: 'Campaña de producto', desc: 'Prompt → Imagen × 4 → Output', icon: '📦' },
                  { name: 'Contenido social media', desc: 'Brief → Variantes imagen/video', icon: '📱' },
                  { name: 'Video de marca', desc: 'Prompts → Video Seedance 2.0', icon: '🎬' },
                ].map((tpl, i) => (
                  <div key={i} style={{ borderRadius: 14, background: 'oklch(15% 0.012 265 / 0.6)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.06)', padding: '18px 16px', opacity: 0.6 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{tpl.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'oklch(80% 0 0)', marginBottom: 4 }}>{tpl.name}</div>
                    <div style={{ fontSize: 11, color: 'oklch(40% 0 0)' }}>{tpl.desc}</div>
                    <div style={{ marginTop: 12, fontSize: 10, color: 'oklch(35% 0 0)', fontFamily: 'IBM Plex Mono, monospace' }}>Próximamente</div>
                  </div>
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
              <div style={{ fontSize: 36, opacity: 0.15 }}>✦</div>
              <div style={{ fontSize: 13, color: 'oklch(35% 0 0)' }}>
                {searchQuery ? 'Sin resultados.' : 'No hay espacios aún. Crea uno nuevo.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
              {filtered.map(space => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  onClick={!selectedClient ? null : s => onOpenSpace(s.id, s.name)}
                  onDelete={handleDeleteSpace}
                />
              ))}
            </div>
          )}

          {/* No client selected overlay */}
          {!selectedClient && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'oklch(10% 0.01 265 / 0.4)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              pointerEvents: 'none',
            }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: 32, opacity: 0.4 }}>👤</div>
                <div style={{ fontSize: 13, color: 'oklch(42% 0 0)', fontWeight: 500 }}>
                  Selecciona un cliente primero
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes nodeFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes flow-dash {
          to { stroke-dashoffset: -18; }
        }
      `}</style>
    </div>
  );
}
