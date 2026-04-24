import React, { useState, useContext } from 'react';
import { Handle, Position } from '@xyflow/react';
import { StudioContext } from '../StudioContext.jsx';

const AGENTS = [
  { id: '/shaq', label: '/shaq', desc: 'Prompts de imagen & video', icon: '🎯' },
];

export function PromptNode({ id, data }) {
  const { selectedClient, selectedStyle, user, generateContent, token } = useContext(StudioContext);
  const [brief, setBrief] = useState(data.brief || '');
  const [count, setCount] = useState(data.count || 1);
  const [agent, setAgent] = useState(data.agent || '/shaq');
  const [type, setType] = useState(data.type || 'image');
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | generating-prompts | generating-media | done | error
  const [error, setError] = useState('');

  const canRun = brief.trim().length > 0 && !loading;

  const handleGenerate = async () => {
    if (!canRun) return;
    setLoading(true);
    setError('');
    setStatus('generating-prompts');
    setPrompts([]);
    try {
      const res = await fetch('/api/kie/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          brief: brief.trim(),
          style_id: selectedStyle?.id || null,
          client_id: selectedClient?.id || null,
          user_id: user?.id || null,
          count,
          type,
          agent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generando');
      setStatus('done');
      setPrompts(data.prompts || []);
      generateContent?.(data.results || []);
    } catch (err) {
      setStatus('error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptsOnly = async () => {
    if (!brief.trim()) return;
    setLoading(true);
    setError('');
    setStatus('generating-prompts');
    try {
      const res = await fetch('/api/kie/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          brief: brief.trim(),
          style_id: selectedStyle?.id || null,
          client_id: selectedClient?.id || null,
          count: Math.max(count, 3),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPrompts(data.prompts || []);
      setStatus('idle');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = { idle: 'oklch(35% 0 0)', 'generating-prompts': 'oklch(65% 0.2 265)', 'generating-media': 'oklch(65% 0.15 50)', done: 'oklch(70% 0.18 155)', error: 'oklch(62% 0.22 25)' }[status];
  const statusLabel = { idle: '○ Listo', 'generating-prompts': '◉ Generando prompts...', 'generating-media': '◉ Generando media...', done: '✓ Completado', error: '✕ Error' }[status];

  return (
    <div style={{
      width: 300,
      background: 'oklch(16% 0.015 265 / 0.88)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderRadius: 14,
      boxShadow: `inset 0 0 0 1px oklch(65% 0.2 265 / ${status === 'generating-prompts' ? '0.5' : '0.18'}), 0 8px 28px -4px oklch(0% 0 0 / 0.35)`,
      overflow: 'hidden',
      transition: 'box-shadow 300ms cubic-bezier(0.16,1,0.3,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '11px 14px 9px', borderBottom: '1px solid oklch(100% 0 0 / 0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, oklch(55% 0.22 265), oklch(42% 0.24 280))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>✦</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'oklch(92% 0 0)' }}>Prompt Node</div>
          <div style={{ fontSize: 10, color: statusColor, fontFamily: 'IBM Plex Mono, monospace', marginTop: 1, transition: 'color 300ms' }}>{statusLabel}</div>
        </div>
        {/* Agent selector */}
        <select
          value={agent}
          onChange={e => setAgent(e.target.value)}
          style={{ fontSize: 10, background: 'oklch(100% 0 0 / 0.06)', border: 'none', borderRadius: 6, color: 'oklch(65% 0.2 265)', padding: '3px 6px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.3)', outline: 'none' }}
        >
          {AGENTS.map(a => <option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
        </select>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Brief textarea */}
        <div>
          <div style={{ fontSize: 9, color: 'oklch(42% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Brief creativo</div>
          <textarea
            rows={3}
            placeholder="Describe qué quieres crear... Ej: foto de producto de lujo para una marca de relojes"
            value={brief}
            onChange={e => setBrief(e.target.value)}
            disabled={loading}
            style={{ width: '100%', padding: '8px 10px', background: 'oklch(100% 0 0 / 0.04)', border: 'none', borderRadius: 8, boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)', color: 'oklch(88% 0 0)', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 64, boxSizing: 'border-box' }}
          />
        </div>

        {/* Type + Count row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'oklch(42% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Tipo</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['image', 'video'].map(t => (
                <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: '5px', borderRadius: 7, border: 'none', background: type === t ? 'oklch(65% 0.2 265 / 0.2)' : 'oklch(100% 0 0 / 0.04)', boxShadow: type === t ? 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.4)' : 'inset 0 0 0 1px oklch(100% 0 0 / 0.08)', color: type === t ? 'oklch(78% 0.18 265)' : 'oklch(48% 0 0)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}>
                  {t === 'image' ? '🖼 Imagen' : '🎬 Video'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: 70 }}>
            <div style={{ fontSize: 9, color: 'oklch(42% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Cantidad</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setCount(c => Math.max(1, c - 1))} style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'oklch(100% 0 0 / 0.06)', color: 'oklch(60% 0 0)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: 13, color: 'oklch(88% 0 0)', fontWeight: 600, minWidth: 14, textAlign: 'center' }}>{count}</span>
              <button onClick={() => setCount(c => Math.min(5, c + 1))} style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'oklch(100% 0 0 / 0.06)', color: 'oklch(60% 0 0)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
        </div>

        {/* Style & client indicators */}
        {(selectedStyle || selectedClient) && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {selectedStyle && (
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'oklch(55% 0.18 265 / 0.15)', boxShadow: 'inset 0 0 0 1px oklch(55% 0.18 265 / 0.3)', color: 'oklch(65% 0.18 265)', fontFamily: 'IBM Plex Mono, monospace' }}>
                {selectedStyle.emoji} {selectedStyle.name}
              </span>
            )}
            {selectedClient && (
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'oklch(55% 0.18 155 / 0.12)', boxShadow: 'inset 0 0 0 1px oklch(55% 0.18 155 / 0.25)', color: 'oklch(65% 0.18 155)', fontFamily: 'IBM Plex Mono, monospace' }}>
                👤 {selectedClient.name}
              </span>
            )}
          </div>
        )}

        {/* Prompts preview */}
        {prompts.length > 0 && (
          <div style={{ padding: '8px 10px', background: 'oklch(100% 0 0 / 0.03)', borderRadius: 8, boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.06)', maxHeight: 100, overflowY: 'auto' }}>
            <div style={{ fontSize: 9, color: 'oklch(40% 0 0)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 4 }}>PROMPTS GENERADOS ({prompts.length})</div>
            {prompts.map((p, i) => (
              <div key={i} style={{ fontSize: 10, color: 'oklch(60% 0 0)', lineHeight: 1.5, marginBottom: 4, borderBottom: i < prompts.length - 1 ? '1px solid oklch(100% 0 0 / 0.04)' : 'none', paddingBottom: 4 }}>
                <span style={{ color: 'oklch(65% 0.2 265)' }}>{i + 1}.</span> {p.slice(0, 100)}{p.length > 100 ? '...' : ''}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ fontSize: 11, color: 'oklch(65% 0.2 25)', padding: '6px 10px', background: 'oklch(62% 0.22 25 / 0.1)', borderRadius: 7, boxShadow: 'inset 0 0 0 1px oklch(62% 0.22 25 / 0.2)' }}>{error}</div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handlePromptsOnly}
            disabled={!canRun}
            style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: canRun ? 'oklch(100% 0 0 / 0.07)' : 'oklch(20% 0 0)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)', color: canRun ? 'oklch(65% 0 0)' : 'oklch(35% 0 0)', fontSize: 10, fontWeight: 600, cursor: canRun ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 150ms' }}
          >Ver prompts</button>
          <button
            onClick={handleGenerate}
            disabled={!canRun}
            style={{ flex: 2, padding: '7px', borderRadius: 8, border: 'none', background: canRun ? 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))' : 'oklch(25% 0 0)', color: canRun ? 'oklch(97% 0 0)' : 'oklch(40% 0 0)', fontSize: 11, fontWeight: 700, cursor: canRun ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: canRun ? '0 4px 12px oklch(55% 0.2 265 / 0.25)' : 'none', transition: 'all 150ms' }}
          >{loading ? '◉ Generando...' : `▶ Generar ${count > 1 ? `×${count}` : ''}`}</button>
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
