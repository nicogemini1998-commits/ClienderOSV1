import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useWorkflow } from '../WorkflowContext.jsx';

const DEFAULT_FIELDS = [
  { key: 'name', label: 'Nombre del lead', placeholder: 'Ej. Juan García', multiline: false },
  { key: 'website', label: 'Website', placeholder: 'https://empresa.com', multiline: false },
  { key: 'sector', label: 'Sector', placeholder: 'Technology, Retail...', multiline: false },
];

function statusGlow(status) {
  if (status === 'running') return `
    inset 0 0 0 1px oklch(65% 0.2 265 / 0.5),
    inset 0 1px 0 oklch(100% 0 0 / 0.08),
    0 0 0 1px oklch(65% 0.2 265 / 0.15),
    0 0 24px -4px oklch(65% 0.2 265 / 0.25),
    0 8px 28px -4px oklch(0% 0 0 / 0.35)
  `;
  if (status === 'completed') return `
    inset 0 0 0 1px oklch(70% 0.18 155 / 0.35),
    inset 0 1px 0 oklch(100% 0 0 / 0.08),
    0 8px 28px -4px oklch(0% 0 0 / 0.32)
  `;
  return `
    inset 0 0 0 1px oklch(100% 0 0 / 0.1),
    inset 0 1px 0 oklch(100% 0 0 / 0.07),
    0 2px 4px -1px oklch(0% 0 0 / 0.12),
    0 8px 28px -4px oklch(0% 0 0 / 0.3)
  `;
}

const inputSt = {
  width: '100%',
  padding: '7px 10px',
  background: 'oklch(100% 0 0 / 0.04)',
  border: 'none',
  borderRadius: 7,
  boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)',
  color: 'oklch(90% 0 0)',
  fontSize: 12,
  fontFamily: 'inherit',
  outline: 'none',
  resize: 'vertical',
  boxSizing: 'border-box',
};

export function DynamicInputNode({ data }) {
  const { runWorkflow, workflowStatus, connected } = useWorkflow();
  const fields = data?.inputConfig?.fields?.length ? data.inputConfig.fields : DEFAULT_FIELDS;

  const initial = Object.fromEntries(fields.map(f => [f.key, '']));
  const [form, setForm] = useState(initial);

  const isRunning = workflowStatus === 'running';
  const isCompleted = workflowStatus === 'completed';

  const canRun = !isRunning && connected && fields.every(f => !f.required || form[f.key]?.trim());

  const handleRun = () => {
    if (!canRun) return;
    runWorkflow(form);
  };

  return (
    <div
      style={{
        width: 260,
        background: 'oklch(16% 0.015 250 / 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 16,
        boxShadow: statusGlow(workflowStatus),
        transition: 'box-shadow 300ms cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '13px 16px 11px',
        borderBottom: '1px solid oklch(100% 0 0 / 0.07)',
        display: 'flex', alignItems: 'center', gap: 9,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, oklch(55% 0.22 265), oklch(42% 0.24 280))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13,
          boxShadow: '0 0 12px oklch(55% 0.22 265 / 0.3)',
        }}>⚙️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'oklch(92% 0 0)', letterSpacing: '-0.01em' }}>
            Input
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: connected ? 'oklch(70% 0.18 155)' : 'oklch(35% 0 0)',
              boxShadow: connected ? '0 0 6px oklch(70% 0.18 155 / 0.6)' : 'none',
              transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
            }} />
            <span style={{ fontSize: 10, color: 'oklch(42% 0 0)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {connected ? 'ws conectado' : 'desconectado'}
            </span>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {fields.map(f => (
          <div key={f.key}>
            <div style={{
              fontSize: 9, color: 'oklch(45% 0 0)',
              fontFamily: 'IBM Plex Mono, monospace',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              marginBottom: 4,
            }}>{f.label}{f.required && ' *'}</div>
            {f.multiline ? (
              <textarea
                rows={3}
                placeholder={f.placeholder || ''}
                value={form[f.key] || ''}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                disabled={isRunning}
                style={{ ...inputSt, minHeight: 64 }}
              />
            ) : (
              <input
                type="text"
                placeholder={f.placeholder || ''}
                value={form[f.key] || ''}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                disabled={isRunning}
                style={inputSt}
              />
            )}
          </div>
        ))}
      </div>

      {/* Run button */}
      <div style={{ padding: '0 14px 14px' }}>
        <button
          onClick={handleRun}
          disabled={!canRun}
          style={{
            width: '100%', padding: '9px',
            borderRadius: 9, border: 'none',
            background: canRun
              ? 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))'
              : 'oklch(25% 0.01 265 / 0.6)',
            color: canRun ? 'oklch(97% 0 0)' : 'oklch(40% 0 0)',
            fontSize: 12, fontWeight: 700,
            cursor: canRun ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            letterSpacing: '-0.01em',
            transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
            boxShadow: canRun ? '0 4px 14px oklch(55% 0.2 265 / 0.25)' : 'none',
          }}
        >
          {isRunning ? '◉ Ejecutando...' : isCompleted ? '↺ Ejecutar de nuevo' : '▶ Ejecutar workflow'}
        </button>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
