import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow, useNodesState, useEdgesState, Background, MiniMap,
  ReactFlowProvider, addEdge, useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../canvas.css';

import { StudioContext } from './StudioContext.jsx';
import { PromptNode } from './nodes/PromptNode.jsx';
import { ImageNode } from './nodes/ImageNode.jsx';
import { VideoNode } from './nodes/VideoNode.jsx';
import { MediaOutputNode } from './nodes/MediaOutputNode.jsx';
import { StylesPanel } from './panels/StylesPanel.jsx';
import { GalleryPanel } from './panels/GalleryPanel.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { StudioEdge } from './edges/StudioEdge.jsx';
import { NoteNode } from './nodes/NoteNode.jsx';
import { useGallery } from '../../hooks/useGallery.js';

const nodeTypes = {
  prompt: PromptNode,
  image: ImageNode,
  video: VideoNode,
  mediaOutput: MediaOutputNode,
  note: NoteNode,
};

const edgeTypes = { studio: StudioEdge };

const INITIAL_NODES = [];
const INITIAL_EDGES = [];

const CanvasInner = React.forwardRef(function CanvasInnerComponent({ editMode, userId, token, initialTemplateId }, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const { fitView, screenToFlowPosition } = useReactFlow();
  const [menuPos, setMenuPos] = useState(null);
  const suppressNextPaneClick = useRef(false);
  const connectingFrom = useRef(null);

  // Auto-load initial template
  React.useEffect(() => {
    if (!initialTemplateId || !token) return;
    fetch(`/api/content-templates/${initialTemplateId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(template => {
        const cleanedNodes = (template.nodes || []).map(n => {
          const { incomingPrompt, autoTrigger, ...rest } = n.data || {};
          return { ...n, data: rest };
        });
        setNodes(cleanedNodes.length ? cleanedNodes : INITIAL_NODES);
        setEdges(template.edges || INITIAL_EDGES);
        setTimeout(() => fitView({ padding: 0.2, duration: 350 }), 80);
      })
      .catch(() => {});
  }, [initialTemplateId, token]);

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, type: 'studio' }, eds));
    connectingFrom.current = null;
  }, []);

  const onConnectStart = useCallback((_, { nodeId, handleId, handleType }) => {
    connectingFrom.current = { nodeId, handleId, handleType };
  }, []);

  const addNode = useCallback((type) => {
    const id = `${type}-${Date.now()}`;
    setNodes(ns => [...ns, {
      id, type,
      position: { x: 80 + Math.random() * 120, y: 80 + ns.length * 80 },
      data: {},
    }]);
  }, []);

  const onConnectEnd = useCallback((event) => {
    const from = connectingFrom.current;
    if (!from) return;
    connectingFrom.current = null;

    // If dropped on a handle the onConnect already fired — target will be a handle element
    const targetIsHandle = event.target?.closest?.('.react-flow__handle') !== null;
    if (targetIsHandle) return;

    // Dropped on empty canvas → show menu
    const rfBounds = document.querySelector('.react-flow')?.getBoundingClientRect();
    const relX = event.clientX - (rfBounds?.left ?? 0);
    const relY = event.clientY - (rfBounds?.top ?? 0);
    const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY }, { snapToGrid: false });

    suppressNextPaneClick.current = true;
    setMenuPos({
      ...flowPos,
      screenX: relX,
      screenY: relY,
      sourceNodeId: from.nodeId,
      sourceHandleId: from.handleId ?? null,
    });
  }, [screenToFlowPosition]);

  const handlePaneClick = useCallback(() => {
    if (suppressNextPaneClick.current) {
      suppressNextPaneClick.current = false;
      return;
    }
    setMenuPos(null);
  }, []);


  const TARGET_HANDLES = { image: 'prompt-in', video: 'prompt-in', note: 'note-in', prompt: 'prompts-in' };

  const createNodeFromMenu = useCallback((type) => {
    if (!menuPos) return;
    const id = `${type}-${Date.now()}`;
    setNodes(ns => [...ns, {
      id, type,
      position: { x: menuPos.x, y: menuPos.y },
      data: {},
    }]);
    // Auto-connect edge from source handle to new node's input
    if (menuPos.sourceNodeId) {
      setEdges(eds => addEdge({
        source: menuPos.sourceNodeId,
        sourceHandle: menuPos.sourceHandleId,
        target: id,
        targetHandle: TARGET_HANDLES[type] ?? null,
        type: 'studio',
      }, eds));
    }
    setMenuPos(null);
  }, [menuPos, setNodes, setEdges]);


  React.useImperativeHandle(ref, () => ({
    async save(name) {
      const response = await fetch('/api/content-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, nodes, edges }),
      });
      if (!response.ok) throw new Error(`Save failed: ${response.statusText}`);
      return response.json();
    },
    async load(templateId) {
      const response = await fetch(`/api/content-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Load failed: ${response.statusText}`);
      const template = await response.json();
      const cleanedNodes = template.nodes.map(n => {
        const { incomingPrompt, autoTrigger, ...rest } = n.data || {};
        return { ...n, data: rest };
      });
      setNodes(cleanedNodes);
      setEdges(template.edges);
      fitView({ padding: 0.2 });
    },
    async saveToExisting(templateId, name) {
      const response = await fetch(`/api/content-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, nodes, edges }),
      });
      if (!response.ok) throw new Error(`Save failed: ${response.statusText}`);
      return response.json();
    },
    async fetchTemplates() {
      const response = await fetch('/api/content-templates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
      return response.json();
    },
  }));

  const onNodesDelete = useCallback((deleted) => {
    // React Flow handles edge cleanup automatically
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onConnectStart={onConnectStart}
      onConnectEnd={onConnectEnd}
      onPaneClick={handlePaneClick}
      onNodesDelete={onNodesDelete}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2.5}
      panOnScroll
      zoomOnScroll
      panOnDrag={[1, 2]}
      deleteKeyCode={['Delete', 'Backspace']}
      selectionOnDrag={editMode}
      connectOnClick
    >
      <Background variant="dots" gap={24} size={1} color="rgba(255,255,255,0.04)" />
      <MiniMap
        nodeColor={n => n.type === 'image' ? 'oklch(55% 0.2 265)' : n.type === 'video' ? 'oklch(55% 0.18 155)' : 'oklch(40% 0 0)'}
        maskColor="rgba(5,5,8,0.75)"
        style={{ bottom: 16 }}
      />
      {/* Add node buttons */}
      <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: 6 }}>
        {[
          { type: 'image', label: '🖼 + Imagen', color: '265' },
          { type: 'video', label: '🎬 + Video', color: '155' },
          { type: 'prompt', label: '📝 + Prompt', color: '50' },
          { type: 'note', label: '📌 + Nota', color: '85' },
        ].map(({ type, label, color }) => (
          <button
            key={type}
            onClick={() => addNode(type)}
            style={{
              padding: '7px 14px', borderRadius: 9, border: 'none',
              background: 'oklch(14% 0.01 250 / 0.92)',
              backdropFilter: 'blur(16px)',
              boxShadow: `inset 0 0 0 1px oklch(100% 0 0 / 0.09), 0 4px 14px -2px oklch(0% 0 0 / 0.4)`,
              color: `oklch(65% 0.2 ${color})`, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'oklch(18% 0.01 250 / 0.98)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'oklch(14% 0.01 250 / 0.92)'; }}
          >{label}</button>
        ))}
      </div>
      {/* Context menu for creating nodes from edges */}
      {menuPos && (
        <div style={{
          position: 'absolute',
          top: menuPos.screenY,
          left: menuPos.screenX,
          zIndex: 1000,
          background: 'oklch(13% 0.015 250 / 0.97)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          borderRadius: 14,
          boxShadow: '0 16px 48px -8px oklch(0% 0 0 / 0.6), 0 4px 16px oklch(0% 0 0 / 0.3), inset 0 0 0 1px oklch(100% 0 0 / 0.1)',
          minWidth: 190,
          overflow: 'hidden',
          animation: 'node-enter 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Header label */}
          <div style={{
            padding: '9px 14px 7px',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'oklch(40% 0 0)',
            borderBottom: '1px solid oklch(100% 0 0 / 0.06)',
          }}>
            Añadir nodo
          </div>

          {[
            {
              type: 'image',
              label: 'Imagen',
              desc: 'Genera imágenes con IA',
              iconBg: 'oklch(45% 0.22 265 / 0.18)',
              iconColor: 'oklch(72% 0.2 265)',
              borderColor: 'oklch(55% 0.2 265 / 0.35)',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
            },
            {
              type: 'video',
              label: 'Video',
              desc: 'Genera clips de video',
              iconBg: 'oklch(40% 0.18 155 / 0.18)',
              iconColor: 'oklch(68% 0.2 155)',
              borderColor: 'oklch(50% 0.18 155 / 0.35)',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="15" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M17 9l5-3v12l-5-3V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                </svg>
              ),
            },
            {
              type: 'note',
              label: 'Nota',
              desc: 'Post-it de anotaciones',
              iconBg: 'oklch(82% 0.12 85 / 0.2)',
              iconColor: 'oklch(55% 0.14 85)',
              borderColor: 'oklch(68% 0.12 85 / 0.4)',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16v12l-4 4H4V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  <path d="M16 16v4l4-4h-4z" fill="currentColor" opacity="0.5"/>
                  <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="8" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ),
            },
          ].map((opt, i, arr) => (
            <button
              key={opt.type}
              onClick={() => createNodeFromMenu(opt.type)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                borderBottom: i < arr.length - 1 ? '1px solid oklch(100% 0 0 / 0.05)' : 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'oklch(100% 0 0 / 0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Icon block */}
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: opt.iconBg,
                border: `1px solid ${opt.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: opt.iconColor,
                flexShrink: 0,
              }}>
                {opt.icon}
              </div>
              {/* Text */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'oklch(88% 0 0)', lineHeight: 1.3 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 10, color: 'oklch(42% 0 0)', marginTop: 1 }}>
                  {opt.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

    </ReactFlow>
  );
});

export function ContentStudioCanvas({ onSwitchTool, onBack, initialTemplateId, spaceName, selectedClient, onSelectClient }) {
  const { user, token, logout } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [stylesPanelOpen, setStylesPanelOpen] = useState(false);
  const [galleryPanelOpen, setGalleryPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef();

  const { items: galleryItems, addItem, deleteItem, load: loadGallery } = useGallery();
  const recentMedia = galleryItems.slice(0, 20);

  React.useEffect(() => {
    loadGallery();
  }, [selectedClient, loadGallery]);

  const generateContent = useCallback((results) => {
    results.filter(r => r.url).forEach(r => addItem(r));
  }, [addItem]);

  const handleSaveCanvas = useCallback(async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      if (initialTemplateId) {
        await canvasRef.current.saveToExisting(initialTemplateId, spaceName || 'Espacio sin nombre');
      } else {
        const name = prompt('Nombre del espacio:');
        if (!name) { setSaving(false); return; }
        await canvasRef.current.save(name);
      }
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [initialTemplateId, spaceName]);

  const handleLoadTemplates = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      const templates = await canvasRef.current.fetchTemplates();
      setSavedTemplates(templates);
      setShowLoadMenu(prev => !prev);
    } catch (err) {
      alert('Error al cargar templates: ' + err.message);
    }
  }, []);

  const handleLoadTemplate = useCallback(async (templateId) => {
    if (!canvasRef.current) return;
    try {
      await canvasRef.current.load(templateId);
      setShowLoadMenu(false);
    } catch (err) {
      alert('Error al cargar template: ' + err.message);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    token,
    selectedClient,
    selectedStyle,
    recentMedia,
    generateContent,
    deleteMediaItem: deleteItem,
  }), [user, token, selectedClient, selectedStyle, recentMedia, generateContent, deleteItem]);

  const Divider = () => <div style={{ width: 1, height: 18, background: 'oklch(100% 0 0 / 0.08)', margin: '0 4px' }} />;

  const HeaderBtn = ({ onClick, active, children, accent }) => (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 7, border: 'none',
        background: active ? `oklch(65% 0.2 ${accent || 265} / 0.15)` : 'oklch(100% 0 0 / 0.05)',
        boxShadow: active ? `inset 0 0 0 1px oklch(65% 0.2 ${accent || 265} / 0.35)` : 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)',
        color: active ? `oklch(78% 0.18 ${accent || 265})` : 'oklch(55% 0 0)',
        fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >{children}</button>
  );

  return (
    <StudioContext.Provider value={contextValue}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Background */}
        <div style={{ position: 'fixed', inset: 0, background: 'oklch(11% 0.015 250)', zIndex: 0 }} />
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `
            radial-gradient(ellipse 60% 50% at 20% 70%, oklch(45% 0.2 265 / 0.06) 0%, transparent 100%),
            radial-gradient(ellipse 50% 40% at 80% 20%, oklch(55% 0.18 155 / 0.05) 0%, transparent 100%)
          `,
        }} />

        {/* Header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 52, zIndex: 20,
          display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
          background: 'oklch(11% 0.015 250 / 0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: 'inset 0 -1px 0 oklch(100% 0 0 / 0.07)',
        }}>
          {/* Back to Spaces */}
          {onBack && (
            <button
              onClick={onBack}
              style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: 'oklch(100% 0 0 / 0.04)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.07)', color: 'oklch(50% 0 0)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.color = 'oklch(75% 0 0)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'oklch(50% 0 0)'; }}
            >← Espacios</button>
          )}

          {/* Logo + Space name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: onBack ? 2 : 4, marginRight: 4 }}>
            <img src="/logo.jpg" alt="Cliender" style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'oklch(90% 0 0)', letterSpacing: '-0.02em' }}>{spaceName || 'Design'}</span>
              <span style={{ fontSize: 10, color: 'oklch(38% 0 0)', marginLeft: 5 }}>Studio</span>
            </div>
          </div>

          <Divider />

          {/* Switch to Orchestrator */}
          {onSwitchTool && (
            <>
              <button
                onClick={onSwitchTool}
                style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: 'oklch(100% 0 0 / 0.04)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.07)', color: 'oklch(45% 0 0)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'oklch(65% 0 0)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'oklch(45% 0 0)'; }}
              >⚡ Orchestrator</button>
              <Divider />
            </>
          )}


          {/* Selected style badge */}
          {selectedStyle && (
            <>
              <Divider />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 7, background: 'oklch(65% 0.2 265 / 0.1)', boxShadow: 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.25)', cursor: 'pointer' }} onClick={() => setSelectedStyle(null)} title="Click para quitar estilo">
                <span style={{ fontSize: 12 }}>{selectedStyle.emoji}</span>
                <span style={{ fontSize: 11, color: 'oklch(72% 0.18 265)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedStyle.name}</span>
                <span style={{ fontSize: 10, color: 'oklch(42% 0 0)' }}>✕</span>
              </div>
            </>
          )}

          <div style={{ flex: 1 }} />

          {/* Action buttons */}
          <HeaderBtn onClick={() => { setStylesPanelOpen(o => !o); setGalleryPanelOpen(false); }} active={stylesPanelOpen}>
            {selectedStyle ? `${selectedStyle.emoji} Estilo` : '🎨 Estilos'}
          </HeaderBtn>

          <HeaderBtn onClick={() => { setGalleryPanelOpen(o => !o); setStylesPanelOpen(false); }} active={galleryPanelOpen} accent={155}>
            🖼 Galería
          </HeaderBtn>

          <Divider />

          <HeaderBtn onClick={handleSaveCanvas}>
            {saving ? '◉ Guardando...' : '💾 Guardar'}
          </HeaderBtn>

          <div style={{ position: 'relative' }}>
            <HeaderBtn onClick={handleLoadTemplates} active={showLoadMenu}>
              📂 Cargar
            </HeaderBtn>
            {showLoadMenu && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'oklch(14% 0.01 250 / 0.95)',
                backdropFilter: 'blur(16px)', borderRadius: 7, border: '1px solid oklch(100% 0 0 / 0.09)',
                minWidth: 180, zIndex: 100, maxHeight: 300, overflowY: 'auto', boxShadow: '0 4px 14px -2px oklch(0% 0 0 / 0.4)'
              }}>
                {savedTemplates.length === 0 ? (
                  <div style={{ padding: '10px 12px', fontSize: 11, color: 'oklch(42% 0 0)' }}>
                    No hay templates guardados
                  </div>
                ) : (
                  savedTemplates.map(t => (
                    <div
                      key={t.id}
                      onClick={() => handleLoadTemplate(t.id)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: 11, color: 'oklch(65% 0 0)',
                        borderBottom: '1px solid oklch(100% 0 0 / 0.05)', transition: 'background 150ms'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'oklch(100% 0 0 / 0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {t.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <Divider />

          <HeaderBtn onClick={() => setEditMode(m => !m)} active={editMode}>
            {editMode ? '✓ Editando' : '✏ Editar'}
          </HeaderBtn>

          <Divider />

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, oklch(50% 0.2 265), oklch(42% 0.22 280))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'oklch(95% 0 0)', flexShrink: 0 }}>
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span style={{ fontSize: 11, color: 'oklch(55% 0 0)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</span>
            <button onClick={logout} style={{ background: 'none', border: 'none', color: 'oklch(38% 0 0)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit', transition: 'color 150ms' }} onMouseEnter={e => { e.currentTarget.style.color = 'oklch(62% 0.22 25)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'oklch(38% 0 0)'; }}>salir</button>
          </div>
        </div>

        {/* Canvas */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, paddingTop: 52 }}>
          <ReactFlowProvider>
            <CanvasInner ref={canvasRef} editMode={editMode} userId={user?.id} token={token} initialTemplateId={initialTemplateId} />
          </ReactFlowProvider>
        </div>

        {/* Panels */}
        <StylesPanel
          open={stylesPanelOpen}
          onClose={() => setStylesPanelOpen(false)}
          selectedStyle={selectedStyle}
          onSelectStyle={setSelectedStyle}
        />
        <GalleryPanel
          open={galleryPanelOpen}
          onClose={() => setGalleryPanelOpen(false)}
          selectedClient={selectedClient}
        />
      </div>
    </StudioContext.Provider>
  );
}
