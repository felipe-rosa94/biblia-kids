import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getQuestionsForLesson, getLessonsForPlan, updateQuestion } from '../../lib/firestore'
import type { Question, QuestionType } from '../../types'

const FIELD_CLASS =
  'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]/40'

export function AdminQuestionFormPage() {
  const { planId, lessonId, questionId } = useParams<{
    planId: string
    lessonId: string
    questionId: string
  }>()
  const navigate = useNavigate()

  const [type, setType] = useState<QuestionType>('multiple_choice')
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctOption, setCorrectOption] = useState(0)
  const [sentence, setSentence] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [hint, setHint] = useState('')
  const [wordOptions, setWordOptions] = useState(['', '', '', ''])
  const [order, setOrder] = useState(1)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')

  useEffect(() => {
    if (!planId || !lessonId || !questionId) return

    Promise.all([
      getLessonsForPlan(planId),
      getQuestionsForLesson(lessonId),
    ])
      .then(([lessons, questions]) => {
        const lesson = lessons.find(l => l.id === lessonId)
        setLessonTitle(lesson?.title ?? '')

        const q = questions.find(q => q.id === questionId)
        if (!q) { setError('Questão não encontrada.'); return }

        setType(q.type)
        setPrompt(q.prompt)
        setOrder(q.order)

        if (q.type === 'multiple_choice') {
          const padded = [...(q.options ?? []), '', '', '', ''].slice(0, 4)
          setOptions(padded)
          setCorrectOption(q.correctOption ?? 0)
        } else {
          setSentence(q.sentence ?? '')
          setCorrectAnswer(q.correctAnswer ?? '')
          setHint(q.hint ?? '')
          const padded = [...(q.wordOptions ?? []), '', '', '', ''].slice(0, 4)
          setWordOptions(padded)
        }
      })
      .catch(() => setError('Não foi possível carregar a questão.'))
      .finally(() => setLoading(false))
  }, [planId, lessonId, questionId])

  function setOption(i: number, value: string) {
    const next = [...options]
    next[i] = value
    setOptions(next)
  }

  function setWordOption(i: number, value: string) {
    const next = [...wordOptions]
    next[i] = value
    setWordOptions(next)
  }

  const filledOptions = options.filter(o => o.trim())
  const filledWords = wordOptions.filter(o => o.trim())
  const canSave = prompt.trim().length > 0

  async function handleSave() {
    if (!canSave || !questionId || !lessonId) return
    setSaving(true)
    setError(null)

    const base = { lessonId, order, prompt: prompt.trim() }
    const data: Omit<Question, 'id'> =
      type === 'multiple_choice'
        ? { ...base, type: 'multiple_choice', options, correctOption }
        : {
            ...base,
            type: 'fill_in_the_blank',
            sentence,
            correctAnswer,
            hint,
            wordOptions: wordOptions.filter(o => o.trim()),
          }

    try {
      await updateQuestion(questionId, data)
      navigate(`/admin/plans/${planId}/lessons/${lessonId}/questions`)
    } catch {
      setError('Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-[#1CB0F6] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !prompt) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="font-bold text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-6 flex-wrap">
        <Link to="/admin/plans" className="hover:text-[#9333EA] transition-colors">Planos</Link>
        <span>/</span>
        <Link to={`/admin/plans/${planId}`} className="hover:text-[#9333EA] transition-colors">Lições</Link>
        <span>/</span>
        <Link to={`/admin/plans/${planId}/lessons/${lessonId}/questions`} className="hover:text-[#9333EA] transition-colors truncate max-w-[10rem]">
          {lessonTitle || 'Questões'}
        </Link>
        <span>/</span>
        <span className="text-gray-700">Editar questão</span>
      </div>

      <h1 className="text-2xl font-black text-gray-800 mb-8">Editar questão</h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        {/* Tipo */}
        <div className="mb-5">
          <Label>Tipo</Label>
          <div className="flex gap-3 mt-1">
            {([
              { value: 'multiple_choice' as QuestionType, label: 'Múltipla escolha' },
              { value: 'fill_in_the_blank' as QuestionType, label: 'Completar a frase' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`py-2 px-4 rounded-xl font-bold text-sm border transition-all
                  ${type === opt.value
                    ? 'bg-[#1CB0F6] text-white border-[#1CB0F6]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#1CB0F6]/40'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Enunciado */}
        <div className="mb-5">
          <Label>Enunciado *</Label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={2}
            className={`${FIELD_CLASS} resize-none mt-1`}
          />
        </div>

        {type === 'multiple_choice' ? (
          <>
            <div className="mb-5">
              <Label>Opções de resposta</Label>
              <div className="grid gap-2 sm:grid-cols-2 mt-1">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400 w-5 shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      value={opt}
                      onChange={e => setOption(i, e.target.value)}
                      placeholder={`Opção ${String.fromCharCode(65 + i)}`}
                      className={FIELD_CLASS}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <Label>Resposta correta</Label>
              <select
                value={correctOption}
                onChange={e => setCorrectOption(Number(e.target.value))}
                className={`${FIELD_CLASS} mt-1`}
              >
                {filledOptions.length === 0 && (
                  <option disabled>Preencha as opções acima</option>
                )}
                {options.map((opt, i) =>
                  opt.trim() && (
                    <option key={i} value={i}>
                      {String.fromCharCode(65 + i)}: {opt}
                    </option>
                  )
                )}
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="mb-5">
              <Label>Frase com lacuna (use ___ para indicar o espaço)</Label>
              <input
                value={sentence}
                onChange={e => setSentence(e.target.value)}
                placeholder="Ex: No princípio Deus criou os céus e a ___."
                className={`${FIELD_CLASS} mt-1`}
              />
            </div>
            <div className="mb-5">
              <Label>Opções de palavras (3–4)</Label>
              <div className="grid gap-2 sm:grid-cols-2 mt-1">
                {wordOptions.map((opt, i) => (
                  <input
                    key={i}
                    value={opt}
                    onChange={e => setWordOption(i, e.target.value)}
                    placeholder={`Palavra ${i + 1}${i === 3 ? ' (opcional)' : ''}`}
                    className={FIELD_CLASS}
                  />
                ))}
              </div>
            </div>
            <div className="mb-5">
              <Label>Resposta correta</Label>
              <select
                value={correctAnswer}
                onChange={e => setCorrectAnswer(e.target.value)}
                className={`${FIELD_CLASS} mt-1`}
              >
                <option value="">Selecione...</option>
                {filledWords.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="mb-5">
              <Label>Dica (opcional)</Label>
              <input
                value={hint}
                onChange={e => setHint(e.target.value)}
                placeholder="Ex: Onde nós moramos"
                className={`${FIELD_CLASS} mt-1`}
              />
            </div>
          </>
        )}

        {error && <p className="text-sm font-bold text-[#FF4B4B] mb-4">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <Link
            to={`/admin/plans/${planId}/lessons/${lessonId}/questions`}
            className="py-2.5 px-5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="bg-[#1CB0F6] text-white font-extrabold py-2.5 px-6 rounded-xl hover:bg-[#0087CC] transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">
      {children}
    </label>
  )
}
