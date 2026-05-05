import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useClients } from '../hooks/useClients.js';

// ── Helpers ──────────────────────────────────────────────────────

function Avatar({ name, size = 32 }) {
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 3,
      background: 'linear-gradient(135deg, oklch(50% 0.2 265), oklch(42% 0.22 280))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: 'oklch(95% 0 0)',
      flexShrink: 0, letterSpacing: '-0.02em',
    }}>{initials}</div>
  );
}

const inputSt = {
  width: '100%', padding: '7px 10px',
  background: 'oklch(100% 0 0 / 0.05)',
  border: 'none', borderRadius: 7,
  boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)',
  color: 'oklch(90% 0 0)', fontSize: 12, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
};

const textareaSt = {
  ...inputSt,
  resize: 'vertical',
  minHeight: 70,
  lineHeight: 1.5,
};

// ── Client Form Modal ─────────────────────────────────────────────

function ClientFormModal({ initial, onSave, onClose }) {
  const blank = {
    name: '', company: '', sector: '', email: '', phone: '', website: '',
    brand_description: '', tone: '', brand_colors: '', target_audience: '', notes: '',
  };
  const [form, setForm] = useState(initial ? { ...blank, ...initial } : blank);
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const Field = ({ k, label, placeholder, area = false }) => (
    <div>
      <div style={{ fontSize: 9, color: 'oklch(45% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
        {label}
      </div>
      {area
        ? <textarea style={textareaSt} placeholder={placeholder} value={form[k]} onChange={set(k)} />
        : <input style={inputSt} placeholder={placeholder} value={form[k]} onChange={set(k)} />
      }
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'oklch(0% 0 0 / 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 520, maxHeight: '88vh', overflowY: 'auto',
        background: 'oklch(13% 0.012 265)',
        borderRadius: 16,
        boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1), 0 24px 80px -8px oklch(0% 0 0 / 0.7)',
        padding: '24px 28px',
        fontFamily: '-apple-system, "Helvetica Neue", Inter, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'oklch(90% 0 0)', letterSpacing: '-0.02em' }}>
              {initial ? 'Editar cliente' : 'Nuevo cliente'}
            </div>
            <div style={{ fontSize: 11, color: 'oklch(40% 0 0)', marginTop: 2 }}>
              Ficha de marca para generación de contenido
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'oklch(40% 0 0)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Section: Identificación */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'oklch(55% 0.18 265)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Identificación
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field k="name" label="Nombre del cliente *" placeholder="Nombre completo" />
            </div>
            <Field k="company" label="Empresa" placeholder="Nombre de la empresa" />
            <Field k="sector" label="Sector / Industria" placeholder="Moda, Tech, Salud..." />
            <Field k="email" label="Email" placeholder="contacto@empresa.com" />
            <Field k="phone" label="Teléfono" placeholder="+34 600 000 000" />
            <div style={{ gridColumn: '1 / -1' }}>
              <Field k="website" label="Website" placeholder="https://empresa.com" />
            </div>
          </div>
        </div>

        {/* Section: Contexto de marca */}
        <div style={{ marginTop: 18, marginBottom: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'oklch(55% 0.18 265)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Contexto de marca para IA
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field k="brand_description" label="Descripción de la marca" placeholder="Qué hace la empresa, propuesta de valor, personalidad..." area />
            <Field k="tone" label="Tono de voz" placeholder="Profesional y cercano, aspiracional, minimalista..." />
            <Field k="brand_colors" label="Colores de marca" placeholder="#1A1A2E, #FF6B35, blanco, negro..." />
            <Field k="target_audience" label="Audiencia objetivo" placeholder="Mujeres 25-40, directivos tech, familias urbanas..." area />
            <Field k="notes" label="Instrucciones adicionales / Notas" placeholder="Evitar competidores, siempre incluir producto, etc." area />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: 'oklch(100% 0 0 / 0.06)', color: 'oklch(55% 0 0)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >Cancelar</button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
            style={{
              padding: '9px 22px', borderRadius: 9, border: 'none',
              background: form.name.trim() ? 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))' : 'oklch(30% 0 0)',
              color: 'oklch(97% 0 0)', fontSize: 12, fontWeight: 700,
              cursor: form.name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}
          >{saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear cliente'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Client Card ───────────────────────────────────────────────────

function ClientCard({ client, selected, onClick, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div
      onClick={() => !confirmDel && onClick(client)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDel(false); }}
      style={{
        borderRadius: 14,
        background: selected
          ? 'oklch(18% 0.02 265 / 0.95)'
          : hovered ? 'oklch(17% 0.015 265 / 0.9)' : 'oklch(14% 0.012 265 / 0.85)',
        boxShadow: selected
          ? 'inset 0 0 0 1.5px oklch(65% 0.2 265 / 0.5), 0 8px 24px -4px oklch(0% 0 0 / 0.4)'
          : hovered
            ? 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.2), 0 6px 20px -4px oklch(0% 0 0 / 0.35)'
            : 'inset 0 0 0 1px oklch(100% 0 0 / 0.07), 0 2px 10px -2px oklch(0% 0 0 / 0.25)',
        cursor: 'pointer',
        transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
        position: 'relative',
        overflow: 'hidden',
        padding: '14px 16px 12px',
      }}
    >
      {/* Selected indicator */}
      {selected && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, oklch(65% 0.2 265), oklch(55% 0.22 280))',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Avatar name={client.company || client.name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'oklch(90% 0 0)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {client.company || client.name}
          </div>
          {client.company && (
            <div style={{ fontSize: 11, color: 'oklch(55% 0 0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {client.name}
            </div>
          )}
          {client.sector && (
            <div style={{
              display: 'inline-block', marginTop: 5,
              fontSize: 9, color: 'oklch(65% 0.18 265)',
              background: 'oklch(65% 0.18 265 / 0.12)',
              padding: '2px 7px', borderRadius: 4,
              fontFamily: 'IBM Plex Mono, monospace',
            }}>{client.sector}</div>
          )}
        </div>
      </div>

      {/* Brand context preview */}
      {client.brand_description && (
        <div style={{
          marginTop: 10, fontSize: 10, color: 'oklch(42% 0 0)', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {client.brand_description}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        {client.tone && (
          <span style={{ fontSize: 9, color: 'oklch(38% 0 0)', fontFamily: 'IBM Plex Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
            {client.tone}
          </span>
        )}
        <div style={{ flex: 1 }} />

        {/* Edit */}
        <button
          onClick={e => { e.stopPropagation(); onEdit(client); }}
          style={{
            opacity: hovered ? 1 : 0, transition: 'opacity 150ms',
            background: 'oklch(100% 0 0 / 0.06)', border: 'none', borderRadius: 5,
            padding: '3px 7px', fontSize: 10, color: 'oklch(60% 0 0)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Editar</button>

        {/* Delete */}
        <button
          onClick={e => {
            e.stopPropagation();
            if (confirmDel) onDelete(client.id);
            else setConfirmDel(true);
          }}
          style={{
            opacity: hovered ? 1 : 0, transition: 'opacity 150ms',
            background: confirmDel ? 'oklch(62% 0.22 25 / 0.85)' : 'oklch(62% 0.22 25 / 0.12)',
            border: 'none', borderRadius: 5, padding: '3px 7px',
            fontSize: 10, color: confirmDel ? 'oklch(98% 0 0)' : 'oklch(65% 0.2 25)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >{confirmDel ? '¿Sí?' : '✕'}</button>
      </div>
    </div>
  );
}

// ── Space Card ────────────────────────────────────────────────────

function SpaceCard({ space, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nodeCount = space.nodes?.length || 0;
  const edgeCount = space.edges?.length || 0;
  const updatedAt = space.updated_at
    ? new Date(space.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
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
      <div style={{
        height: 110,
        background: 'oklch(10% 0.01 265)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {previewNodes.length > 0 ? (
          <div style={{ display: 'flex', gap: 6, padding: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {previewNodes.map((n, i) => {
              const c = typeColors[n.type] || 265;
              return (
                <div key={i} style={{
                  width: 30, height: 30, borderRadius: 7,
                  background: `oklch(55% 0.2 ${c} / 0.2)`,
                  boxShadow: `inset 0 0 0 1px oklch(65% 0.2 ${c} / 0.4)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                }}>
                  {n.type === 'image' ? '🖼' : n.type === 'video' ? '🎬' : n.type === 'prompt' ? '✦' : '◎'}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 24, opacity: 0.12 }}>✦</div>
        )}
        <button
          onClick={e => { e.stopPropagation(); if (confirmDelete) onDelete(space); else setConfirmDelete(true); }}
          style={{
            position: 'absolute', top: 6, right: 6,
            width: 24, height: 24, borderRadius: 5,
            background: confirmDelete ? 'oklch(62% 0.22 25 / 0.85)' : 'oklch(62% 0.22 25 / 0.15)',
            border: 'none', color: confirmDelete ? 'oklch(98% 0 0)' : 'oklch(65% 0.2 25)',
            cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'inherit',
            transition: 'all 150ms', opacity: hovered ? 1 : 0,
          }}
        >{confirmDelete ? '¿Sí?' : '✕'}</button>
      </div>

      <div style={{ padding: '9px 13px 11px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'oklch(90% 0 0)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {space.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
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

// ── Animated Node Preview ────────────────────────────────────────

function AnimatedNodePreview() {
  return (
    <div style={{ position: 'relative', width: 460, height: 280, flexShrink: 0 }}>
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

// ── Main SpacesScreen ─────────────────────────────────────────────

export function SpacesScreen({ onOpenCanvas, onOpenSpace, selectedClient, onSelectClient }) {
  const { user, token, logout } = useAuth();
  const { clients, loading: clientsLoading, createClient, updateClient, deleteClient } = useClients();

  const [spaces, setSpaces] = useState([]);
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('spaces');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // Client form modal state
  const [clientModal, setClientModal] = useState(null); // null | 'new' | client object

  const fetchSpaces = useCallback(async () => {
    if (!token) return;
    setSpacesLoading(true);
    try {
      const url = selectedClient
        ? `/api/content-templates?client_id=${selectedClient.id}`
        : '/api/content-templates';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSpaces(await res.json());
    } finally {
      setSpacesLoading(false);
    }
  }, [token, selectedClient]);

  useEffect(() => { fetchSpaces(); }, [fetchSpaces]);

  const handleCreateSpace = async () => {
    const name = newName.trim() || `Espacio ${spaces.length + 1}`;
    try {
      const body = { name, nodes: [], edges: [] };
      if (selectedClient) body.client_id = selectedClient.id;
      const res = await fetch('/api/content-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
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
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      setSpaces(s => s.filter(x => x.id !== space.id));
    } catch {}
  };

  const handleSaveClient = async (form) => {
    if (clientModal === 'new') {
      const client = await createClient(form);
      onSelectClient(client);
    } else {
      await updateClient(clientModal.id, form);
    }
    setClientModal(null);
  };

  const handleDeleteClient = async (id) => {
    if (selectedClient?.id === id) onSelectClient(null);
    await deleteClient(id);
  };

  const handleSelectClient = (client) => {
    onSelectClient(client);
    setActiveTab('spaces');
  };

  const filteredSpaces = spaces.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    !clientSearch
    || c.name.toLowerCase().includes(clientSearch.toLowerCase())
    || (c.company || '').toLowerCase().includes(clientSearch.toLowerCase())
    || (c.sector || '').toLowerCase().includes(clientSearch.toLowerCase())
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
        position: 'relative', zIndex: 10,
      }}>
        {/* Logo */}
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
            value={activeTab === 'clients' ? clientSearch : searchQuery}
            onChange={e => activeTab === 'clients' ? setClientSearch(e.target.value) : setSearchQuery(e.target.value)}
            placeholder={activeTab === 'clients' ? 'Buscar clientes...' : 'Buscar espacios...'}
            style={{
              width: 190, padding: '6px 10px 6px 28px',
              background: 'oklch(100% 0 0 / 0.05)',
              border: 'none', borderRadius: 8,
              boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)',
              color: 'oklch(80% 0 0)', fontSize: 12, fontFamily: 'inherit', outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'oklch(40% 0 0)' }}>⌕</span>
        </div>

        {/* Selected client badge */}
        {selectedClient && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 8px 4px 6px', borderRadius: 8,
            background: 'oklch(65% 0.2 265 / 0.1)',
            boxShadow: 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.25)',
            cursor: 'pointer',
          }} onClick={() => onSelectClient(null)} title="Click para deseleccionar">
            <Avatar name={selectedClient.company || selectedClient.name} size={20} />
            <span style={{ fontSize: 11, color: 'oklch(72% 0.18 265)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedClient.company || selectedClient.name}
            </span>
            <span style={{ fontSize: 9, color: 'oklch(42% 0 0)' }}>✕</span>
          </div>
        )}

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, oklch(55% 0.22 265), oklch(42% 0.24 280))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', userSelect: 'none' }} title={user?.name || 'Usuario'}>
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'oklch(85% 0 0)' }}>
              {user?.name || 'Usuario'}
            </div>
            <div style={{ fontSize: 9, color: 'oklch(45% 0 0)' }}>
              {user?.email || ''}
            </div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'oklch(40% 0 0)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: 6, transition: 'color 150ms', marginLeft: 8 }} onMouseEnter={e => e.currentTarget.style.color = 'oklch(65% 0 0)'} onMouseLeave={e => e.currentTarget.style.color = 'oklch(40% 0 0)'}>
            Salir
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{
        background: `radial-gradient(ellipse at 70% 50%, oklch(22% 0.05 265 / 0.45) 0%, transparent 60%), oklch(10% 0.01 265)`,
        padding: '36px 56px',
        borderBottom: '1px solid oklch(100% 0 0 / 0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 46, fontWeight: 900, color: 'oklch(92% 0 0)', margin: 0, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
              {activeTab === 'clients' ? 'Clientes' : activeTab === 'templates' ? 'Plantillas' : 'Espacios'}
            </h1>
            <p style={{ fontSize: 13, color: 'oklch(40% 0 0)', margin: '8px 0 20px', maxWidth: 380, lineHeight: 1.6 }}>
              {activeTab === 'clients'
                ? 'Fichas de marca. Cada cliente guarda su contexto, tono y plantillas para generar contenido consistente.'
                : activeTab === 'templates'
                  ? 'Plantillas predefinidas para acelerar tu flujo de trabajo.'
                  : selectedClient
                    ? `Espacios de ${selectedClient.company || selectedClient.name}. Cada uno guarda nodos, conexiones y configuración.`
                    : 'Selecciona un cliente para ver sus espacios, o crea uno nuevo.'}
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              {activeTab === 'clients' ? (
                <button
                  onClick={() => setClientModal('new')}
                  style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))', color: 'oklch(97% 0 0)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px oklch(55% 0.2 265 / 0.3)' }}
                >
                  + Nuevo cliente
                </button>
              ) : activeTab === 'spaces' ? (
                <>
                  {creating ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        autoFocus
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreateSpace(); if (e.key === 'Escape') setCreating(false); }}
                        placeholder="Nombre del espacio..."
                        style={{ padding: '8px 12px', borderRadius: 9, border: 'none', background: 'oklch(100% 0 0 / 0.08)', boxShadow: 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.4)', color: 'oklch(90% 0 0)', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 200 }}
                      />
                      <button onClick={handleCreateSpace} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))', color: 'oklch(97% 0 0)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Crear
                      </button>
                      <button onClick={() => setCreating(false)} style={{ padding: '8px 10px', borderRadius: 9, border: 'none', background: 'oklch(100% 0 0 / 0.06)', color: 'oklch(50% 0 0)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreating(true)}
                      style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'oklch(100% 0 0 / 0.07)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.12)', color: 'oklch(85% 0 0)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <span style={{ fontSize: 15 }}>+</span> Nuevo espacio
                    </button>
                  )}
                  <button
                    onClick={onOpenCanvas}
                    style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))', color: 'oklch(97% 0 0)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px oklch(55% 0.2 265 / 0.3)' }}
                  >
                    Canvas libre →
                  </button>
                  <a
                    href="http://localhost:80"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '9px 18px', borderRadius: 10, textDecoration: 'none',
                      background: 'oklch(100% 0 0 / 0.06)',
                      boxShadow: 'inset 0 0 0 1px oklch(55% 0.18 155 / 0.35)',
                      color: 'oklch(68% 0.18 155)',
                      fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'oklch(55% 0.18 155 / 0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.06)'; }}
                  >
                    RStudio
                  </a>
                </>
              ) : null}
            </div>
          </div>

          <div style={{ flexShrink: 0, opacity: 0.85 }}>
            <AnimatedNodePreview />
          </div>
        </div>
      </div>

      {/* ── Tabs + Content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, padding: '0 56px', borderBottom: '1px solid oklch(100% 0 0 / 0.06)', flexShrink: 0 }}>
          {[
            ['spaces', 'Mis espacios'],
            ['clients', 'Clientes'],
            ['templates', 'Plantillas'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '11px 16px',
                background: 'none', border: 'none',
                borderBottom: activeTab === key ? '2px solid oklch(65% 0.2 265)' : '2px solid transparent',
                color: activeTab === key ? 'oklch(78% 0.18 265)' : 'oklch(42% 0 0)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'color 150ms',
                marginBottom: -1,
              }}
            >
              {label}
              {key === 'clients' && clients.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 9, background: 'oklch(65% 0.2 265 / 0.18)', color: 'oklch(65% 0.2 265)', padding: '1px 5px', borderRadius: 10, fontFamily: 'IBM Plex Mono, monospace' }}>
                  {clients.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 56px 48px', position: 'relative' }}>

          {/* ── Clientes Tab ── */}
          {activeTab === 'clients' && (
            <div>
              {clientsLoading ? (
                <div style={{ color: 'oklch(35% 0 0)', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>Cargando clientes...</div>
              ) : filteredClients.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
                  <div style={{ fontSize: 36, opacity: 0.15 }}>👤</div>
                  <div style={{ fontSize: 13, color: 'oklch(35% 0 0)' }}>
                    {clientSearch ? 'Sin resultados.' : 'No hay clientes. Crea el primero.'}
                  </div>
                  {!clientSearch && (
                    <button
                      onClick={() => setClientModal('new')}
                      style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))', color: 'oklch(97% 0 0)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >+ Crear primer cliente</button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                  {filteredClients.map(client => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      selected={selectedClient?.id === client.id}
                      onClick={handleSelectClient}
                      onEdit={c => setClientModal(c)}
                      onDelete={handleDeleteClient}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Plantillas Tab ── */}
          {activeTab === 'templates' && (
            <div>
              <div style={{ fontSize: 12, color: 'oklch(40% 0 0)', marginBottom: 20 }}>
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
          )}

          {/* ── Espacios Tab ── */}
          {activeTab === 'spaces' && (
            <>
              {spacesLoading ? (
                <div style={{ color: 'oklch(35% 0 0)', fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>Cargando espacios...</div>
              ) : filteredSpaces.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
                  <div style={{ fontSize: 36, opacity: 0.15 }}>✦</div>
                  <div style={{ fontSize: 13, color: 'oklch(35% 0 0)' }}>
                    {searchQuery
                      ? 'Sin resultados.'
                      : selectedClient
                        ? `${selectedClient.company || selectedClient.name} no tiene espacios aún.`
                        : 'No hay espacios aún. Crea uno nuevo.'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  {filteredSpaces.map(space => (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      onClick={s => onOpenSpace(s.id, s.name)}
                      onDelete={handleDeleteSpace}
                    />
                  ))}
                </div>
              )}

              {/* No client selected hint */}
              {!selectedClient && spaces.length === 0 && !spacesLoading && !searchQuery && (
                <div style={{ marginTop: 24, padding: '16px 20px', borderRadius: 12, background: 'oklch(100% 0 0 / 0.03)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.06)', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 420 }}>
                  <div style={{ fontSize: 20, opacity: 0.4 }}>💡</div>
                  <div>
                    <div style={{ fontSize: 12, color: 'oklch(55% 0 0)', fontWeight: 600, marginBottom: 3 }}>Selecciona un cliente</div>
                    <div style={{ fontSize: 11, color: 'oklch(38% 0 0)', lineHeight: 1.5 }}>
                      Ve a la pestaña <button onClick={() => setActiveTab('clients')} style={{ background: 'none', border: 'none', color: 'oklch(65% 0.18 265)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, padding: 0, textDecoration: 'underline' }}>Clientes</button> para crear o seleccionar uno.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Client Form Modal ── */}
      {clientModal && (
        <ClientFormModal
          initial={clientModal === 'new' ? null : clientModal}
          onSave={handleSaveClient}
          onClose={() => setClientModal(null)}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes nodeFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes flow-dash {
          to { stroke-dashoffset: -18; }
        }
      `}</style>
    </div>
  );
}
