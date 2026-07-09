import { useState, useRef, useEffect } from 'react'
import { importApi } from '../lib/api'
import { toast } from '../lib/toast'

const STEPS = [
  { id: 1, label: 'Subir archivo' },
  { id: 2, label: 'Validar con IA' },
  { id: 3, label: 'En el pool' },
]

const LOADER_STAGES = [
  { id: 'parse', label: 'Analizando columnas' },
  { id: 'niche', label: 'Detectando nichos' },
  { id: 'ai',    label: 'Validando con IA' },
  { id: 'pool',  label: 'Importando al pool' },
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => {
        const done = s.id < current
        const active = s.id === current
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300"
                style={{
                  background: done ? '#10b981' : active ? '#7c3aed' : 'rgb(var(--color-surface-raised))',
                  color: done || active ? '#fff' : 'var(--text-muted)',
                  border: done || active ? 'none' : '1px solid rgb(var(--color-surface-border) / 0.6)',
                  boxShadow: active ? '0 0 16px rgba(124,58,237,0.6)' : done ? '0 0 10px rgba(16,185,129,0.4)' : 'none',
                }}
              >
                {done ? '✓' : s.id}
              </div>
              <span className="text-[10px] font-semibold whitespace-nowrap"
                style={{ color: active ? '#c4b5fd' : done ? '#6ee7b7' : 'var(--text-muted)' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-4 transition-all duration-500"
                style={{ background: done ? 'rgba(16,185,129,0.5)' : 'rgb(var(--color-surface-border) / 0.5)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function UploadZone({ onFile, loading }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file && /\.(xlsx|xls|csv)$/i.test(file.name)) onFile(file)
    else toast.error('Solo .xlsx, .xls o .csv')
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onClick={() => inputRef.current?.click()}
      className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 p-8 text-center"
      style={{
        background: drag ? 'rgba(124,58,237,0.08)' : 'rgb(var(--color-surface-raised) / 0.5)',
        border: drag ? '2px dashed rgba(124,58,237,0.7)' : '2px dashed rgb(var(--color-surface-border) / 0.7)',
        boxShadow: drag ? '0 0 40px -10px rgba(124,58,237,0.3), inset 0 0 40px rgba(124,58,237,0.04)' : 'none',
      }}
    >
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{ background: 'radial-gradient(circle at 50% 30%, rgba(124,58,237,0.08) 0%, transparent 65%)', opacity: drag ? 1 : 0 }} />
      <input ref={inputRef} type="file" className="hidden" accept=".xlsx,.xls,.csv"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(124,58,237,0.3)', borderTopColor: '#7c3aed' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Procesando archivo…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{ background: drag ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="w-7 h-7">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>
              {drag ? 'Suelta aquí' : 'Arrastra tu Excel aquí'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>o haz clic para seleccionar · .xlsx .xls .csv</p>
          </div>
        </div>
      )}
    </div>
  )
}

function Tag({ label, color = 'purple' }) {
  const s = {
    purple: { color: '#a78bfa', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.25)' },
    green:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' },
    amber:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  }[color]
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border"
      style={{ color: s.color, background: s.bg, borderColor: s.border }}>
      {label}
    </span>
  )
}

function Btn({ onClick, disabled, variant = 'primary', children, loading }) {
  const s = {
    primary:   { background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.4)' },
    secondary: { background: 'rgb(var(--color-surface-raised))', color: 'var(--text-secondary)', border: '1px solid rgb(var(--color-surface-border) / 0.7)' },
    success:   { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)' },
  }[variant]
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
      style={s}>
      {loading && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}

function ProgressLoader({ stage }) {
  // stage = index into LOADER_STAGES of currently-active step (-1 = none, length = done)
  return (
    <div className="rounded-2xl p-6 space-y-3"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(16,185,129,0.04))',
        border: '1px solid rgba(124,58,237,0.25)',
        boxShadow: '0 0 30px -8px rgba(124,58,237,0.2), inset 0 0 30px rgba(124,58,237,0.03)',
      }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', animationDuration: '1.2s' }} />
          <div className="absolute inset-1.5 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(16,185,129,0.15)', borderTopColor: '#10b981', animationDuration: '0.8s', animationDirection: 'reverse' }} />
        </div>
        <div>
          <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Validando con IA</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Claude está analizando tu dataset…</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {LOADER_STAGES.map((s, i) => {
          const done = i < stage
          const active = i === stage
          return (
            <div key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300"
              style={{
                background: active ? 'rgba(124,58,237,0.08)' : done ? 'rgba(16,185,129,0.05)' : 'transparent',
                border: active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
              }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                style={{
                  background: done ? '#10b981' : active ? 'transparent' : 'rgb(var(--color-surface-raised))',
                  color: done ? '#fff' : 'var(--text-muted)',
                  border: active ? '2px solid #7c3aed' : done ? 'none' : '1px solid rgb(var(--color-surface-border) / 0.6)',
                }}>
                {done && '✓'}
                {active && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7c3aed' }} />}
              </div>
              <span className="text-xs font-semibold"
                style={{ color: active ? '#c4b5fd' : done ? '#6ee7b7' : 'var(--text-muted)' }}>
                {s.label}
                {active && <span className="ml-1 inline-block animate-pulse">…</span>}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ImportLeadsSection({ users, onImportDone }) {
  const [step, setStep] = useState(1)
  const [uploadData, setUploadData] = useState(null)
  const [validation, setValidation] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(-1)
  const [allLeads, setAllLeads] = useState([])
  const [detectedNichos, setDetectedNichos] = useState([])

  const uploadFile = async (file) => {
    setLoading(true)
    try {
      const res = await importApi.upload(file)
      const data = res.data
      if (data.success) {
        setUploadData(data)
        setAllLeads(data.all_rows)
        const nichos = new Set()
        data.all_rows.forEach((row) => {
          const combined = [row.industry, row.sub_industry].filter(Boolean).join(' - ').trim()
          if (combined) nichos.add(combined)
        })
        setDetectedNichos(Array.from(nichos))
        toast.success(`${data.total} leads cargados`)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al subir archivo')
    } finally {
      setLoading(false)
    }
  }

  // Animador de sub-stages durante validar+importar
  useEffect(() => {
    if (!loading || step !== 2) return
    setStage(0)
    const timers = [
      setTimeout(() => setStage(1), 600),
      setTimeout(() => setStage(2), 1400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [loading, step])

  const handleValidateAndImport = async () => {
    if (!uploadData) return
    setStep(2)
    setLoading(true)
    try {
      // 1) Validar con IA
      const vRes = await importApi.validate({
        columns_found: uploadData.columns_found,
        all_rows: allLeads,
      })
      setValidation(vRes.data.validation)
      setStage(3)  // pasamos a fase "Importando al pool"

      // 2) Importar al pool sin asignar (assignments=[])
      const iRes = await importApi.assign({ leads: allLeads, assignments: [] })
      setImportResult(iRes.data)
      setStage(LOADER_STAGES.length)
      setStep(3)
      toast.success(`${iRes.data.companies_imported} leads en el pool`)
      onImportDone?.()
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Error en validación')
      setStep(1)
      setStage(-1)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1); setUploadData(null); setValidation(null); setImportResult(null)
    setAllLeads([]); setDetectedNichos([]); setStage(-1)
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-px h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #7c3aed, rgba(124,58,237,0.2))' }} />
        <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Importar Leads</h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'rgb(var(--color-surface-card))',
          border: '1px solid rgb(var(--color-surface-border) / 0.6)',
          boxShadow: '0 4px 20px -6px rgba(0,0,0,0.12)',
        }}>
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 100% 0%, rgba(124,58,237,0.05) 0%, transparent 60%)' }} />

        <StepIndicator current={step} />

        {/* ── STEP 1: UPLOAD + PREVIEW ── */}
        {step === 1 && (
          <div className="space-y-4">
            <UploadZone onFile={uploadFile} loading={loading} />

            {uploadData && !loading && (
              <div className="rounded-xl p-4 space-y-3"
                style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #10b981' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{uploadData.total} leads detectados</span>
                  {detectedNichos.length > 0 && (
                    <span className="ml-auto"><Tag label={`${detectedNichos.length} nicho${detectedNichos.length > 1 ? 's' : ''}`} color="purple" /></span>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>Columnas mapeadas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(uploadData.columns_found).map((f) => (
                      <Tag key={f} label={`✓ ${f}`} color="green" />
                    ))}
                  </div>
                </div>
                {uploadData.sample_rows?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>Preview</p>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {uploadData.sample_rows.slice(0, 3).map((row, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgb(var(--color-surface-raised) / 0.5)', border: '1px solid rgb(var(--color-surface-border) / 0.4)' }}>
                          <span className="text-[10px] font-black w-4 flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{i + 1}</span>
                          <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{row.company_name || row.contact_name || '—'}</span>
                          {row.contact_name && <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{row.contact_name}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Btn onClick={handleValidateAndImport} loading={loading}>Validar con IA e importar al pool →</Btn>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: VALIDATING + IMPORTING (loader) ── */}
        {step === 2 && (
          <ProgressLoader stage={stage} />
        )}

        {/* ── STEP 3: SUCCESS — leads in pool ── */}
        {step === 3 && importResult && (
          <div className="space-y-4">
            <style>{`
              @keyframes lu-pop2 { 0%{transform:scale(.3) translateY(20px);opacity:0} 60%{transform:scale(1.15);opacity:1} 100%{transform:scale(1);opacity:1} }
              @keyframes lu-spark { 0%{transform:translate(-50%,-50%) scale(0) rotate(0);opacity:0} 30%{transform:translate(-50%,-50%) scale(1) rotate(180deg);opacity:1} 100%{transform:translate(-50%,-50%) scale(0) rotate(360deg);opacity:0} }
              @keyframes lu-ring2 { 0%{transform:scale(.4);opacity:.8} 100%{transform:scale(2.4);opacity:0} }
              @keyframes lu-count { 0%{opacity:0; transform:translateY(8px)} 100%{opacity:1; transform:translateY(0)} }
            `}</style>
            <div className="relative rounded-2xl p-5 text-center overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(124,58,237,0.05))',
                border: '1px solid rgba(16,185,129,0.3)',
                boxShadow: '0 0 30px -8px rgba(16,185,129,0.25)',
                animation: 'lu-pop2 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
              <div className="relative w-14 h-14 mx-auto mb-3">
                <div className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.5), transparent 70%)', animation: 'lu-ring2 1400ms ease-out' }} />
                <div className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4), transparent 70%)', animation: 'lu-ring2 1700ms ease-out 250ms' }} />
                <div className="relative w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black"
                  style={{ background: '#10b981', color: '#fff', boxShadow: '0 0 24px rgba(16,185,129,0.6)' }}>✓</div>
                {[...Array(8)].map((_, i) => {
                  const angle = (i * 45) * Math.PI / 180
                  return (
                    <span key={i} className="absolute text-base pointer-events-none"
                      style={{
                        left: `calc(50% + ${Math.cos(angle) * 42}px)`,
                        top: `calc(50% + ${Math.sin(angle) * 42}px)`,
                        animation: `lu-spark 1400ms ease-out ${i * 60}ms forwards`,
                      }}>{i % 2 ? '✨' : '·'}</span>
                  )
                })}
              </div>
              <p className="text-lg font-black mb-1" style={{ color: 'var(--text-primary)', animation: 'lu-count 500ms 200ms backwards' }}>
                {importResult.companies_imported} leads en el pool
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)', animation: 'lu-count 500ms 350ms backwards' }}>
                {importResult.contacts_imported} contactos · {importResult.skipped_already_assigned} ya asignados (omitidos)
              </p>
            </div>

            {validation && (
              <div className="rounded-xl p-4"
                style={{ background: 'rgb(var(--color-surface-raised) / 0.5)', border: '1px solid rgb(var(--color-surface-border) / 0.5)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Calidad del dataset</p>
                  <span className="text-sm font-black tabular-nums"
                    style={{ color: validation.completeness_pct >= 70 ? '#10b981' : validation.completeness_pct >= 40 ? '#f59e0b' : '#ef4444' }}>
                    {validation.completeness_pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'rgb(var(--color-surface-border) / 0.4)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${validation.completeness_pct}%`,
                      background: validation.completeness_pct >= 70
                        ? 'linear-gradient(90deg, #059669, #10b981)'
                        : validation.completeness_pct >= 40
                        ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                        : 'linear-gradient(90deg, #dc2626, #ef4444)',
                    }} />
                </div>
                {validation.recommendations && (
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{validation.recommendations}</p>
                )}
              </div>
            )}

            <div className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <span className="text-lg">👇</span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Distribuye los leads desde la sección <strong style={{ color: '#c4b5fd' }}>Pendientes por nicho</strong> de abajo.
              </p>
            </div>

            <Btn onClick={resetForm} variant="secondary">Importar otro CSV</Btn>
          </div>
        )}
      </div>
    </section>
  )
}
