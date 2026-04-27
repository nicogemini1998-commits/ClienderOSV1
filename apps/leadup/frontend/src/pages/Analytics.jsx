import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color} leading-none`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

function NavBar({ user, onLogout, isAdmin }) {
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
          <Link to="/analytics" className="btn-ghost text-sm text-white">Analytics</Link>
          <Link to="/ajustes" className="btn-ghost text-sm">Ajustes</Link>
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:block">{user?.name}</span>
          <button onClick={onLogout} className="btn-ghost text-sm text-slate-400">Salir</button>
        </div>
      </div>
    </header>
  )
}

function AssignNowButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleAssign = async () => {
    setLoading(true)
    setResult(null)
    try {
      await adminApi.assignNow()
      setResult({ type: 'success', message: 'Asignación iniciada en segundo plano' })
    } catch (err) {
      setResult({ type: 'error', message: 'Error al iniciar la asignación' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleAssign}
        disabled={loading}
        className="btn-primary text-sm flex items-center gap-2"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
        Asignar leads ahora
      </button>
      {result && (
        <span className={`text-xs ${result.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.message}
        </span>
      )}
    </div>
  )
}

export default function Analytics() {
  const { user, logout } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.getAnalytics()
        setData(res.data)
      } catch {
        setError('Error al cargar analytics')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const STATUS_LABELS = {
    pending: 'Pendiente',
    no_answer: 'Sin respuesta',
    closed: 'Cerrado',
    rejected: 'Rechazado',
  }

  const STATUS_COLORS = {
    pending: 'text-amber-400',
    no_answer: 'text-slate-400',
    closed: 'text-emerald-400',
    rejected: 'text-red-400',
  }

  return (
    <>
      <NavBar user={user} onLogout={logout} isAdmin />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            {data && (
              <p className="text-sm text-slate-400 mt-0.5">
                {new Date(data.today + 'T00:00:00').toLocaleDateString('es-ES', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </p>
            )}
          </div>
          <AssignNowButton />
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

        {data && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Leads hoy"
                value={data.total_leads_today}
                sub="asignados"
                color="text-white"
              />
              <StatCard
                label="Total empresas"
                value={data.total_companies}
                sub="en base de datos"
                color="text-accent"
              />
              <StatCard
                label="Tasa conversión"
                value={`${data.all_time.conversion_rate}%`}
                sub="cerrados / asignados"
                color="text-emerald-400"
              />
              <StatCard
                label="Total asignados"
                value={data.all_time.total_assigned}
                sub="histórico"
                color="text-slate-300"
              />
            </div>

            {/* Status breakdown today */}
            {Object.keys(data.today_by_status).length > 0 && (
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Estado hoy</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(data.today_by_status).map(([status, count]) => (
                    <div key={status} className="text-center">
                      <p className={`text-2xl font-bold ${STATUS_COLORS[status] || 'text-white'}`}>{count}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{STATUS_LABELS[status] || status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per commercial table */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-surface-border">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Por comercial</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Comercial</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Hoy</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Total</th>
                      <th className="px-4 py-3 text-xs font-semibold text-emerald-400 uppercase tracking-wider text-right">Cerrados</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Sin resp.</th>
                      <th className="px-4 py-3 text-xs font-semibold text-red-400 uppercase tracking-wider text-right">Rechaz.</th>
                      <th className="px-4 py-3 text-xs font-semibold text-accent uppercase tracking-wider text-right">Conv.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {data.by_commercial.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-5 py-3">
                          <div>
                            <p className="font-medium text-white">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">{c.today_count}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{c.total_assigned}</td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-semibold">{c.closed}</td>
                        <td className="px-4 py-3 text-right text-slate-400">{c.no_answer}</td>
                        <td className="px-4 py-3 text-right text-red-400">{c.rejected}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${c.conversion_rate >= 20 ? 'text-emerald-400' : c.conversion_rate >= 10 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {c.conversion_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
