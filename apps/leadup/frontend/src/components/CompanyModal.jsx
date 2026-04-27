import { useState, useEffect, useRef } from 'react'
import StatusBar from './StatusBar'
import { notesApi } from '../lib/api'

const OPP_STYLES = {
  alta:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  media: 'text-amber-400  bg-amber-400/10  border-amber-400/30',
  baja:  'text-red-400    bg-red-400/10    border-red-400/30',
}

function scoreColor(s) {
  if (s >= 65) return 'text-emerald-400'
  if (s >= 35) return 'text-amber-400'
  return 'text-red-400'
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-surface-border" />
    </div>
  )
}

function DiagRow({ label, value, active, note }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-border/60 last:border-0 gap-4">
      <span className="text-sm text-slate-400 flex-shrink-0">{label}</span>
      <div className="text-right min-w-0">
        {active !== undefined ? (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border
            ${active
              ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
              : 'text-slate-500 bg-surface-card border-surface-border'}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            {active ? 'Activo' : 'No detectado'}
          </span>
        ) : (
          <span className="text-sm text-white font-medium">{value}</span>
        )}
        {note && <p className="text-[11px] text-slate-500 mt-0.5">{note}</p>}
      </div>
    </div>
  )
}

function OppColumn({ title, icon, items }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <div className="text-xs font-black text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span>{icon}</span> {title}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
            <span className="text-accent mt-0.5 flex-shrink-0">›</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function buildOpportunities(company) {
  const sales = []
  const tech = []
  const content = []

  if (!company.captacion_leads) sales.push('Sistema de captación de leads online')
  if (!company.email_marketing) sales.push('Automatización de email marketing / CRM')
  sales.push('Pipeline comercial con seguimiento digital')

  tech.push('Integración IA para atención y presupuestos')
  if (!company.seo_info) tech.push('Posicionamiento SEO para búsquedas locales')
  tech.push('Analytics y cuadro de mando digital')

  if (!company.video_contenido) content.push('Producción de vídeo corporativo y testimonios')
  if (!company.redes_sociales) content.push('Gestión de redes sociales y comunidad')
  content.push('Contenido audiovisual para captación')

  return { sales, tech, content }
}

export default function CompanyModal({ lead, onClose, onStatusChange }) {
  const [notes, setNotes] = useState(lead?.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const overlayRef = useRef(null)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [onClose])

  const handleNotesChange = (value) => {
    setNotes(value)
    setNotesSaved(false)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveNotes(value), 1200)
  }

  const saveNotes = async (value) => {
    setSavingNotes(true)
    try {
      await notesApi.update(lead.assignment_id, value)
      setNotesSaved(true)
    } catch (err) {
      console.error('Failed to save notes:', err)
    } finally {
      setSavingNotes(false)
    }
  }

  if (!lead) return null
  const { company, contact, assignment_id, status } = lead
  const mobile = contact?.phone || company.phone
  const oppStyle = OPP_STYLES[company.opportunity_level] || OPP_STYLES.media
  const { sales, tech, content } = buildOpportunities(company)

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4"
    >
      <div className="bg-surface-raised border border-surface-border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-slide-up overflow-hidden">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-surface-border">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-2xl font-black text-white leading-tight truncate">
              {company.name}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-slate-400">
              {company.city && <span>{company.city}</span>}
              {company.industry && (
                <>
                  <span className="text-slate-600">·</span>
                  <span>{company.industry}</span>
                </>
              )}
              {company.website && (
                <>
                  <span className="text-slate-600">·</span>
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-accent hover:underline"
                  >
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Score */}
            <div className="text-right">
              <div className={`text-3xl font-black leading-none ${scoreColor(company.digital_score)}`}>
                {company.digital_score}
                <span className="text-slate-500 text-base font-medium">/100</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Score digital</div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-hover transition-colors"
              aria-label="Cerrar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Opportunity strip */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-surface-border/50 bg-surface-card/40">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${oppStyle}`}>
            Oportunidad {company.opportunity_level}
          </span>
          {company.opportunity_analysis && (
            <p className="text-xs text-slate-400 truncate">{company.opportunity_analysis}</p>
          )}
        </div>

        {/* ── BODY scrollable ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* DECISION MAKERS */}
          <section>
            <SectionLabel>Decision Makers — Teléfono Móvil Verificado</SectionLabel>

            {contact ? (
              <div className="bg-surface-card border border-surface-border rounded-xl p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-accent">
                        {contact.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{contact.name}</p>
                      {contact.title && (
                        <p className="text-xs text-slate-400 truncate">{contact.title}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone — always prominent */}
                  {mobile ? (
                    <a
                      href={`tel:${mobile}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-2.5 font-mono font-bold text-sm transition-colors flex-shrink-0"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 7.09 7.09l.41-.41a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.92z" />
                      </svg>
                      {mobile}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-600 italic">Móvil no disponible</span>
                  )}
                </div>

                {/* Email row */}
                {contact.email && (
                  <div className="mt-3 pt-3 border-t border-surface-border flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-slate-500 flex-shrink-0">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-sm text-accent hover:underline truncate"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-surface-card border border-surface-border rounded-xl p-4">
                <p className="text-sm text-slate-500 italic">No hay contacto registrado para esta empresa.</p>
                {company.phone && (
                  <a
                    href={`tel:${company.phone}`}
                    className="mt-2 flex items-center gap-2 text-accent text-sm font-mono hover:underline"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 7.09 7.09l.41-.41a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.92z" />
                    </svg>
                    {company.phone}
                  </a>
                )}
              </div>
            )}
          </section>

          {/* ECOSISTEMA DIGITAL */}
          <section>
            <SectionLabel>Ecosistema Digital — Diagnóstico</SectionLabel>
            <div className="bg-surface-card border border-surface-border rounded-xl divide-y divide-surface-border/60 px-4">
              <DiagRow
                label="Presencia web"
                value={`DFTMO Score ${company.digital_score}/100`}
                note={company.website || undefined}
              />
              <DiagRow label="Redes Sociales"   active={company.redes_sociales} />
              <DiagRow label="CRM / Email"       active={company.email_marketing} />
              <DiagRow label="Captación Leads"   active={company.captacion_leads} />
              <DiagRow label="SEO"               active={company.seo_info} />
              <DiagRow label="Contenido en vídeo" active={company.video_contenido} />
            </div>
          </section>

          {/* OPORTUNIDADES HBD */}
          <section>
            <SectionLabel>Oportunidades HBD Revolución</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <OppColumn title="Sales / CRM"  icon="💼" items={sales} />
              <OppColumn title="Tech / IA"    icon="⚡" items={tech} />
              <OppColumn title="Contenido AV" icon="🎬" items={content} />
            </div>
          </section>

          {/* FRASES DE APERTURA */}
          {company.opening_lines?.length > 0 && (
            <section>
              <SectionLabel>Frases de Apertura</SectionLabel>
              <ol className="space-y-2">
                {company.opening_lines.map((line, i) => (
                  <li key={i} className="flex gap-3 p-3 bg-surface-card border border-surface-border rounded-lg">
                    <span className="text-xs font-black text-accent mt-0.5 flex-shrink-0">{i + 1}</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{line}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* HOOKS */}
          {company.hooks?.length > 0 && (
            <section>
              <SectionLabel>Hooks de Conversación</SectionLabel>
              <ul className="space-y-2">
                {company.hooks.map((hook, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-400">
                    <span className="text-accent flex-shrink-0 mt-0.5">›</span>
                    <span>{hook}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* NOTAS DEL COMERCIAL */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">
                Notas del Comercial
              </span>
              <div className="flex-1 h-px bg-surface-border" />
              <span className="text-xs text-slate-600 flex-shrink-0">
                {savingNotes ? '↑ Guardando...' : notesSaved ? '✓ Guardado' : ''}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Escribe tus notas aquí... Se guardan automáticamente."
              rows={5}
              className="w-full bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-accent/50 font-mono leading-relaxed transition-colors"
            />
          </section>
        </div>

        {/* ── FOOTER: status ── */}
        <div className="px-6 py-4 border-t border-surface-border bg-surface-card/60">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Estado del lead</span>
            <StatusBar
              assignmentId={assignment_id}
              currentStatus={status}
              onStatusChange={onStatusChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
