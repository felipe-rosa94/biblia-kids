import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../features/auth/useAuth'
import { getStudyPlans, createStudyPlan, updateStudyPlan } from '../../lib/firestore'

const FIELD_CLASS =
  'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#CE82FF]/40'

export function AdminPlanFormPage() {
  const navigate = useNavigate()
  const { planId } = useParams<{ planId: string }>()
  const isEditing = Boolean(planId)
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditing || !planId) return
    getStudyPlans()
      .then(plans => {
        const plan = plans.find(p => p.id === planId)
        if (plan) {
          setTitle(plan.title)
          setYear(String(plan.year))
          setDescription(plan.description ?? '')
        } else {
          setError('Plano não encontrado.')
        }
      })
      .catch(() => setError('Não foi possível carregar o plano.'))
      .finally(() => setLoading(false))
  }, [planId, isEditing])

  const canSave = title.trim().length > 0 && year.length === 4

  async function handleSave() {
    if (!canSave || !user) return
    setSaving(true)
    setError(null)
    try {
      if (isEditing && planId) {
        await updateStudyPlan(planId, {
          title: title.trim(),
          year: Number(year),
          description: description.trim(),
        })
        navigate(`/admin/plans/${planId}`)
      } else {
        await createStudyPlan(
          { title: title.trim(), year: Number(year), description: description.trim() },
          user.uid,
        )
        navigate('/admin/plans')
      }
    } catch {
      setError('Não foi possível salvar o plano. Tente novamente.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-[#CE82FF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-6">
        <Link to="/admin/plans" className="hover:text-[#9333EA] transition-colors">
          Planos
        </Link>
        {isEditing && planId && (
          <>
            <span>/</span>
            <Link to={`/admin/plans/${planId}`} className="hover:text-[#9333EA] transition-colors truncate max-w-[12rem]">
              {title || 'Plano'}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-700">{isEditing ? 'Editar' : 'Novo plano'}</span>
      </div>

      <h1 className="text-2xl font-black text-gray-800 mb-8">
        {isEditing ? 'Editar plano' : 'Novo plano de estudo'}
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <div className="flex flex-col gap-5">
          <div>
            <Label>Título *</Label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Plano Anual 2025"
              className={FIELD_CLASS}
              autoFocus
            />
          </div>

          <div>
            <Label>Ano *</Label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              min={2020}
              max={2100}
              className={FIELD_CLASS}
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o tema e o público do plano..."
              rows={3}
              className={`${FIELD_CLASS} resize-none`}
            />
          </div>

          {error && (
            <p className="text-sm font-bold text-[#FF4B4B]">{error}</p>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Link
              to={isEditing && planId ? `/admin/plans/${planId}` : '/admin/plans'}
              className="py-2.5 px-5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="bg-[#CE82FF] text-white font-extrabold py-2.5 px-6 rounded-xl hover:bg-[#b86fe0] transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar plano'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1">
      {children}
    </label>
  )
}
