import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { useWorkflow } from './WorkflowContext.jsx';

function ToolBtn({ onClick, title, children, accent }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 34,
        height: 34,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        borderRadius: 8,
        color: accent ? 'oklch(65% 0.2 265)' : 'oklch(60% 0 0)',
        fontSize: 14,
        cursor: 'pointer',
        transition: 'background 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'oklch(100% 0 0 / 0.07)';
        e.currentTarget.style.color = 'oklch(90% 0 0)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = accent ? 'oklch(65% 0.2 265)' : 'oklch(60% 0 0)';
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.93)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {children}
    </button>
  );
}

const Divider = () => (
  <div style={{ width: 1, height: 18, background: 'oklch(100% 0 0 / 0.08)', margin: '0 2px' }} />
);

export function CanvasToolbar() {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const { workflowStatus, resetWorkflow, connected } = useWorkflow();
  const running = workflowStatus === 'running';

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      display: 'flex', alignItems: 'center', gap: 2,
      background: 'oklch(14% 0.01 250 / 0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: 12,
      padding: '4px 6px',
      boxShadow: `
        inset 0 0 0 1px oklch(100% 0 0 / 0.08),
        inset 0 1px 0 oklch(100% 0 0 / 0.07),
        0 4px 16px -2px oklch(0% 0 0 / 0.4),
        0 1px 4px oklch(0% 0 0 / 0.2)
      `,
    }}>
      {/* Connection status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '0 8px 0 4px',
        borderRight: '1px solid oklch(100% 0 0 / 0.07)',
        marginRight: 2,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: connected ? 'oklch(70% 0.18 155)' : 'oklch(50% 0 0)',
          boxShadow: connected ? '0 0 6px oklch(70% 0.18 155 / 0.6)' : 'none',
          transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
        }} />
        <span style={{
          fontSize: 10,
          fontFamily: 'IBM Plex Mono, monospace',
          color: 'oklch(45% 0 0)',
          letterSpacing: '0.02em',
        }}>
          {running ? 'Ejecutando' : connected ? 'Online' : 'Offline'}
        </span>
      </div>

      <ToolBtn onClick={() => zoomIn()} title="Acercar">+</ToolBtn>
      <ToolBtn onClick={() => zoomOut()} title="Alejar">−</ToolBtn>
      <ToolBtn onClick={() => fitView({ padding: 0.15, duration: 400 })} title="Ajustar vista">⊡</ToolBtn>

      <Divider />

      <ToolBtn
        onClick={resetWorkflow}
        title="Reiniciar workflow"
        accent={workflowStatus === 'completed'}
      >
        ↺
      </ToolBtn>
    </div>
  );
}
