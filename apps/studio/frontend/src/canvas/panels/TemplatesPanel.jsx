import React, { useState } from 'react';
import { useTemplates } from '../../hooks/useTemplates.js';

const CATEGORY_ICONS = { ventas: '💼', operaciones: '⚙️', marketing: '📣', custom: '🔧' };
const CATEGORY_LABELS = { ventas: 'Ventas', operaciones: 'Operaciones', marketing: 'Marketing', custom: 'Custom' };

function TemplateCard({ template, isActive, onUse, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      style={{
        padding: '11px 13px',
        borderRadius: 10,
        background: isActive ? 'oklch(65% 0.18 265 / 0.1)' : 'oklch(100% 0 0 / 0.03)',
        boxShadow: isActive
          ? 'inset 0 0 0 1px oklch(65% 0.18 265 / 0.35)'
          : 'inset 0 0 0 1px oklch(100% 0 0 / 0.07)',
        cursor: 'pointer',
        transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
      }}
      onClick={onUse}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.06)'; e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)'; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.03)'; e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(100% 0 0 / 0.07)'; } }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 16, lineHeight: 1.2, flexShrink: 0 }}>{CATEGORY_ICONS[template.category] || '🔧'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'oklch(78% 0.18 265)' : 'oklch(88% 0 0)', lineHeight: 1.3 }}>
            {template.name}
          </div>
          {template.description && (
            <div style={{ fontSize: 10, color: 'oklch(45% 0 0)', marginTop: 3, lineHeight: 1.4 }}>
              {template.description}
            </div>
          )}
        </div>
        {isActive && <span style={{ fontSize: 10, color: 'oklch(65% 0.18 265)', flexShrink: 0, marginTop: 1 }}>activa</span>}
      </div>

      {/* Agent pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {template.agents?.map(a => (
          <span key={a.id} style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 20,
            background: 'oklch(100% 0 0 / 0.06)',
            boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.08)',
            color: 'oklch(55% 0 0)',
            fontFamily: 'IBM Plex Mono, monospace',
          }}>{a.icon} {a.label}</span>
        ))}
      </div>

      {/* Delete (custom only) */}
      {!template.is_predefined && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid oklch(100% 0 0 / 0.06)' }}>
          {!confirmDelete ? (
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
              style={{ fontSize: 10, color: 'oklch(45% 0 0)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
            >Eliminar</button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'oklch(62% 0.22 25)' }}>¿Eliminar?</span>
              <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ fontSize: 10, color: 'oklch(62% 0.22 25)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sí</button>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(false); }} style={{ fontSize: 10, color: 'oklch(55% 0 0)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>No</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TemplatesPanel({ open, onClose, activeTemplate, onSelectTemplate, onSaveCurrentAsTemplate, currentAgents }) {
  const { templates, loading, saveTemplate, deleteTemplate } = useTemplates();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: '', description: '', category: 'custom' });
  const [saving, setSaving] = useState(false);

  const predefined = templates.filter(t => t.is_predefined);
  const custom = templates.filter(t => !t.is_predefined);

  const handleSave = async () => {
    if (!saveForm.name || !currentAgents?.length) return;
    setSaving(true);
    const t = await saveTemplate({
      ...saveForm,
      agents: currentAgents,
      input_config: { fields: [] },
    });
    setSaving(false);
    setShowSaveForm(false);
    setSaveForm({ name: '', description: '', category: 'custom' });
    onSelectTemplate(t);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'transparent' }}
        />
      )}

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 52, right: 0, bottom: 0,
        width: 300,
        background: 'oklch(12% 0.01 250 / 0.97)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: 'inset 1px 0 0 oklch(100% 0 0 / 0.07)',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 320ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid oklch(100% 0 0 / 0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'oklch(90% 0 0)' }}>Plantillas</div>
            <div style={{ fontSize: 10, color: 'oklch(40% 0 0)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 1 }}>
              {templates.length} disponibles
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'oklch(45% 0 0)', fontSize: 16, cursor: 'pointer', padding: 4, borderRadius: 6, lineHeight: 1 }}
          >✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
          {loading ? (
            <div style={{ fontSize: 12, color: 'oklch(40% 0 0)', textAlign: 'center', padding: 24 }}>Cargando...</div>
          ) : (
            <>
              {/* Predefined */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, color: 'oklch(40% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 2px' }}>Predefinidas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {predefined.map(t => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      isActive={activeTemplate?.id === t.id}
                      onUse={() => { onSelectTemplate(t); onClose(); }}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              </div>

              {/* Custom */}
              {custom.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: 'oklch(40% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 2px' }}>Mis Plantillas</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {custom.map(t => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        isActive={activeTemplate?.id === t.id}
                        onUse={() => { onSelectTemplate(t); onClose(); }}
                        onDelete={() => deleteTemplate(t.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Save current canvas as template */}
        <div style={{ borderTop: '1px solid oklch(100% 0 0 / 0.07)', padding: 12 }}>
          {!showSaveForm ? (
            <button
              onClick={() => setShowSaveForm(true)}
              style={{
                width: '100%', padding: '9px 14px', borderRadius: 9, border: 'none',
                background: 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))',
                color: 'oklch(96% 0 0)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 14px oklch(55% 0.2 265 / 0.25)',
              }}
            >+ Guardar canvas como plantilla</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <input
                autoFocus
                placeholder="Nombre de la plantilla"
                value={saveForm.name}
                onChange={e => setSaveForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', background: 'oklch(100% 0 0 / 0.05)', border: 'none', borderRadius: 7, boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)', color: 'oklch(90% 0 0)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
              />
              <input
                placeholder="Descripción (opcional)"
                value={saveForm.description}
                onChange={e => setSaveForm(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', background: 'oklch(100% 0 0 / 0.05)', border: 'none', borderRadius: 7, boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)', color: 'oklch(90% 0 0)', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setShowSaveForm(false)} style={{ flex: 1, padding: '7px', borderRadius: 7, border: 'none', background: 'oklch(100% 0 0 / 0.06)', color: 'oklch(55% 0 0)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                <button
                  onClick={handleSave}
                  disabled={!saveForm.name || saving}
                  style={{ flex: 2, padding: '7px', borderRadius: 7, border: 'none', background: saveForm.name ? 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))' : 'oklch(30% 0 0)', color: 'oklch(96% 0 0)', fontSize: 11, fontWeight: 600, cursor: saveForm.name ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
                >{saving ? '...' : 'Guardar'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
