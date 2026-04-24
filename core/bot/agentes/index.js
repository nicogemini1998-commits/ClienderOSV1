/**
 * 🧠 BOB AGENTES v2.0 — HAIKU ONLY + SHARED NOTEBOOK
 * 
 * ARQUITECTURA:
 * ✅ Todos los agentes usan SOLO claude-haiku-4-5
 * ✅ Una sola memoria compartida (SharedNotebook)
 * ✅ Sin repeticiones — cada agente sabe qué hizo el anterior
 * ✅ Contexto persistente entre agentes
 * ✅ Especializados, concisos, eficientes
 * ✅ Costo: ~1500 tokens = $0.02 aprox
 * 
 * AGENTES:
 * 1. LeadExtractor    — Extrae datos crudos
 * 2. PainAnalyzer     — Identifica dolores
 * 3. StrategyMapper   — Define estrategia
 * 4. ProposalWriter   — Redacta propuesta
 * 5. NextStepsPlanner — Planifica próximos pasos
 * 
 * FLUJO: Lead → Notebook → Agent1 → Agent2 → Agent3 → Agent4 → Agent5 → Propuesta final
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import { query } from '../utils/db.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ============================================================
// SHARED NOTEBOOK — Memoria única de BOB
// ============================================================

class SharedNotebook {
  constructor() {
    this.entries = [];
    this.context = {};
    this.workflow_id = null;
  }

  // Escribir en el cuaderno (todos los agentes usan esto)
  async write(agent_name, action, result) {
    const entry = {
      seq: this.entries.length + 1,
      agent: agent_name,
      action,
      result,
      timestamp: new Date().toISOString()
    };
    
    this.entries.push(entry);
    
    // Persistir en BD
    if (this.workflow_id) {
      try {
        await query(
          `INSERT INTO workflows.execution_logs (workflow_id, step_name, status, details, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [this.workflow_id, `${agent_name}:${action}`, 'completed', JSON.stringify(entry)]
        );
      } catch (e) {
        logger.warn('⚠️ Notebook save fallback', { error: e.message });
      }
    }
    
    logger.success(`📝 ${agent_name} escribió en notebook`, { action, seq: entry.seq });
    return entry;
  }

  // Leer historial reciente (para contexto)
  readRecent(n = 3) {
    return this.entries.slice(-n).map(e => `[${e.seq}] ${e.agent}: ${e.action} → ${JSON.stringify(e.result)}`).join('\n');
  }

  // Leer último resultado
  readLast(agent_name = null) {
    if (agent_name) {
      const matching = this.entries.filter(e => e.agent === agent_name);
      return matching[matching.length - 1]?.result || null;
    }
    return this.entries[this.entries.length - 1]?.result || null;
  }

  // Inicializar
  init(workflow_id, context) {
    this.workflow_id = workflow_id || `workflow_${Date.now()}`;
    this.context = context;
    this.entries = [];
  }

  // Resumen final
  summary() {
    return {
      total_steps: this.entries.length,
      agents: [...new Set(this.entries.map(e => e.agent))],
      context: this.context,
      entries: this.entries
    };
  }

  // Limpiar
  reset() {
    this.entries = [];
    this.context = {};
    this.workflow_id = null;
  }
}

// Instancia global
export const notebook = new SharedNotebook();

// ============================================================
// AGENT 1: LEAD EXTRACTOR
// Función: Extrae datos crudos del lead
// Input: website, name, sector
// Output: empresa, sector, url, data_quality
// Tokens: ~400
// ============================================================

export const leadExtractor = async (lead) => {
  logger.info('1️⃣ LeadExtractor iniciando', { lead: lead.name });

  try {
    notebook.init(lead.workflow_id, { 
      lead_name: lead.name, 
      lead_website: lead.website,
      lead_sector: lead.sector 
    });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Lead: ${lead.name}. Sector: ${lead.sector}. URL: ${lead.website}
        
Extract ONLY: empresa (name), sector, url, validity (valid/invalid). JSON only:`
      }]
    });

    const result = parseJSON(response.content[0].text);
    await notebook.write('LeadExtractor', 'extract', result);

    logger.success('✅ LeadExtractor completado', { empresa: result.empresa });
    return { success: true, agent: 'LeadExtractor', data: result };
  } catch (error) {
    logger.error('❌ LeadExtractor error', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENT 2: PAIN ANALYZER
// Función: Analiza dolores del cliente
// Input: (Lee del notebook)
// Output: dolores (array), urgencia_score, impacto
// Tokens: ~600
// ============================================================

export const painAnalyzer = async () => {
  logger.info('2️⃣ PainAnalyzer iniciando');

  try {
    const prevData = notebook.readLast('LeadExtractor');
    const ctx = notebook.context;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Company: ${ctx.lead_name} (${ctx.lead_sector})
Previous extraction: ${JSON.stringify(prevData)}

Identify TOP 3 pain points. For each: pain, severity (1-10), impact.
JSON only:
{"dolores":[{"pain":"...", "severity":8, "impact":"..."}], "urgencia_score":7, "industry_challenges":["..."]}`
      }]
    });

    const result = parseJSON(response.content[0].text);
    await notebook.write('PainAnalyzer', 'analyze_pains', result);

    logger.success('✅ PainAnalyzer completado', { dolores: result.dolores?.length });
    return { success: true, agent: 'PainAnalyzer', data: result };
  } catch (error) {
    logger.error('❌ PainAnalyzer error', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENT 3: STRATEGY MAPPER
// Función: Mapea estrategia de solución
// Input: (Lee pain analysis)
// Output: estrategia, servicios_recomendados, timeline, presupuesto_range
// Tokens: ~700
// ============================================================

export const strategyMapper = async () => {
  logger.info('3️⃣ StrategyMapper iniciando');

  try {
    const pains = notebook.readLast('PainAnalyzer');
    const ctx = notebook.context;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: `Company: ${ctx.lead_name}
Identified pains: ${JSON.stringify(pains)}

Design solution strategy: approach, recommended services, timeline, budget range.
JSON only:
{
  "estrategia":"clear brief",
  "servicios":["service1","service2"],
  "timeline_days":30,
  "presupuesto":"$5k-15k",
  "closure_probability":65,
  "diferenciador":"unique value"
}`
      }]
    });

    const result = parseJSON(response.content[0].text);
    await notebook.write('StrategyMapper', 'map_strategy', result);

    logger.success('✅ StrategyMapper completado', { timeline: result.timeline_days });
    return { success: true, agent: 'StrategyMapper', data: result };
  } catch (error) {
    logger.error('❌ StrategyMapper error', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENT 4: PROPOSAL WRITER
// Función: Redacta propuesta comercial
// Input: (Lee estrategia)
// Output: titulo, resumen_ejecutivo, fases, precio, garantia
// Tokens: ~900
// ============================================================

export const proposalWriter = async () => {
  logger.info('4️⃣ ProposalWriter iniciando');

  try {
    const strategy = notebook.readLast('StrategyMapper');
    const pains = notebook.readLast('PainAnalyzer');
    const ctx = notebook.context;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: `Company: ${ctx.lead_name}
Strategy: ${JSON.stringify(strategy)}
Pains: ${JSON.stringify(pains)}

Write CONCISE proposal. Include: title, executive summary, 3 phases, price, guarantee.
JSON only. Make it compelling and specific:`
      }]
    });

    const result = parseJSON(response.content[0].text);
    await notebook.write('ProposalWriter', 'write_proposal', result);

    logger.success('✅ ProposalWriter completado', { titulo: result.titulo });
    return { success: true, agent: 'ProposalWriter', data: result };
  } catch (error) {
    logger.error('❌ ProposalWriter error', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENT 5: NEXT STEPS PLANNER
// Función: Planifica próximos pasos
// Input: (Lee propuesta)
// Output: next_steps, contact_strategy, follow_up_days
// Tokens: ~500
// ============================================================

export const nextStepsPlanner = async () => {
  logger.info('5️⃣ NextStepsPlanner iniciando');

  try {
    const proposal = notebook.readLast('ProposalWriter');
    const ctx = notebook.context;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Company: ${ctx.lead_name}
Proposal ready: ${JSON.stringify(proposal)}

Define: next steps, contact strategy, follow-up timing, decision criteria.
JSON only:`
      }]
    });

    const result = parseJSON(response.content[0].text);
    await notebook.write('NextStepsPlanner', 'plan_next_steps', result);

    logger.success('✅ NextStepsPlanner completado');
    return { success: true, agent: 'NextStepsPlanner', data: result };
  } catch (error) {
    logger.error('❌ NextStepsPlanner error', { error: error.message });
    throw error;
  }
};

// ============================================================
// WORKFLOW EXECUTOR — Ejecuta toda la cadena
// ============================================================

export const executeWorkflow = async (leadData, onProgress = null) => {
  logger.info('🚀 WORKFLOW iniciando', { lead: leadData.name });

  try {
    onProgress?.('LeadExtractor', 'running', null);
    await leadExtractor(leadData);
    onProgress?.('LeadExtractor', 'completed', notebook.readLast('LeadExtractor'));

    onProgress?.('PainAnalyzer', 'running', null);
    await painAnalyzer();
    onProgress?.('PainAnalyzer', 'completed', notebook.readLast('PainAnalyzer'));

    onProgress?.('StrategyMapper', 'running', null);
    await strategyMapper();
    onProgress?.('StrategyMapper', 'completed', notebook.readLast('StrategyMapper'));

    onProgress?.('ProposalWriter', 'running', null);
    await proposalWriter();
    onProgress?.('ProposalWriter', 'completed', notebook.readLast('ProposalWriter'));

    onProgress?.('NextStepsPlanner', 'running', null);
    await nextStepsPlanner();
    onProgress?.('NextStepsPlanner', 'completed', notebook.readLast('NextStepsPlanner'));

    const summary = notebook.summary();

    logger.success('✅ WORKFLOW COMPLETADO', {
      lead: leadData.name,
      total_agents: summary.agents.length,
      total_steps: summary.total_steps
    });

    return {
      success: true,
      workflow_id: notebook.workflow_id,
      lead: leadData.name,
      steps: summary.total_steps,
      agents: summary.agents,
      final_proposal: notebook.readLast('ProposalWriter'),
      next_steps: notebook.readLast('NextStepsPlanner'),
      complete_notebook: summary.entries
    };
  } catch (error) {
    logger.error('❌ WORKFLOW FAILED', { error: error.message });
    throw error;
  } finally {
    notebook.reset();
  }
};

// ============================================================
// UTILITY: Parse JSON from response
// ============================================================

function parseJSON(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : text);
  } catch (e) {
    logger.warn('⚠️ JSON parse fallback', { error: e.message });
    return { error: 'parse_failed', raw: text };
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Agentes individuales (si necesitas uno específico)
  leadExtractor,
  painAnalyzer,
  strategyMapper,
  proposalWriter,
  nextStepsPlanner,
  
  // Workflow completo (recomendado)
  executeWorkflow,
  
  // Acceso a notebook (si es necesario en otras funciones)
  notebook
};

// ============================================================
// USO:
// ============================================================

/*
import { executeWorkflow } from './agentes.js';

const lead = {
  name: 'Empresa XYZ',
  website: 'https://empresa.com',
  sector: 'Technology',
  workflow_id: 'optional-id'
};

const result = await executeWorkflow(lead);
console.log(result.final_proposal);
console.log(result.next_steps);
*/
