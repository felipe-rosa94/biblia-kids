import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getStudyPlans,
  getLessonsForPlan,
  getQuestionsForLesson,
  createQuestion,
} from '../../lib/firestore'
import type { StudyPlan, Lesson, Question, QuestionType } from '../../types'

interface QuestionFormState {
  type: QuestionType
  prompt: string
  options: string[]
  correctOption: number
  sentence: string
  correctAnswer: string
  hint: string
  wordOptions: string[]
}

const EMPTY_FORM: QuestionFormState = {
  type: 'multiple_choice',
  prompt: '',
  options: ['', '', '', ''],
  correctOption: 0,
  sentence: '',
  correctAnswer: '',
  hint: '',
  wordOptions: ['', '', '', ''],
}

const FIELD_CLASS =
  'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]/40'

export function AdminQuestionsPage() {
  const { planId, lessonId } = useParams<{ planId: string; lessonId: string }>()

  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<QuestionFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!planId || !lessonId) return
    let cancelled = false

    async function load() {
      try {
        const [allPlans, allLessons, fetchedQuestions] = await Promise.all([
          getStudyPlans(),
          getLessonsForPlan(planId!),
          getQuestionsForLesson(lessonId!),
        ])
        if (!cancelled) {
          setPlan(allPlans.find(p => p.id === planId) ?? null)
          setLesson(allLessons.find(l => l.id === lessonId) ?? null)
          setQuestions(fetchedQuestions)
        }
      } catch (err) {
        console.error('Erro ao carregar questões:', err)
        if (!cancelled) setError('Não foi possível carregar as questões.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [planId, lessonId])

  async function handleSave() {
    if (!lessonId || !form.prompt.trim()) return
    setSaving(true)

    const base = { lessonId, order: questions.length + 1, prompt: form.prompt.trim() }
    const data: Omit<Question, 'id'> =
      form.type === 'multiple_choice'
        ? { ...base, type: 'multiple_choice', options: form.options, correctOption: form.correctOption }
        : {
            ...base,
            type: 'fill_in_the_blank',
            sentence: form.sentence,
            correctAnswer: form.correctAnswer,
            hint: form.hint,
            wordOptions: form.wordOptions.filter(o => o.trim()),
          }

    try {
      const newQ = await createQuestion(data)
      setQuestions(prev => [...prev, newQ])
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch {
      alert('Erro ao salvar questão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  function setOption(index: number, value: string) {
    const opts = [...form.options]
    opts[index] = value
    setForm(f => ({ ...f, options: opts }))
  }

  function setWordOption(index: number, value: string) {
    const opts = [...form.wordOptions]
    opts[index] = value
    setForm(f => ({ ...f, wordOptions: opts }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-[#1CB0F6] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="font-bold text-gray-500">{error ?? 'Lição não encontrada.'}</p>
      </div>
    )
  }

  const filledOptions = form.options.filter(o => o.trim())
  const filledWords = form.wordOptions.filter(o => o.trim())
  const canSave = form.prompt.trim().length > 0

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-6 flex-wrap">
        <Link to="/admin/plans" className="hover:text-[#9333EA] transition-colors">
          Planos
        </Link>
        <span>/</span>
        <Link to={`/admin/plans/${planId}`} className="hover:text-[#9333EA] transition-colors">
          {plan?.title ?? 'Plano'}
        </Link>
        <span>/</span>
        <span className="text-gray-700 truncate">{lesson.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Questões</h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">
            {lesson.title} · {questions.length} questão{questions.length !== 1 ? 'ões' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`font-extrabold py-2.5 px-5 rounded-xl transition-colors active:scale-95
            ${showForm
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-[#1CB0F6] text-white hover:bg-[#0087CC]'}`}
        >
          {showForm ? '✕ Cancelar' : '+ Nova questão'}
        </button>
      </div>

      {/* Formulário inline de nova questão */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="question-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-[#1CB0F6]/5 border border-[#1CB0F6]/25 rounded-2xl p-6">
              <h3 className="font-extrabold text-gray-800 text-lg mb-5">Nova questão</h3>

              {/* Tipo */}
              <div className="mb-4">
                <Label>Tipo</Label>
                <div className="flex gap-3 mt-1">
                  {(
                    [
                      { value: 'multiple_choice' as QuestionType, label: 'Múltipla escolha' },
                      { value: 'fill_in_the_blank' as QuestionType, label: 'Completar a frase' },
                    ] as const
                  ).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                      className={`py-2 px-4 rounded-xl font-bold text-sm border transition-all
                        ${form.type === opt.value
                          ? 'bg-[#1CB0F6] text-white border-[#1CB0F6]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#1CB0F6]/40'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enunciado */}
              <div className="mb-4">
                <Label>Enunciado *</Label>
                <textarea
                  value={form.prompt}
                  onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
                  placeholder="Digite a pergunta..."
                  rows={2}
                  className={`${FIELD_CLASS} resize-none mt-1`}
                />
              </div>

              {form.type === 'multiple_choice' ? (
                <>
                  <div className="mb-4">
                    <Label>Opções de resposta</Label>
                    <div className="grid gap-2 sm:grid-cols-2 mt-1">
                      {form.options.map((opt, i) => (
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
                  <div className="mb-4">
                    <Label>Resposta correta</Label>
                    <select
                      value={form.correctOption}
                      onChange={e => setForm(f => ({ ...f, correctOption: Number(e.target.value) }))}
                      className={`${FIELD_CLASS} mt-1`}
                    >
                      {filledOptions.length === 0 && (
                        <option disabled>Preencha as opções acima</option>
                      )}
                      {form.options.map(
                        (opt, i) =>
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
                  <div className="mb-4">
                    <Label>Frase com lacuna (use ___ para indicar o espaço)</Label>
                    <input
                      value={form.sentence}
                      onChange={e => setForm(f => ({ ...f, sentence: e.target.value }))}
                      placeholder="Ex: No princípio Deus criou os céus e a ___."
                      className={`${FIELD_CLASS} mt-1`}
                    />
                  </div>
                  <div className="mb-4">
                    <Label>Opções de palavras (3–4)</Label>
                    <div className="grid gap-2 sm:grid-cols-2 mt-1">
                      {form.wordOptions.map((opt, i) => (
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
                  <div className="mb-4">
                    <Label>Resposta correta</Label>
                    <select
                      value={form.correctAnswer}
                      onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))}
                      className={`${FIELD_CLASS} mt-1`}
                    >
                      <option value="">Selecione...</option>
                      {filledWords.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <Label>Dica (opcional)</Label>
                    <input
                      value={form.hint}
                      onChange={e => setForm(f => ({ ...f, hint: e.target.value }))}
                      placeholder="Ex: Onde nós moramos"
                      className={`${FIELD_CLASS} mt-1`}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                  className="py-2.5 px-5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  className="bg-[#1CB0F6] text-white font-extrabold py-2.5 px-6 rounded-xl hover:bg-[#0087CC] transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando…' : 'Salvar questão'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de questões */}
      {questions.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">❓</p>
          <p className="font-bold text-lg text-gray-500">Nenhuma questão ainda</p>
          <p className="text-sm">Clique em "Nova questão" para começar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1CB0F6]/10 text-[#1CB0F6] font-black text-sm flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full
                        ${q.type === 'multiple_choice'
                          ? 'bg-[#CE82FF]/10 text-[#9333EA]'
                          : 'bg-[#FF9600]/10 text-[#FF9600]'}`}
                    >
                      {q.type === 'multiple_choice' ? 'Múltipla escolha' : 'Completar frase'}
                    </span>
                  </div>
                  <p className="font-extrabold text-gray-800 mb-2">{q.prompt}</p>

                  {q.type === 'multiple_choice' && q.options && (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt, oi) => (
                        <span
                          key={oi}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border
                            ${oi === q.correctOption
                              ? 'bg-[#58CC02]/10 text-[#3e9101] border-[#58CC02]/30'
                              : 'bg-gray-50 text-gray-500 border-gray-100'}`}
                        >
                          {String.fromCharCode(65 + oi)}: {opt}
                        </span>
                      ))}
                    </div>
                  )}

                  {q.type === 'fill_in_the_blank' && (
                    <div>
                      {q.sentence && (
                        <p className="text-sm text-gray-600 italic mb-1">"{q.sentence}"</p>
                      )}
                      <p className="text-xs text-[#3e9101] font-bold">
                        ✓ Resposta: {q.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
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
