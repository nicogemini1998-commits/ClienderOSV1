import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { StudioContext } from '../StudioContext.jsx';

const MODELS = [
  { id: 'flux-2/pro-text-to-image', label: 'Flux 2 Pro' },
  { id: 'flux-2/flex-text-to-image', label: 'Flux 2 Flex' },
  { id: 'google/nano-banana', label: 'Nano Banana (rápido)' },
];

const ASPECT_RATIOS = ['1:1', '4:5', '3:4', '16:9', '9:16', '5:4', '2:3', '3:2'];

function Collapsible({ title, open = false, children, icon = '▸' }) {
  const [isOpen, setIsOpen] = useState(open);
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none', border: 'none', color: 'oklch(72% 0 0)', fontSize: 11,
          fontWeight: 700, cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        <span style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms', display: 'inline-block' }}>{icon}</span>
        {title}
      </button>
      {isOpen && <div style={{ paddingLeft: 12, marginTop: 8 }}>{children}</div>}
    </div>
  );
}

function UploadArea({ label, maxFiles, fileTypes, onChange, files = [] }) {
  const inputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).slice(0, maxFiles - files.length);
    onChange([...files, ...newFiles.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: 'oklch(42% 0 0)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label} ({files.length}/{maxFiles})
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragActive(false); handleFiles(e.dataTransfer.files); }}
        style={{
          width: 50, height: 50, borderRadius: 8, background: isDragActive ? 'oklch(100% 0 0 / 0.08)' : 'oklch(100% 0 0 / 0.04)',
          border: `1px dashed oklch(100% 0 0 / ${isDragActive ? '0.2' : '0.1'})`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20,
          transition: 'all 150ms', color: 'oklch(65% 0 0)',
        }}
      >
        +
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={fileTypes}
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                width: 40, height: 40, borderRadius: 5, background: 'oklch(10% 0 0)',
                overflow: 'hidden', position: 'relative', cursor: 'pointer',
              }}
              onClick={() => { const updated = files.filter((_, idx) => idx !== i); onChange(updated); }}
            >
              <img src={f.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'oklch(0% 0 0 / 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 150ms' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <span style={{ color: 'oklch(90% 0 0)', fontSize: 14 }}>✕</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
      <span style={{ color: 'oklch(72% 0 0)' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 30, height: 16, borderRadius: 8, border: 'none', background: value ? 'oklch(60% 0.18 155)' : 'oklch(100% 0 0 / 0.1)',
          cursor: 'pointer', position: 'relative', transition: 'all 200ms',
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: value ? 16 : 2, width: 12, height: 12,
          borderRadius: 6, background: 'oklch(96% 0 0)', transition: 'left 200ms',
        }} />
      </button>
    </div>
  );
}

export function ImageNode({ id, data }) {
  const { selectedClient, selectedStyle, user, token, generateContent } = useContext(StudioContext);

  const [model, setModel] = useState('flux-2/pro-text-to-image');
  const [prompt, setPrompt] = useState('');
  const [useAgent, setUseAgent] = useState(false);
  const [brief, setBrief] = useState('');

  const [refImages, setRefImages] = useState([]);
  const [raw, setRaw] = useState(false);
  const [seedMode, setSeedMode] = useState('random');
  const [seedValue, setSeedValue] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [count, setCount] = useState(1);

  const [genStatus, setGenStatus] = useState('idle');
  const [tasks, setTasks] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const activeInput = useAgent ? brief : prompt;
  const canGenerate = activeInput.trim().length > 0 && genStatus !== 'submitting' && genStatus !== 'polling';

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenStatus('submitting');
    setErrorMsg('');
    setTasks([]);

    const refUrl = refImages.length > 0 ? refImages[0].preview : null;
    const body = {
      model, aspectRatio, resolution: '1K', count,
      imageInput: refUrl || null,
      seed: seedMode === 'fixed' && seedValue ? seedValue : null,
      style_id: selectedStyle?.id || null,
      client_id: selectedClient?.id || null,
      user_id: user?.id || null,
    };

    if (useAgent) {
      body.brief = brief.trim();
      body.use_agent = true;
    } else {
      body.prompt = prompt.trim();
      body.use_agent = false;
    }

    try {
      const resp = await fetch('/api/kie/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al iniciar generación');

      const initialTasks = (data.taskIds || []).map((taskId, i) => ({
        taskId, prompt: data.prompts?.[i] || '', status: 'pending', url: null,
      }));
      setTasks(initialTasks);
      setGenStatus('polling');

      // Polling
      const pollInterval = setInterval(async () => {
        const updated = await Promise.all(
          initialTasks.map(async (t) => {
            if (t.status !== 'pending') return t;
            try {
              const res = await fetch(`/api/kie/task/${t.taskId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const result = await res.json();
              if (result.status === 'completed' && result.url) {
                generateContent?.([{ url: result.url, type: 'image', prompt: t.prompt, created_at: new Date().toISOString() }]);
                fetch('/api/gallery', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ type: 'image', url: result.url, prompt: t.prompt, style_name: selectedStyle?.name || null, client_id: selectedClient?.id || null, user_id: user?.id || null, metadata: { model, aspectRatio } }),
                }).catch(() => {});
                return { ...t, status: 'done', url: result.url };
              }
              return t;
            } catch {}
            return t;
          })
        );
        setTasks(updated);
        if (updated.every(t => t.status !== 'pending')) {
          clearInterval(pollInterval);
          setGenStatus(updated.some(t => t.status === 'done') ? 'done' : 'error');
        }
      }, 4000);
    } catch (err) {
      setErrorMsg(err.message);
      setGenStatus('error');
    }
  };

  const statusColor = { idle: 'oklch(38% 0 0)', submitting: 'oklch(65% 0.2 265)', polling: 'oklch(65% 0.15 50)', done: 'oklch(65% 0.18 155)', error: 'oklch(65% 0.22 25)' }[genStatus];
  const statusLabel = { idle: '○ Listo', submitting: '◉ Iniciando...', polling: `◉ Generando ${doneCount}/${tasks.length}...`, done: `✓ Listo`, error: '✕ Error' }[genStatus];

  return (
    <div style={{
      width: 340, background: 'oklch(14% 0.015 265 / 0.92)', backdropFilter: 'blur(24px)', borderRadius: 14,
      boxShadow: `inset 0 0 0 1px oklch(65% 0.2 265 / 0.18), 0 8px 32px -4px oklch(0% 0 0 / 0.4)`,
      overflow: 'hidden', transition: 'box-shadow 400ms',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 13px 8px', borderBottom: '1px solid oklch(100% 0 0 / 0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, oklch(55% 0.22 265), oklch(42% 0.24 280))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🖼</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'oklch(92% 0 0)' }}>Imagen</div>
          <div style={{ fontSize: 9, color: statusColor, transition: 'color 300ms' }}>{statusLabel}</div>
        </div>
        <select value={model} onChange={e => setModel(e.target.value)} style={{ fontSize: 9, background: 'oklch(100% 0 0 / 0.07)', border: 'none', borderRadius: 6, color: 'oklch(72% 0.15 265)', padding: '4px 7px', cursor: 'pointer', fontFamily: 'inherit', outline: 'none', maxWidth: 130 }}>
          {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      <div style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
        {/* Prompt */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: 9, color: 'oklch(42% 0 0)', fontFamily: 'IBM Plex Mono', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Prompt</span>
            <button onClick={() => setUseAgent(!useAgent)} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, border: 'none', background: useAgent ? 'oklch(65% 0.2 265 / 0.18)' : 'oklch(100% 0 0 / 0.05)', color: useAgent ? 'oklch(72% 0.18 265)' : 'oklch(42% 0 0)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}>
              {useAgent ? '🎯 /shaq' : '✏ Directo'}
            </button>
          </div>
          <textarea
            rows={3}
            placeholder="Describe la imagen con detalle..."
            value={useAgent ? brief : prompt}
            onChange={e => useAgent ? setBrief(e.target.value) : setPrompt(e.target.value)}
            disabled={genStatus === 'submitting' || genStatus === 'polling'}
            style={{ width: '100%', padding: '8px 10px', background: 'oklch(100% 0 0 / 0.04)', border: 'none', borderRadius: 8, boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)', color: 'oklch(88% 0 0)', fontSize: 11, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 60, boxSizing: 'border-box', lineHeight: 1.5 }}
          />
        </div>

        {/* Escenarios */}
        <Collapsible title="Escenarios">
          {/* Estilo */}
          {selectedStyle && (
            <div style={{ marginBottom: 10, padding: '6px 8px', borderRadius: 6, background: 'oklch(65% 0.2 265 / 0.1)', boxShadow: 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.25)' }}>
              <div style={{ fontSize: 8, color: 'oklch(42% 0 0)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Estilo seleccionado</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12 }}>{selectedStyle.emoji}</span>
                <span style={{ fontSize: 10, color: 'oklch(72% 0.18 265)' }}>{selectedStyle.name}</span>
              </div>
            </div>
          )}

          {/* Imagen de referencia */}
          <UploadArea label="Imagen de referencia" maxFiles={1} fileTypes="image/*" files={refImages} onChange={setRefImages} />

          {/* Crudo */}
          <Toggle label="Crudo" value={raw} onChange={setRaw} />

          {/* Semilla */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: 'oklch(42% 0 0)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Semilla</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setSeedMode(m => m === 'random' ? 'fixed' : 'random')} style={{ flex: 1, padding: '3px 6px', borderRadius: 5, border: 'none', background: seedMode === 'fixed' ? 'oklch(65% 0.2 265 / 0.15)' : 'oklch(100% 0 0 / 0.05)', color: seedMode === 'fixed' ? 'oklch(70% 0.18 265)' : 'oklch(40% 0 0)', fontSize: 9, cursor: 'pointer', fontFamily: 'IBM Plex Mono', transition: 'all 150ms' }}>
                {seedMode === 'random' ? '∞ Aleatorio' : '# Fijo'}
              </button>
              {seedMode === 'fixed' && (
                <input type="number" placeholder="0" value={seedValue} onChange={e => setSeedValue(e.target.value)} style={{ width: 60, padding: '3px 6px', background: 'oklch(100% 0 0 / 0.04)', border: 'none', borderRadius: 5, boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)', color: 'oklch(85% 0 0)', fontSize: 10, fontFamily: 'IBM Plex Mono', outline: 'none' }} />
              )}
            </div>
          </div>

          {/* Relación de aspecto */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: 'oklch(42% 0 0)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Relación de aspecto</div>
            <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} style={{ width: '100%', padding: '5px 8px', background: 'oklch(100% 0 0 / 0.04)', border: 'none', borderRadius: 6, boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)', color: 'oklch(85% 0 0)', fontSize: 10, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
              {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Cantidad */}
          <div style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 9, color: 'oklch(42% 0 0)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cantidad</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => setCount(c => Math.max(1, c - 1))} style={{ width: 24, height: 24, borderRadius: 5, border: 'none', background: 'oklch(100% 0 0 / 0.06)', color: 'oklch(65% 0 0)', cursor: 'pointer', fontSize: 13 }}>−</button>
              <span style={{ fontSize: 13, color: 'oklch(88% 0 0)', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{count}</span>
              <button onClick={() => setCount(c => Math.min(4, c + 1))} style={{ width: 24, height: 24, borderRadius: 5, border: 'none', background: 'oklch(100% 0 0 / 0.06)', color: 'oklch(65% 0 0)', cursor: 'pointer', fontSize: 13 }}>+</button>
            </div>
          </div>
        </Collapsible>

        {errorMsg && <div style={{ fontSize: 10, color: 'oklch(68% 0.2 25)', padding: '6px 9px', background: 'oklch(62% 0.22 25 / 0.08)', borderRadius: 7, boxShadow: 'inset 0 0 0 1px oklch(62% 0.22 25 / 0.2)', lineHeight: 1.4 }}>{errorMsg}</div>}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            padding: '9px', borderRadius: 9, border: 'none',
            background: canGenerate ? 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))' : 'oklch(20% 0 0)',
            color: canGenerate ? 'oklch(97% 0 0)' : 'oklch(38% 0 0)',
            fontSize: 11, fontWeight: 700, cursor: canGenerate ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', letterSpacing: '-0.01em',
            boxShadow: canGenerate ? '0 4px 14px oklch(55% 0.2 265 / 0.3)' : 'none',
            transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          ▶ Generar imagen{count > 1 ? ` ×${count}` : ''}
        </button>
      </div>

      <Handle type="source" position={Position.Right} style={{ background: 'oklch(65% 0.2 265)', borderColor: 'oklch(45% 0.2 265)' }} />
    </div>
  );
}
