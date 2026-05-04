import StatusBar from './StatusBar'

const OPP_STYLES = {
  alta:  { chip: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', dot: 'bg-emerald-400', label: '↑ Alta' },
  media: { chip: 'text-amber-400  bg-amber-400/10  border-amber-400/30',  dot: 'bg-amber-400',  label: '→ Media' },
  baja:  { chip: 'text-red-400    bg-red-400/10    border-red-400/30',    dot: 'bg-red-400',    label: '↓ Baja' },
}

function scoreColor(score) {
  if (score >= 65) return 'text-emerald-400'
  if (score >= 35) return 'text-amber-400'
  return 'text-red-400'
}

function formatWhatsAppNumber(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('34') && digits.length === 11) return digits
  if (digits.length === 9) return '34' + digits
  return digits.length >= 10 ? digits : null
}

function getFollowUpBadge(followUpDate) {
  if (!followUpDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(followUpDate + 'T00:00:00')
  const diffDays = Math.round((due - today) / 86400000)
  if (diffDays < 0) return { label: `Recordatorio vencido`, cls: 'text-red-400 bg-red-400/10 border-red-400/30' }
  if (diffDays === 0) return { label: 'Recordatorio: hoy', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/30' }
  if (diffDays === 1) return { label: 'Recordatorio: mañana', cls: 'text-blue-400 bg-blue-400/10 border-blue-400/30' }
  return { label: `Recordatorio: ${due.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`, cls: 'text-slate-400 bg-slate-400/10 border-slate-400/30' }
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 7.09 7.09l.41-.41a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.92z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  )
}

export default function CompanyCard({ lead, onClick, onStatusChange }) {
  const { company, contact, assignment_id, status, follow_up_date } = lead
  const opp = OPP_STYLES[company.opportunity_level] || OPP_STYLES.media
  const mobile = contact?.phone || company.phone
  const waNumber = formatWhatsAppNumber(mobile)
  const openingLine = company.opening_lines?.[0] || ''
  const waUrl = waNumber
    ? `https://wa.me/${waNumber}${openingLine ? `?text=${encodeURIComponent(openingLine)}` : ''}`
    : null
  const followUpBadge = getFollowUpBadge(follow_up_date)

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(lead)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(lead)}
      className="card p-0 cursor-pointer hover:border-accent/30 transition-all duration-150 animate-fade-in group overflow-hidden"
    >
      {/* Accent top stripe */}
      <div className={`h-0.5 w-full ${opp.dot}`} />

      <div className="p-4">
        {/* Header: name + score */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-bold text-base leading-tight truncate group-hover:text-accent transition-colors">
              {company.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 flex-wrap">
              {company.city && <span>{company.city}</span>}
              {company.industry && (
                <>
                  <span className="text-slate-700">·</span>
                  <span className="truncate max-w-[120px]">{company.industry}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <span className={`text-xl font-black leading-none ${scoreColor(company.digital_score)}`}>
              {company.digital_score}
            </span>
            <span className="text-slate-600 text-xs">/100</span>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${opp.chip}`}>
            {opp.label}
          </span>
          {followUpBadge && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${followUpBadge.cls}`}>
              ⏰ {followUpBadge.label}
            </span>
          )}
        </div>

        {/* Decision Maker + contacts */}
        <div className="bg-surface-raised border border-surface-border rounded-lg p-3 mb-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Decision Maker · Contacto
          </p>

          {contact?.name ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
                {contact.title && (
                  <p className="text-xs text-slate-500 truncate">{contact.title}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {mobile && (
                  <a
                    href={`tel:${mobile}`}
                    className="flex items-center gap-1 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-lg px-2 py-1.5 text-xs font-mono transition-colors"
                  >
                    <PhoneIcon />
                  </a>
                )}
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg px-2 py-1.5 text-xs transition-colors"
                    title="Abrir WhatsApp con mensaje preparado"
                  >
                    <WhatsAppIcon />
                  </a>
                )}
                {mobile && (
                  <span className="text-xs font-mono text-slate-400">{mobile}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600 italic">Sin contacto asignado</span>
              <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {mobile && (
                  <a
                    href={`tel:${mobile}`}
                    className="flex items-center gap-1 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-lg px-2 py-1.5 text-xs transition-colors"
                  >
                    <PhoneIcon />
                  </a>
                )}
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg px-2 py-1.5 text-xs transition-colors"
                  >
                    <WhatsAppIcon />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hook preview */}
        {company.hooks?.length > 0 && (
          <p className="text-xs text-slate-500 italic mb-3 line-clamp-1">
            "{company.hooks[0]}"
          </p>
        )}

        {/* Nota guardada */}
        {lead.notes && (
          <div className="flex items-start gap-2 bg-amber-400/5 border border-amber-400/20 rounded-lg px-3 py-2 mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p className="text-xs text-amber-300/80 line-clamp-2 leading-relaxed">{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
        <StatusBar
          assignmentId={assignment_id}
          currentStatus={status}
          onStatusChange={onStatusChange}
        />
      </div>
    </article>
  )
}
