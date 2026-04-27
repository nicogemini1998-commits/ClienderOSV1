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

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 7.09 7.09l.41-.41a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.92z" />
    </svg>
  )
}

export default function CompanyCard({ lead, onClick, onStatusChange }) {
  const { company, contact, assignment_id, status } = lead
  const opp = OPP_STYLES[company.opportunity_level] || OPP_STYLES.media
  const mobile = contact?.phone || company.phone

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(lead)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(lead)}
      className="card p-0 cursor-pointer hover:border-accent/30 transition-all duration-150 animate-fade-in group overflow-hidden"
    >
      {/* Accent top stripe based on opportunity */}
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

          {/* Score */}
          <div className="flex-shrink-0 text-right">
            <span className={`text-xl font-black leading-none ${scoreColor(company.digital_score)}`}>
              {company.digital_score}
            </span>
            <span className="text-slate-600 text-xs">/100</span>
          </div>
        </div>

        {/* Opportunity badge */}
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${opp.chip}`}>
            {opp.label}
          </span>
        </div>

        {/* Decision Maker + MÓVIL VERIFICADO — siempre visible */}
        <div className="bg-surface-raised border border-surface-border rounded-lg p-3 mb-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Decision Maker · Móvil
          </p>

          {contact?.name ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
                {contact.title && (
                  <p className="text-xs text-slate-500 truncate">{contact.title}</p>
                )}
              </div>

              {mobile ? (
                <a
                  href={`tel:${mobile}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-lg px-2.5 py-1.5 text-xs font-mono transition-colors flex-shrink-0"
                >
                  <PhoneIcon />
                  {mobile}
                </a>
              ) : (
                <span className="text-xs text-slate-600 italic">Sin móvil</span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600 italic">Sin contacto asignado</span>
              {mobile && (
                <a
                  href={`tel:${mobile}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-lg px-2.5 py-1.5 text-xs font-mono transition-colors"
                >
                  <PhoneIcon />
                  {mobile}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Hook preview */}
        {company.hooks?.length > 0 && (
          <p className="text-xs text-slate-500 italic mb-3 line-clamp-1">
            "{company.hooks[0]}"
          </p>
        )}
      </div>

      {/* Status bar */}
      <div
        className="px-4 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <StatusBar
          assignmentId={assignment_id}
          currentStatus={status}
          onStatusChange={onStatusChange}
        />
      </div>
    </article>
  )
}
