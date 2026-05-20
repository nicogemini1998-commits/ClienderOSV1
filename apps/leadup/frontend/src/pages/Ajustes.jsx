import { useState, useEffect } from 'react'
import { adminApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import NavBar from '../components/NavBar'
import ImportLeadsSection from '../components/ImportLeadsSection'

const NICHO_OPTIONS = [
  'Construcción y Reformas',
  'Despachos de Abogados',
  'Asesorías y Gestorías',
  'Clínicas y Salud',
  'Restaurantes y Hostelería',
  'Inmobiliarias',
  'Academias y Formación',
  'Talleres y Automoción',
  'Fontanería y Electricidad',
  'Arquitectura y Diseño',
  'Transporte y Logística',
  'Comercio al por menor',
]

const AVATAR_COLORS = [
  'from-blue-500/30 to-blue-600/10 border-blue-500/30 text-blue-300',
  'from-violet-500/30 to-violet-600/10 border-violet-500/30 text-violet-300',
  'from-emerald-500/30 to-emerald-600/10 border-emerald-500/30 text-emerald-300',
  'from-amber-500/30 to-amber-600/10 border-amber-500/30 text-amber-300',
  'from-rose-500/30 to-rose-600/10 border-rose-500/30 text-rose-300',
]

function Toggle({ enabled, onChange, loading }) {
  return (
    <button
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      role="switch"
      aria-checked={enabled}
      className={`relative w-11 h-6 rounded-full border-2 transition-all duration-300 flex-shrink-0
        ${enabled ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-surface-card border-surface-border'}
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-all duration-300
        ${enabled
          ? 'left-[calc(100%-18px)] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
          : 'left-0.5 bg-slate-500'}`}
      />
    </button>
  )
}

function Stepper({ value, onChange, min = 1, max = 100 }) {
  return (
    <div className="flex items-center gap-1 bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold"
      >
        −
      </button>
      <span className="w-12 text-center text-lg font-black text-white tabular-nums select-none">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold"
      >
        +
      </button>
    </div>
  )
}

function SystemAction({ title, desc, children }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-surface-raised border border-surface-border rounded-xl">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">{children}</div>
    </div>
  )
}

export default function Ajustes() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState({})
  const [expandedUser, setExpandedUser] = useState(null)
  const [userSettings, setUserSettings] = useState({})
  const [savingSettings, setSavingSettings] = useState({})
  const [savedSettings, setSavedSettings] = useState({})
  const [enrichmentLoading, setEnrichmentLoading] = useState(false)
  const [enrichmentResult, setEnrichmentResult] = useState(null)
  const [lushaLoading, setLushaLoading] = useState(false)
  const [lushaResult, setLushaResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    adminApi.getAnalytics()
      .then(res => {
        setAnalytics(res.data)
        const initial = {}
        for (const c of res.data.by_commercial) {
          initial[c.id] = {
            leads_per_day: c.leads_per_day ?? 20,
            industry_filters: c.industry_filters ?? [],
          }
        }
        setUserSettings(initial)
      })
      .catch(() => setError('Error al cargar usuarios'))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveSettings = async (userId) => {
    setSavingSettings(p => ({ ...p, [userId]: true }))
    try {
      await adminApi.updateUserSettings(userId, userSettings[userId])
      setSavedSettings(p => ({ ...p, [userId]: true }))
      setTimeout(() => setSavedSettings(p => ({ ...p, [userId]: false })), 2000)
    } catch {}
    finally { setSavingSettings(p => ({ ...p, [userId]: false })) }
  }

  const toggleNicho = (userId, nicho) => {
    setUserSettings(prev => {
      const current = prev[userId]?.industry_filters ?? []
      const next = current.includes(nicho) ? current.filter(n => n !== nicho) : [...current, nicho]
      return { ...prev, [userId]: { ...prev[userId], industry_filters: next } }
    })
  }

  const setLeadsPerDay = (userId, val) => {
    setUserSettings(prev => ({ ...prev, [userId]: { ...prev[userId], leads_per_day: val } }))
  }

  const handleToggle = async (userId, currentEnabled) => {
    setToggling(p => ({ ...p, [userId]: true }))
    try {
      await adminApi.toggleLeadSearch(userId, !currentEnabled)
      setAnalytics(prev => ({
        ...prev,
        by_commercial: prev.by_commercial.map(c =>
          c.id === userId ? { ...c, lead_search_enabled: !currentEnabled } : c
        ),
      }))
    } catch {}
    finally { setToggling(p => ({ ...p, [userId]: false })) }
  }

  const handleTriggerEnrichment = async () => {
    setEnrichmentLoading(true); setEnrichmentResult(null)
    try {
      await adminApi.triggerEnrichment()
      setEnrichmentResult({ ok: true, msg: 'Enriquecimiento iniciado en segundo plano' })
    } catch { setEnrichmentResult({ ok: false, msg: 'Error al iniciar el enriquecimiento' }) }
    finally { setEnrichmentLoading(false) }
  }

  const handleAssignAll = async () => { try { await adminApi.assignNow() } catch {} }

  const handleLushaLoad = async () => {
    setLushaLoading(true); setLushaResult(null)
    try {
      await adminApi.lushaLoad()
      setLushaResult({ ok: true, msg: '25 leads cargando → Toni, Ruben, Ethan' })
    } catch (err) {
      setLushaResult({ ok: false, msg: err.response?.data?.detail || 'Error al conectar con Lusha' })
    } finally { setLushaLoading(false) }
  }

  return (
    <>
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Ajustes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configuración del sistema y gestión de comerciales</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {analytics && (
          <>
            {/* ── Importar Leads ── */}
            <ImportLeadsSection users={analytics.by_commercial} />

            {/* ── Gestión de comerciales ── */}
            <section className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="font-bold text-white">Gestión de comerciales</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Activa, configura cuota y asigna nichos por usuario</p>
                </div>
                <span className="text-xs text-slate-600 font-medium">
                  {analytics.by_commercial.filter(c => c.lead_search_enabled).length} activos
                  · {analytics.by_commercial.length} total
                </span>
              </div>

              <div className="grid gap-3">
                {analytics.by_commercial.map((c, idx) => {
                  const isExpanded = expandedUser === c.id
                  const settings = userSettings[c.id] || { leads_per_day: 20, industry_filters: [] }
                  const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                  const activeNichos = settings.industry_filters.length

                  return (
                    <div
                      key={c.id}
                      className={`rounded-2xl border overflow-hidden transition-all duration-200 bg-gradient-to-br from-surface-card to-surface shadow-[0_4px_12px_-2px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] hover:border-accent/40
                        ${c.lead_search_enabled
                          ? 'border-surface-border'
                          : 'border-surface-border/60 opacity-70'}`}
                    >
                      {/* ── Card header ── */}
                      <div className="flex items-center gap-4 px-5 py-4">

                        {/* Avatar */}
                        <div className={`relative w-11 h-11 rounded-2xl bg-gradient-to-br border flex items-center justify-center flex-shrink-0 font-black text-sm ${avatarColor}`}>
                          {initials}
                          {/* Active dot */}
                          <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-raised
                            ${c.lead_search_enabled ? 'bg-emerald-400' : 'bg-slate-600'}`}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm leading-tight">{c.name}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{c.email}</p>
                          {/* Pills row */}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border
                              ${c.lead_search_enabled
                                ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                                : 'text-slate-500 bg-surface-card border-surface-border'}`}
                            >
                              <span className={`w-1 h-1 rounded-full ${c.lead_search_enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                              {c.lead_search_enabled ? 'Activo' : 'Pausado'}
                            </span>
                            <span className="text-[9px] font-bold text-slate-600 bg-surface-card border border-surface-border px-2 py-0.5 rounded-full">
                              {settings.leads_per_day} leads/día
                            </span>
                            {activeNichos > 0 && (
                              <span className="text-[9px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
                                {activeNichos} {activeNichos === 1 ? 'nicho' : 'nichos'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Toggle + expand */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Toggle
                            enabled={c.lead_search_enabled}
                            onChange={() => handleToggle(c.id, c.lead_search_enabled)}
                            loading={toggling[c.id]}
                          />
                          <button
                            onClick={() => setExpandedUser(isExpanded ? null : c.id)}
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all duration-200
                              ${isExpanded
                                ? 'bg-accent/10 border-accent/30 text-accent'
                                : 'bg-surface-card border-surface-border text-slate-500 hover:text-white hover:bg-surface-hover'}`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* ── Expanded config ── */}
                      {isExpanded && (
                        <div className="border-t border-surface-border animate-slide-down">

                          {/* Leads por día */}
                          <div className="px-5 pt-5 pb-4 border-b border-surface-border/60">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cuota diaria</p>
                                <p className="text-xs text-slate-600">Leads asignados automáticamente cada día</p>
                              </div>
                              <Stepper
                                value={settings.leads_per_day}
                                onChange={(v) => setLeadsPerDay(c.id, v)}
                              />
                            </div>
                          </div>

                          {/* Nichos */}
                          <div className="px-5 pt-4 pb-4 border-b border-surface-border/60">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Nichos asignados</p>
                                <p className="text-xs text-slate-600">
                                  {activeNichos === 0
                                    ? 'Sin filtros — recibe leads de todos los nichos'
                                    : `${activeNichos} de ${NICHO_OPTIONS.length} seleccionados`}
                                </p>
                              </div>
                              {activeNichos > 0 && (
                                <button
                                  onClick={() => setUserSettings(prev => ({
                                    ...prev, [c.id]: { ...prev[c.id], industry_filters: [] }
                                  }))}
                                  className="text-[10px] text-slate-600 hover:text-red-400 transition-colors font-medium"
                                >
                                  Limpiar
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {NICHO_OPTIONS.map((nicho) => {
                                const active = settings.industry_filters.includes(nicho)
                                return (
                                  <button
                                    key={nicho}
                                    onClick={() => toggleNicho(c.id, nicho)}
                                    className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all duration-150
                                      ${active
                                        ? 'bg-accent/15 border-accent/40 text-accent shadow-[0_0_8px_-2px_rgb(79_142_247_/_0.3)]'
                                        : 'bg-surface-card border-surface-border text-slate-500 hover:border-slate-400 hover:text-slate-300'
                                      }`}
                                  >
                                    {nicho}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Footer guardar */}
                          <div className="px-5 py-3 flex items-center justify-between gap-3 bg-surface-card/40">
                            <p className="text-[11px] text-slate-600">
                              Los cambios aplican a partir de la próxima asignación
                            </p>
                            <button
                              onClick={() => handleSaveSettings(c.id)}
                              disabled={savingSettings[c.id]}
                              className={`btn-primary text-sm flex items-center gap-2 flex-shrink-0 transition-all
                                ${savedSettings[c.id] ? '!bg-emerald-500/20 !border-emerald-500/40 !text-emerald-400' : ''}`}
                            >
                              {savingSettings[c.id] && (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              )}
                              {savedSettings[c.id]
                                ? '✓ Guardado'
                                : savingSettings[c.id]
                                  ? 'Guardando...'
                                  : 'Guardar cambios'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

          </>
        )}
      </main>
    </>
  )
}
