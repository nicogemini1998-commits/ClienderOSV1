/**
 * 🧠 BOB AGENTES v2.0 — HAIKU ONLY + SHARED MEMORY
 * 
 * ✅ TODOS usan SOLO claude-haiku-4-5 (máximo ahorro)
 * ✅ UNA SOLA memoria compartida (SharedNotebook)
 * ✅ Sin repeticiones (cada agente verifica qué hizo el anterior)
 * ✅ Contexto persistente entre agentes
 * ✅ Especializados, concisos, eficientes
 * 
 * FLUJO:
 * Agent 1 (Extractor) → Lee lead, guarda contexto
 * Agent 2 (Analyzer) → Lee notebook, analiza, escribe
 * Agent 3 (Strategist) → Lee análisis, define estrategia
 * Agent 4 (Proposer) → Lee estrategia, redacta propuesta
 * 
 * COST: ~1500 tokens Haiku = $0.02 aprox
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import { query } from '../utils/db.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ============================================================
// SHARED NOTEBOOK — Memoria única y persistente
// ============================================================

class SharedNotebook {
  constructor() {
    this.entries = [];
    this.context = {};
    this.workflow_id = null;
  }

  // Agregar entrada al cuaderno
  async writeEntry(agent_name, action, result) {
    const entry = {
      seq: this.entries.length + 1,
      agent: agent_name,
      action,
      result,
      timestamp: new Date().toISOString()
    };
    
    this.entries.push(entry);
    
    // Persistir en BD si es necesario
    if (this.workflow_id) {
      try {
        await query(
          `INSERT INTO workflows.execution_logs (workflow_id, step_name, status, details, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [this.workflow_id, `${agent_name}:${action}`, 'completed', JSON.stringify(entry)]
        );
      } catch (e) {
        logger.warn('⚠️ Notebook BD save fallback', { error: e.message });
      }
    }
    
    return entry;
  }

  // Obtener historial para context window
  getHistory(last_n = 3) {
    return this.entries.slice(-last_n).map(e => `${e.agent}: ${e.action} → ${JSON.stringify(e.result)}`).join('\n');
  }

  // Obtener último resultado específico
  getLastResult(agent_name = null) {
    if (agent_name) {
      const matching = this.entries.filter(e => e.agent === agent_name);
      return matching[matching.length - 1]?.result || null;
    }
    return this.entries[this.entries.length - 1]?.result || null;
  }

  // Setup inicial
  initialize(workflow_id, context) {
    this.workflow_id = workflow_id;
    this.context = context;
    this.entries = [];
    logger.info('📓 SharedNotebook inicializado', { workflow_id, context });
  }

  // Reset para nuevo workflow
  reset() {
    this.entries = [];
    this.context = {};
    this.workflow_id = null;
  }
}

const notebook = new SharedNotebook();

// ============================================================
// AGENT 1: LEAD EXTRACTOR (Especializado: extrae datos crudos)
// ============================================================

/**
 * FUNCIÓN: Extrae datos mínimos de un lead
 * INPUT: website, name, sector
 * OUTPUT: { empresa, url, sector }
 * TOKENS: ~500
 */

export const leadExtractor = async (leadData) => {
  logger.info('🔍 Agent 1: Lead Extractor iniciado', { lead: leadData.name });

  try {
    // Guardar contexto inicial
    notebook.setContext({
      lead_name: leadData.name,
      lead_website: leadData.website,
      lead_sector: leadData.sector,
      workflow_id: leadData.workflow_id || 'default'
    });

    const prompt = `Extrae SOLO estos datos de forma concisa:
${leadData.website}

Responde JSON:
{"empresa":"nombre","sector":"${leadData.sector}","url":"url","status":"ok"}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    let result = {};
    try {
      const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : message.content[0].text);
    } catch (e) {
      result = { error: 'parse_failed', raw: message.content[0].text };
    }

    // Guardar en notebook
    await notebook.addEntry('LeadExtractor', 'extract_data', result);

    logger.success('✅ Lead Extractor completado', { 
      empresa: result.empresa,
      tokens: message.usage.output_tokens 
    });

    return { success: true, data: result, agent: 'LeadExtractor' };
  } catch (error) {
    logger.error('❌ Lead Extractor falló', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENT 2: PAIN ANALYZER (Especializado: identifica dolores)
// ============================================================

/**
 * FUNCIÓN: Analiza dolores específicos del lead
 * INPUT: (Lee del notebook)
 * OUTPUT: { dolores, urgencia, servicios }
 * TOKENS: ~800
 */

export const painAnalyzer = async () => {
  logger.info('💔 Agent 2: Pain Analyzer iniciado');

  try {
    // Leer contexto anterior (qué hizo LeadExtractor)
    const prevStep = notebook.getSummary();
    const leadData = notebook.current_context;

    const prompt = `Lead: ${leadData.lead_name} (${leadData.lead_sector})
URL: ${leadData.lead_website}

Identifica 3 dolores máximo. JSON:
{"dolores":[{"pain":"X","severity":8}],"urgencia":7,"servicios":["A","B"]}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    });

    let result = {};
    try {
      const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : message.content[0].text);
    } catch (e) {
      result = { error: 'parse_failed' };
    }

    await notebook.addEntry('PainAnalyzer', 'identify_pains', result);

    logger.success('✅ Pain Analyzer completado', { 
      dolores: result.dolores?.length || 0,
      urgencia: result.urgencia,
      tokens: message.usage.output_tokens 
    });

    return { success: true, data: result, agent: 'PainAnalyzer' };
  } catch (error) {
    logger.error('❌ Pain Analyzer falló', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENT 3: STRATEGY MAPPER (Especializado: mapea estrategia)
// ============================================================

/**
 * FUNCIÓN: Define estrategia de abordaje
 * INPUT: (Lee pain analysis del notebook)
 * OUTPUT: { estrategia, timeline, inversion }
 * TOKENS: ~600
 */

export const strategyMapper = async () => {
  logger.info('🗺️ Agent 3: Strategy Mapper iniciado');

  try {
    const summary = notebook.getSummary();
    const lastPainAnalysis = summary.last_entry;

    const prompt = `Basado en análisis previo de dolores.
Datos: ${JSON.stringify(notebook.current_context)}
Dolores identificados: ${JSON.stringify(lastPainAnalysis.result)}

Define: estrategia, timeline, presupuesto. JSON:
{"estrategia":"brief","timeline":"30d","inversion":"$5k-15k","probabilidad_cierre":65}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    let result = {};
    try {
      const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : message.content[0].text);
    } catch (e) {
      result = { error: 'parse_failed' };
    }

    await notebook.addEntry('StrategyMapper', 'map_strategy', result);

    logger.success('✅ Strategy Mapper completado', { 
      timeline: result.timeline,
      inversion: result.inversion,
      tokens: message.usage.output_tokens 
    });

    return { success: true, data: result, agent: 'StrategyMapper' };
  } catch (error) {
    logger.error('❌ Strategy Mapper falló', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENT 4: PROPOSAL CRAFTER (Especializado: redacta propuesta)
// ============================================================

/**
 * FUNCIÓN: Redacta propuesta comercial concisa
 * INPUT: (Lee estrategia del notebook)
 * OUTPUT: { titulo, resumen, fases, precio }
 * TOKENS: ~1000
 */

export const proposalCrafter = async () => {
  logger.info('📄 Agent 4: Proposal Crafter iniciado');

  try {
    const summary = notebook.getSummary();
    const strategy = summary.last_entry.result;

    const prompt = `Redacta propuesta CONCISA. JSON:
{
  "titulo":"Nombre propuesta",
  "resumen":"1 frase vendiendo",
  "fases":[
    {"nombre":"Discovery","dias":14,"entregables":["X"]}
  ],
  "precio":{"total":"$10000","payment":"50/50"},
  "roi":"300%"
}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    let result = {};
    try {
      const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : message.content[0].text);
    } catch (e) {
      result = { error: 'parse_failed' };
    }

    await notebook.addEntry('ProposalCrafter', 'craft_proposal', result);

    logger.success('✅ Proposal Crafter completado', { 
      titulo: result.titulo,
      precio: result.precio?.total,
      tokens: message.usage.output_tokens 
    });

    return { success: true, data: result, agent: 'ProposalCrafter' };
  } catch (error) {
    logger.error('❌ Proposal Crafter falló', { error: error.message });
    throw error;
  }
};

// ============================================================
// WORKFLOW EXECUTION — Cadena de agentes
// ============================================================

/**
 * Ejecuta TODOS los agentes en cadena
 * Cada uno lee el contexto del anterior
 */

export const executeWorkflow = async (leadData) => {
  logger.info('🔄 WORKFLOW iniciado', { lead: leadData.name });

  try {
    // Limpiar notebook para nuevo workflow
    notebook.reset();

    // Ejecutar cadena de agentes
    const step1 = await leadExtractor(leadData);
    const step2 = await painAnalyzer();
    const step3 = await strategyMapper();
    const step4 = await proposalCrafter();

    // Obtener resumen final
    const finalSummary = notebook.getSummary();

    logger.success('✅ WORKFLOW COMPLETADO', {
      lead: leadData.name,
      total_steps: finalSummary.total_steps,
      agents: finalSummary.agents_executed.join(', ')
    });

    return {
      success: true,
      workflow: 'LEAD_TO_PROPOSAL',
      lead: leadData.name,
      steps: finalSummary.total_steps,
      notebook_summary: finalSummary,
      final_proposal: step4.data,
      execution_log: notebook.entries
    };
  } catch (error) {
    logger.error('❌ WORKFLOW FALLÓ', { error: error.message });
    throw error;
  }
};

// ============================================================
// EXPORTS
// ============================================================

export default {
  // Agentes individuales (para uso específico)
  leadExtractor,
  painAnalyzer,
  strategyMapper,
  proposalCrafter,
  
  // Workflow completo
  executeWorkflow,
  
  // Acceso a notebook (si es necesario)
  notebook
};
