import React, { useState, useRef, useEffect } from 'react';
import { useClients } from '../../hooks/useClients.js';

const CATEGORY_COLORS = { Technology: '#6366f1', Finance: '#3b82f6', Healthcare: '#10b981', default: '#8b5cf6' };

function Avatar({ name, size = 28 }) {
  const initials = name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 3,
      background: `linear-gradient(135deg, oklch(50% 0.2 265), oklch(42% 0.22 280))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: 'oklch(95% 0 0)',
      flexShrink: 0, letterSpacing: '-0.02em',
    }}>{initials}</div>
  );
}

function NewClientForm({ onSave, onCancel, createClient }) {
  const [form, setForm] = useState({ name: '', company: '', sector: '', website: '', email: '' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const inputSt = {
    width: '100%', padding: '7px 10px',
    background: 'oklch(100% 0 0 / 0.05)',
    border: 'none', borderRadius: 7,
    boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)',
    color: 'oklch(90% 0 0)', fontSize: 12, fontFamily: 'inherit', outline: 'none',
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const client = await createClient(form);
    setSaving(false);
    onSave(client);
  };

  return (
    <div style={{ padding: '12px 14px', borderTop: '1px solid oklch(100% 0 0 / 0.07)', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'oklch(70% 0 0)', marginBottom: 2 }}>Nuevo Cliente</div>
      {[
        { k: 'name', label: 'Nombre *', ph: 'Nombre del cliente' },
        { k: 'company', label: 'Empresa', ph: 'Nombre de la empresa' },
        { k: 'sector', label: 'Sector', ph: 'Technology, Finance...' },
        { k: 'website', label: 'Website', ph: 'https://...' },
        { k: 'email', label: 'Email', ph: 'contacto@empresa.com' },
      ].map(({ k, label, ph }) => (
        <div key={k}>
          <div style={{ fontSize: 9, color: 'oklch(45% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
          <input style={inputSt} placeholder={ph} value={form[k]} onChange={set(k)} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '7px', borderRadius: 7, border: 'none', background: 'oklch(100% 0 0 / 0.06)', color: 'oklch(60% 0 0)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
        <button
          onClick={handleSave}
          disabled={!form.name || saving}
          style={{
            flex: 2, padding: '7px', borderRadius: 7, border: 'none',
            background: form.name ? 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))' : 'oklch(30% 0.05 265 / 0.4)',
            color: 'oklch(96% 0 0)', fontSize: 11, fontWeight: 600, cursor: form.name ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
          }}
        >{saving ? 'Guardando...' : '+ Guardar'}</button>
      </div>
    </div>
  );
}

export function ClientPicker({ selectedClient, onSelect }) {
  const { clients, loading, createClient } = useClients();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '5px 10px 5px 7px',
          background: open ? 'oklch(100% 0 0 / 0.08)' : 'oklch(100% 0 0 / 0.05)',
          border: 'none', borderRadius: 9,
          boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)',
          cursor: 'pointer', transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
          color: 'oklch(85% 0 0)', fontFamily: 'inherit',
        }}
      >
        {selectedClient
          ? <Avatar name={selectedClient.name} size={22} />
          : <div style={{ width: 22, height: 22, borderRadius: 6, background: 'oklch(25% 0 0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>👤</div>
        }
        <span style={{ fontSize: 12, fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedClient?.name || 'Sin cliente'}
        </span>
        <span style={{ fontSize: 9, color: 'oklch(40% 0 0)', marginLeft: 2 }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          width: 280, maxHeight: 420,
          background: 'oklch(14% 0.01 250 / 0.97)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: `inset 0 0 0 1px oklch(100% 0 0 / 0.09), 0 4px 24px -4px oklch(0% 0 0 / 0.5)`,
          zIndex: 100,
          animation: 'node-enter 0.18s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          {/* Search */}
          <div style={{ padding: '10px 12px 8px' }}>
            <input
              autoFocus
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px',
                background: 'oklch(100% 0 0 / 0.05)',
                border: 'none', borderRadius: 7,
                boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)',
                color: 'oklch(90% 0 0)', fontSize: 12, outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* No client option */}
          <div
            onClick={() => { onSelect(null); setOpen(false); }}
            style={{
              padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              background: !selectedClient ? 'oklch(100% 0 0 / 0.06)' : 'transparent',
              transition: 'background 120ms',
              borderBottom: '1px solid oklch(100% 0 0 / 0.05)',
            }}
            onMouseEnter={e => { if (selectedClient) e.currentTarget.style.background = 'oklch(100% 0 0 / 0.04)'; }}
            onMouseLeave={e => { if (selectedClient) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'oklch(20% 0 0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>—</div>
            <span style={{ fontSize: 12, color: 'oklch(55% 0 0)' }}>Sin cliente seleccionado</span>
          </div>

          {/* Client list */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '16px 14px', fontSize: 12, color: 'oklch(40% 0 0)', textAlign: 'center' }}>Cargando...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '16px 14px', fontSize: 12, color: 'oklch(40% 0 0)', textAlign: 'center' }}>Sin resultados</div>
            ) : filtered.map(client => (
              <div
                key={client.id}
                onClick={() => { onSelect(client); setOpen(false); setSearch(''); }}
                style={{
                  padding: '8px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 9,
                  background: selectedClient?.id === client.id ? 'oklch(65% 0.18 265 / 0.12)' : 'transparent',
                  transition: 'background 120ms',
                }}
                onMouseEnter={e => { if (selectedClient?.id !== client.id) e.currentTarget.style.background = 'oklch(100% 0 0 / 0.04)'; }}
                onMouseLeave={e => { if (selectedClient?.id !== client.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <Avatar name={client.name} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'oklch(88% 0 0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</div>
                  {(client.company || client.sector) && (
                    <div style={{ fontSize: 10, color: 'oklch(45% 0 0)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[client.company, client.sector].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                {selectedClient?.id === client.id && <span style={{ color: 'oklch(65% 0.18 265)', fontSize: 11 }}>✓</span>}
              </div>
            ))}
          </div>

          {/* New client */}
          {!showNew ? (
            <button
              onClick={() => setShowNew(true)}
              style={{
                width: '100%', padding: '10px 14px', border: 'none',
                background: 'transparent',
                borderTop: '1px solid oklch(100% 0 0 / 0.07)',
                color: 'oklch(65% 0.18 265)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'background 120ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >+ Nuevo cliente</button>
          ) : (
            <NewClientForm
              createClient={createClient}
              onSave={(client) => { onSelect(client); setOpen(false); setShowNew(false); }}
              onCancel={() => setShowNew(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
