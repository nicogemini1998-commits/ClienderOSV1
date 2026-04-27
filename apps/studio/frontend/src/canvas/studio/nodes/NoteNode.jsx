import React, { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

const TINTS = [
  { hue: 85,  label: 'Ámbar',   accent: 'oklch(72% 0.16 85)',  glow: 'oklch(65% 0.18 85 / 0.12)'  },
  { hue: 265, label: 'Índigo',  accent: 'oklch(72% 0.2 265)',  glow: 'oklch(65% 0.2 265 / 0.12)'  },
  { hue: 155, label: 'Esmeralda', accent: 'oklch(68% 0.2 155)', glow: 'oklch(60% 0.2 155 / 0.12)' },
  { hue: 330, label: 'Rosa',    accent: 'oklch(70% 0.18 330)', glow: 'oklch(62% 0.18 330 / 0.12)' },
  { hue: 200, label: 'Cielo',   accent: 'oklch(70% 0.16 200)', glow: 'oklch(62% 0.16 200 / 0.12)' },
];

export function NoteNode({ data, id }) {
  const { deleteElements } = useReactFlow();
  const [text, setText] = useState(data.text || '');
  const [tintIdx, setTintIdx] = useState(data.tintIdx ?? 0);
  const [showPalette, setShowPalette] = useState(false);

  const t = TINTS[tintIdx];

  const handleTextChange = useCallback((e) => setText(e.target.value), []);

  return (
    <div
      style={{
        width: 240,
        minHeight: 160,
        background: 'oklch(14% 0.01 250 / 0.94)',
        border: `1px solid oklch(100% 0 0 / 0.09)`,
        borderTop: `2px solid ${t.accent}`,
        borderRadius: 10,
        boxShadow: `
          inset 0 0 0 1px oklch(100% 0 0 / 0.05),
          0 0 0 1px oklch(0% 0 0 / 0.2),
          0 8px 24px -6px oklch(0% 0 0 / 0.45),
          0 0 32px -8px ${t.glow}
        `,
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 10px 6px',
        borderBottom: '1px solid oklch(100% 0 0 / 0.06)',
        gap: 6,
      }}>
        {/* Tint dot + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: t.accent,
            boxShadow: `0 0 6px ${t.accent}`,
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 8,
            fontFamily: 'IBM Plex Mono, monospace',
            fontWeight: 700,
            color: t.accent,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>Nota</span>
        </div>

        {/* Palette toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {showPalette && TINTS.map((p, i) => (
            <button
              key={i}
              className="nodrag"
              onClick={() => { setTintIdx(i); setShowPalette(false); }}
              title={p.label}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: p.accent,
                border: i === tintIdx ? '2px solid oklch(90% 0 0 / 0.6)' : '1.5px solid oklch(100% 0 0 / 0.15)',
                cursor: 'pointer',
                padding: 0,
                transform: i === tintIdx ? 'scale(1.3)' : 'scale(1)',
                transition: 'transform 150ms',
                flexShrink: 0,
              }}
            />
          ))}
          <button
            className="nodrag"
            onClick={() => setShowPalette(p => !p)}
            title="Cambiar color"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: showPalette ? t.accent : 'oklch(38% 0 0)',
              fontSize: 11,
              lineHeight: 1,
              transition: 'color 150ms',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
              <circle cx="8" cy="10" r="2" fill="currentColor"/>
              <circle cx="16" cy="10" r="2" fill="currentColor"/>
              <circle cx="12" cy="16" r="2" fill="currentColor"/>
            </svg>
          </button>
          <button
            className="nodrag"
            onClick={() => deleteElements({ nodes: [{ id }] })}
            title="Eliminar nota"
            style={{ width: 20, height: 20, padding: 0, borderRadius: 5, border: 'none', background: 'oklch(62% 0.22 25 / 0.12)', color: 'oklch(60% 0.2 25)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
            onMouseEnter={e => e.currentTarget.style.background = 'oklch(62% 0.22 25 / 0.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'oklch(62% 0.22 25 / 0.12)'}
          >✕</button>
        </div>
      </div>

      {/* Text area */}
      <textarea
        className="nodrag"
        value={text}
        onChange={handleTextChange}
        placeholder="Escribe una nota..."
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
          resize: 'none',
          padding: '10px 12px',
          fontSize: 12,
          lineHeight: 1.65,
          color: 'oklch(78% 0 0)',
          fontFamily: 'IBM Plex Mono, monospace',
          outline: 'none',
          minHeight: 110,
          caretColor: t.accent,
        }}
      />

      {/* Char hint bottom */}
      <div style={{
        padding: '4px 12px 6px',
        borderTop: text.length > 0 ? '1px solid oklch(100% 0 0 / 0.04)' : 'none',
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        {text.length > 0 && (
          <span style={{ fontSize: 8, color: 'oklch(30% 0 0)', fontFamily: 'IBM Plex Mono, monospace' }}>
            {text.length}
          </span>
        )}
      </div>

      {/* Handles — same style as rest of nodes */}
      <Handle
        type="target"
        position={Position.Left}
        id="note-in"
        style={{
          background: `oklch(55% 0.14 ${t.hue} / 0.7)`,
          borderColor: `oklch(35% 0.1 ${t.hue})`,
          width: 12,
          height: 12,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="note-out"
        style={{
          background: `oklch(65% 0.18 ${t.hue})`,
          borderColor: `oklch(45% 0.14 ${t.hue})`,
          width: 12,
          height: 12,
        }}
      />
    </div>
  );
}
