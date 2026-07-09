import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import NavBar from '../components/NavBar'
import ImportLeadsSection from '../components/ImportLeadsSection'
import { toast } from '../lib/toast'

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
  'from-violet-500/30 to-violet-600/10 border-violet-500/30 text-violet-300',
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

// ── Panel de asignación de leads sin asignar ──────────────────────────────────
function AssignLeadsPanel({ users }) {
  const [niches, setNiches] = useState([])
  const [loadingNiches, setLoadingNiches] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [nicheCounts, setNicheCounts] = useState({})
  const [assigning, setAssigning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [editingNiche, setEditingNiche] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [flashRows, setFlashRows] = useState(new Set())
  const [celebrating, setCelebrating] = useState(false)
  const prevNichesRef = useRef({})

  const fetchNiches = () => {
    setLoadingNiches(true)
    adminApi.getPendingByNiche()
      .then(r => {
        const next = r.data.niches || []
        // Detectar nichos nuevos o con más leads que antes -> flash animación
        const prev = prevNichesRef.current || {}
        const grown = new Set()
        for (const nn of next) {
          if ((prev[nn.industry] ?? -1) < nn.total_pending) grown.add(nn.industry)
        }
        if (grown.size > 0) {
          setFlashRows(grown)
          setTimeout(() => setFlashRows(new Set()), 2200)
        }
        prevNichesRef.current = Object.fromEntries(next.map(nn => [nn.industry, nn.total_pending]))
        const list = r.data.niches || []
        setNiches(list)
        setNicheCounts(prev => {
          const next = {}
          for (const n of list) {
            next[n.industry] = Math.min(prev[n.industry] ?? 0, n.total_pending)
          }
          return next
        })
      })
      .catch(console.error)
      .finally(() => setLoadingNiches(false))
  }

  useEffect(() => { fetchNiches() }, [])
  useEffect(() => {
    const h = () => fetchNiches()
    window.addEventListener('leadup:niches-refresh', h)
    return () => window.removeEventListener('leadup:niches-refresh', h)
  }, [])

  const totalPending = niches.reduce((s, n) => s + n.total_pending, 0)
  const totalSelected = Object.values(nicheCounts).reduce((s, v) => s + v, 0)

  const handleAssign = async () => {
    if (!selectedUserId) { toast.error('Selecciona un comercial'); return }
    const toAssign = niches.filter(n => (nicheCounts[n.industry] ?? 0) > 0)
    if (toAssign.length === 0) { toast.error('Selecciona al menos 1 lead de algún nicho'); return }

    setAssigning(true)
    setLastResult(null)
    let totalAssigned = 0
    const errors = []

    for (const n of toAssign) {
      const qty = nicheCounts[n.industry]
      try {
        const res = await adminApi.assignNow(parseInt(selectedUserId), qty, n.industry)
        totalAssigned += res.data?.assigned ?? qty
      } catch (err) {
        errors.push(n.industry)
      }
    }

    setAssigning(false)
    if (errors.length === 0) {
      toast.success(`${totalAssigned} leads asignados correctamente`)
      setLastResult({ ok: true, assigned: totalAssigned })
    } else {
      toast.error(`Errores en: ${errors.join(', ')}`)
      setLastResult({ ok: false, msg: `Parcial. Errores en: ${errors.join(', ')}` })
    }
    fetchNiches()
    if (errors.length === 0) {
      setCelebrating(true)
      setTimeout(() => setCelebrating(false), 2000)
    }
  }

  const handleRenameNiche = async (oldName) => {
    const newName = editValue.trim()
    // Clear inmediato: si onBlur dispara después del Enter, bailará por editValue vacío.
    setEditingNiche(null)
    setEditValue('')
    if (!newName || newName === oldName) return
    try {
      await adminApi.renameNiche(oldName, newName)
      toast.success(`Nicho renombrado a "${newName}"`)
      // Llevar la cantidad seleccionada al nuevo nombre
      setNicheCounts(p => {
        if (!(oldName in p)) return p
        const { [oldName]: q, ...rest } = p
        return { ...rest, [newName]: q }
      })
      fetchNiches()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al renombrar')
    }
  }

  return (
    <section className="space-y-3 relative">
      <style>{`
        @keyframes lu-pop { 0%{transform:scale(.3) translateY(20px);opacity:0} 60%{transform:scale(1.1) translateY(-4px);opacity:1} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes lu-fade-out { 0%{opacity:1} 80%{opacity:1} 100%{opacity:0; transform: translateY(-30px) scale(0.95)} }
        @keyframes lu-sparkle { 0%{transform:scale(0) rotate(0);opacity:0} 30%{transform:scale(1) rotate(180deg);opacity:1} 100%{transform:scale(0) rotate(360deg);opacity:0} }
        @keyframes lu-ring { 0%{transform:scale(.5);opacity:.8} 100%{transform:scale(2.5);opacity:0} }
      `}</style>
      <div>
        <h2 className="font-bold text-white">Leads sin asignar</h2>
        <p className="text-xs text-slate-500 mt-0.5">Elige cuántos leads asignar de cada nicho a un comercial</p>
      </div>

      <div className="rounded-2xl border border-surface-border bg-gradient-to-br from-surface-card to-surface overflow-hidden shadow-[0_4px_12px_-2px_rgba(0,0,0,0.2)]">

        {/* Selector de comercial */}
        <div className="px-5 pt-5 pb-4 border-b border-surface-border/60">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comercial</p>
          <div className="relative max-w-xs">
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-raised border border-surface-border text-white rounded-xl text-sm appearance-none pr-8 focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="">Seleccionar comercial…</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Steppers por nicho */}
        <div className="px-5 pt-4 pb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad por nicho</p>
            {totalPending > 0 && (
              <span className="text-xs font-black text-amber-400 tabular-nums bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg">
                {totalPending} disponibles
              </span>
            )}
          </div>

          {loadingNiches ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-surface-raised animate-pulse" />
              ))}
            </div>
          ) : niches.length === 0 ? (
            <p className="text-sm text-slate-600 italic py-4 text-center">No hay leads sin asignar</p>
          ) : (
            <div className="space-y-2">
              {niches.map(n => {
                const available = n.total_pending
                const selected = nicheCounts[n.industry] ?? 0
                const dot = available <= 3 ? '#ef4444' : available <= 8 ? '#f59e0b' : '#a78bfa'
                return (
                  <div
                    key={n.industry}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                    style={{
                      background: flashRows.has(n.industry)
                        ? 'rgba(16,185,129,0.18)'
                        : selected > 0 ? 'rgba(124,58,237,0.06)' : 'rgb(var(--color-surface-raised))',
                      borderColor: flashRows.has(n.industry)
                        ? 'rgba(16,185,129,0.7)'
                        : selected > 0 ? 'rgba(124,58,237,0.3)' : 'rgb(var(--color-surface-border) / 0.7)',
                      boxShadow: flashRows.has(n.industry) ? '0 0 24px -2px rgba(16,185,129,0.55), inset 0 0 18px rgba(16,185,129,0.08)' : 'none',
                      transform: flashRows.has(n.industry) ? 'translateX(2px) scale(1.005)' : 'none',
                      transition: 'all 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: dot, boxShadow: `0 0 4px ${dot}80` }} />
                    {editingNiche === n.industry ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => handleRenameNiche(n.industry)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') e.target.blur()
                          else if (e.key === 'Escape') { setEditingNiche(null); setEditValue('') }
                        }}
                        className="flex-1 bg-transparent text-sm font-medium focus:outline-none px-2 py-0.5 rounded"
                        style={{ color: 'var(--text-primary)', border: '1.5px solid #a78bfa', boxShadow: '0 0 0 3px rgba(167,139,250,0.15)' }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditingNiche(n.industry); setEditValue(n.industry) }}
                        className="group flex-1 flex items-center gap-2 text-left text-sm font-medium truncate cursor-pointer transition-all duration-200 hover:text-violet-300 px-2 py-0.5 rounded hover:bg-violet-500/10"
                        style={{ color: 'var(--text-primary)' }}
                        title="Click para renombrar nicho"
                      >
                        <span className="truncate">{n.industry}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity text-violet-400 flex-shrink-0">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                    <span className="text-xs font-black tabular-nums mr-2" style={{ color: dot }}>
                      {available} disp.
                    </span>
                    <div className="flex items-center gap-1 bg-surface-card border border-surface-border rounded-xl overflow-hidden flex-shrink-0">
                      <button
                        onClick={() => setNicheCounts(p => ({ ...p, [n.industry]: Math.max(0, (p[n.industry] ?? 0) - 1) }))}
                        disabled={(nicheCounts[n.industry] ?? 0) <= 0}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-bold text-base"
                      >−</button>
                      <span className="w-10 text-center text-sm font-black text-white tabular-nums select-none">
                        {nicheCounts[n.industry] ?? 0}
                      </span>
                      <button
                        onClick={() => setNicheCounts(p => ({ ...p, [n.industry]: Math.min(available, (p[n.industry] ?? 0) + 1) }))}
                        disabled={(nicheCounts[n.industry] ?? 0) >= available}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-bold text-base"
                      >+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Botón asignar */}
          <div className="mt-4 flex items-center justify-between gap-3">
            {totalSelected > 0 ? (
              <p className="text-xs text-violet-400 font-bold">{totalSelected} leads seleccionados</p>
            ) : (
              <p className="text-xs text-slate-600">Ajusta las cantidades arriba</p>
            )}
            <button
              onClick={handleAssign}
              disabled={assigning || !selectedUserId || totalSelected === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: assigning ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.9)',
                color: 'white',
                border: '1px solid rgba(124,58,237,0.5)',
              }}
            >
              {assigning ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              )}
              {assigning ? 'Asignando…' : `Asignar ${totalSelected} leads`}
            </button>
          </div>

          {lastResult && (
            <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
              lastResult.ok
                ? 'bg-emerald-400/10 border border-emerald-400/25 text-emerald-400'
                : 'bg-red-400/10 border border-red-400/25 text-red-400'
            }`}>
              {lastResult.ok
                ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>{lastResult.assigned} leads asignados correctamente</>
                : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>{lastResult.msg}</>
              }
            </div>
          )}
        </div>
      </div>
      {celebrating && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          style={{ animation: 'lu-fade-out 2000ms forwards' }}>
          <div className="relative">
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.55), transparent 70%)', animation: 'lu-ring 1200ms ease-out', width: 240, height: 240, left: -120, top: -120 }} />
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.45), transparent 70%)', animation: 'lu-ring 1500ms ease-out 200ms', width: 240, height: 240, left: -120, top: -120 }} />
            <div className="relative flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))',
                boxShadow: '0 12px 40px -6px rgba(16,185,129,0.6), 0 0 0 1px rgba(255,255,255,0.2) inset',
                animation: 'lu-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl font-black bg-white/25">✓</div>
              <div className="text-white">
                <p className="text-lg font-black">¡Asignados!</p>
                <p className="text-xs opacity-90">{lastResult?.assigned ?? 0} leads enviados al comercial</p>
              </div>
              {[...Array(6)].map((_, i) => {
                const angle = (i * 60) * Math.PI / 180
                return (
                  <span key={i} className="absolute pointer-events-none text-xl"
                    style={{
                      left: `calc(50% + ${Math.cos(angle) * 100}px)`,
                      top: `calc(50% + ${Math.sin(angle) * 60}px)`,
                      animation: `lu-sparkle 1400ms ease-out ${i * 80}ms forwards`,
                    }}>✨</span>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
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
  const [exporting, setExporting] = useState(false)
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

  const handleExportNotes = async () => {
    setExporting(true)
    try {
      const res = await adminApi.exportNotes()
      const url = URL.createObjectURL(new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }))
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.href = url
      a.download = `leadup_notas_${date}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Excel descargado correctamente')
    } catch {
      toast.error('Error al exportar notas')
    } finally {
      setExporting(false)
    }
  }

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

  return (
    <>
      <NavBar />

      <main className="max-w-5xl mx-auto px-4 pt-5 pb-10 space-y-8">
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
            {/* ── Asignación de leads ── */}
            <AssignLeadsPanel users={analytics.by_commercial} />

            {/* ── Exportar notas ── */}
            <section className="space-y-3">
              <div>
                <h2 className="font-bold text-white">Exportar notas a Excel</h2>
                <p className="text-xs text-slate-500 mt-0.5">Backup local de todas las notas, recordatorios e info de clientes</p>
              </div>
              <div className="rounded-2xl border border-surface-border bg-gradient-to-br from-surface-card to-surface p-5 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" className="w-5 h-5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Todas las notas y datos de clientes</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Incluye empresa, contacto, sector, estado, notas del comercial, recordatorios y seguimientos
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportNotes}
                    disabled={exporting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    style={{
                      background: exporting ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.9)',
                      border: '1px solid rgba(124,58,237,0.5)',
                    }}
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    )}
                    {exporting ? 'Generando Excel…' : 'Descargar Excel'}
                  </button>
                </div>
              </div>
            </section>

            {/* ── Importar Leads ── */}
            <ImportLeadsSection users={analytics.by_commercial} onImportDone={() => window.dispatchEvent(new Event('leadup:niches-refresh'))} />

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
                          <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-raised
                            ${c.lead_search_enabled ? 'bg-emerald-400' : 'bg-slate-600'}`}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm leading-tight">{c.name}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{c.email}</p>
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
