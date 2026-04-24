import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useWorkflow } from '../WorkflowContext.jsx';

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  background: 'oklch(100% 0 0 / 0.05)',
  border: 'none',
  borderRadius: '8px',
  boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)',
  color: 'oklch(96% 0 0)',
  fontSize: '13px',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'box-shadow 180ms cubic-bezier(0.16,1,0.3,1)',
};

export function LeadInputNode() {
  const { connected, workflowStatus, runWorkflow } = useWorkflow();
  const [form, setForm] = useState({ name: '', website: '', sector: '' });
  const running = workflowStatus === 'running';
  const completed = workflowStatus === 'completed';

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRun = () => {
    if (!form.name || !form.website || !form.sector) return;
    runWorkflow(form);
  };

  return (
    <div
      className="node-enter"
      data-index="0"
      style={{
        width: 260,
        background: 'oklch(18% 0.01 250 / 0.75)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 16,
        boxShadow: `
          inset 0 0 0 1px oklch(100% 0 0 / ${running ? '0.16' : '0.08'}),
          inset 0 1px 0 oklch(100% 0 0 / 0.08),
          0 2px 4px -1px oklch(0% 0 0 / 0.16),
          0 8px 24px -4px oklch(0% 0 0 / 0.28)
          ${running ? ', 0 0 0 1px oklch(65% 0.2 265 / 0.3), 0 0 32px -4px oklch(65% 0.2 265 / 0.2)' : ''}
        `,
        transition: 'box-shadow 300ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid oklch(100% 0 0 / 0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, oklch(55% 0.22 265), oklch(45% 0.24 280))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}>⚡</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'oklch(96% 0 0)', letterSpacing: '-0.01em' }}>
            BOB AI
          </div>
          <div style={{ fontSize: 10, color: 'oklch(50% 0 0)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 1 }}>
            Orquestador
          </div>
        </div>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: connected ? 'oklch(70% 0.18 155)' : 'oklch(50% 0 0)',
          boxShadow: connected ? '0 0 6px oklch(70% 0.18 155 / 0.6)' : 'none',
          transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>

      {/* Form */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: 'oklch(50% 0 0)', marginBottom: 4, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Empresa</div>
          <input
            style={inputStyle}
            placeholder="Nombre del cliente"
            value={form.name}
            onChange={set('name')}
            disabled={running}
            onFocus={e => e.target.style.boxShadow = 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.6)'}
            onBlur={e => e.target.style.boxShadow = 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)'}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'oklch(50% 0 0)', marginBottom: 4, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Website</div>
          <input
            style={inputStyle}
            placeholder="https://empresa.com"
            value={form.website}
            onChange={set('website')}
            disabled={running}
            onFocus={e => e.target.style.boxShadow = 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.6)'}
            onBlur={e => e.target.style.boxShadow = 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)'}
          />
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'oklch(50% 0 0)', marginBottom: 4, fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sector</div>
          <input
            style={inputStyle}
            placeholder="Technology, Finance..."
            value={form.sector}
            onChange={set('sector')}
            disabled={running}
            onFocus={e => e.target.style.boxShadow = 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.6)'}
            onBlur={e => e.target.style.boxShadow = 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)'}
          />
        </div>

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={running || !form.name || !form.website || !form.sector}
          style={{
            marginTop: 4,
            padding: '10px 16px',
            borderRadius: 10,
            border: 'none',
            background: running || !form.name || !form.website || !form.sector
              ? 'oklch(30% 0.05 265 / 0.5)'
              : 'linear-gradient(135deg, oklch(55% 0.22 265), oklch(48% 0.24 280))',
            color: 'oklch(96% 0 0)',
            fontSize: 13,
            fontWeight: 600,
            cursor: running || !form.name || !form.website || !form.sector ? 'not-allowed' : 'pointer',
            opacity: !form.name || !form.website || !form.sector ? 0.4 : 1,
            transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
            boxShadow: !running && form.name && form.website && form.sector
              ? '0 4px 16px oklch(55% 0.22 265 / 0.3), inset 0 1px 0 oklch(100% 0 0 / 0.15)'
              : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'inherit',
          }}
          onMouseDown={e => { if (!running) e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {running ? (
            <>
              <span style={{ width: 12, height: 12, border: '2px solid oklch(96% 0 0 / 0.3)', borderTopColor: 'oklch(96% 0 0)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              Ejecutando...
            </>
          ) : completed ? '↺ Ejecutar de nuevo' : '▶ Ejecutar Workflow'}
        </button>
      </div>

      <Handle type="source" position={Position.Right} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
