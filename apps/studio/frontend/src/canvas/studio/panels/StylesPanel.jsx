import React, { useState } from 'react';
import { useStyles } from '../../../hooks/useStyles.js';

function StyleCard({ style, isSelected, onSelect, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
        background: isSelected ? 'oklch(65% 0.2 265 / 0.12)' : 'oklch(100% 0 0 / 0.03)',
        boxShadow: isSelected ? 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.4)' : 'inset 0 0 0 1px oklch(100% 0 0 / 0.07)',
        transition: 'all 150ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 16 }}>{style.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'oklch(78% 0.18 265)' : 'oklch(88% 0 0)' }}>{style.name}</div>
          {style.description && <div style={{ fontSize: 10, color: 'oklch(42% 0 0)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{style.description}</div>}
        </div>
        {isSelected && <span style={{ fontSize: 10, color: 'oklch(65% 0.2 265)', flexShrink: 0 }}>✓</span>}
      </div>
      <div style={{ fontSize: 9, color: 'oklch(35% 0 0)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {style.prompt_prefix.slice(0, 60)}...
      </div>
      {!style.is_predefined && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid oklch(100% 0 0 / 0.05)' }}>
          {!confirmDelete
            ? <button onClick={e => { e.stopPropagation(); setConfirmDelete(true); }} style={{ fontSize: 10, color: 'oklch(40% 0 0)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Eliminar</button>
            : <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'oklch(62% 0.22 25)' }}>¿Eliminar?</span>
                <button onClick={e => { e.stopPropagation(); onDelete(style.id); }} style={{ fontSize: 10, color: 'oklch(62% 0.22 25)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sí</button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(false); }} style={{ fontSize: 10, color: 'oklch(45% 0 0)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>No</button>
              </div>
          }
        </div>
      )}
    </div>
  );
}

export function StylesPanel({ open, onClose, selectedStyle, onSelectStyle }) {
  const { styles, loading, createStyle, deleteStyle } = useStyles();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', prompt_prefix: '', emoji: '📷' });

  const predefined = styles.filter(s => s.is_predefined);
  const custom = styles.filter(s => !s.is_predefined);

  const handleSave = async () => {
    if (!form.name || !form.prompt_prefix) return;
    await createStyle(form);
    setShowForm(false);
    setForm({ name: '', description: '', prompt_prefix: '', emoji: '📷' });
  };

  const inputSt = { width: '100%', padding: '7px 10px', background: 'oklch(100% 0 0 / 0.05)', border: 'none', borderRadius: 7, boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)', color: 'oklch(90% 0 0)', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

  return (
    <>
      {open && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />}
      <div style={{
        position: 'fixed', top: 52, right: 0, bottom: 0, width: 300,
        background: 'oklch(12% 0.01 250 / 0.97)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: 'inset 1px 0 0 oklch(100% 0 0 / 0.07)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid oklch(100% 0 0 / 0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'oklch(90% 0 0)' }}>Estilos</div>
            <div style={{ fontSize: 10, color: 'oklch(40% 0 0)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 1 }}>{styles.length} disponibles</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'oklch(45% 0 0)', fontSize: 16, cursor: 'pointer', padding: 4, borderRadius: 6 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
          {loading ? (
            <div style={{ fontSize: 12, color: 'oklch(40% 0 0)', textAlign: 'center', padding: 24 }}>Cargando...</div>
          ) : (
            <>
              {predefined.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: 'oklch(40% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 2px' }}>Predefinidos</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {predefined.map(s => <StyleCard key={s.id} style={s} isSelected={selectedStyle?.id === s.id} onSelect={() => { onSelectStyle(selectedStyle?.id === s.id ? null : s); onClose(); }} onDelete={() => {}} />)}
                  </div>
                </div>
              )}
              {custom.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: 'oklch(40% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 2px' }}>Mis Estilos</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {custom.map(s => <StyleCard key={s.id} style={s} isSelected={selectedStyle?.id === s.id} onSelect={() => { onSelectStyle(selectedStyle?.id === s.id ? null : s); onClose(); }} onDelete={deleteStyle} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ borderTop: '1px solid oklch(100% 0 0 / 0.07)', padding: 12 }}>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '9px 14px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))', color: 'oklch(96% 0 0)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px oklch(55% 0.2 265 / 0.25)' }}>+ Nuevo estilo</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input placeholder="Emoji" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} style={{ ...inputSt, width: 50 }} />
                <input autoFocus placeholder="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputSt, flex: 1 }} />
              </div>
              <input placeholder="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inputSt} />
              <textarea placeholder="Prompt prefix * (se añade al inicio de cada prompt)" value={form.prompt_prefix} onChange={e => setForm(f => ({ ...f, prompt_prefix: e.target.value }))} rows={3} style={{ ...inputSt, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '7px', borderRadius: 7, border: 'none', background: 'oklch(100% 0 0 / 0.06)', color: 'oklch(55% 0 0)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button onClick={handleSave} disabled={!form.name || !form.prompt_prefix} style={{ flex: 2, padding: '7px', borderRadius: 7, border: 'none', background: (form.name && form.prompt_prefix) ? 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))' : 'oklch(30% 0 0)', color: 'oklch(96% 0 0)', fontSize: 11, fontWeight: 600, cursor: (form.name && form.prompt_prefix) ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>Guardar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
