import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useWorkflow } from '../WorkflowContext.jsx';

const ICONS = {
  LeadExtractor: '⚡',
  PainAnalyzer: '🎯',
  StrategyMapper: '🗺',
  ProposalWriter: '✍',
  NextStepsPlanner: '📋',
};

const RESULT_PREVIEW = {
  LeadExtractor: (r) => r?.empresa ? `${r.empresa} · ${r.sector || '—'}` : null,
  PainAnalyzer: (r) => r?.dolores ? `${r.dolores.length} pains · urgencia ${r.urgencia_score}/10` : null,
  StrategyMapper: (r) => r?.presupuesto ? `${r.presupuesto} · ${r.timeline_days}d` : null,
  ProposalWriter: (r) => r?.titulo ? `"${r.titulo.slice(0, 28)}…"` : null,
  NextStepsPlanner: (r) => r?.follow_up_days !== undefined ? `Follow-up en ${r.follow_up_days}d` : null,
};

function statusGlow(status) {
  if (status === 'running') return `
    inset 0 0 0 1px oklch(65% 0.2 265 / 0.55),
    inset 0 1px 0 oklch(100% 0 0 / 0.08),
    0 0 0 1px oklch(65% 0.2 265 / 0.2),
    0 0 24px -4px oklch(65% 0.2 265 / 0.3),
    0 8px 24px -4px oklch(0% 0 0 / 0.3)
  `;
  if (status === 'completed') return `
    inset 0 0 0 1px oklch(70% 0.18 155 / 0.4),
    inset 0 1px 0 oklch(100% 0 0 / 0.08),
    0 0 0 1px oklch(70% 0.18 155 / 0.1),
    0 8px 24px -4px oklch(0% 0 0 / 0.28)
  `;
  if (status === 'error') return `
    inset 0 0 0 1px oklch(62% 0.22 25 / 0.5),
    0 8px 24px -4px oklch(0% 0 0 / 0.28)
  `;
  return `
    inset 0 0 0 1px oklch(100% 0 0 / 0.08),
    inset 0 1px 0 oklch(100% 0 0 / 0.06),
    0 2px 4px -1px oklch(0% 0 0 / 0.12),
    0 8px 24px -4px oklch(0% 0 0 / 0.24)
  `;
}

export function AgentNode({ data }) {
  const { agentStatuses } = useWorkflow();
  const [expanded, setExpanded] = useState(false);

  const { agentName, label, tokens, index } = data;
  const agentStatus = agentStatuses[agentName] || {};
  const status = agentStatus.status || 'idle';
  const result = agentStatus.result;

  const isRunning = status === 'running';
  const isCompleted = status === 'completed';
  const isError = status === 'error';

  const dotColor = {
    idle: 'oklch(35% 0 0)',
    running: 'oklch(65% 0.2 265)',
    completed: 'oklch(70% 0.18 155)',
    error: 'oklch(62% 0.22 25)',
  }[status];

  const preview = isCompleted && result ? RESULT_PREVIEW[agentName]?.(result) : null;

  return (
    <div
      className="node-enter"
      data-index={String(index)}
      style={{
        width: 220,
        background: 'oklch(18% 0.01 250 / 0.75)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 14,
        boxShadow: statusGlow(status),
        transition: 'box-shadow 300ms cubic-bezier(0.16,1,0.3,1), transform 180ms cubic-bezier(0.16,1,0.3,1)',
        animation: isError ? 'node-shake 0.3s cubic-bezier(0.16,1,0.3,1)' : undefined,
        cursor: isCompleted ? 'pointer' : 'default',
      }}
      onClick={() => isCompleted && setExpanded(e => !e)}
    >
      <Handle type="target" position={Position.Left} />

      {/* Header */}
      <div style={{
        padding: '12px 14px 10px',
        borderBottom: '1px solid oklch(100% 0 0 / 0.06)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: isRunning
            ? 'linear-gradient(135deg, oklch(55% 0.22 265), oklch(45% 0.24 280))'
            : isCompleted
            ? 'linear-gradient(135deg, oklch(55% 0.18 155), oklch(45% 0.2 165))'
            : 'oklch(22% 0 0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, flexShrink: 0,
          transition: 'background 300ms cubic-bezier(0.16,1,0.3,1)',
          boxShadow: isRunning ? '0 0 12px oklch(55% 0.22 265 / 0.4)' : 'none',
        }}>
          {ICONS[agentName] || '●'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'oklch(96% 0 0)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </div>
          <div style={{ fontSize: 10, color: 'oklch(45% 0 0)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 1 }}>
            Haiku · {tokens}t
          </div>
        </div>
        <div style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: dotColor,
          boxShadow: isRunning ? `0 0 8px ${dotColor}` : 'none',
          animation: isRunning ? 'pulse-border 1.2s ease-in-out infinite' : 'none',
          transition: 'background 300ms cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>

      {/* Status row */}
      <div style={{
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 6,
        minHeight: 38,
      }}>
        <span style={{ fontSize: 11, color: dotColor, transition: 'color 300ms cubic-bezier(0.16,1,0.3,1)' }}>
          {isRunning ? '◉ Procesando...' : isCompleted ? '✓ Completado' : isError ? '✕ Error' : '○ En espera'}
        </span>
      </div>

      {/* Result preview (when completed + expanded) */}
      {isCompleted && preview && (
        <div style={{
          padding: '0 14px 12px',
          borderTop: '1px solid oklch(100% 0 0 / 0.05)',
          paddingTop: expanded ? 10 : 0,
          overflow: 'hidden',
          maxHeight: expanded ? '200px' : '0px',
          transition: 'max-height 300ms cubic-bezier(0.16,1,0.3,1), padding-top 300ms cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{ fontSize: 11, color: 'oklch(65% 0 0)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.5, wordBreak: 'break-all' }}>
            {preview}
          </div>
        </div>
      )}

      {/* Expand toggle for completed nodes */}
      {isCompleted && preview && (
        <div style={{
          padding: '4px 14px 10px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 10, color: 'oklch(45% 0 0)', cursor: 'pointer' }}>
            {expanded ? '▲ cerrar' : '▼ ver resultado'}
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
