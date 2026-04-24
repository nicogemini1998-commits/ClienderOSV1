import React, { useState } from 'react';

const PALETTE_NODES = [
  { type: 'agent', icon: '⚡', label: 'Agente IA', desc: 'Claude Haiku · configurable', color: 'oklch(55% 0.2 265)' },
  { type: 'agent-custom', icon: '🔮', label: 'Agente Custom', desc: 'Prompt personalizado', color: 'oklch(55% 0.2 280)' },
  { type: 'note', icon: '📝', label: 'Nota', desc: 'Anotación en el canvas', color: 'oklch(70% 0.15 80)' },
];

function PaletteItem({ node }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: 'agent',
      data: {
        agentName: `Agent_${Date.now()}`,
        label: node.label,
        tokens: 600,
        icon: node.icon,
        systemPrompt: 'You are a helpful AI assistant. Analyze the provided information and return a JSON response.',
        model: 'claude-haiku-4-5',
        isNew: true,
      }
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 10px',
        borderRadius: 8,
        background: 'oklch(100% 0 0 / 0.04)',
        boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.07)',
        cursor: 'grab',
        transition: 'background 150ms',
        userSelect: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.04)'; }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: `${node.color}22`,
        boxShadow: `inset 0 0 0 1px ${node.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
      }}>{node.icon}</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'oklch(82% 0 0)' }}>{node.label}</div>
        <div style={{ fontSize: 9, color: 'oklch(42% 0 0)', fontFamily: 'IBM Plex Mono, monospace', marginTop: 1 }}>{node.desc}</div>
      </div>
      <div style={{ marginLeft: 'auto', fontSize: 10, color: 'oklch(35% 0 0)' }}>⠿</div>
    </div>
  );
}

export function NodePalette({ visible }) {
  return (
    <div style={{
      position: 'absolute',
      left: 12,
      top: '50%',
      transform: `translateY(-50%) translateX(${visible ? '0' : 'calc(-100% - 20px)'})`,
      width: 180,
      background: 'oklch(13% 0.01 250 / 0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: 12,
      boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.08), 0 8px 32px -4px oklch(0% 0 0 / 0.4)',
      zIndex: 10,
      overflow: 'hidden',
      transition: 'transform 350ms cubic-bezier(0.32, 0.72, 0, 1)',
    }}>
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid oklch(100% 0 0 / 0.07)' }}>
        <div style={{ fontSize: 9, color: 'oklch(40% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nodos</div>
        <div style={{ fontSize: 9, color: 'oklch(33% 0 0)', marginTop: 2 }}>Arrastra al canvas</div>
      </div>
      <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {PALETTE_NODES.map(n => <PaletteItem key={n.type + n.label} node={n} />)}
      </div>
    </div>
  );
}
