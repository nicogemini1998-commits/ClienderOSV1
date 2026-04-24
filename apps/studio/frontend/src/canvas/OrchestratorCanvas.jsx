import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './canvas.css';

import { WorkflowContext } from './WorkflowContext.jsx';
import { useWorkflowSocket } from '../hooks/useWorkflowSocket.js';
import { useTemplates } from '../hooks/useTemplates.js';
import { AgentNode } from './nodes/AgentNode.jsx';
import { ProposalOutputNode } from './nodes/ProposalOutputNode.jsx';
import { FlowEdge } from './edges/FlowEdge.jsx';
import { CanvasToolbar } from './CanvasToolbar.jsx';
import { TemplatesPanel } from './panels/TemplatesPanel.jsx';
import { ClientPicker } from './panels/ClientPicker.jsx';
import { NodePalette } from './palette/NodePalette.jsx';

// ─── Dynamic input node (adapts to template) ─────────────────
import { DynamicInputNode } from './nodes/DynamicInputNode.jsx';

const nodeTypes = {
  dynamicInput: DynamicInputNode,
  agent: AgentNode,
  proposalOutput: ProposalOutputNode,
};

const edgeTypes = { flow: FlowEdge };

const NODE_SPACING = 300;

// ─── Build nodes + edges from template agents ─────────────────
function buildFromTemplate(template) {
  const agents = template?.agents || [];
  const nodes = [];
  const edges = [];

  nodes.push({
    id: 'node-input',
    type: 'dynamicInput',
    position: { x: 0, y: 0 },
    data: { inputConfig: template?.input_config || { fields: [] } },
  });

  agents.forEach((agent, i) => {
    nodes.push({
      id: `node-${agent.id}`,
      type: 'agent',
      position: { x: NODE_SPACING * (i + 1), y: 0 },
      data: { agentName: agent.id, label: agent.label, tokens: agent.tokens, icon: agent.icon, index: i + 1 },
    });
  });

  nodes.push({
    id: 'node-output',
    type: 'proposalOutput',
    position: { x: NODE_SPACING * (agents.length + 1), y: 0 },
    data: {},
  });

  // Edges
  if (agents.length > 0) {
    edges.push({ id: 'e-in-0', source: 'node-input', target: `node-${agents[0].id}`, type: 'flow', data: { sourceAgent: null, targetAgent: agents[0].id } });
    agents.forEach((agent, i) => {
      if (i < agents.length - 1) {
        edges.push({ id: `e-${i}-${i + 1}`, source: `node-${agent.id}`, target: `node-${agents[i + 1].id}`, type: 'flow', data: { sourceAgent: agent.id, targetAgent: agents[i + 1].id } });
      }
    });
    edges.push({ id: 'e-last-out', source: `node-${agents[agents.length - 1].id}`, target: 'node-output', type: 'flow', data: { sourceAgent: agents[agents.length - 1].id, targetAgent: null } });
  }

  return { nodes, edges };
}

// ─── Canvas inner ─────────────────────────────────────────────
function CanvasInner({ editMode, activeTemplate, onDropNode }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // Rebuild when template changes
  useEffect(() => {
    if (!activeTemplate) return;
    const { nodes: n, edges: e } = buildFromTemplate(activeTemplate);
    setNodes(n);
    setEdges(e);
    setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
  }, [activeTemplate?.id]);

  // Update agent node data when statuses come from context (handled in nodes via context)

  const onConnect = useCallback((params) => {
    if (!editMode) return;
    setEdges(eds => addEdge({ ...params, type: 'flow', data: {} }, eds));
  }, [editMode]);

  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    if (!editMode) return;
    const raw = e.dataTransfer.getData('application/reactflow');
    if (!raw) return;

    const { type, data } = JSON.parse(raw);
    const bounds = e.currentTarget.getBoundingClientRect();
    const position = { x: e.clientX - bounds.left - 110, y: e.clientY - bounds.top - 70 };

    const newNode = {
      id: `node-custom-${Date.now()}`,
      type: 'agent',
      position,
      data: { ...data, index: 99 },
    };
    setNodes(ns => [...ns, newNode]);
    onDropNode?.(newNode);
  }, [editMode, onDropNode]);

  const onNodesDelete = useCallback((deleted) => {
    // Remove connected edges too (React Flow handles this)
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onNodesDelete={onNodesDelete}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.15}
      maxZoom={2.5}
      deleteKeyCode={editMode ? 'Delete' : null}
      selectionOnDrag={editMode}
      panOnScroll
      zoomOnScroll
      panOnDrag={[1, 2]}
      connectOnClick={editMode}
    >
      <Background variant="dots" gap={24} size={1} color="rgba(255,255,255,0.05)" />
      <MiniMap
        nodeColor={(n) => n.type === 'dynamicInput' ? 'oklch(55% 0.2 265)' : n.type === 'proposalOutput' ? 'oklch(55% 0.18 155)' : 'oklch(32% 0.08 265)'}
        maskColor="rgba(5,5,8,0.75)"
        style={{ bottom: 72 }}
      />
      <CanvasToolbar editMode={editMode} />
    </ReactFlow>
  );
}

// ─── Header ───────────────────────────────────────────────────
function Header({ selectedClient, onSelectClient, activeTemplate, editMode, setEditMode, onOpenTemplates, templatesPanelOpen, onSwitchTool }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 52, zIndex: 20,
      display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
      background: 'oklch(11% 0.015 250 / 0.9)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: 'inset 0 -1px 0 oklch(100% 0 0 / 0.07)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 4 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, oklch(55% 0.22 265), oklch(42% 0.24 280))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, boxShadow: '0 0 12px oklch(55% 0.22 265 / 0.3)', flexShrink: 0,
        }}>⚡</div>
        <div>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'oklch(90% 0 0)', letterSpacing: '-0.02em' }}>BOB</span>
          <span style={{ fontSize: 11, color: 'oklch(38% 0 0)', marginLeft: 5 }}>Orchestrator</span>
        </div>
      </div>

      <div style={{ width: 1, height: 18, background: 'oklch(100% 0 0 / 0.08)', margin: '0 4px' }} />

      {/* Switch to Studio */}
      {onSwitchTool && (
        <button
          onClick={onSwitchTool}
          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: 'oklch(100% 0 0 / 0.04)', boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.07)', color: 'oklch(45% 0 0)', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'oklch(65% 0 0)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'oklch(45% 0 0)'; }}
        >🎨 Studio</button>
      )}

      <div style={{ width: 1, height: 18, background: 'oklch(100% 0 0 / 0.08)', margin: '0 4px' }} />

      {/* Client picker */}
      <ClientPicker selectedClient={selectedClient} onSelect={onSelectClient} />

      <div style={{ width: 1, height: 18, background: 'oklch(100% 0 0 / 0.08)', margin: '0 4px' }} />

      {/* Active template badge */}
      {activeTemplate && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 9px', borderRadius: 7,
          background: 'oklch(100% 0 0 / 0.05)',
          boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)',
        }}>
          <span style={{ fontSize: 11 }}>
            {{ ventas: '💼', operaciones: '⚙️', marketing: '📣', custom: '🔧' }[activeTemplate.category] || '📋'}
          </span>
          <span style={{ fontSize: 11, color: 'oklch(72% 0 0)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTemplate.name}</span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Edit mode toggle */}
      <button
        onClick={() => setEditMode(m => !m)}
        style={{
          padding: '5px 12px', borderRadius: 7, border: 'none',
          background: editMode ? 'oklch(65% 0.2 265 / 0.2)' : 'oklch(100% 0 0 / 0.05)',
          boxShadow: editMode ? 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.4)' : 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)',
          color: editMode ? 'oklch(78% 0.18 265)' : 'oklch(55% 0 0)',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >{editMode ? '✓ Editando' : '✏ Editar'}</button>

      {/* Templates button */}
      <button
        onClick={onOpenTemplates}
        style={{
          padding: '5px 12px', borderRadius: 7, border: 'none',
          background: templatesPanelOpen ? 'oklch(65% 0.2 265 / 0.15)' : 'oklch(100% 0 0 / 0.05)',
          boxShadow: templatesPanelOpen ? 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.35)' : 'inset 0 0 0 1px oklch(100% 0 0 / 0.09)',
          color: templatesPanelOpen ? 'oklch(78% 0.18 265)' : 'oklch(55% 0 0)',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >Plantillas ☰</button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────
export function OrchestratorCanvas({ onSwitchTool }) {
  const workflowState = useWorkflowSocket();
  const { templates, loading: tplLoading } = useTemplates();

  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [templatesPanelOpen, setTemplatesPanelOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAgents, setCurrentAgents] = useState([]);

  // Load first predefined template on start
  useEffect(() => {
    if (!tplLoading && templates.length > 0 && !activeTemplate) {
      const first = templates.find(t => t.is_predefined) || templates[0];
      setActiveTemplate(first);
      setCurrentAgents(first.agents || []);
    }
  }, [tplLoading, templates]);

  const handleSelectTemplate = useCallback((t) => {
    setActiveTemplate(t);
    setCurrentAgents(t.agents || []);
    workflowState.resetWorkflow();
  }, [workflowState]);

  // Pass template + client into socket run
  const runWorkflow = useCallback((formData) => {
    if (!activeTemplate) return;
    workflowState.runWorkflow({
      input: formData,
      templateId: activeTemplate.id,
      clientId: selectedClient?.id ?? null,
    });
  }, [activeTemplate, selectedClient, workflowState]);

  const contextValue = useMemo(() => ({
    ...workflowState,
    runWorkflow,
    selectedClient,
    activeTemplate,
  }), [workflowState, runWorkflow, selectedClient, activeTemplate]);

  return (
    <WorkflowContext.Provider value={contextValue}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Atmospheric background */}
        <div style={{
          position: 'fixed', inset: 0,
          background: 'oklch(11% 0.015 250)',
          zIndex: 0,
        }} />
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `
            radial-gradient(ellipse 60% 55% at 15% 60%, oklch(45% 0.2 265 / 0.07) 0%, transparent 100%),
            radial-gradient(ellipse 50% 45% at 85% 15%, oklch(55% 0.18 155 / 0.05) 0%, transparent 100%),
            radial-gradient(ellipse 40% 50% at 65% 85%, oklch(55% 0.18 220 / 0.05) 0%, transparent 100%)
          `,
        }} />

        <Header
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          activeTemplate={activeTemplate}
          editMode={editMode}
          setEditMode={setEditMode}
          onOpenTemplates={() => setTemplatesPanelOpen(o => !o)}
          templatesPanelOpen={templatesPanelOpen}
          onSwitchTool={onSwitchTool}
        />

        {/* Canvas */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, paddingTop: 52 }}>
          <ReactFlowProvider>
            <NodePalette visible={editMode} />
            <CanvasInner
              editMode={editMode}
              activeTemplate={activeTemplate}
              onDropNode={(n) => setCurrentAgents(prev => [...prev, n.data])}
            />
          </ReactFlowProvider>
        </div>

        {/* Templates panel */}
        <TemplatesPanel
          open={templatesPanelOpen}
          onClose={() => setTemplatesPanelOpen(false)}
          activeTemplate={activeTemplate}
          onSelectTemplate={handleSelectTemplate}
          currentAgents={currentAgents}
        />
      </div>
    </WorkflowContext.Provider>
  );
}
