import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

function NavBar({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm">LeadUp</span>
        </div>
        <nav className="flex items-center gap-1">
          <Link to="/" className="btn-ghost text-sm">Dashboard</Link>
          <Link to="/analytics" className="btn-ghost text-sm">Analytics</Link>
          <Link to="/ajustes" className="btn-ghost text-sm text-white">Ajustes</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:block">{user?.name}</span>
          <button onClick={onLogout} className="btn-ghost text-sm text-slate-400">Salir</button>
        </div>
      </div>
    </header>
  )
}

function Toggle({ enabled, onChange, loading }) {
  return (
    <button
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      role="switch"
      aria-checked={enabled}
      className={`relative w-12 h-6 rounded-full border transition-all duration-200 flex-shrink-0
        ${enabled
          ? 'bg-accent border-accent'
          : 'bg-surface-raised border-surface-border'}
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-0'}`}
      />
    </button>
  )
}

export default function Ajustes() {
  const { user, logout } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState({})
  const [enrichmentLoading, setEnrichmentLoading] = useState(false)
  const [enrichmentResult, setEnrichmentResult] = useState(null)
  const [error, setError] = useState(null)

  const loadData = async () => {
    try {
      const res = await adminApi.getAnalytics()
      setAnalytics(res.data)
    } catch {
      setError('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggle = async (userId, currentEnabled) => {
    setToggling((prev) => ({ ...prev, [userId]: true }))
    try {
      await adminApi.toggleLeadSearch(userId, !currentEnabled)
      setAnalytics((prev) => ({
        ...prev,
        by_commercial: prev.by_commercial.map((c) =>
          c.id === userId ? { ...c, lead_search_enabled: !currentEnabled } : c
        ),
      }))
    } catch (err) {
      console.error('Toggle failed:', err)
    } finally {
      setToggling((prev) => ({ ...prev, [userId]: false }))
    }
  }

  const handleTriggerEnrichment = async () => {
    setEnrichmentLoading(true)
    setEnrichmentResult(null)
    try {
      await adminApi.triggerEnrichment()
      setEnrichmentResult({ type: 'success', message: 'Enriquecimiento iniciado en segundo plano' })
    } catch {
      setEnrichmentResult({ type: 'error', message: 'Error al iniciar el enriquecimiento' })
    } finally {
      setEnrichmentLoading(false)
    }
  }

  const handleAssignAll = async () => {
    try {
      await adminApi.assignNow()
    } catch (err) {
      console.error('Assign failed:', err)
    }
  }

  return (
    <>
      <NavBar user={user} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Ajustes</h1>
          <p className="text-sm text-slate-400 mt-0.5">Configuración del sistema y gestión de usuarios</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="card p-6 border-red-500/20 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {analytics && (
          <div className="space-y-6">
            {/* User management */}
            <section className="card overflow-hidden">
              <div className="p-5 border-b border-surface-border">
                <h2 className="font-semibold text-white">Gestión de comerciales</h2>
                <p className="text-xs text-slate-400 mt-0.5">Activa o desactiva la búsqueda de leads por usuario</p>
              </div>

              <div className="divide-y divide-surface-border">
                {analytics.by_commercial.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-hover transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{c.name}</p>
                        <span className={`badge text-xs border
                          ${c.lead_search_enabled
                            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                            : 'text-slate-500 bg-surface-raised border-surface-border'}`}
                        >
                          {c.lead_search_enabled ? 'Activo' : 'Pausado'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{c.email}</p>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-white">{c.today_count}</p>
                        <p className="text-xs text-slate-500">leads hoy</p>
                      </div>
                      <Toggle
                        enabled={c.lead_search_enabled}
                        onChange={() => handleToggle(c.id, c.lead_search_enabled)}
                        loading={toggling[c.id]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Actions */}
            <section className="card p-5">
              <h2 className="font-semibold text-white mb-4">Acciones del sistema</h2>
              <div className="space-y-3">
                {/* Assign leads now */}
                <div className="flex items-center justify-between p-4 bg-surface-raised border border-surface-border rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">Asignar leads ahora</p>
                    <p className="text-xs text-slate-400 mt-0.5">Ejecuta la asignación diaria para todos los usuarios activos</p>
                  </div>
                  <button
                    onClick={handleAssignAll}
                    className="btn-primary text-sm flex-shrink-0"
                  >
                    Ejecutar
                  </button>
                </div>

                {/* Trigger enrichment */}
                <div className="flex items-center justify-between p-4 bg-surface-raised border border-surface-border rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">Enriquecer leads pendientes</p>
                    <p className="text-xs text-slate-400 mt-0.5">Procesa empresas sin enriquecimiento con Claude Haiku (máx. 50)</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {enrichmentResult && (
                      <span className={`text-xs ${enrichmentResult.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {enrichmentResult.message}
                      </span>
                    )}
                    <button
                      onClick={handleTriggerEnrichment}
                      disabled={enrichmentLoading}
                      className="btn-primary text-sm flex items-center gap-2"
                    >
                      {enrichmentLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : null}
                      {enrichmentLoading ? 'Procesando...' : 'Enriquecer'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* System info */}
            <section className="card p-5">
              <h2 className="font-semibold text-white mb-4">Información del sistema</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Scheduler</p>
                  <p className="text-slate-300">Diario a las 8:00 AM</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Leads/usuario/día</p>
                  <p className="text-slate-300">20 leads</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Fuente de datos</p>
                  <p className="text-slate-300">Apollo.io</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Enriquecimiento</p>
                  <p className="text-slate-300">Claude Haiku</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Sector objetivo</p>
                  <p className="text-slate-300">Construcción / Reformas</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Región</p>
                  <p className="text-slate-300">España</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  )
}
