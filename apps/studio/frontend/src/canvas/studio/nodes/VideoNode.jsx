import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { StudioContext } from '../StudioContext.jsx';

const RESOLUTIONS = ['480p', '720p', '1080p'];
const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4'];
const DURATIONS = [4, 5, 7, 10, 15];

function Label({ children }) {
  return (
    <div style={{ fontSize: 8, color: 'oklch(42% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 8, color: 'oklch(50% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ flex: 1, height: 1, background: 'oklch(100% 0 0 / 0.06)' }} />
      {children}
      <div style={{ flex: 1, height: 1, background: 'oklch(100% 0 0 / 0.06)' }} />
    </div>
  );
}

function ChipRow({ options, value, onChange, accent = 265 }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {options.map(opt => (
        <button
          key={opt}
          className="nodrag"
          onClick={() => onChange(opt)}
          style={{ padding: '2px 6px', borderRadius: 4, border: 'none', background: value === opt ? `oklch(65% 0.2 ${accent} / 0.2)` : 'oklch(100% 0 0 / 0.04)', boxShadow: value === opt ? `inset 0 0 0 1px oklch(65% 0.2 ${accent} / 0.4)` : 'inset 0 0 0 1px oklch(100% 0 0 / 0.07)', color: value === opt ? `oklch(75% 0.18 ${accent})` : 'oklch(42% 0 0)', fontSize: 8, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', transition: 'all 120ms' }}
        >{opt}</button>
      ))}
    </div>
  );
}

function FileUploadSlot({ label, type, value, onChange, maxCount = 1 }) {
  const inputRef = useRef(null);
  const files = Array.isArray(value) ? value : (value ? [value] : []);
  const canAdd = maxCount === 1 || files.length < maxCount;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (maxCount === 1) {
        onChange(evt.target.result);
      } else {
        onChange([...files, evt.target.result]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeFile = (idx) => {
    if (maxCount === 1) {
      onChange('');
    } else {
      onChange(files.filter((_, i) => i !== idx));
    }
  };

  const getAccept = () => {
    if (type === 'image') return 'image/*';
    if (type === 'video') return 'video/*';
    if (type === 'audio') return 'audio/*';
    return '*/*';
  };

  const getThumbnail = (file) => {
    if (type === 'image') {
      return <img src={file} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    }
    return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'oklch(20% 0 0)' }}>
      {type === 'video' ? '▶' : type === 'audio' ? '♪' : '?'}
    </div>;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Label>{label}</Label>
        {maxCount > 1 && <span style={{ fontSize: 7, color: 'oklch(42% 0 0)' }}>{files.length}/{maxCount}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: maxCount === 1 ? '1fr' : 'repeat(5, 1fr)', gap: 4 }}>
        {files.map((file, idx) => (
          <div
            key={idx}
            style={{
              position: 'relative', aspectRatio: '1', borderRadius: 7, overflow: 'hidden',
              background: 'oklch(10% 0 0)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)',
              cursor: 'pointer', transition: 'box-shadow 150ms'
            }}
            onClick={() => removeFile(idx)}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(62% 0.22 25 / 0.4), 0 0 12px oklch(62% 0.22 25 / 0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)'; }}
          >
            {getThumbnail(file)}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, background: 'oklch(0% 0 0 / 0.5)', transition: 'opacity 150ms' }} onMouseEnter={e => { e.currentTarget.style.opacity = 1; }} onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}>
              <span style={{ fontSize: 9, color: 'oklch(90% 0 0)' }}>✕</span>
            </div>
          </div>
        ))}
        {canAdd && (
          <button
            className="nodrag"
            onClick={() => inputRef.current?.click()}
            style={{
              aspectRatio: '1', borderRadius: 7, border: 'none',
              background: 'oklch(100% 0 0 / 0.04)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.08)',
              color: 'oklch(55% 0 0)', cursor: 'pointer', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 150ms'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.07)'; e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(100% 0 0 / 0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.04)'; e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(100% 0 0 / 0.08)'; }}
          >
            +
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={getAccept()}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export function VideoNode({ id, data }) {
  const { selectedClient, selectedStyle, user, token, generateContent } = useContext(StudioContext);
  const { deleteElements } = useReactFlow();

  const [prompt, setPrompt] = useState('');
  const [useAgent, setUseAgent] = useState(false);
  const [brief, setBrief] = useState('');

  const [resolution, setResolution] = useState('720p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState(5);
  const [keyFrames, setKeyFrames] = useState([]);
  const [refVideos, setRefVideos] = useState([]);
  const [refAudio, setRefAudio] = useState([]);
  const [syncAudio, setSyncAudio] = useState(false);
  const [resumeLastFrame, setResumeLastFrame] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [contentCheck, setContentCheck] = useState(false);
  const [count, setCount] = useState(1);

  const [genStatus, setGenStatus] = useState('idle');
  const [tasks, setTasks] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const pollRef = useRef(null);
  const prevAutoTriggerRef = useRef(null);

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const activeInput = useAgent ? brief : prompt;
  const canGenerate = activeInput.trim().length > 0 && genStatus !== 'submitting' && genStatus !== 'polling';

  const checkTasks = useCallback(async (currentTasks) => {
    const pending = currentTasks.filter(t => t.status === 'pending');
    if (pending.length === 0) return currentTasks;

    const updated = [...currentTasks];
    for (const task of pending) {
      try {
        const resp = await fetch(`/api/kie/task/${task.taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await resp.json();
        const idx = updated.findIndex(t => t.taskId === task.taskId);
        if (data.status === 'completed' && data.url) {
          updated[idx] = { ...updated[idx], status: 'done', url: data.url };
          fetch('/api/gallery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              type: 'video', url: data.url, prompt: task.prompt,
              style_name: selectedStyle?.name || null, agent: useAgent ? '/shaq' : null,
              client_id: selectedClient?.id || null, user_id: user?.id || null,
              metadata: { resolution, aspectRatio, duration, syncAudio, resumeLastFrame, webSearch, contentCheck },
            }),
          }).catch(() => {});
          generateContent?.([{ url: data.url, type: 'video', prompt: task.prompt, created_at: new Date().toISOString() }]);
        } else if (data.status === 'failed') {
          updated[idx] = { ...updated[idx], status: 'error' };
        }
      } catch {}
    }
    return updated;
  }, [token, selectedStyle, selectedClient, user, resolution, aspectRatio, duration, syncAudio, resumeLastFrame, webSearch, contentCheck, useAgent, generateContent]);

  // Auto-trigger on incoming prompt from connected PromptNode
  useEffect(() => {
    if (!data.autoTrigger) return;
    if (data.autoTrigger === prevAutoTriggerRef.current) return;
    if (!data.incomingPrompt?.trim()) return;
    if (genStatus === 'submitting' || genStatus === 'polling') return;

    prevAutoTriggerRef.current = data.autoTrigger;
    handleGenerate(data.incomingPrompt);
  }, [data.autoTrigger, data.incomingPrompt, genStatus]);

  useEffect(() => {
    if (genStatus !== 'polling') return;
    pollRef.current = setInterval(async () => {
      setTasks(prev => {
        checkTasks(prev).then(updated => {
          setTasks(updated);
          const allDone = updated.every(t => t.status !== 'pending');
          if (allDone) {
            clearInterval(pollRef.current);
            setGenStatus(updated.some(t => t.status === 'done') ? 'done' : 'error');
          }
        });
        return prev;
      });
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [genStatus, checkTasks]);

  const handleGenerate = async (explicitPrompt = null) => {
    const resolvedPrompt = explicitPrompt ?? (useAgent ? brief : prompt);
    if (!resolvedPrompt.trim()) return;
    setGenStatus('submitting');
    setErrorMsg('');
    setTasks([]);

    const body = {
      resolution, aspectRatio, duration, count,
      keyFrames: keyFrames.length > 0 ? keyFrames : null,
      refVideos: refVideos.length > 0 ? refVideos : null,
      refAudio: refAudio.length > 0 ? refAudio : null,
      syncAudio, resumeLastFrame, webSearch, contentCheck,
      style_id: selectedStyle?.id || null,
      client_id: selectedClient?.id || null,
      user_id: user?.id || null,
      prompt: resolvedPrompt.trim(),
      use_agent: explicitPrompt ? false : useAgent,
    };

    try {
      const resp = await fetch('/api/kie/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Error al iniciar generación');

      const initialTasks = (data.taskIds || []).map((taskId, i) => ({
        taskId, prompt: data.prompts?.[i] || body.prompt || body.brief, status: 'pending', url: null,
      }));
      setTasks(initialTasks);
      setGenStatus('polling');
    } catch (err) {
      setErrorMsg(err.message);
      setGenStatus('error');
    }
  };

  const statusColor = {
    idle: 'oklch(38% 0 0)', submitting: 'oklch(65% 0.2 155)',
    polling: 'oklch(65% 0.15 50)', done: 'oklch(65% 0.18 155)', error: 'oklch(65% 0.22 25)',
  }[genStatus];

  const statusLabel = {
    idle: '○ Listo',
    submitting: '◉ Iniciando...',
    polling: `◉ Generando... ${doneCount}/${tasks.length} · hasta ${duration * tasks.length * 4}s`,
    done: `✓ ${doneCount} video${doneCount > 1 ? 's' : ''} listo${doneCount > 1 ? 's' : ''}`,
    error: '✕ Error',
  }[genStatus];

  return (
    <div style={{
      width: 310,
      background: 'oklch(14% 0.015 155 / 0.9)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderRadius: 14,
      boxShadow: `inset 0 0 0 1px oklch(55% 0.18 155 / ${genStatus === 'polling' ? '0.5' : '0.22'}), 0 8px 32px -4px oklch(0% 0 0 / 0.4)`,
      transition: 'box-shadow 400ms cubic-bezier(0.16,1,0.3,1)',
    }}>
      {/* Header */}
      <div style={{ padding: '8px 11px 6px', borderBottom: '1px solid oklch(100% 0 0 / 0.07)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, oklch(55% 0.22 155), oklch(42% 0.24 165))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>🎬</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'oklch(92% 0 0)' }}>Video</div>
          <div style={{ fontSize: 8, color: statusColor, fontFamily: 'IBM Plex Mono, monospace', marginTop: 0.5, transition: 'color 300ms' }}>{statusLabel}</div>
        </div>
        <div style={{ fontSize: 8, color: 'oklch(55% 0.15 155)', fontFamily: 'IBM Plex Mono, monospace', padding: '2px 5px', borderRadius: 4, background: 'oklch(55% 0.18 155 / 0.12)', boxShadow: 'inset 0 0 0 1px oklch(55% 0.18 155 / 0.25)' }}>
          2.0
        </div>
        <button
          className="nodrag"
          onClick={() => deleteElements({ nodes: [{ id }] })}
          style={{ width: 20, height: 20, padding: 0, borderRadius: 4, border: 'none', background: 'oklch(62% 0.22 25 / 0.15)', color: 'oklch(65% 0.2 25)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
          onMouseEnter={e => e.currentTarget.style.background = 'oklch(62% 0.22 25 / 0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'oklch(62% 0.22 25 / 0.15)'}
        >✕</button>
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {/* Context badges */}
        {(selectedStyle || selectedClient) && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {selectedStyle && (
              <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 12, background: 'oklch(55% 0.18 155 / 0.12)', boxShadow: 'inset 0 0 0 1px oklch(55% 0.18 155 / 0.25)', color: 'oklch(65% 0.18 155)', fontFamily: 'IBM Plex Mono, monospace' }}>
                {selectedStyle.emoji} {selectedStyle.name}
              </span>
            )}
            {selectedClient && (
              <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 12, background: 'oklch(55% 0.18 265 / 0.1)', boxShadow: 'inset 0 0 0 1px oklch(55% 0.18 265 / 0.22)', color: 'oklch(65% 0.18 265)', fontFamily: 'IBM Plex Mono, monospace' }}>
                👤 {selectedClient.name}
              </span>
            )}
          </div>
        )}

        {/* Prompt */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3, gap: 3 }}>
            <Label>{useAgent ? 'Brief creativo' : 'Prompt'}</Label>
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                className="nodrag"
                onClick={() => setUseAgent(a => !a)}
                style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, border: 'none', background: useAgent ? 'oklch(55% 0.18 155 / 0.18)' : 'oklch(100% 0 0 / 0.05)', boxShadow: useAgent ? 'inset 0 0 0 1px oklch(55% 0.18 155 / 0.35)' : 'inset 0 0 0 1px oklch(100% 0 0 / 0.08)', color: useAgent ? 'oklch(68% 0.18 155)' : 'oklch(42% 0 0)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
              >{useAgent ? '🎯 /shaq' : '✏ Directo'}</button>
              <button
                className="nodrag"
                onClick={() => setIsConfigOpen(o => !o)}
                style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, border: 'none', background: isConfigOpen ? 'oklch(55% 0.18 155 / 0.18)' : 'oklch(100% 0 0 / 0.05)', boxShadow: isConfigOpen ? 'inset 0 0 0 1px oklch(55% 0.18 155 / 0.35)' : 'inset 0 0 0 1px oklch(100% 0 0 / 0.08)', color: isConfigOpen ? 'oklch(68% 0.18 155)' : 'oklch(42% 0 0)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 2 }}
              >
                <span style={{ transform: isConfigOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 250ms cubic-bezier(0.16,1,0.3,1)', display: 'inline-block', fontSize: 6 }}>▶</span>
                Config
              </button>
            </div>
          </div>
          <textarea
            className="nodrag"
            rows={2}
            placeholder={useAgent ? 'Describe el concepto del video...' : 'Escribe el prompt...'}
            value={useAgent ? brief : prompt}
            onChange={e => useAgent ? setBrief(e.target.value) : setPrompt(e.target.value)}
            disabled={genStatus === 'submitting' || genStatus === 'polling'}
            style={{ width: '100%', padding: '6px 8px', background: 'oklch(100% 0 0 / 0.04)', border: 'none', borderRadius: 6, boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)', color: 'oklch(88% 0 0)', fontSize: 9, fontFamily: 'inherit', outline: 'none', resize: 'vertical', minHeight: 45, boxSizing: 'border-box', lineHeight: 1.4 }}
          />
        </div>

        {/* Config Panel - Collapsible */}
        <div style={{
          maxHeight: isConfigOpen ? '1200px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div style={{ paddingTop: 7, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {/* Settings grid */}
            <div>
              <SectionTitle>Configuración</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div>
                  <Label>Resolución</Label>
                  <ChipRow options={RESOLUTIONS} value={resolution} onChange={setResolution} accent={155} />
                </div>
                <div>
                  <Label>Proporción</Label>
                  <ChipRow options={ASPECT_RATIOS} value={aspectRatio} onChange={setAspectRatio} accent={155} />
                </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <Label>Duración</Label>
              <ChipRow options={DURATIONS.map(d => `${d}s`)} value={`${duration}s`} onChange={d => setDuration(Number(d.replace('s', '')))} accent={155} />
            </div>

            {/* Media uploads */}
            <div>
              <SectionTitle>Fotogramas clave</SectionTitle>
              <FileUploadSlot label="Imágenes clave" type="image" value={keyFrames} onChange={setKeyFrames} maxCount={10} />
            </div>

            <div>
              <SectionTitle>Vídeos de referencia</SectionTitle>
              <FileUploadSlot label="Vídeos" type="video" value={refVideos} onChange={setRefVideos} maxCount={2} />
            </div>

            <div>
              <SectionTitle>Audio de referencia</SectionTitle>
              <FileUploadSlot label="Audio" type="audio" value={refAudio} onChange={setRefAudio} maxCount={2} />
            </div>

            {/* Toggles */}
            <div>
              <SectionTitle>Opciones</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { label: '🔊 Audio sincronizado', state: syncAudio, setState: setSyncAudio },
                  { label: '↩ Retomar último fotograma', state: resumeLastFrame, setState: setResumeLastFrame },
                  { label: '🔍 Búsqueda en línea', state: webSearch, setState: setWebSearch },
                  { label: '✓ Verificar contenido', state: contentCheck, setState: setContentCheck },
                ].map(({ label, state, setState }) => (
                  <button
                    key={label}
                    className="nodrag"
                    onClick={() => setState(s => !s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '4px 6px',
                      borderRadius: 6, border: 'none',
                      background: state ? 'oklch(55% 0.18 155 / 0.12)' : 'oklch(100% 0 0 / 0.04)',
                      boxShadow: state ? 'inset 0 0 0 1px oklch(55% 0.18 155 / 0.25)' : 'inset 0 0 0 1px oklch(100% 0 0 / 0.08)',
                      color: state ? 'oklch(68% 0.18 155)' : 'oklch(42% 0 0)',
                      cursor: 'pointer', fontSize: 8, fontFamily: 'inherit',
                      transition: 'all 150ms', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 8 }}>{state ? '☑' : '☐'}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 9, color: 'oklch(42% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cantidad</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, color: 'oklch(40% 0 0)', fontFamily: 'IBM Plex Mono, monospace' }}>×</span>
                <button className="nodrag" onClick={() => setCount(c => Math.max(1, c - 1))} style={{ width: 20, height: 20, borderRadius: 5, border: 'none', background: 'oklch(100% 0 0 / 0.07)', color: 'oklch(65% 0 0)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: 12, color: 'oklch(88% 0 0)', fontWeight: 700, minWidth: 14, textAlign: 'center' }}>{count}</span>
                <button className="nodrag" onClick={() => setCount(c => Math.min(3, c + 1))} style={{ width: 20, height: 20, borderRadius: 5, border: 'none', background: 'oklch(100% 0 0 / 0.07)', color: 'oklch(65% 0 0)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {tasks.some(t => t.status === 'done') && (
          <div>
            <div style={{ fontSize: 8, color: 'oklch(45% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              {tasks.filter(t => t.status === 'done').length} video{tasks.filter(t => t.status === 'done').length > 1 ? 's' : ''} generado{tasks.filter(t => t.status === 'done').length > 1 ? 's' : ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 6 }}>
              {tasks.filter(t => t.status === 'done' && t.url).map((t) => (
                <div
                  key={t.taskId}
                  style={{
                    position: 'relative',
                    aspectRatio: '16 / 9',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'oklch(10% 0 0)',
                    boxShadow: 'inset 0 0 0 1px oklch(55% 0.18 155 / 0.2), 0 4px 12px oklch(0% 0 0 / 0.3)',
                    cursor: 'pointer',
                    animation: 'fadeIn 300ms ease forwards',
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(55% 0.18 155 / 0.4), 0 8px 24px oklch(55% 0.18 155 / 0.2)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(55% 0.18 155 / 0.2), 0 4px 12px oklch(0% 0 0 / 0.3)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onClick={() => {
                    const modal = document.createElement('div');
                    modal.style.cssText = 'position:fixed;inset:0;background:oklch(5% 0 0 / 0.95);display:flex;align-items:center;justify-content:center;zIndex:9999;cursor:pointer;';
                    const video = document.createElement('video');
                    video.src = t.url;
                    video.controls = true;
                    video.autoplay = true;
                    video.style.cssText = 'maxWidth:90vw;maxHeight:90vh;borderRadius:12px;';
                    modal.appendChild(video);
                    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
                    document.body.appendChild(modal);
                  }}
                >
                  <video src={t.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  <div style={{ position: 'absolute', inset: 0, background: 'oklch(0% 0 0 / 0)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 200ms' }} onMouseEnter={e => { e.currentTarget.style.background = 'oklch(0% 0 0 / 0.3)'; e.currentTarget.style.opacity = 1; }} onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}>
                    <span style={{ fontSize: 28, color: 'oklch(90% 0 0)' }}>▶</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task progress for pending/errors */}
        {tasks.some(t => t.status !== 'done') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tasks.filter(t => t.status !== 'done').map((t) => (
              <div key={t.taskId} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 6px', borderRadius: 6, background: 'oklch(100% 0 0 / 0.03)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.06)' }}>
                <div style={{ width: 5, height: 5, borderRadius: 3, background: t.status === 'error' ? 'oklch(62% 0.22 25)' : 'oklch(60% 0.18 155)', boxShadow: t.status === 'pending' ? '0 0 4px oklch(60% 0.18 155 / 0.6)' : 'none', flexShrink: 0, transition: 'background 300ms' }} />
                <span style={{ fontSize: 7, color: 'oklch(50% 0 0)', fontFamily: 'IBM Plex Mono, monospace', flex: 1 }}>
                  {t.status === 'error' ? '✕ Error' : `Procesando...`}
                </span>
              </div>
            ))}
          </div>
        )}

        {errorMsg && (
          <div style={{ fontSize: 8, color: 'oklch(68% 0.2 25)', padding: '4px 7px', background: 'oklch(62% 0.22 25 / 0.08)', borderRadius: 6, boxShadow: 'inset 0 0 0 1px oklch(62% 0.22 25 / 0.2)', lineHeight: 1.3 }}>{errorMsg}</div>
        )}

        {/* Generate */}
        <button
          className="nodrag"
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            padding: '6px', borderRadius: 8, border: 'none',
            background: canGenerate
              ? 'linear-gradient(135deg, oklch(55% 0.2 155), oklch(46% 0.22 165))'
              : 'oklch(20% 0 0)',
            color: canGenerate ? 'oklch(97% 0 0)' : 'oklch(38% 0 0)',
            fontSize: 9, fontWeight: 700, cursor: canGenerate ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', letterSpacing: '-0.01em',
            boxShadow: canGenerate ? '0 4px 14px oklch(55% 0.2 155 / 0.3)' : 'none',
            transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {genStatus === 'submitting' ? '◉ Iniciando...'
            : genStatus === 'polling' ? `◉ ${doneCount}/${tasks.length}...`
            : `▶ Generar${count > 1 ? ` ×${count}` : ''}`}
        </button>
      </div>

      <Handle type="target" position={Position.Left} id="prompt-in" style={{ background: 'oklch(65% 0.18 155 / 0.6)', borderColor: 'oklch(45% 0.18 155)', width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} style={{ background: 'oklch(65% 0.18 155)', borderColor: 'oklch(45% 0.18 155)' }} />
    </div>
  );
}
