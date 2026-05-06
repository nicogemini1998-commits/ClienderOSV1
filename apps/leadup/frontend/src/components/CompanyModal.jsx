import { useState, useEffect } from 'react'
import StatusBar from './StatusBar'
import { notesApi, contactsApi, leadsApi } from '../lib/api'

function isMobilePrefix(prefix) {
  if (!prefix) return false
  const p = prefix.replace(/\D/g, '')
  return p.startsWith('6') || p.startsWith('7')
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

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

function SectionLabel({ children, action }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-surface-border" />
      {action}
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

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function ReportContent({ content }) {
  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i} className="italic">{part.slice(1, -1)}</em>
      return part
    })
  }

  const blocks = []
  const lines = content.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('# ')) {
      blocks.push(<h1 key={i} className="text-xl font-black text-white mt-4 mb-1">{line.slice(2)}</h1>)
    } else if (line.startsWith('## ')) {
      blocks.push(<h2 key={i} className="text-base font-black text-white mt-6 mb-2 pb-1 border-b border-surface-border">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      blocks.push(<h3 key={i} className="text-sm font-bold text-accent uppercase tracking-wider mt-4 mb-2">{line.slice(4)}</h3>)
    } else if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={i} className="border-surface-border/60 my-3" />)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-2">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className="text-accent flex-shrink-0 mt-0.5">›</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    } else if (/^\d+\. /.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      blocks.push(
        <ol key={`ol-${i}`} className="space-y-1.5 my-2">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className="text-accent font-bold flex-shrink-0 w-4">{j + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    } else if (line.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i])
        i++
      }
      const isHeaderNext = rows[1] && /^\|[-|: ]+\|$/.test(rows[1].trim())
      const parseRow = (row) => row.split('|').filter(c => c.trim() !== '').map(c => c.trim())
      const dataRows = isHeaderNext ? rows.slice(2) : rows.filter(r => !/^\|[-|: ]+\|$/.test(r.trim()))
      blocks.push(
        <div key={`table-${i}`} className="my-3 rounded-xl border border-surface-border overflow-hidden">
          <table className="w-full text-sm">
            {isHeaderNext && (
              <thead>
                <tr className="bg-surface-raised">
                  {parseRow(rows[0]).map((cell, j) => (
                    <th key={j} className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-surface-border">
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {dataRows.map((row, j) => (
                <tr key={j} className="border-b border-surface-border/40 last:border-0 hover:bg-surface-hover/30 transition-colors">
                  {parseRow(row).map((cell, k) => (
                    <td key={k} className="text-slate-300 px-3 py-2.5 align-top leading-relaxed">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    } else if (line.trim() === '') {
      blocks.push(<div key={i} className="h-1" />)
    } else {
      blocks.push(
        <p key={i} className="text-sm text-slate-300 leading-relaxed my-1">
          {renderInline(line)}
        </p>
      )
    }
    i++
  }

  return <div className="space-y-0.5">{blocks}</div>
}

export default function CompanyModal({ lead, onClose, onStatusChange, onContactChange }) {
  const [notes, setNotes] = useState(lead?.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  const [followUpDate, setFollowUpDate] = useState(lead?.follow_up_date || '')
  const [savingFollowUp, setSavingFollowUp] = useState(false)

  const handleFollowUpChange = async (newDate) => {
    setSavingFollowUp(true)
    try {
      await leadsApi.updateFollowup(lead.assignment_id, newDate || null)
      setFollowUpDate(newDate)
    } catch (_) {
      // silently fail
    } finally {
      setSavingFollowUp(false)
    }
  }

  const [contact, setContact] = useState(lead?.contact || null)
  const [editingContact, setEditingContact] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: lead?.contact?.name || '',
    title: lead?.contact?.title || '',
    phone: lead?.contact?.phone || '',
    email: lead?.contact?.email || '',
  })
  const [savingContact, setSavingContact] = useState(false)
  const [contactError, setContactError] = useState(null)

  const [revealedPhone, setRevealedPhone] = useState(
    lead?.contact?.phone_revealed ? lead?.contact?.phone : null
  )
  const [revealing, setRevealing] = useState(false)
  const [revealError, setRevealError] = useState(null)

  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState(null)
  const [reportCached, setReportCached] = useState(false)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    setNotesSaved(false)
    try {
      await notesApi.update(lead.assignment_id, notes)
      setNotesSaved(true)
    } catch (err) {
      // silently fail — user can retry
    } finally {
      setSavingNotes(false)
    }
  }

  const handleStartEditContact = () => {
    setContactForm({
      name: contact?.name || '',
      title: contact?.title || '',
      phone: contact?.phone || '',
      email: contact?.email || '',
    })
    setContactError(null)
    setEditingContact(true)
  }

  const handleCancelEditContact = () => {
    setEditingContact(false)
    setContactError(null)
  }

  const handleSaveContact = async () => {
    if (!contact?.id) return
    setSavingContact(true)
    setContactError(null)
    try {
      const res = await contactsApi.update(contact.id, contactForm)
      const updated = res.data
      setContact(updated)
      onContactChange?.(lead.assignment_id, updated)
      setEditingContact(false)
    } catch (err) {
      setContactError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setSavingContact(false)
    }
  }

  const handleGenerateReport = async (forceRegenerate = false) => {
    if (reportLoading) return
    if (forceRegenerate) {
      try { await leadsApi.clearReportCache(lead.assignment_id) } catch (_) {}
    }
    setReportLoading(true)
    setReportError(null)
    try {
      const res = await leadsApi.generateReport(lead.assignment_id)
      setReport(res.data.report)
      setReportCached(res.data.cached)
    } catch (err) {
      setReportError(err.response?.data?.detail || 'Error al generar el informe')
    } finally {
      setReportLoading(false)
    }
  }

  const handleRevealPhone = async () => {
    if (revealing) return
    setRevealing(true)
    setRevealError(null)
    try {
      const res = await leadsApi.revealPhone(lead.assignment_id)
      const phone = res.data.phone
      setRevealedPhone(phone)
      setContact(prev => prev ? { ...prev, phone, phone_revealed: true } : prev)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al revelar el número'
      setRevealError(msg)
    } finally {
      setRevealing(false)
    }
  }

  if (!lead) return null
  const { company, assignment_id, status } = lead
  const displayPhone = revealedPhone || contact?.phone || company.phone
  const mobile = displayPhone
  const isRevealed = !!revealedPhone || contact?.phone_revealed
  const hasLusha = !!contact?.lusha_person_id
  const prefix = contact?.phone_prefix || ''
  const isMobile = isMobilePrefix(prefix)
  const oppStyle = OPP_STYLES[company.opportunity_level] || OPP_STYLES.media
  const { sales, tech, content } = buildOpportunities(company)

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
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
            <SectionLabel
              action={
                contact?.id && !editingContact ? (
                  <button
                    onClick={handleStartEditContact}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-surface-hover border border-surface-border transition-colors flex-shrink-0"
                  >
                    <PencilIcon />
                    Editar
                  </button>
                ) : null
              }
            >
              Decision Makers — Teléfono Móvil Verificado
            </SectionLabel>

            {contact ? (
              <div className="bg-surface-card border border-surface-border rounded-xl p-4">
                {editingContact ? (
                  /* ── EDIT FORM ── */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre</label>
                        <input
                          type="text"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 transition-colors"
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cargo</label>
                        <input
                          type="text"
                          value={contactForm.title}
                          onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                          className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 transition-colors"
                          placeholder="Cargo"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Teléfono</label>
                        <input
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-accent/50 transition-colors"
                          placeholder="+34 6XX XXX XXX"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent/50 transition-colors"
                          placeholder="email@empresa.com"
                        />
                      </div>
                    </div>
                    {contactError && (
                      <p className="text-xs text-red-400">{contactError}</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSaveContact}
                        disabled={savingContact}
                        className="flex-1 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                      >
                        {savingContact ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                      <button
                        onClick={handleCancelEditContact}
                        disabled={savingContact}
                        className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-surface-hover border border-surface-border transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── READ VIEW ── */
                  <>
                    <div className="flex items-center justify-between gap-4">
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

                      {isRevealed && mobile ? (
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
                      ) : !isRevealed && hasLusha ? (
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <button
                            onClick={handleRevealPhone}
                            disabled={revealing}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-sm border transition-colors
                              ${isMobile
                                ? 'bg-emerald-400/10 hover:bg-emerald-400/20 border-emerald-400/30 text-emerald-400'
                                : 'bg-surface-raised hover:bg-surface-hover border-surface-border text-slate-300'
                              } disabled:opacity-50`}
                          >
                            {revealing ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <EyeIcon />
                            )}
                            {revealing ? 'Revelando…' : (
                              prefix
                                ? <>Revelar <span className="font-mono">{prefix}X…</span></>
                                : 'Revelar móvil'
                            )}
                          </button>
                          {isMobile && !revealing && (
                            <span className="text-[10px] text-emerald-400/70">Móvil detectado</span>
                          )}
                          {revealError && (
                            <span className="text-[10px] text-red-400">{revealError}</span>
                          )}
                        </div>
                      ) : mobile ? (
                        <a
                          href={`tel:${mobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-xl px-4 py-2.5 font-mono font-bold text-sm transition-colors flex-shrink-0"
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

                    {contact.email && (
                      <div className="mt-3 pt-3 border-t border-surface-border flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-slate-500 flex-shrink-0">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <a href={`mailto:${contact.email}`} className="text-sm text-accent hover:underline truncate">
                          {contact.email}
                        </a>
                      </div>
                    )}
                  </>
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
              <DiagRow label="Redes Sociales"    active={company.redes_sociales} />
              <DiagRow label="CRM / Email"        active={company.email_marketing} />
              <DiagRow label="Captación Leads"    active={company.captacion_leads} />
              <DiagRow label="SEO"                active={company.seo_info} />
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

          {/* RECORDATORIO DE SEGUIMIENTO */}
          <section>
            <SectionLabel>Recordatorio de Seguimiento</SectionLabel>
            <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Volver a llamar el
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleFollowUpChange(e.target.value)}
                  disabled={savingFollowUp}
                  className="bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
                />
              </div>
              {followUpDate && (
                <button
                  onClick={() => handleFollowUpChange('')}
                  disabled={savingFollowUp}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors mt-4 flex-shrink-0"
                >
                  Quitar recordatorio
                </button>
              )}
              {savingFollowUp && (
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin mt-4 flex-shrink-0" />
              )}
            </div>
          </section>

          {/* INFORME IA */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">
                Informe Comercial IA
              </span>
              <div className="flex-1 h-px bg-surface-border" />
              {report && (
                <button
                  onClick={() => handleGenerateReport(true)}
                  disabled={reportLoading}
                  className="text-xs text-slate-500 hover:text-accent transition-colors flex-shrink-0"
                >
                  Regenerar
                </button>
              )}
            </div>

            {!report ? (
              <div className="bg-surface-card border border-surface-border rounded-xl p-5 text-center">
                <div className="text-2xl mb-2">🧠</div>
                <p className="text-sm text-slate-400 mb-1">Análisis completo de la empresa</p>
                <p className="text-xs text-slate-600 mb-4">Dolores, argumentario, objeciones y plan de cierre personalizado</p>
                {reportError && (
                  <p className="text-xs text-red-400 mb-3">{reportError}</p>
                )}
                <button
                  onClick={() => handleGenerateReport(false)}
                  disabled={reportLoading}
                  className="btn-primary text-sm flex items-center gap-2 mx-auto"
                >
                  {reportLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generando informe…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                        <path d="M12 12l8.5-8.5" />
                      </svg>
                      Generar Informe IA
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
                {reportCached && (
                  <div className="px-4 py-2 bg-amber-400/5 border-b border-surface-border flex items-center justify-between">
                    <span className="text-[10px] text-amber-400/70">Informe en caché</span>
                    <button
                      onClick={() => handleGenerateReport(true)}
                      disabled={reportLoading}
                      className="text-[10px] text-slate-500 hover:text-accent transition-colors"
                    >
                      Regenerar con IA →
                    </button>
                  </div>
                )}
                <div className="p-5 prose-sm max-w-none overflow-y-auto max-h-[500px]">
                  <ReportContent content={report} />
                </div>
              </div>
            )}
          </section>

          {/* NOTAS DEL COMERCIAL */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">
                Notas del Comercial
              </span>
              <div className="flex-1 h-px bg-surface-border" />
              {notesSaved && !savingNotes && (
                <span className="text-xs text-emerald-400 flex-shrink-0">✓ Guardado</span>
              )}
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent hover:bg-accent/90 disabled:opacity-50 text-white transition-colors flex-shrink-0"
              >
                {savingNotes ? 'Guardando...' : 'Guardar nota'}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setNotesSaved(false) }}
              placeholder="Escribe tus notas aquí..."
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
