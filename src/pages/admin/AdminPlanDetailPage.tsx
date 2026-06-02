import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../features/auth/useAuth'
import {
  getStudyPlans,
  getLessonsForPlan,
  createLesson,
  publishLesson,
  deleteLesson,
} from '../../lib/firestore'
import type { StudyPlan, Lesson } from '../../types'

interface LessonFormState {
  title: string
  weekNumber: string
  baseVerse: string
  verseText: string
  availableFrom: string
}

const EMPTY_FORM: LessonFormState = {
  title: '',
  weekNumber: '',
  baseVerse: '',
  verseText: '',
  availableFrom: '',
}

const FIELD_CLASS =
  'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#58CC02]/40'

export function AdminPlanDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<LessonFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!planId) return
    let cancelled = false

    async function load() {
      try {
        const [allPlans, fetchedLessons] = await Promise.all([
          getStudyPlans(),
          getLessonsForPlan(planId!),
        ])
        if (!cancelled) {
          setPlan(allPlans.find(p => p.id === planId) ?? null)
          setLessons(fetchedLessons)
        }
      } catch (err) {
        console.error('Erro ao carregar lições:', err)
        if (!cancelled) setError('Não foi possível carregar as lições.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [planId])

  async function handleSave() {
    if (!planId || !form.title.trim() || !form.weekNumber || !user) return
    setSaving(true)
    try {
      const newLesson = await createLesson(
        {
          planId,
          title: form.title.trim(),
          weekNumber: Number(form.weekNumber),
          baseVerse: form.baseVerse.trim(),
          verseText: form.verseText.trim(),
          availableFromDateStr: form.availableFrom || new Date().toISOString().split('T')[0],
          order: lessons.length + 1,
        },
        user.uid,
      )
      setLessons(prev => [...prev, newLesson])
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch {
      alert('Erro ao salvar lição. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish(lessonId: string) {
    try {
      await publishLesson(lessonId)
      setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, published: true } : l))
    } catch {
      alert('Erro ao publicar lição.')
    }
  }

  async function handleDelete(lessonId: string) {
    setDeletingId(lessonId)
    try {
      await deleteLesson(lessonId)
      setLessons(prev => prev.filter(l => l.id !== lessonId))
    } catch {
      alert('Não foi possível excluir a lição. Tente novamente.')
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="font-bold text-gray-500">{error ?? 'Plano não encontrado.'}</p>
      </div>
    )
  }

  const canSave = form.title.trim().length > 0 && form.weekNumber.length > 0

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-6 flex-wrap">
        <Link to="/admin/plans" className="hover:text-[#9333EA] transition-colors">
          Planos
        </Link>
        <span>/</span>
        <span className="text-gray-700 truncate">{plan.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800">{plan.title}</h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">
            {lessons.length} {lessons.length !== 1 ? 'lições' : 'lição'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`font-extrabold py-2.5 px-5 rounded-xl transition-colors active:scale-95
            ${showForm
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-[#58CC02] text-white hover:bg-[#46A302]'}`}
        >
          {showForm ? '✕ Cancelar' : '+ Nova lição'}
        </button>
      </div>

      {/* Formulário inline de nova lição */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="lesson-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-[#58CC02]/5 border border-[#58CC02]/25 rounded-2xl p-6">
              <h3 className="font-extrabold text-gray-800 text-lg mb-5">Nova lição</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormLabel>Título da lição *</FormLabel>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ex: Davi e Golias"
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <FormLabel>Semana *</FormLabel>
                  <input
                    type="number"
                    value={form.weekNumber}
                    onChange={e => setForm(f => ({ ...f, weekNumber: e.target.value }))}
                    placeholder="1"
                    min={1}
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <FormLabel>Data de disponibilização (domingo)</FormLabel>
                  <input
                    type="date"
                    value={form.availableFrom}
                    onChange={e => setForm(f => ({ ...f, availableFrom: e.target.value }))}
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <FormLabel>Versículo-base (referência)</FormLabel>
                  <input
                    value={form.baseVerse}
                    onChange={e => setForm(f => ({ ...f, baseVerse: e.target.value }))}
                    placeholder="Ex: João 3:16"
                    className={FIELD_CLASS}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FormLabel>Texto do versículo</FormLabel>
                  <textarea
                    value={form.verseText}
                    onChange={e => setForm(f => ({ ...f, verseText: e.target.value }))}
                    placeholder="Porque Deus amou o mundo de tal maneira..."
                    rows={2}
                    className={`${FIELD_CLASS} resize-none`}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                  className="py-2.5 px-5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  className="bg-[#58CC02] text-white font-extrabold py-2.5 px-6 rounded-xl hover:bg-[#46A302] transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando…' : 'Salvar lição'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de lições */}
      {lessons.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-bold text-lg text-gray-500">Nenhuma lição ainda</p>
          <p className="text-sm">Clique em "Nova lição" para começar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lessons.map((lesson, i) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wide">
                      Semana {lesson.weekNumber}
                    </span>
                    {lesson.published ? (
                      <span className="text-xs font-bold bg-[#58CC02]/10 text-[#3e9101] px-2 py-0.5 rounded-full">
                        ✓ Publicada
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Rascunho
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-gray-800 text-base truncate">{lesson.title}</h3>
                  {lesson.baseVerse && (
                    <p className="text-sm text-gray-500 font-semibold">📖 {lesson.baseVerse}</p>
                  )}
                  <p className="text-xs text-gray-400 font-semibold mt-1">
                    Disponível em:{' '}
                    {lesson.availableFrom.toDate().toLocaleDateString('pt-BR', {
                      weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <ActionButton
                    color="blue"
                    onClick={() => navigate(`/admin/plans/${planId}/lessons/${lesson.id}/questions`)}
                  >
                    Ver questões
                  </ActionButton>
                  {!lesson.published && (
                    <ActionButton color="green" onClick={() => handlePublish(lesson.id)}>
                      Publicar
                    </ActionButton>
                  )}
                  <ActionButton
                    color="purple"
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                  >
                    Preview
                  </ActionButton>
                  <ActionButton
                    color="orange"
                    onClick={() => navigate(`/admin/plans/${planId}/lessons/${lesson.id}`)}
                  >
                    Editar
                  </ActionButton>
                  <ActionButton
                    color="red"
                    onClick={() => setConfirmDeleteId(lesson.id)}
                  >
                    Excluir
                  </ActionButton>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
            >
              <p className="text-4xl text-center mb-3">🗑️</p>
              <h2 className="text-lg font-black text-gray-800 text-center mb-2">Excluir lição?</h2>
              <p className="text-sm text-gray-500 font-semibold text-center mb-6">
                Esta ação não pode ser desfeita. Todas as questões vinculadas a esta lição serão excluídas.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deletingId === confirmDeleteId}
                  className="flex-1 py-2.5 rounded-xl font-extrabold text-white bg-[#FF4B4B] hover:bg-[#e03e3e] transition-colors disabled:opacity-50"
                >
                  {deletingId === confirmDeleteId ? 'Excluindo…' : 'Excluir'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-1">
      {children}
    </label>
  )
}

const ACTION_STYLES = {
  blue: 'text-[#1CB0F6] border-[#1CB0F6]/30 hover:bg-[#1CB0F6]/10',
  green: 'text-[#58CC02] border-[#58CC02]/30 hover:bg-[#58CC02]/10',
  purple: 'text-[#9333EA] border-[#CE82FF]/30 hover:bg-[#CE82FF]/10',
  orange: 'text-[#FF9600] border-[#FF9600]/30 hover:bg-[#FF9600]/10',
  red: 'text-[#FF4B4B] border-[#FF4B4B]/30 hover:bg-[#FF4B4B]/10',
}

function ActionButton({
  color,
  onClick,
  children,
}: {
  color: keyof typeof ACTION_STYLES
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-extrabold border px-3 py-1.5 rounded-lg transition-colors ${ACTION_STYLES[color]}`}
    >
      {children}
    </button>
  )
}
