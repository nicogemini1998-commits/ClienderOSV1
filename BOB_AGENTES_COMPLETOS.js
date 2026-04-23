/**
 * 🧠 BOB AGENTES COMPLETOS — CLIENDER OS v1.0
 * 
 * Todos los agentes listos para FullStackAI, ContentStudio y LeadUp
 * Diseño: Dark Glass + Liquid Glass + Elementos elegantes
 * 
 * ÚLTIMA ACTUALIZACIÓN: 2026-04-24
 */

// ============================================================
// AGENT 1: LEAD RESEARCH AGENT
// ============================================================

/**
 * lead-research.js
 * 
 * PROPÓSITO: Analizar leads profundamente
 * ENTRADA: { website, name, sector, country }
 * SALIDA: Análisis con urgencia, servicios recomendados, estrategia
 * MODELO: claude-haiku-4-5
 * TOKENS: ~2000
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

const client = new Anthropic();

export const leadResearch = async (leadData) => {
  logger.info('🔍 Lead Research iniciado', { 
    lead: leadData.name, 
    website: leadData.website 
  });

  try {
    const systemPrompt = `Eres un experto estratega comercial B2B de CLIENDER.
Tu rol: Analizar leads y dar insights de calidad ejecutiva.

RESPONDE SIEMPRE EN JSON VÁLIDO, SIN MARKDOWN.`;

    const userPrompt = `Analiza este lead con profundidad:

LEAD:
- Nombre: ${leadData.name}
- Website: ${leadData.website || 'No disponible'}
- Sector: ${leadData.sector || 'Desconocido'}
- País: ${leadData.country || 'No especificado'}

Proporciona análisis en JSON:
{
  "empresa": {
    "nombre": "nombre oficial",
    "posicionamiento": "cómo se posiciona",
    "etapa": "startup/scale-up/establecida",
    "tamaño_estimado": "empleados aproximados"
  },
  "dolores_identificados": [
    {"dolor": "Problema 1", "severidad": 8, "contexto": "Explicación"},
    {"dolor": "Problema 2", "severidad": 6, "contexto": "Explicación"}
  ],
  "oportunidades": [
    "Oportunidad 1: contexto breve",
    "Oportunidad 2: contexto breve"
  ],
  "servicios_recomendados": [
    {"servicio": "Captación de Leads", "justificacion": "porque..."},
    {"servicio": "Automatización de Ventas", "justificacion": "porque..."}
  ],
  "urgencia_score": 7,
  "timeline_estimado": "30 días",
  "inversion_probable": "$5,000-$15,000",
  "estrategia_abordaje": "Cómo contactar y posicionar",
  "probabilidad_cierre": 65
}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    const analysisText = message.content[0].text;
    let analysis = {};

    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch (e) {
      logger.warn('⚠️ JSON parse fallback', { error: e.message });
      analysis = { raw_response: analysisText };
    }

    logger.success('✅ Lead Research completado', {
      lead: leadData.name,
      urgencia: analysis.urgencia_score,
      tokens: message.usage.output_tokens
    });

    return {
      success: true,
      agent: 'LeadResearch',
      analysis,
      metadata: {
        model: 'claude-haiku-4-5',
        tokens_used: message.usage.output_tokens,
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now()
      }
    };
  } catch (error) {
    logger.error('❌ Lead Research falló', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENT 2: MEETING ANALYZER AGENT
// ============================================================

/**
 * meeting-analyzer.js
 * 
 * PROPÓSITO: Extraer insights de reuniones de ventas
 * ENTRADA: { transcription, attendees, company, duration_minutes }
 * SALIDA: Análisis comercial, sentimiento, próximos pasos
 * MODELO: claude-haiku-4-5
 * TOKENS: ~2500
 */

export const meetingAnalyzer = async (meetingData) => {
  logger.info('📞 Meeting Analyzer iniciado', {
    company: meetingData.company,
    attendees: meetingData.attendees?.length || 0,
    duration: meetingData.duration_minutes
  });

  try {
    const systemPrompt = `Eres un analista de ventas experto en extractar valor de reuniones.
Extrae insights accionables, detecta objeciones y probabilidad de cierre.
RESPONDE SIEMPRE EN JSON VÁLIDO.`;

    const userPrompt = `Analiza esta reunión de ventas:

DETALLES:
- Empresa: ${meetingData.company}
- Asistentes: ${meetingData.attendees?.join(', ') || 'No especificados'}
- Duración: ${meetingData.duration_minutes || '?'} minutos

TRANSCRIPCIÓN:
${meetingData.transcription}

Proporciona análisis en JSON:
{
  "resumen_ejecutivo": "1-2 líneas clave de la reunión",
  "puntos_clave_discutidos": [
    "Punto 1",
    "Punto 2",
    "Punto 3"
  ],
  "objeciones_planteadas": [
    {"objecion": "Objeción 1", "severidad": "alta/media/baja", "respuesta_sugerida": "Cómo contrarrestar"}
  ],
  "necesidades_identificadas": [
    "Necesidad 1 con contexto",
    "Necesidad 2 con contexto"
  ],
  "proximos_pasos": [
    "Paso 1 (responsable, fecha estimada)",
    "Paso 2 (responsable, fecha estimada)"
  ],
  "sentimiento_general": "muy_positivo/positivo/neutral/negativo",
  "engagement_level": "alto/medio/bajo",
  "urgencia_cliente": 8,
  "probabilidad_cierre": 72,
  "timeline_estimado": "2-3 semanas",
  "decisor_identificado": "Nombre/rol del decision maker",
  "presupuesto_mencionado": "$X-$Y si se conoce",
  "red_flags": ["Flag 1 si existe", "Flag 2 si existe"],
  "green_flags": ["Indicador positivo 1", "Indicador positivo 2"],
  "acciones_inmediatas": "¿Qué hacer en las próximas 24 horas?"
}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    const analysisText = message.content[0].text;
    let analysis = {};

    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch (e) {
      logger.warn('⚠️ JSON parse fallback', { error: e.message });
      analysis = { raw_response: analysisText };
    }

    logger.success('✅ Meeting Analyzer completado', {
      company: meetingData.company,
      sentiment: analysis.sentimiento_general,
      closure_probability: analysis.probabilidad_cierre,
      tokens: message.usage.output_tokens
    });

    return {
      success: true,
      agent: 'MeetingAnalyzer',
      analysis,
      metadata: {
        model: 'claude-haiku-4-5',
        tokens_used: message.usage.output_tokens,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('❌ Meeting Analyzer falló', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENT 3: PROPOSAL GENERATOR AGENT
// ============================================================

/**
 * proposal-generator.js
 * 
 * PROPÓSITO: Generar propuestas comerciales profesionales
 * ENTRADA: { lead_analysis, meeting_analysis, company_name, budget_range }
 * SALIDA: Propuesta estructurada, pricing, timeline
 * MODELO: claude-haiku-4-5
 * TOKENS: ~3000
 */

export const proposalGenerator = async (data) => {
  logger.info('📄 Proposal Generator iniciado', {
    company: data.company_name
  });

  try {
    const systemPrompt = `Eres un experto redactor de propuestas B2B de CLIENDER.
Creas propuestas que convencen, justifican precio, y cierran deals.
RESPONDE SIEMPRE EN JSON VÁLIDO.`;

    const userPrompt = `Genera una propuesta comercial basada en estos análisis:

EMPRESA: ${data.company_name}
ANÁLISIS LEAD: ${JSON.stringify(data.lead_analysis)}
ANÁLISIS REUNIÓN: ${JSON.stringify(data.meeting_analysis)}
RANGO PRESUPUESTO: ${data.budget_range || 'A determinar'}

Crea propuesta en JSON:
{
  "numero_propuesta": "PROP-2026-[num]",
  "fecha_emision": "2026-04-24",
  "validez_dias": 30,
  "titulo": "Título impactante de la propuesta",
  "resumen_ejecutivo": "Párrafo de 3-4 líneas vendiendo el concepto",
  "problema_cliente": "Resumen del/los problema(s) identificado(s)",
  "solucion_propuesta": "Cómo CLIENDER lo resuelve",
  "fases": [
    {
      "numero": 1,
      "nombre": "Discovery & Strategy",
      "duracion_dias": 14,
      "descripcion": "Qué incluye",
      "entregables": ["Entregable 1", "Entregable 2"]
    },
    {
      "numero": 2,
      "nombre": "Implementación",
      "duracion_dias": 30,
      "descripcion": "Qué incluye",
      "entregables": ["Entregable 1", "Entregable 2"]
    },
    {
      "numero": 3,
      "nombre": "Optimización & Handoff",
      "duracion_dias": 14,
      "descripcion": "Qué incluye",
      "entregables": ["Entregable 1", "Entregable 2"]
    }
  ],
  "servicios": [
    {
      "nombre": "Servicio 1",
      "descripcion": "Breve descripción",
      "incluye": ["Item 1", "Item 2"],
      "precio": "$X,000"
    }
  ],
  "investment": {
    "subtotal": "$X,XXX",
    "impuesto": "$X,XXX",
    "total": "$XX,XXX",
    "moneda": "USD",
    "payment_terms": "50% al firmar, 50% al completar Fase 2"
  },
  "roi_estimado": "300-400% en 6 meses",
  "timeline_total_dias": 58,
  "start_date": "Negotiable",
  "key_success_factors": ["Factor 1", "Factor 2", "Factor 3"],
  "proximos_pasos": "Próximos pasos si cliente acepta",
  "garantia": "Breve garantía de satisfacción",
  "contacto_responsable": "Nombre + email para preguntas"
}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    const proposalText = message.content[0].text;
    let proposal = {};

    try {
      const jsonMatch = proposalText.match(/\{[\s\S]*\}/);
      proposal = JSON.parse(jsonMatch ? jsonMatch[0] : proposalText);
    } catch (e) {
      logger.warn('⚠️ JSON parse fallback', { error: e.message });
      proposal = { raw_proposal: proposalText };
    }

    logger.success('✅ Proposal Generator completado', {
      company: data.company_name,
      total_investment: proposal.investment?.total,
      timeline_days: proposal.timeline_total_dias,
      tokens: message.usage.output_tokens
    });

    return {
      success: true,
      agent: 'ProposalGenerator',
      proposal,
      metadata: {
        model: 'claude-haiku-4-5',
        tokens_used: message.usage.output_tokens,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('❌ Proposal Generator falló', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENT 4: KICKOFF ANALYZER AGENT
// ============================================================

/**
 * kickoff-analyzer.js
 * 
 * PROPÓSITO: Analizar reunión de kickoff y extraer brief operativo
 * ENTRADA: { transcription, company_name, project_goals }
 * SALIDA: Brief maestro con públicos, zonas, estrategia
 * MODELO: claude-haiku-4-5
 * TOKENS: ~2500
 */

export const kickoffAnalyzer = async (kickoffData) => {
  logger.info('🚀 Kickoff Analyzer iniciado', {
    company: kickoffData.company_name
  });

  try {
    const systemPrompt = `Eres un estratega de marketing que extrae insights operativos de kickoffs.
Creas briefs que guían toda la ejecución del proyecto.
RESPONDE SIEMPRE EN JSON VÁLIDO.`;

    const userPrompt = `Analiza este kickoff y extrae el brief operativo:

EMPRESA: ${kickoffData.company_name}
OBJETIVOS: ${kickoffData.project_goals}

TRANSCRIPCIÓN KICKOFF:
${kickoffData.transcription}

Proporciona brief en JSON:
{
  "proyecto_nombre": "Nombre del proyecto",
  "duracion_total": "90 días",
  "presupuesto_total": "$X,XXX",
  "vision_general": "Qué se quiere lograr en 1 frase",
  "objetivos_medibles": [
    {"objetivo": "Aumentar leads en 50%", "metrica": "leads/mes", "baseline": "X", "target": "Y"}
  ],
  "audiencias_target": [
    {
      "nombre": "Audience 1",
      "descripcion": "Quiénes son",
      "tamaño_estimado": "X personas",
      "caracteristicas": ["Característica 1", "Característica 2"],
      "pain_points": ["Dolor 1", "Dolor 2"],
      "mensajeria_clave": "Cómo hablarles"
    }
  ],
  "zonas_geograficas": ["Zona 1", "Zona 2"],
  "canales_principales": [
    {"canal": "Google Ads", "presupuesto": "40%", "objetivo": "Tráfico"}
  ],
  "entregables_fase_1": ["Entregable 1", "Entregable 2"],
  "entregables_fase_2": ["Entregable 1", "Entregable 2"],
  "metricas_exito": [
    {"metrica": "CTR", "target": "3.5%", "check_point": "Semanal"}
  ],
  "riesgos_identificados": [
    {"riesgo": "Riesgo 1", "mitigacion": "Cómo manejarlo"}
  ],
  "stakeholders": [
    {"nombre": "Name", "rol": "Rol", "contacto": "email"}
  ],
  "timeline_ejecutivo": "Fechas hito principales",
  "presupuesto_distribucion": "Cómo se distribuye el presupuesto",
  "siguiente_reunion": "Cuándo y qué revisar"
}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    const analysisText = message.content[0].text;
    let brief = {};

    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      brief = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch (e) {
      logger.warn('⚠️ JSON parse fallback', { error: e.message });
      brief = { raw_brief: analysisText };
    }

    logger.success('✅ Kickoff Analyzer completado', {
      company: kickoffData.company_name,
      audiencias: brief.audiencias_target?.length || 0,
      tokens: message.usage.output_tokens
    });

    return {
      success: true,
      agent: 'KickoffAnalyzer',
      brief,
      metadata: {
        model: 'claude-haiku-4-5',
        tokens_used: message.usage.output_tokens,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('❌ Kickoff Analyzer falló', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENT 5: CONTENT STRATEGIST AGENT
// ============================================================

/**
 * content-strategist.js
 * 
 * PROPÓSITO: Crear estrategia de contenido alineada con brief
 * ENTRADA: { brief, target_audience, campaign_duration, platforms }
 * SALIDA: Estrategia de contenido, calendario, prompts
 * MODELO: claude-haiku-4-5
 * TOKENS: ~2500
 */

export const contentStrategist = async (strategyData) => {
  logger.info('🎯 Content Strategist iniciado', {
    audience: strategyData.target_audience,
    platforms: strategyData.platforms?.length || 0
  });

  try {
    const systemPrompt = `Eres estratega de contenido de marketing B2B.
Creas estrategias de contenido que generan leads y engagement.
RESPONDE SIEMPRE EN JSON VÁLIDO.`;

    const userPrompt = `Crea estrategia de contenido:

AUDIENCIA: ${strategyData.target_audience}
DURACIÓN: ${strategyData.campaign_duration}
PLATAFORMAS: ${strategyData.platforms?.join(', ') || 'A definir'}
BRIEF: ${JSON.stringify(strategyData.brief)}

Proporciona estrategia en JSON:
{
  "vision_contenido": "La visión general de contenido",
  "pilares_tematicos": [
    {
      "pilar": "Pilar 1",
      "temas": ["Tema 1", "Tema 2"],
      "frecuencia": "2x semanal",
      "objetivo": "Qué lograr con este pilar"
    }
  ],
  "tipos_contenido": [
    {
      "tipo": "Blog posts",
      "cantidad": 12,
      "duracion": "1500-2000 palabras",
      "seo_focus": "Palabras clave target"
    }
  ],
  "calendario_anual": [
    {"mes": "Abril", "temas": ["Tema 1", "Tema 2"], "eventos": ["Evento 1"]}
  ],
  "prompts_creativos": [
    {
      "titulo": "Título del asset",
      "plataforma": "Plataforma destino",
      "prompt_imagen": "Si aplica",
      "copy": "Texto a usar",
      "cta": "Llamada a acción"
    }
  ],
  "metricas_exito": [
    {"metrica": "Engagement rate", "target": "4%"}
  ],
  "presupuesto_distribucion": {
    "produccion": "50%",
    "distribucion": "30%",
    "herramientas": "20%"
  }
}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    const strategyText = message.content[0].text;
    let strategy = {};

    try {
      const jsonMatch = strategyText.match(/\{[\s\S]*\}/);
      strategy = JSON.parse(jsonMatch ? jsonMatch[0] : strategyText);
    } catch (e) {
      logger.warn('⚠️ JSON parse fallback', { error: e.message });
      strategy = { raw_strategy: strategyText };
    }

    logger.success('✅ Content Strategist completado', {
      pillars: strategy.pilares_tematicos?.length || 0,
      content_types: strategy.tipos_contenido?.length || 0,
      tokens: message.usage.output_tokens
    });

    return {
      success: true,
      agent: 'ContentStrategist',
      strategy,
      metadata: {
        model: 'claude-haiku-4-5',
        tokens_used: message.usage.output_tokens,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('❌ Content Strategist falló', { error: error.message });
    throw error;
  }
};

// ============================================================
// AGENTES EXPORTADOS
// ============================================================

export default {
  leadResearch,
  meetingAnalyzer,
  proposalGenerator,
  kickoffAnalyzer,
  contentStrategist
};
