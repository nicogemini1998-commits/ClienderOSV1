import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import { logger } from './logger.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dir, '../../data');
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'cliender.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    company     TEXT,
    email       TEXT,
    phone       TEXT,
    sector      TEXT,
    website     TEXT,
    ghl_id      TEXT UNIQUE,
    notes       TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS templates (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    description   TEXT,
    category      TEXT DEFAULT 'custom',
    is_predefined INTEGER DEFAULT 0,
    input_config  TEXT NOT NULL DEFAULT '{}',
    agents        TEXT NOT NULL DEFAULT '[]',
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS executions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id   INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL,
    status      TEXT DEFAULT 'completed',
    input       TEXT,
    result      TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT DEFAULT 'limited',
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gallery_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    client_id   INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    type        TEXT NOT NULL DEFAULT 'image',
    url         TEXT NOT NULL,
    prompt      TEXT,
    style_name  TEXT,
    agent       TEXT,
    metadata    TEXT DEFAULT '{}',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS content_templates (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    description TEXT,
    nodes       TEXT NOT NULL DEFAULT '[]',
    edges       TEXT NOT NULL DEFAULT '[]',
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS photography_styles (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    description   TEXT,
    prompt_prefix TEXT NOT NULL,
    emoji         TEXT DEFAULT '📷',
    is_predefined INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Migrations (idempotent) ───────────────────────────────────
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_ghl_id ON clients(ghl_id) WHERE ghl_id IS NOT NULL;`);

// ─── Seed predefined templates ─────────────────────────────────
const seedCount = db.prepare('SELECT COUNT(*) as c FROM templates WHERE is_predefined=1').get();

if (seedCount.c === 0) {
  logger.info('🌱 Seeding predefined templates...');
  seedTemplates();
  logger.success('✅ Templates seeded');
}

function seedTemplates() {
  const insert = db.prepare(`
    INSERT INTO templates (name, description, category, is_predefined, input_config, agents)
    VALUES (@name, @description, @category, 1, @input_config, @agents)
  `);

  // ── Template 1: Lead → Propuesta ──────────────────────────────
  insert.run({
    name: 'Lead → Propuesta',
    description: 'Pipeline completo: extracción, análisis de dolor, estrategia y propuesta comercial',
    category: 'ventas',
    input_config: JSON.stringify({
      fields: [
        { key: 'name',    label: 'Empresa',  placeholder: 'Nombre del cliente', multiline: false },
        { key: 'website', label: 'Website',  placeholder: 'https://empresa.com', multiline: false },
        { key: 'sector',  label: 'Sector',   placeholder: 'Technology, Finance...', multiline: false },
      ]
    }),
    agents: JSON.stringify([
      {
        id: 'LeadExtractor',
        label: 'Lead Extractor',
        icon: '⚡',
        tokens: 400,
        model: 'claude-haiku-4-5',
        systemPrompt: `You are a lead research specialist. Extract structured data about the company.
Output ONLY valid JSON: { empresa, sector, url, validity("valid"/"invalid"), company_size_estimate, industry_type }
Be concise and accurate. No extra text.`,
      },
      {
        id: 'PainAnalyzer',
        label: 'Pain Analyzer',
        icon: '🎯',
        tokens: 600,
        model: 'claude-haiku-4-5',
        systemPrompt: `You are a senior business consultant identifying pain points.
Output ONLY valid JSON: { dolores:[{pain,severity(1-10),impact,solution_hint}], urgencia_score(1-10), industry_challenges:[] }
Focus on real business problems, not generic ones.`,
      },
      {
        id: 'StrategyMapper',
        label: 'Strategy Mapper',
        icon: '🗺',
        tokens: 700,
        model: 'claude-haiku-4-5',
        systemPrompt: `You are a strategy consultant designing solution approaches.
Output ONLY valid JSON: { estrategia, servicios:[], timeline_days, presupuesto("$X-$Y"), closure_probability(0-100), diferenciador }
Be specific and realistic with the budget range.`,
      },
      {
        id: 'ProposalWriter',
        label: 'Proposal Writer',
        icon: '✍',
        tokens: 900,
        model: 'claude-haiku-4-5',
        systemPrompt: `You are an expert proposal writer creating compelling commercial proposals.
Output ONLY valid JSON: { titulo, resumen_ejecutivo, fases:[{nombre,descripcion,duracion}], precio:{total,desglose}, garantia }
Make it persuasive and client-specific.`,
      },
      {
        id: 'NextStepsPlanner',
        label: 'Next Steps',
        icon: '📋',
        tokens: 500,
        model: 'claude-haiku-4-5',
        systemPrompt: `You are a sales strategist planning follow-up actions.
Output ONLY valid JSON: { next_steps:[{action,deadline,responsible}], contact_strategy, follow_up_days, decision_criteria:[] }
Be actionable and time-bound.`,
      },
    ]),
  });

  // ── Template 2: Análisis de Reunión ────────────────────────────
  insert.run({
    name: 'Análisis de Reunión',
    description: 'Procesa un transcript o resumen de reunión: puntos clave, tareas y email de seguimiento',
    category: 'operaciones',
    input_config: JSON.stringify({
      fields: [
        { key: 'transcript',   label: 'Transcript / Resumen', placeholder: 'Pega el transcript de la reunión o un resumen...', multiline: true },
        { key: 'participants', label: 'Participantes',         placeholder: 'Ej: Nicolas, Toni, Dan', multiline: false },
      ]
    }),
    agents: JSON.stringify([
      {
        id: 'MeetingSummarizer',
        label: 'Meeting Summarizer',
        icon: '📝',
        tokens: 600,
        model: 'claude-haiku-4-5',
        systemPrompt: `You are a meeting analyst. Summarize the meeting content provided.
Output ONLY valid JSON: { summary, key_points:[], participants_mentioned:[], main_decisions:[], duration_estimate }`,
      },
      {
        id: 'ActionItemExtractor',
        label: 'Action Items',
        icon: '✅',
        tokens: 600,
        model: 'claude-haiku-4-5',
        systemPrompt: `You are a project coordinator. Extract all action items from the meeting.
Output ONLY valid JSON: { action_items:[{task,owner,deadline,priority("high"/"medium"/"low")}], total_count, blockers:[] }`,
      },
      {
        id: 'FollowUpDrafter',
        label: 'Follow-Up Email',
        icon: '📧',
        tokens: 700,
        model: 'claude-haiku-4-5',
        systemPrompt: `You are a business communication specialist. Draft a professional follow-up email.
Output ONLY valid JSON: { subject, body, tone, send_to:[], cc:[] }
Write the full email body in the body field.`,
      },
    ]),
  });

  // ── Template 3: Estrategia de Contenido ───────────────────────
  insert.run({
    name: 'Estrategia de Contenido',
    description: 'Crea una estrategia de contenido completa: audiencia, pilares y calendario 30 días',
    category: 'marketing',
    input_config: JSON.stringify({
      fields: [
        { key: 'brand',       label: 'Marca / Producto', placeholder: 'Nombre de la marca o producto', multiline: false },
        { key: 'description', label: 'Descripción',      placeholder: 'Qué hace, a quién va dirigido, propuesta de valor...', multiline: true },
      ]
    }),
    agents: JSON.stringify([
      {
        id: 'AudienceAnalyzer',
        label: 'Audience Analyzer',
        icon: '👥',
        tokens: 600,
        model: 'claude-haiku-4-5',
        systemPrompt: `You are a digital marketing specialist. Analyze the target audience for this brand.
Output ONLY valid JSON: { primary_audience, demographics:{age_range,profession,interests:[]}, pain_points:[], content_preferences:[], platforms:[] }`,
      },
      {
        id: 'ContentStrategist',
        label: 'Content Strategist',
        icon: '🎨',
        tokens: 700,
        model: 'claude-haiku-4-5',
        systemPrompt: `You are a content strategy director. Create a content strategy based on the audience analysis.
Output ONLY valid JSON: { pillars:[{name,description,percentage}], content_types:[{type,frequency,purpose}], tone_of_voice, key_messages:[] }`,
      },
      {
        id: 'CalendarPlanner',
        label: 'Calendar Planner',
        icon: '📅',
        tokens: 800,
        model: 'claude-haiku-4-5',
        systemPrompt: `You are a content planner. Create a 30-day content calendar outline.
Output ONLY valid JSON: { monthly_goal, weekly_themes:[4 strings], sample_posts:[{day,type,topic,hook}], kpis:[] }
Provide 7 sample posts.`,
      },
    ]),
  });
}

// ─── Seed users ────────────────────────────────────────────────
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
if (userCount.c === 0) {
  logger.info('👤 Seeding users...');
  seedUsers();
  logger.success('✅ Users seeded');
}

function seedUsers() {
  // Passwords are stored as bcrypt hashes — seeded at runtime via auth route
  // Here we store a marker; the auth route will handle real hashing
  // We store plain bcrypt rounds=10 hashes for known passwords
  const insert = db.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`);
  const admins = ['nicolas', 'toni', 'dan'];
  const limited = ['pablo', 'vicent', 'ferran', 'ruben', 'ethan', 'sara'];
  // Placeholder hashes — replaced on first login by auth route if needed
  // Format: role:password so auth can verify simply during bootstrap
  admins.forEach(n => insert.run(n, `${n}@cliender.com`, `PENDING:Master123`, 'admin'));
  limited.forEach(n => insert.run(n, `${n}@cliender.com`, `PENDING:Cliender123`, 'limited'));
}

// ─── Seed photography styles ────────────────────────────────────
const styleCount = db.prepare('SELECT COUNT(*) as c FROM photography_styles WHERE is_predefined=1').get();
if (styleCount.c === 0) {
  logger.info('🎨 Seeding photography styles...');
  seedStyles();
  logger.success('✅ Styles seeded');
}

function seedStyles() {
  const insert = db.prepare(`INSERT INTO photography_styles (name, description, prompt_prefix, emoji, is_predefined) VALUES (?, ?, ?, ?, 1)`);
  const styles = [
    ['Editorial Luxury', 'Alta moda, iluminación dramática, fondos neutros', 'Editorial luxury photography, high fashion, dramatic studio lighting, neutral tones, magazine quality, sharp details,', '✨'],
    ['Lifestyle Natural', 'Luz natural, cotidiano auténtico, tonos cálidos', 'Lifestyle photography, natural light, authentic everyday moments, warm tones, candid, golden hour,', '🌿'],
    ['Producto Minimalista', 'Fondo blanco/negro, producto centrado, shadows suaves', 'Product photography, minimalist style, clean white or dark background, centered subject, soft shadows, commercial quality,', '📦'],
    ['Arquitectura & Espacio', 'Interiores modernos, perspectiva arquitectónica, luz difusa', 'Architectural photography, modern interior design, perspective lines, diffused natural light, clean composition,', '🏛️'],
    ['Retrato Corporativo', 'Profesional, fondo blurred, luz lateral suave', 'Corporate portrait photography, professional look, bokeh background, soft side lighting, confident pose,', '👤'],
    ['Dark & Moody', 'Sombras profundas, contraste alto, paleta oscura', 'Dark moody photography, deep shadows, high contrast, dark color palette, cinematic atmosphere, noir style,', '🌑'],
    ['Vibrante & Colorful', 'Colores saturados, alegre, energético', 'Vibrant colorful photography, saturated colors, joyful mood, energetic composition, pop art inspired,', '🎨'],
    ['Cinematic Film', 'Grano de película, ratio 2.39:1, color grading cinemático', 'Cinematic film photography, 35mm grain texture, widescreen composition, cinematic color grading, anamorphic lens flare,', '🎬'],
    ['Flat Lay', 'Vista cenital, composición geométrica, props organizados', 'Flat lay photography, overhead bird eye view, geometric arrangement, organized props, clean background,', '🪟'],
    ['Macro & Detalle', 'Primer plano extremo, texturas, profundidad de campo mínima', 'Macro photography, extreme close-up, intricate textures, razor-thin depth of field, fine details visible,', '🔬'],
  ];
  styles.forEach(s => insert.run(...s));
}

// ─── Helpers ───────────────────────────────────────────────────
export function getDB() { return db; }

export function query(sql, params = []) {
  const stmt = db.prepare(sql);
  const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
  return { rows: isSelect ? stmt.all(...params) : [stmt.run(...params)] };
}

export default db;
