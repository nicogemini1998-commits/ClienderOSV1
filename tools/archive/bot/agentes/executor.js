import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import db from '../utils/db.js';

let _claude = null;
function getClaude() {
  if (!_claude) _claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _claude;
}

// ─── Shared notebook (same pattern as index.js) ───────────────
class Notebook {
  constructor() { this.entries = []; this.context = {}; this.id = null; }

  init(id, context) { this.id = id; this.entries = []; this.context = context; }

  write(agent, action, result) {
    const entry = { seq: this.entries.length + 1, agent, action, result, ts: new Date().toISOString() };
    this.entries.push(entry);

    try {
      db.prepare(`INSERT INTO executions (client_id, template_id, status, input, result)
                  SELECT ?, ?, 'step', ?, ?
                  WHERE 1=0`).run(); // no-op placeholder; full execution saved by server
    } catch (_) {}

    return entry;
  }

  readRecent(n = 3) {
    return this.entries.slice(-n)
      .map(e => `[${e.seq}] ${e.agent}: ${JSON.stringify(e.result)}`)
      .join('\n');
  }

  readLast() {
    return this.entries[this.entries.length - 1]?.result ?? null;
  }

  summary() {
    return { id: this.id, steps: this.entries.length, context: this.context, entries: this.entries };
  }

  reset() { this.entries = []; this.context = {}; this.id = null; }
}

const notebook = new Notebook();

// ─── JSON parser ──────────────────────────────────────────────
function parseJSON(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : text);
  } catch {
    return { raw: text };
  }
}

// ─── Dynamic workflow executor ────────────────────────────────
export async function executeDynamicWorkflow({ input, template, client, onProgress }) {
  const workflowId = `wf_${Date.now()}`;

  notebook.init(workflowId, {
    ...input,
    client_name: client?.name ?? '',
    client_company: client?.company ?? '',
    client_sector: client?.sector ?? '',
    client_website: client?.website ?? '',
  });

  logger.info('🚀 Dynamic workflow', { template: template.name, client: client?.name });

  for (const agent of template.agents) {
    onProgress?.(agent.id, 'running', null);
    logger.info(`  → ${agent.label}`);

    try {
      const context = notebook.readRecent(3);
      const clientLine = client
        ? `Client: ${client.name}${client.company ? ` (${client.company})` : ''}${client.sector ? ` · ${client.sector}` : ''}`
        : '';

      const userContent = [
        clientLine,
        context ? `Previous steps:\n${context}` : '',
        `Input: ${JSON.stringify(input)}`,
        'Respond with valid JSON only.',
      ].filter(Boolean).join('\n\n');

      const response = await getClaude().messages.create({
        model: agent.model || 'claude-haiku-4-5',
        max_tokens: agent.tokens || 600,
        system: agent.systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      });

      const result = parseJSON(response.content[0].text);
      notebook.write(agent.id, 'execute', result);
      onProgress?.(agent.id, 'completed', result);
      logger.success(`  ✓ ${agent.label}`);
    } catch (err) {
      logger.error(`  ✕ ${agent.label}`, { error: err.message });
      onProgress?.(agent.id, 'error', { error: err.message });
      throw err;
    }
  }

  const summary = notebook.summary();
  notebook.reset();

  return {
    success: true,
    workflow_id: workflowId,
    template: template.name,
    client: client?.name ?? null,
    steps: summary.steps,
    result: summary.entries[summary.entries.length - 1]?.result ?? null,
    all_results: Object.fromEntries(summary.entries.map(e => [e.agent, e.result])),
    entries: summary.entries,
  };
}
