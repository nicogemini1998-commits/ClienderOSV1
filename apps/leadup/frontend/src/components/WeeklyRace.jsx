import { useState, useEffect, useRef } from 'react'
import { m as motion } from 'motion/react'

function CountUp({ to }) {
  const [val, setVal] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (to === 0) { setVal(0); return }
    const start = performance.now()
    const duration = 800
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(to * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [to])

  return <>{val}</>
}

// Colores seguros que Tailwind detecta estáticamente
const LANE_STYLES = [
  { bg: 'bg-indigo-500',  text: 'text-indigo-300',  badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30' },
  { bg: 'bg-blue-500',    text: 'text-blue-300',    badge: 'bg-blue-500/15 text-blue-300 border-blue-400/30' },
  { bg: 'bg-cyan-500',    text: 'text-cyan-300',    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' },
  { bg: 'bg-teal-500',    text: 'text-teal-300',    badge: 'bg-teal-500/15 text-teal-300 border-teal-400/30' },
  { bg: 'bg-slate-500',   text: 'text-slate-400',   badge: 'bg-slate-500/15 text-slate-400 border-slate-400/30' },
]

export default function WeeklyRace({ commercials }) {
  const [goal, setGoal] = useState(() => {
    try { return parseInt(localStorage.getItem('leadup_weekly_goal') || '10') || 10 } catch { return 10 }
  })
  const [daysLeft, setDaysLeft] = useState(5)

  useEffect(() => {
    const d = new Date()
    const until = (7 - d.getDay()) % 7 || 7
    setDaysLeft(until)
  }, [])

  if (!commercials?.length) return null

  // Usar closed total como métrica visible (week_closed casi siempre 0 si asignaciones son recientes)
  const sorted = [...commercials].sort((a, b) => (b.closed || 0) - (a.closed || 0))
  const teamTotal = sorted.reduce((s, c) => s + (c.closed || 0), 0)

  return (
    <div className="card p-6 space-y-5">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Progreso del Equipo</h3>
          <p className="text-xs text-slate-500 mt-0.5">Leads agendados · activo esta semana</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Total equipo</p>
            <p className="text-xl font-black text-white tabular-nums">
              <CountUp to={teamTotal} /> agendados
            </p>
          </div>
          <div className="h-8 w-px bg-surface-border" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Meta/persona</p>
            <input
              type="number"
              value={goal}
              min={1}
              step={1}
              onChange={e => {
                const v = parseInt(e.target.value) || 1
                setGoal(v)
                try { localStorage.setItem('leadup_weekly_goal', String(v)) } catch {}
              }}
              className="w-14 px-2 py-1 bg-surface-raised border border-surface-border text-white rounded-lg text-sm font-black text-center focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Cierre en</p>
            <p className="text-sm font-black text-accent tabular-nums">{daysLeft} días</p>
          </div>
        </div>
      </div>

      {/* Barras */}
      <div className="space-y-3">
        {sorted.map((c, i) => {
          const style = LANE_STYLES[i] || LANE_STYLES[LANE_STYLES.length - 1]
          const closed = c.closed || 0
          const pct = goal > 0 ? Math.min(Math.round((closed / goal) * 100), 100) : 0
          const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

          return (
            <div key={c.id} className="flex items-center gap-3">
              {/* Rank */}
              <span className="text-[10px] font-black text-slate-600 w-3 tabular-nums flex-shrink-0">{i + 1}</span>

              {/* Avatar */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 border ${style.badge}`}>
                {initials}
              </div>

              {/* Nombre */}
              <span className={`text-sm font-bold w-16 truncate flex-shrink-0 ${i === 0 ? style.text : 'text-slate-300'}`}>
                {c.name.split(' ')[0]}
              </span>

              {/* Barra */}
              <div className="flex-1 h-5 bg-surface-secondary rounded-md overflow-hidden border border-surface-border/40 relative">
                {/* Líneas de milestone */}
                {[25, 50, 75].map(m => (
                  <div
                    key={m}
                    className="absolute inset-y-0 w-px bg-white/5"
                    style={{ left: `${m}%` }}
                  />
                ))}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={`h-full rounded-md ${style.bg} opacity-80`}
                />
              </div>

              {/* Valor */}
              <div className="flex items-center gap-2 flex-shrink-0 w-20 justify-end">
                <span className={`text-sm font-black tabular-nums ${style.text}`}>
                  <CountUp to={closed} />
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border tabular-nums w-10 text-center ${style.badge}`}>
                  {pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-surface-border flex items-center justify-between">
        <p className="text-[10px] text-slate-600">{sorted.length} comerciales activos</p>
        <p className="text-[10px] text-slate-600">
          Meta: <span className="text-slate-400 font-bold">{goal} agendados</span> por persona
        </p>
      </div>
    </div>
  )
}
