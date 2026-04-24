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
import { ClientPicker } from '../panels/ClientPicker.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useGallery } from '../../hooks/useGallery.js';

const nodeTypes = {
  prompt: PromptNode,
  image: ImageNode,
  video: VideoNode,
  mediaOutput: MediaOutputNode,
};

const INITIAL_NODES = [
  { id: 'image-1', type: 'image', position: { x: 60, y: 60 }, data: {} },
  { id: 'video-1', type: 'video', position: { x: 60, y: 380 }, data: {} },
  { id: 'output-1', type: 'mediaOutput', position: { x: 460, y: 180 }, data: {} },
];
const INITIAL_EDGES = [
  { id: 'e-img', source: 'image-1', target: 'output-1', type: 'default' },
  { id: 'e-vid', source: 'video-1', target: 'output-1', type: 'default' },
];

const CanvasInner = React.forwardRef(function CanvasInnerComponent({ editMode, userId }, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const { fitView } = useReactFlow();

  const onConnect = useCallback((params) => {
    if (!editMode) return;
    setEdges(eds => addEdge(params, eds));
  }, [editMode]);

  const addNode = useCallback((type) => {
    const id = `${type}-${Date.now()}`;
    setNodes(ns => [...ns, {
      id, type,
      position: { x: 80 + Math.random() * 120, y: 80 + ns.length * 80 },
      data: {},
    }]);
  }, []);

  React.useImperativeHandle(ref, () => ({
    async save(name) {
      const response = await fetch('/api/content-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, name, nodes, edges }),
      });
      return response.json();
    },
    async load(templateId) {
      const response = await fetch(`/api/content-templates?userId=${userId}`);
      const templates = await response.json();
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setNodes(template.nodes);
        setEdges(template.edges);
      }
    },
    async fetchTemplates() {
      const response = await fetch(`/api/content-templates?userId=${userId}`);
      const templates = await response.json();
      setSavedTemplates(templates);
      return templates;
    },
  }));

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2.5}
      panOnScroll
      zoomOnScroll
      panOnDrag={[1, 2]}
      deleteKeyCode={editMode ? 'Delete' : null}
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
    </ReactFlow>
  );
});

export function ContentStudioCanvas({ onSwitchTool }) {
  const { user, token, logout } = useAuth();
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [stylesPanelOpen, setStylesPanelOpen] = useState(false);
  const [galleryPanelOpen, setGalleryPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
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
    const name = prompt('Nombre del template:');
    if (!name || !canvasRef.current) return;
    try {
      await canvasRef.current.save(name);
      alert('Template guardado');
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  }, []);

  const handleLoadTemplates = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      const templates = await canvasRef.current.fetchTemplates();
      setSavedTemplates(templates);
      setShowLoadMenu(!showLoadMenu);
    } catch (err) {
      alert('Error al cargar templates: ' + err.message);
    }
  }, [showLoadMenu]);

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
          {/* Logo + tool switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, oklch(55% 0.22 155), oklch(42% 0.24 165))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 0 12px oklch(55% 0.22 155 / 0.3)', flexShrink: 0 }}>🎨</div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'oklch(90% 0 0)', letterSpacing: '-0.02em' }}>STUDIO</span>
              <span style={{ fontSize: 11, color: 'oklch(38% 0 0)', marginLeft: 5 }}>Content</span>
            </div>
          </div>

          <Divider />

          {/* Switch to Orchestrator */}
          <button
            onClick={onSwitchTool}
            style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: 'oklch(100% 0 0 / 0.04)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.07)', color: 'oklch(45% 0 0)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'oklch(65% 0 0)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'oklch(45% 0 0)'; }}
          >⚡ Orchestrator</button>

          <Divider />

          {/* Client picker */}
          <ClientPicker selectedClient={selectedClient} onSelect={setSelectedClient} />

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
            💾 Guardar
          </HeaderBtn>

          <div style={{ position: 'relative' }}>
            <HeaderBtn onClick={handleLoadTemplates} active={showLoadMenu}>
              📂 Cargar
            </HeaderBtn>
            {showLoadMenu && savedTemplates.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'oklch(14% 0.01 250 / 0.95)',
                backdropFilter: 'blur(16px)', borderRadius: 7, border: '1px solid oklch(100% 0 0 / 0.09)',
                minWidth: 180, zIndex: 100, maxHeight: 300, overflowY: 'auto', boxShadow: '0 4px 14px -2px oklch(0% 0 0 / 0.4)'
              }}>
                {savedTemplates.map(t => (
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
                ))}
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
            <CanvasInner ref={canvasRef} editMode={editMode} userId={user?.id} />
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
