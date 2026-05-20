import { useState } from 'react'
import { m } from 'motion/react'
import confetti from 'canvas-confetti'
import { leadsApi } from '../../lib/api'
import { toast } from '../../lib/toast'

const GHL_CALENDAR_URL = 'https://info.cliender.com/widget/bookings/ccl'

const STATUS_OPTIONS = [
  { value: 'pending',    label: 'Pendiente',     color: 'text-amber-400  bg-amber-400/10  border-amber-400/25  hover:bg-amber-400/20',  glow: 'shadow-[0_0_10px_-2px_rgb(251_191_36_/_0.5)]'  },
  { value: 'no_answer',  label: 'Sin respuesta', color: 'text-slate-300  bg-slate-400/10  border-slate-400/25  hover:bg-slate-400/20',  glow: 'shadow-[0_0_10px_-2px_rgb(148_163_184_/_0.4)]' },
  { value: 'call_later', label: 'Llamar luego',  color: 'text-blue-400   bg-blue-400/10   border-blue-400/25   hover:bg-blue-400/20',   glow: 'shadow-[0_0_10px_-2px_rgb(96_165_250_/_0.5)]'  },
  { value: 'closed',     label: 'Agendado',      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25 hover:bg-emerald-400/20', glow: 'shadow-[0_0_10px_-2px_rgb(52_211_153_/_0.5)]' },
  { value: 'rejected',   label: 'Rechazado',     color: 'text-red-400    bg-red-400/10    border-red-400/25    hover:bg-red-400/20',    glow: 'shadow-[0_0_10px_-2px_rgb(248_113_113_/_0.5)]' },
]

function fireCelebration() {
  const count = 120
  const defaults = { startVelocity: 28, spread: 55, ticks: 55, zIndex: 9999 }

  confetti({ ...defaults, particleCount: count * 0.25, origin: { x: 0.2, y: 0.65 },
    colors: ['#34d399', '#6ee7b7', '#a7f3d0', '#fff'] })
  confetti({ ...defaults, particleCount: count * 0.25, origin: { x: 0.8, y: 0.65 },
    colors: ['#34d399', '#6ee7b7', '#a7f3d0', '#fff'] })
  setTimeout(() => {
    confetti({ ...defaults, particleCount: count * 0.2, origin: { x: 0.5, y: 0.6 },
      colors: ['#34d399', '#10b981', '#fff', '#d1fae5'] })
  }, 150)
}

export default function StatusBar({ assignmentId, currentStatus, onStatusChange }) {
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(currentStatus)

  const handleChange = async (newStatus) => {
    if (newStatus === active || loading) return
    setLoading(true)
    try {
      await leadsApi.updateStatus(assignmentId, newStatus)
      setActive(newStatus)
      onStatusChange?.(assignmentId, newStatus)
      const label = STATUS_OPTIONS.find(o => o.value === newStatus)?.label
      toast.success(label ?? 'Estado actualizado')

      if (newStatus === 'closed') {
        fireCelebration()
        setTimeout(() => {
          const popup = window.open(GHL_CALENDAR_URL, '_blank')
          if (!popup) {
            window.location.href = GHL_CALENDAR_URL
          }
        }, 100)
      }
    } catch (err) {
      toast.error('Error al cambiar estado')
      console.error('Status update failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {STATUS_OPTIONS.map((opt) => {
        const isActive = active === opt.value
        return (
          <m.button
            key={opt.value}
            onClick={(e) => { e.stopPropagation(); handleChange(opt.value) }}
            disabled={loading}
            className={`
              badge border text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer
              ${isActive
                ? `${opt.color} ${opt.glow} scale-105 shadow-card`
                : 'text-slate-500 bg-surface-card border-surface-border hover:border-slate-400 hover:text-slate-300'
              }
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft" />
            )}
            {opt.label}
          </m.button>
        )
      })}
    </div>
  )
}
