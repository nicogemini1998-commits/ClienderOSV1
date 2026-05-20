import { useState } from 'react'
import { importApi, adminApi } from '../lib/api'
import { toast } from '../lib/toast'

const NICHO_OPTIONS = [
  'Construcción y reformas',
  'Abogados',
  'Consultoría empresarial',
  'Clínicas dentales',
  'Psicólogos',
  'Logística',
  'Restaurantes',
  'Agencias inmobiliarias',
  'Academias y formación',
  'Spa y bienestar',
  'Peluquerías',
  'Fitness y gyms',
]

export default function ImportLeadsSection({ users }) {
  const [step, setStep] = useState(1)
  const [uploadData, setUploadData] = useState(null)
  const [validation, setValidation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedNichos, setSelectedNichos] = useState([])
  const [totalQuantity, setTotalQuantity] = useState(0)
  const [detectedNichos, setDetectedNichos] = useState([])
  const [allLeads, setAllLeads] = useState([])

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      uploadFile(file)
    } else {
      toast('error', 'Por favor sube un archivo Excel (.xlsx, .xls) o CSV')
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) uploadFile(file)
  }

  const uploadFile = async (file) => {
    setLoading(true)
    try {
      const response = await importApi.upload(file)
      const data = response.data
      if (data.success) {
        setUploadData(data)
        setAllLeads(data.all_rows)

        const nichos = new Set()
        data.all_rows.forEach((row) => {
          const industry = row.industry || ''
          const subIndustry = row.sub_industry || ''
          const combined = `${industry}${subIndustry ? ' - ' + subIndustry : ''}`.trim()
          if (combined) nichos.add(combined)
        })
        setDetectedNichos(Array.from(nichos))

        toast('success', `✓ ${data.total} leads cargados correctamente`)
      }
    } catch (error) {
      toast('error', error.response?.data?.detail || 'Error al subir archivo')
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    if (!uploadData) return
    setLoading(true)
    try {
      const response = await importApi.validate({
        columns_found: uploadData.columns_found,
        all_rows: allLeads,
      })
      setValidation(response.data.validation)
      setStep(2)
      toast('success', 'Validación completada')
    } catch (error) {
      toast('error', error.response?.data?.detail || 'Error en validación')
    } finally {
      setLoading(false)
    }
  }

  const handleProceed = () => {
    setStep(3)
    setSelectedNichos([])
    setTotalQuantity(0)
  }

  const toggleNicho = (nicho) => {
    setSelectedNichos((prev) =>
      prev.includes(nicho) ? prev.filter((n) => n !== nicho) : [...prev, nicho]
    )
  }

  const handleAssign = async () => {
    if (!uploadData || !allLeads.length) {
      toast('error', 'No hay datos para asignar')
      return
    }

    if (selectedNichos.length === 0 || totalQuantity === 0) {
      toast('error', 'Selecciona nichos y una cantidad')
      return
    }

    const activeUsers = users.filter((u) => u.enabled)
    if (activeUsers.length === 0) {
      toast('error', 'No hay usuarios activos')
      return
    }

    const quantityPerUser = Math.floor(totalQuantity / activeUsers.length)
    const assignments = activeUsers.map((user) => ({
      user_id: user.id,
      nichos: selectedNichos,
      quantity: quantityPerUser,
    }))

    setLoading(true)
    try {
      const response = await importApi.assign({
        leads: allLeads,
        assignments,
      })
      if (response.data.success) {
        toast('success', `✓ ${response.data.companies_imported} empresas importadas`)
        resetForm()
      }
    } catch (error) {
      toast('error', error.response?.data?.detail || 'Error en asignación')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setUploadData(null)
    setValidation(null)
    setSelectedNichos([])
    setTotalQuantity(0)
    setDetectedNichos([])
    setAllLeads([])
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-b from-accent to-accent/40 rounded-full" />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Importar Leads desde Excel
        </h2>
      </div>

      <div className="bg-gradient-to-br from-surface-card to-surface border border-surface-border/60 rounded-xl p-6 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.2)]">
        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative overflow-hidden rounded-xl p-8 text-center cursor-pointer transition-all group"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
                border: '2px dashed rgba(59, 130, 246, 0.3)',
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              }} />
              <input
                type="file"
                id="file-input"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-input" className="cursor-pointer block relative z-10">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                  }}>
                    <span className="text-3xl">📊</span>
                  </div>
                </div>
                <p className="text-white font-bold text-lg mb-1">Importa tus leads</p>
                <p className="text-sm text-slate-400 mb-3">Arrastra un archivo Excel aquí</p>
                <p className="text-xs text-slate-500">o haz clic para seleccionar (.xlsx, .xls)</p>
              </label>
            </div>

            {uploadData && (
              <div className="space-y-4 bg-surface-raised rounded-lg p-4 border border-surface-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-sm text-white font-semibold">
                    {uploadData.total} leads detectados
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-2">Columnas mapeadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(uploadData.columns_found).map(([excel, internal]) => (
                      <span
                        key={excel}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-xs"
                      >
                        ✓ {internal}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-2">Preview (primeros 3):</p>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="text-xs text-slate-300 w-full">
                      <tbody>
                        {uploadData.sample_rows.slice(0, 3).map((row, idx) => (
                          <tr key={idx} className="border-b border-surface-border last:border-0">
                            <td className="py-1 px-2">
                              {row.company_name || row.contact_name || '—'}
                            </td>
                            <td className="py-1 px-2 text-slate-500">
                              {row.contact_name && `${row.contact_name} `}
                              {row.contact_title && `(${row.contact_title})`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button
                  onClick={handleValidate}
                  disabled={loading}
                  className="w-full bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-lg px-4 py-2.5 font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'Validando…' : '✓ Validar con IA'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Validation */}
        {step === 2 && validation && (
          <div className="space-y-4">
            <div className="bg-surface-raised rounded-lg p-4 border border-surface-border space-y-3">
              <div>
                <p className="text-xs text-slate-400 mb-2">Campos mapeados ✓</p>
                <div className="flex flex-wrap gap-2">
                  {Object.values(uploadData.columns_found).map((field) => (
                    <span
                      key={field}
                      className="inline-flex items-center px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-xs"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              {validation.missing_fields.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Campos que faltan ⚠️</p>
                  <div className="flex flex-wrap gap-2">
                    {validation.missing_fields.map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded text-xs"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-400 mb-2">Completitud</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-emerald-400"
                      style={{ width: `${validation.completeness_pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-white font-semibold">
                    {validation.completeness_pct}%
                  </span>
                </div>
              </div>

              {validation.recommendations && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Recomendaciones:</p>
                  <p className="text-xs text-slate-300 italic">{validation.recommendations}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-surface-raised hover:bg-surface-hover border border-surface-border text-slate-400 rounded-lg px-4 py-2.5 font-semibold text-sm transition-colors"
              >
                ← Volver
              </button>
              <button
                onClick={handleProceed}
                className="flex-1 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-lg px-4 py-2.5 font-semibold text-sm transition-colors"
              >
                Proceder →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Assignment */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-surface-raised rounded-lg p-4 border border-surface-border">
              <p className="text-sm text-white font-semibold mb-4">
                {allLeads.length} leads listos para distribuir
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-slate-400 font-semibold">Nichos a asignar</label>
                    <span className="text-xs text-slate-500">{selectedNichos.length} seleccionados</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detectedNichos.map((nicho) => (
                      <button
                        key={nicho}
                        onClick={() => toggleNicho(nicho)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          selectedNichos.includes(nicho)
                            ? 'bg-accent/20 border-accent/50 text-accent'
                            : 'bg-surface-raised border-surface-border text-slate-400 hover:border-accent/30'
                        }`}
                      >
                        {nicho}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 font-semibold block mb-2">
                    Cantidad total a distribuir
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={allLeads.length}
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white text-base font-mono focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                  />
                </div>

                {totalQuantity > 0 && users.filter((u) => u.enabled).length > 0 && (
                  <div className="bg-surface rounded-lg p-3 border border-surface-border/50">
                    <p className="text-xs text-slate-400 mb-2">Distribución a usuarios activos:</p>
                    <p className="text-sm text-white font-semibold">
                      {Math.floor(totalQuantity / users.filter((u) => u.enabled).length)} leads por usuario
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Distribuirá entre {users.filter((u) => u.enabled).length} usuario{users.filter((u) => u.enabled).length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-surface-raised hover:bg-surface-hover border border-surface-border text-slate-400 rounded-lg px-4 py-2.5 font-semibold text-sm transition-colors"
              >
                ← Volver
              </button>
              <button
                onClick={handleAssign}
                disabled={loading}
                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg px-4 py-2.5 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Asignando…' : '✓ Confirmar asignación'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
