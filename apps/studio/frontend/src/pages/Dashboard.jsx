/**
 * 🎨 FullStackAI Dashboard
 * 
 * PROPÓSITO: Canvas visual con agentes ejecutables
 * FEATURES:
 * - @xyflow para canvas
 * - Componentes elegantes Dark Glass
 * - Socket.io real-time
 * - Visualización de workflow
 */

import React, { useState, useCallback, useEffect } from 'react';
import { GlassCard, GlassButton, Badge, AgentNode, Header, LoadingSpinner } from '../components';
import { io } from 'socket.io-client';
import './Dashboard.css';

const socket = io('http://localhost:3005');

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [workflowResult, setWorkflowResult] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    sector: ''
  });

  // Socket listeners
  useEffect(() => {
    socket.on('workflow:success', (result) => {
      setWorkflowResult(result);
      setWorkflowRunning(false);
      setActiveAgent('completed');
    });

    socket.on('workflow:error', (error) => {
      console.error('Workflow error:', error);
      setWorkflowRunning(false);
    });

    return () => socket.off('workflow:success');
  }, []);

  // Ejecutar workflow
  const handleExecuteWorkflow = useCallback(() => {
    if (!formData.name || !formData.website || !formData.sector) {
      alert('Por favor completa todos los campos');
      return;
    }

    setWorkflowRunning(true);
    setActiveAgent('LeadExtractor');

    socket.emit('workflow:request', formData);
  }, [formData]);

  // Agregar lead
  const handleAddLead = useCallback(() => {
    setLeads([...leads, { id: Date.now(), ...formData, status: 'new' }]);
    setFormData({ name: '', website: '', sector: '' });
  }, [formData, leads]);

  return (
    <div className="dashboard">
      {/* Header */}
      <Header 
        title="BOB AI Dashboard"
        subtitle="Workflow Lead → Propuesta con Agentes Haiku"
      />

      {/* Main Grid */}
      <div className="grid">
        {/* Left: Input Form */}
        <GlassCard className="form-card p-6">
          <h3 className="text-lg font-bold mb-4">Nuevo Lead</h3>

          <input
            type="text"
            placeholder="Nombre de la empresa"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="glass-input mb-3"
          />

          <input
            type="text"
            placeholder="Website (https://...)"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="glass-input mb-3"
          />

          <input
            type="text"
            placeholder="Sector (Technology, Finance...)"
            value={formData.sector}
            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
            className="glass-input mb-4"
          />

          <div className="flex gap-2">
            <GlassButton 
              variant="primary" 
              onClick={handleAddLead}
              className="flex-1"
            >
              + Agregar Lead
            </GlassButton>
            <GlassButton 
              variant="blue"
              onClick={handleExecuteWorkflow}
              disabled={workflowRunning}
              className="flex-1"
            >
              {workflowRunning ? 'Ejecutando...' : '▶ Ejecutar Workflow'}
            </GlassButton>
          </div>
        </GlassCard>

        {/* Center: Canvas de Agentes */}
        <GlassCard className="canvas-card p-6">
          <h3 className="text-lg font-bold mb-4">Agentes en Cadena</h3>

          {workflowRunning ? (
            <div className="space-y-3">
              <AgentNode 
                title="Lead Extractor"
                agent="haiku"
                status={activeAgent === 'LeadExtractor' ? 'generating' : 'idle'}
              >
                Extrayendo datos del lead...
              </AgentNode>

              <AgentNode 
                title="Pain Analyzer"
                agent="haiku"
                status={activeAgent === 'PainAnalyzer' ? 'generating' : 'idle'}
              >
                Analizando dolores...
              </AgentNode>

              <AgentNode 
                title="Strategy Mapper"
                agent="haiku"
                status={activeAgent === 'StrategyMapper' ? 'generating' : 'idle'}
              >
                Mapeando estrategia...
              </AgentNode>

              <AgentNode 
                title="Proposal Writer"
                agent="haiku"
                status={activeAgent === 'ProposalWriter' ? 'generating' : 'idle'}
              >
                Redactando propuesta...
              </AgentNode>

              <AgentNode 
                title="Next Steps Planner"
                agent="haiku"
                status={activeAgent === 'NextStepsPlanner' ? 'generating' : 'idle'}
              >
                Planificando próximos pasos...
              </AgentNode>
            </div>
          ) : workflowResult ? (
            <div className="space-y-3">
              <Badge variant="success">✓ Workflow Completado</Badge>
              <p className="text-sm text-white/60">
                {workflowResult.steps} pasos ejecutados
              </p>
              <p className="text-xs text-white/40 mt-2">
                Tiempo: {new Date().toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <p className="text-white/40">Carga un lead y ejecuta para ver agentes en acción...</p>
          )}
        </GlassCard>

        {/* Right: Resultados */}
        <GlassCard className="results-card p-6">
          <h3 className="text-lg font-bold mb-4">Resultado Final</h3>

          {workflowResult ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/40 mb-1">Propuesta</p>
                <p className="font-semibold text-white">
                  {workflowResult.final_proposal?.titulo || 'Propuesta generada'}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40 mb-1">Precio</p>
                <p className="font-semibold text-emerald-400">
                  {workflowResult.final_proposal?.precio?.total || '$TBD'}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40 mb-1">Timeline</p>
                <p className="font-semibold text-white">
                  {workflowResult.final_proposal?.timeline_days || 30} días
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40 mb-1">Próximos Pasos</p>
                <p className="text-sm text-white/80">
                  {workflowResult.next_steps?.follow_up_days || 7} días para follow-up
                </p>
              </div>

              <GlassButton variant="primary" className="w-full mt-4">
                📥 Enviar Propuesta
              </GlassButton>
            </div>
          ) : (
            <p className="text-white/40">Los resultados aparecerán aquí...</p>
          )}
        </GlassCard>
      </div>

      {/* Lista de Leads */}
      {leads.length > 0 && (
        <GlassCard className="leads-list mt-6 p-6">
          <h3 className="text-lg font-bold mb-4">Leads Cargados ({leads.length})</h3>
          <div className="space-y-2">
            {leads.map(lead => (
              <div 
                key={lead.id}
                className="p-3 bg-white/4 rounded-lg border border-white/8 cursor-pointer hover:bg-white/6 transition-colors"
                onClick={() => {
                  setFormData({ name: lead.name, website: lead.website, sector: lead.sector });
                  setSelectedLead(lead);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-white">{lead.name}</p>
                    <p className="text-xs text-white/40">{lead.sector}</p>
                  </div>
                  <Badge variant={selectedLead?.id === lead.id ? 'success' : 'draft'}>
                    {selectedLead?.id === lead.id ? 'Seleccionado' : 'Nuevo'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
