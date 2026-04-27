import { useState } from 'react'
import { leadsApi } from '../lib/api'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/20' },
  { value: 'no_answer', label: 'Sin respuesta', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20 hover:bg-slate-400/20' },
  { value: 'closed', label: 'Cerrado', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 hover:bg-emerald-400/20' },
  { value: 'rejected', label: 'Rechazado', color: 'text-red-400 bg-red-400/10 border-red-400/20 hover:bg-red-400/20' },
]

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
    } catch (err) {
      console.error('Status update failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STATUS_OPTIONS.map((opt) => {
        const isActive = active === opt.value
        return (
          <button
            key={opt.value}
            onClick={(e) => { e.stopPropagation(); handleChange(opt.value) }}
            disabled={loading}
            className={`
              badge border transition-all duration-150 cursor-pointer
              ${isActive ? opt.color : 'text-slate-500 bg-transparent border-surface-border hover:border-slate-500 hover:text-slate-300'}
              ${isActive ? 'ring-1 ring-offset-1 ring-offset-surface-card' : ''}
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
          >
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft" />
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
