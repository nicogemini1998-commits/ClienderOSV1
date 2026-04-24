import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useWorkflow } from '../WorkflowContext.jsx';

function ResultRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  const display = Array.isArray(value)
    ? value.slice(0, 3).join(', ') + (value.length > 3 ? `… +${value.length - 3}` : '')
    : typeof value === 'object'
    ? JSON.stringify(value).slice(0, 80)
    : String(value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 9, color: 'oklch(42% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 11, color: 'oklch(82% 0 0)', lineHeight: 1.4, wordBreak: 'break-word' }}>{display}</span>
    </div>
  );
}

function formatKey(k) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function ProposalOutputNode() {
  const { workflowStatus, result } = useWorkflow();
  const [showRaw, setShowRaw] = useState(false);

  const completed = workflowStatus === 'completed';
  const lastResult = result?.result;
  const templateName = result?.template;
  const stepCount = result?.steps;

  const boxShadow = completed
    ? `inset 0 0 0 1px oklch(70% 0.18 155 / 0.35),
       inset 0 1px 0 oklch(100% 0 0 / 0.08),
       0 0 0 1px oklch(70% 0.18 155 / 0.1),
       0 8px 24px -4px oklch(0% 0 0 / 0.28)`
    : `inset 0 0 0 1px oklch(100% 0 0 / 0.08),
       inset 0 1px 0 oklch(100% 0 0 / 0.06),
       0 2px 4px -1px oklch(0% 0 0 / 0.12),
       0 8px 24px -4px oklch(0% 0 0 / 0.24)`;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultado-${templateName?.replace(/\s+/g, '-') || 'workflow'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="node-enter"
      data-index="6"
      style={{
        width: 280,
        background: 'oklch(18% 0.01 250 / 0.75)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 14,
        boxShadow,
        transition: 'box-shadow 300ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <Handle type="target" position={Position.Left} />

      {/* Header */}
      <div style={{
        padding: '12px 14px 10px',
        borderBottom: '1px solid oklch(100% 0 0 / 0.07)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: completed
            ? 'linear-gradient(135deg, oklch(55% 0.18 155), oklch(45% 0.2 165))'
            : 'oklch(22% 0 0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13,
          boxShadow: completed ? '0 0 12px oklch(55% 0.18 155 / 0.3)' : 'none',
          transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
        }}>✦</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'oklch(96% 0 0)' }}>Resultado</div>
          <div style={{ fontSize: 10, color: 'oklch(45% 0 0)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {completed ? `${stepCount} pasos · ${templateName || ''}` : 'En espera'}
          </div>
        </div>
        {completed && (
          <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: 'oklch(70% 0.18 155)', boxShadow: '0 0 8px oklch(70% 0.18 155 / 0.6)' }} />
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!completed ? (
          <div style={{ fontSize: 12, color: 'oklch(32% 0 0)', textAlign: 'center', padding: '18px 0', fontFamily: 'IBM Plex Mono, monospace' }}>
            — esperando —
          </div>
        ) : (
          <>
            {/* Last agent result rows */}
            {lastResult && typeof lastResult === 'object' && !showRaw && (
              <div style={{
                padding: '10px 12px',
                background: 'oklch(100% 0 0 / 0.03)',
                borderRadius: 9,
                boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.06)',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {Object.entries(lastResult).slice(0, 6).map(([k, v]) => (
                  <ResultRow key={k} label={formatKey(k)} value={v} />
                ))}
                {Object.keys(lastResult).length > 6 && (
                  <span style={{ fontSize: 10, color: 'oklch(38% 0 0)', fontFamily: 'IBM Plex Mono, monospace' }}>
                    +{Object.keys(lastResult).length - 6} campos más
                  </span>
                )}
              </div>
            )}

            {/* Raw JSON toggle */}
            {lastResult && (
              <button
                onClick={() => setShowRaw(r => !r)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 10, color: 'oklch(42% 0 0)', fontFamily: 'IBM Plex Mono, monospace',
                  textAlign: 'left', padding: 0,
                }}
              >{showRaw ? '▲ ocultar raw' : '▼ ver JSON completo'}</button>
            )}

            {showRaw && lastResult && (
              <pre style={{
                fontSize: 9, color: 'oklch(55% 0 0)', fontFamily: 'IBM Plex Mono, monospace',
                background: 'oklch(100% 0 0 / 0.03)', borderRadius: 7,
                boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.06)',
                padding: '8px 10px', overflow: 'auto', maxHeight: 160,
                margin: 0, lineHeight: 1.5,
              }}>
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            )}

            {/* Export */}
            <button
              onClick={handleExport}
              style={{
                padding: '9px 14px', borderRadius: 9, border: 'none',
                background: 'linear-gradient(135deg, oklch(55% 0.18 155), oklch(46% 0.2 165))',
                color: 'oklch(96% 0 0)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 14px oklch(55% 0.18 155 / 0.25), inset 0 1px 0 oklch(100% 0 0 / 0.15)',
                transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >↓ Exportar resultado</button>
          </>
        )}
      </div>
    </div>
  );
}
