import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getLessonsForPlan, updateLesson } from '../../lib/firestore'
import type { Lesson } from '../../types'

const FIELD_CLASS =
  'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#58CC02]/40'

export function AdminLessonFormPage() {
  const { planId, lessonId } = useParams<{ planId: string; lessonId: string }>()
  const navigate = useNavigate()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [title, setTitle] = useState('')
  const [weekNumber, setWeekNumber] = useState('')
  const [baseVerse, setBaseVerse] = useState('')
  const [verseText, setVerseText] = useState('')
  const [availableFrom, setAvailableFrom] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!planId || !lessonId) return
    getLessonsForPlan(planId)
      .then(lessons => {
        const found = lessons.find(l => l.id === lessonId)
        if (!found) { setError('Lição não encontrada.'); return }
        setLesson(found)
        setTitle(found.title)
        setWeekNumber(String(found.weekNumber))
        setBaseVerse(found.baseVerse ?? '')
        setVerseText(found.verseText ?? '')
        setAvailableFrom(found.availableFrom.toDate().toISOString().split('T')[0])
      })
      .catch(() => setError('Não foi possível carregar a lição.'))
      .finally(() => setLoading(false))
  }, [planId, lessonId])

  const canSave = title.trim().length > 0 && weekNumber.length > 0

  async function handleSave() {
    if (!canSave || !lessonId) return
    setSaving(true)
    setError(null)
    try {
      await updateLesson(lessonId, {
        title: title.trim(),
        weekNumber: Number(weekNumber),
        baseVerse: baseVerse.trim(),
        verseText: verseText.trim(),
        availableFromDateStr: availableFrom || new Date().toISOString().split('T')[0],
      })
      navigate(`/admin/plans/${planId}`)
    } catch {
      setError('Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !lesson) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="font-bold text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-6 flex-wrap">
        <Link to="/admin/plans" className="hover:text-[#9333EA] transition-colors">Planos</Link>
        <span>/</span>
        <Link to={`/admin/plans/${planId}`} className="hover:text-[#9333EA] transition-colors truncate max-w-[10rem]">
          Lições
        </Link>
        <span>/</span>
        <span className="text-gray-700 truncate max-w-[10rem]">{title || 'Lição'}</span>
        <span>/</span>
        <span className="text-gray-700">Editar</span>
      </div>

      <h1 className="text-2xl font-black text-gray-800 mb-8">Editar lição</h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormLabel>Título *</FormLabel>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Davi e Golias"
              className={FIELD_CLASS}
              autoFocus
            />
          </div>
          <div>
            <FormLabel>Semana *</FormLabel>
            <input
              type="number"
              value={weekNumber}
              onChange={e => setWeekNumber(e.target.value)}
              min={1}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <FormLabel>Data de disponibilização</FormLabel>
            <input
              type="date"
              value={availableFrom}
              onChange={e => setAvailableFrom(e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <div>
            <FormLabel>Versículo-base (referência)</FormLabel>
            <input
              value={baseVerse}
              onChange={e => setBaseVerse(e.target.value)}
              placeholder="Ex: João 3:16"
              className={FIELD_CLASS}
            />
          </div>
          <div className="sm:col-span-2">
            <FormLabel>Texto do versículo</FormLabel>
            <textarea
              value={verseText}
              onChange={e => setVerseText(e.target.value)}
              rows={3}
              className={`${FIELD_CLASS} resize-none`}
            />
          </div>
        </div>

        {error && <p className="text-sm font-bold text-[#FF4B4B] mt-4">{error}</p>}

        <div className="flex gap-3 justify-end mt-6">
          <Link
            to={`/admin/plans/${planId}`}
            className="py-2.5 px-5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="bg-[#58CC02] text-white font-extrabold py-2.5 px-6 rounded-xl hover:bg-[#46A302] transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </motion.div>
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
