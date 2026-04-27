import { Router } from 'express';
import db from '../../../../core/bot/utils/db.js';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const KIE_BASE = 'https://api.kie.ai';
const KIE_API = `${KIE_BASE}/api/v1`;

let _claude = null;
function getClaude() {
  if (!_claude) _claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _claude;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── /shaq agent ──────────────────────────────────────────────
async function runShaqAgent({ brief, style, client, count = 1, type = 'image' }) {
  const clientCtx = client
    ? `Client: ${client.name}${client.company ? ` (${client.company})` : ''}${client.sector ? ` · ${client.sector}` : ''}\n`
    : '';
  const styleCtx = style
    ? `Photography style: ${style.name} — ${style.description}\nStyle prefix: ${style.prompt_prefix}\n`
    : '';

  const mediaType = type === 'video' ? 'video' : 'image';
  const system = `You are /shaq, expert AI prompt engineer for ${mediaType} generation.
Generate ${count} highly detailed, production-ready prompts for KIE AI.
Output ONLY valid JSON: { "prompts": ["prompt 1", ...] }`;

  const userMsg = `${clientCtx}${styleCtx}Brief: ${brief}\nGenerate exactly ${count} ${mediaType} prompt${count > 1 ? 's' : ''}.`;

  const response = await getClaude().messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1500,
    system,
    messages: [{ role: 'user', content: userMsg }],
  });

  try {
    const match = response.content[0].text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : response.content[0].text);
    return parsed.prompts || [response.content[0].text];
  } catch {
    return [response.content[0].text];
  }
}

// ─── KIE createTask (all models) ──────────────────────────────
async function kieCreateTask(model, input) {
  const apiKey = process.env.KIE_API_KEY;
  const resp = await fetch(`${KIE_API}/jobs/createTask`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input }),
  });
  const data = await resp.json();
  if (!resp.ok || data.code !== 200) {
    throw new Error(`KIE createTask ${model}: ${data.msg || resp.status}`);
  }
  const taskId = data.data?.taskId || data.data?.recordId;
  if (!taskId) throw new Error(`KIE no taskId: ${JSON.stringify(data).slice(0, 200)}`);
  return taskId;
}

// ─── KIE poll once ────────────────────────────────────────────
async function kieRecordInfo(taskId) {
  const apiKey = process.env.KIE_API_KEY;
  const resp = await fetch(`${KIE_API}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await resp.json();
  if (!resp.ok || data.code !== 200) {
    return { status: 'pending', url: null, raw: data };
  }
  const d = data.data || {};
  const state = (d.state || '').toLowerCase();

  let url = null;
  if (d.resultJson) {
    try {
      const parsed = JSON.parse(d.resultJson);
      url = (parsed.resultUrls || [])[0] || parsed.url || null;
    } catch {}
  }

  let status;
  if (state === 'success' || state === 'completed') status = 'completed';
  else if (state === 'failed' || state === 'error') status = 'failed';
  else status = 'pending';

  return { status, url, failMsg: d.failMsg || null, raw: d };
}

// ─── Poll until done ──────────────────────────────────────────
async function pollUntilDone(taskId, maxWaitMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await sleep(4000);
    const result = await kieRecordInfo(taskId);
    if (result.status === 'completed') return result;
    if (result.status === 'failed') throw new Error(result.failMsg || 'KIE task failed');
  }
  throw new Error('Generation timeout (180s)');
}

// ─── POST /api/kie/image — start image tasks ──────────────────
// Supported models: flux-2/pro-text-to-image, flux-2/flex-text-to-image,
//   flux-2/pro-image-to-image, google/nano-banana, seedream/4.5-text-to-image
router.post('/image', async (req, res) => {
  const {
    prompt, brief, use_agent, model = 'flux-2/pro-text-to-image',
    aspectRatio = '1:1', resolution = '1K', imageInput,
    count = 1, style_id, client_id, user_id,
  } = req.body;

  const style = style_id ? db.prepare('SELECT * FROM photography_styles WHERE id = ?').get(style_id) : null;
  const client = client_id ? db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id) : null;
  const safeCount = Math.min(Math.max(1, Number(count)), 4);

  try {
    let prompts;
    if (use_agent && brief) {
      const raw = await runShaqAgent({ brief, style, client, count: safeCount, type: 'image' });
      prompts = raw.slice(0, safeCount).map(p => style ? `${style.prompt_prefix} ${p}` : p);
    } else {
      const base = prompt || brief || '';
      const fp = style ? `${style.prompt_prefix} ${base}` : base;
      prompts = Array(safeCount).fill(fp);
    }

    // Determine correct model (use image-to-image if reference provided)
    const finalModel = imageInput
      ? model.replace('text-to-image', 'image-to-image')
      : model;

    const taskIds = await Promise.all(prompts.map(p => {
      const input = {
        prompt: p,
        aspect_ratio: aspectRatio,
        resolution,
        ...(imageInput && { image_input: Array.isArray(imageInput) ? imageInput : [imageInput] }),
      };
      return kieCreateTask(finalModel, input);
    }));

    res.json({ success: true, taskIds, prompts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/kie/video — start video tasks ──────────────────
router.post('/video', async (req, res) => {
  const {
    prompt, brief, use_agent, resolution = '720p', aspectRatio = '16:9',
    duration = 5, count = 1, style_id, client_id, user_id,
    keyFrames, refVideos, refAudio,
    syncAudio = false, resumeLastFrame = false, webSearch = false, contentCheck = false,
  } = req.body;

  const style = style_id ? db.prepare('SELECT * FROM photography_styles WHERE id = ?').get(style_id) : null;
  const client = client_id ? db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id) : null;
  const safeCount = Math.min(Math.max(1, Number(count)), 3);

  try {
    let prompts;
    if (use_agent && brief) {
      const raw = await runShaqAgent({ brief, style, client, count: safeCount, type: 'video' });
      prompts = raw.slice(0, safeCount).map(p => style ? `${style.prompt_prefix} ${p}` : p);
    } else {
      const base = prompt || brief || '';
      const fp = style ? `${style.prompt_prefix} ${base}` : base;
      prompts = Array(safeCount).fill(fp);
    }

    const taskIds = await Promise.all(prompts.map(p => {
      const input = {
        prompt: p,
        resolution,
        aspect_ratio: aspectRatio,
        duration: Math.min(15, Math.max(4, Number(duration))),
        ...(Array.isArray(keyFrames) && keyFrames.length > 0 && { key_frames: keyFrames }),
        ...(Array.isArray(refVideos) && refVideos.length > 0 && { reference_videos: refVideos }),
        ...(Array.isArray(refAudio) && refAudio.length > 0 && { reference_audio: refAudio }),
        sync_audio: !!syncAudio,
        resume_last_frame: !!resumeLastFrame,
        web_search: !!webSearch,
        content_check: !!contentCheck,
      };
      return kieCreateTask('bytedance/seedance-2', input);
    }));

    res.json({ success: true, taskIds, prompts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/kie/task/:taskId — poll once ────────────────────
router.get('/task/:taskId', async (req, res) => {
  try {
    const result = await kieRecordInfo(req.params.taskId);
    res.json({ ...result, taskId: req.params.taskId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/kie/prompts — prompts only ─────────────────────
router.post('/prompts', async (req, res) => {
  const { brief, style_id, client_id, count = 3 } = req.body;
  if (!brief) return res.status(400).json({ error: 'brief required' });

  const style = style_id ? db.prepare('SELECT * FROM photography_styles WHERE id = ?').get(style_id) : null;
  const client = client_id ? db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id) : null;

  try {
    const prompts = await runShaqAgent({ brief, style, client, count: Math.min(count, 10) });
    res.json({ prompts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/kie/generate — legacy blocking endpoint ────────
router.post('/generate', async (req, res) => {
  const { brief, style_id, client_id, user_id, count = 1, type = 'image', agent = '/shaq' } = req.body;
  if (!brief) return res.status(400).json({ error: 'brief required' });

  const style = style_id ? db.prepare('SELECT * FROM photography_styles WHERE id = ?').get(style_id) : null;
  const client = client_id ? db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id) : null;
  const safeCount = Math.min(Math.max(1, Number(count)), 4);

  try {
    const promptList = await runShaqAgent({ brief, style, client, count: safeCount, type });
    const results = [];

    for (const p of promptList.slice(0, safeCount)) {
      const fp = style ? `${style.prompt_prefix} ${p}` : p;
      try {
        let taskId;
        if (type === 'video') {
          taskId = await kieCreateTask('bytedance/seedance-2', {
            prompt: fp, resolution: '720p', aspect_ratio: '16:9', duration: 5, generate_audio: false,
          });
        } else {
          taskId = await kieCreateTask('flux-2/pro-text-to-image', {
            prompt: fp, aspect_ratio: '1:1', resolution: '1K',
          });
        }
        const { url } = await pollUntilDone(taskId);
        if (!url) { results.push({ error: 'No URL', prompt: fp }); continue; }

        const row = db.prepare(`
          INSERT INTO gallery_items (user_id, client_id, type, url, prompt, style_name, agent, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(user_id || null, client_id || null, type, url, fp, style?.name || null, agent,
               JSON.stringify({ brief, style_id }));
        const saved = db.prepare('SELECT * FROM gallery_items WHERE id = ?').get(row.lastInsertRowid);
        results.push({ ...saved, metadata: JSON.parse(saved.metadata || '{}') });
      } catch (genErr) {
        results.push({ error: genErr.message, prompt: fp });
      }
    }

    res.json({ success: true, results, prompts: promptList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
