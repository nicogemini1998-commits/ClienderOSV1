import { useState, useEffect, useRef } from 'react'
import { m as motion, AnimatePresence } from 'motion/react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, PieChart, Pie } from 'recharts'
import { adminApi } from '../lib/api'
import NavBar from '../components/NavBar'
import WeeklyRace from '../components/WeeklyRace'
import UnassignedLeadsPanel from '../components/UnassignedLeadsPanel'

const STATUS_CFG = {
  closed:     { label: 'Agendado',      color: '#10b981' },
  pending:    { label: 'Pendiente',     color: '#fbbf24' },
  call_later: { label: 'Llamar luego',  color: '#60a5fa' },
  no_answer:  { label: 'Sin respuesta', color: '#64748b' },
  rejected:   { label: 'Rechazado',     color: '#f87171' },
}
const STATUS_ORDER = ['closed', 'pending', 'call_later', 'no_answer', 'rejected']

function KpiCard({ label, value, sub, color = 'text-white', icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="card p-4 flex items-center gap-3"
    >
      {icon && (
        <div className="w-9 h-9 rounded-xl bg-surface-raised border border-surface-border flex items-center justify-center flex-shrink-0 text-slate-400">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-xl font-black tabular-nums leading-none ${color}`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}

function PipelineChart({ statusMap, total }) {
  if (!total) return null
  const data = STATUS_ORDER.map(s => ({
    name: STATUS_CFG[s].label,
    value: statusMap[s] || 0,
    fill: STATUS_CFG[s].color,
  }))
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 96, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis type="number" stroke="#475569" tick={{ fontSize: 11 }} />
        <YAxis dataKey="name" type="category" stroke="#475569" width={96} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: 12 }}
          formatter={(v) => v.toLocaleString('es-ES')}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Commercial profile row (self-managed expand state) ────────────────────────
function CommercialRow({ c, rank, maxInd }) {
  const [open, setOpen] = useState(false)

  const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const convTier = c.conversion_rate >= 20 ? 'emerald' : c.conversion_rate >= 10 ? 'amber' : 'slate'
  const convCls = {
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
    amber:   'text-amber-400   bg-amber-400/10   border-amber-400/25',
    slate:   'text-slate-400   bg-slate-400/10   border-slate-400/25',
  }[convTier]
  const barBg = { emerald: 'bg-emerald-400', amber: 'bg-amber-400', slate: 'bg-slate-500' }[convTier]

  const called = c.total_assigned - (c.pending || 0)
  const callRate = c.total_assigned > 0 ? Math.round((called / c.total_assigned) * 100) : 0

  const chartData = [
    { name: 'Agendado',      value: c.closed     || 0, fill: '#10b981' },
    { name: 'Pendiente',     value: c.pending    || 0, fill: '#fbbf24' },
    { name: 'Llamar luego',  value: c.call_later || 0, fill: '#60a5fa' },
    { name: 'Sin respuesta', value: c.no_answer  || 0, fill: '#64748b' },
    { name: 'Rechazado',     value: c.rejected   || 0, fill: '#f87171' },
  ].filter(d => d.value > 0)

  const total = chartData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="card border-surface-border/60 shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-200">
      {/* Header — clickable */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-5 py-4 hover:bg-white/[0.02] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black text-slate-600 w-4 flex-shrink-0 tabular-nums">{rank}</span>

          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs
            ${c.lead_search_enabled
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'bg-surface-raised text-slate-500 border border-surface-border'}`}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="font-bold text-white text-sm truncate">{c.name}</p>
              <span className={`hidden sm:inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border flex-shrink-0
                ${c.lead_search_enabled
                  ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                  : 'text-slate-500 bg-surface-raised border-surface-border'}`}
              >
                <span className={`w-1 h-1 rounded-full ${c.lead_search_enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                {c.lead_search_enabled ? 'Activo' : 'Pausado'}
              </span>
            </div>
            <div className="h-1 bg-surface-border rounded-full overflow-hidden w-28">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barBg}`}
                style={{ width: `${Math.min(c.conversion_rate * 3, 100)}%` }}
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-5 flex-shrink-0">
            <div className="text-center">
              <p className="text-sm font-black text-white tabular-nums">{c.today_count}</p>
              <p className="text-[9px] text-slate-600">hoy</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-300 tabular-nums">{c.total_assigned}</p>
              <p className="text-[9px] text-slate-600">total</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-emerald-400 tabular-nums">{c.closed}</p>
              <p className="text-[9px] text-slate-600">agendados</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-red-400 tabular-nums">{c.rejected}</p>
              <p className="text-[9px] text-slate-600">rechazados</p>
            </div>
          </div>

          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-sm font-black tabular-nums flex-shrink-0 ${convCls}`}>
            {c.conversion_rate}%
          </span>

          <motion.svg
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.22 }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="w-4 h-4 text-slate-500 flex-shrink-0"
          >
            <polyline points="6 9 12 15 18 9" />
          </motion.svg>
        </div>
      </button>

      {/* Expandable detail — uses CSS max-height trick for reliability */}
      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ maxHeight: open ? '800px' : '0px' }}
      >
        <div className="border-t border-surface-border bg-surface-card/40 p-5 space-y-5">

          {/* Donut + status grid */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {total > 0 && (
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={32} outerRadius={58} dataKey="value" strokeWidth={0}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex-1 grid grid-cols-5 gap-2">
              {[
                { label: 'Pendiente',    value: c.pending,    color: 'text-amber-400' },
                { label: 'Agendado',     value: c.closed,     color: 'text-emerald-400' },
                { label: 'Llamar luego', value: c.call_later, color: 'text-blue-400' },
                { label: 'Sin resp.',    value: c.no_answer,  color: 'text-slate-400' },
                { label: 'Rechazado',    value: c.rejected,   color: 'text-red-400' },
              ].map(m => (
                <div key={m.label} className="bg-surface-raised border border-surface-border rounded-xl p-3 text-center">
                  <p className={`text-xl font-black tabular-nums ${m.color}`}>{m.value ?? 0}</p>
                  <p className="text-[9px] text-slate-600 mt-1 leading-tight">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-raised border border-surface-border rounded-xl p-3">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Efectividad</p>
              <p className="text-2xl font-black text-white tabular-nums">{callRate}<span className="text-base text-slate-500">%</span></p>
              <p className="text-[10px] text-slate-600 mt-0.5">{called} de {c.total_assigned} contactados</p>
            </div>
            <div className="bg-surface-raised border border-surface-border rounded-xl p-3">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Cuota diaria</p>
              <p className="text-2xl font-black text-accent tabular-nums">{c.leads_per_day}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">leads/día configurados</p>
            </div>
            <div className="bg-surface-raised border border-surface-border rounded-xl p-3">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Esta semana</p>
              <p className="text-2xl font-black text-emerald-400 tabular-nums">{c.week_closed}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">agendados 7 días</p>
            </div>
          </div>

          {/* Top industries */}
          {c.top_industries?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nichos trabajados</p>
              <div className="space-y-2">
                {c.top_industries.map((ind, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-slate-600 w-3 tabular-nums">{i + 1}</span>
                    <p className="text-xs text-slate-300 w-36 truncate flex-shrink-0">{ind.industry}</p>
                    <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent/60 transition-all duration-700"
                        style={{ width: `${Math.round((ind.count / (maxInd || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-400 tabular-nums w-5 text-right">{ind.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Industry filters */}
          {c.industry_filters?.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nichos asignados por admin</p>
              <div className="flex flex-wrap gap-1.5">
                {c.industry_filters.map((f, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent font-medium">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [secondsAgo, setSecondsAgo] = useState(0)

  const fetchData = () => {
    adminApi.getAnalytics()
      .then(r => {
        setData(r.data)
        setLastUpdated(Date.now())
        setSecondsAgo(0)
        setError(null)
      })
      .catch(() => setError('Error al cargar analytics'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    const poll = setInterval(fetchData, 30_000)
    return () => clearInterval(poll)
  }, [])

  useEffect(() => {
    if (!lastUpdated) return
    const tick = setInterval(() => setSecondsAgo(Math.round((Date.now() - lastUpdated) / 1000)), 1000)
    return () => clearInterval(tick)
  }, [lastUpdated])

  if (loading) return (
    <>
      <NavBar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    </>
  )

  if (error) return (
    <>
      <NavBar />
      <div className="max-w-6xl mx-auto px-6 py-10 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={fetchData} className="mt-3 text-xs text-accent hover:underline">Reintentar</button>
      </div>
    </>
  )

  const todayLabel = new Date(data.today + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const todayTotal = Object.values(data.today_by_status).reduce((a, b) => a + b, 0)
  const allTotal = data.all_time.total_assigned
  const commercials = [...data.by_commercial].sort((a, b) => b.conversion_rate - a.conversion_rate)
  const maxInd = Math.max(...commercials.flatMap(c => c.top_industries?.map(i => i.count) || [0]), 1)

  return (
    <>
      <NavBar />

      <main className="max-w-6xl mx-auto px-5 py-7 space-y-7">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-slate-500 capitalize mt-0.5">{todayLabel}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-raised border border-surface-border">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
            />
            <span className="text-[11px] font-bold text-emerald-400">En vivo</span>
            <span className="text-[10px] text-slate-600">
              · {secondsAgo < 5 ? 'ahora mismo' : `hace ${secondsAgo}s`}
            </span>
            <button
              onClick={fetchData}
              className="ml-1 text-slate-500 hover:text-accent transition-colors"
              title="Actualizar ahora"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard delay={0}    label="Leads hoy"        value={data.total_leads_today}                      sub={`de ${data.by_commercial.reduce((a, c) => a + c.leads_per_day, 0)} posibles`} color="text-white"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          />
          <KpiCard delay={0.05} label="Conversión"       value={`${data.all_time.conversion_rate}%`}         sub={`${data.all_time.by_status?.closed || 0} agendados / ${allTotal} asignados`}   color={data.all_time.conversion_rate >= 20 ? 'text-emerald-400' : data.all_time.conversion_rate >= 10 ? 'text-amber-400' : 'text-slate-300'}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
          />
          <KpiCard delay={0.1}  label="Total histórico"  value={allTotal.toLocaleString('es-ES')}             sub="leads asignados"                                                                color="text-accent"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
          <KpiCard delay={0.15} label="Empresas en BD"   value={data.total_companies.toLocaleString('es-ES')} sub="disponibles"                                                                    color="text-slate-300"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
          />
        </div>

        {/* Weekly Race */}
        <WeeklyRace commercials={data.by_commercial} />

        {/* Unassigned */}
        <UnassignedLeadsPanel users={data.users || []} />

        {/* Pipeline hoy + Histórico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pipeline hoy</p>
              <span className="text-xs font-bold text-white bg-surface-raised border border-surface-border px-2 py-0.5 rounded-lg">{todayTotal} leads</span>
            </div>
            {todayTotal > 0
              ? <PipelineChart statusMap={data.today_by_status} total={todayTotal} />
              : <p className="text-xs text-slate-600 italic">Sin actividad hoy</p>}
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Histórico total</p>
              <span className="text-xs font-bold text-white bg-surface-raised border border-surface-border px-2 py-0.5 rounded-lg">{allTotal.toLocaleString('es-ES')} leads</span>
            </div>
            {allTotal > 0
              ? <PipelineChart statusMap={data.all_time.by_status} total={allTotal} />
              : <p className="text-xs text-slate-600 italic">Sin datos históricos</p>}
          </div>
        </div>

        {/* Comerciales */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Rendimiento por comercial</p>
            <p className="text-[11px] text-slate-600">Click para abrir perfil · datos en tiempo real</p>
          </div>
          <div className="space-y-2">
            {commercials.map((c, rank) => (
              <CommercialRow key={c.id} c={c} rank={rank + 1} maxInd={maxInd} />
            ))}
          </div>
        </div>

      </main>
    </>
  )
}
