import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getLessonWithQuestions, saveLessonProgress } from '../../lib/firestore'
import { useAuth } from '../../features/auth/useAuth'
import { MultipleChoiceGame } from '../../components/games/MultipleChoiceGame'
import { FillBlankGame } from '../../components/games/FillBlankGame'
import type { Lesson, Question } from '../../types'

type LessonPhase = 'intro' | 'playing' | 'result'

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<LessonPhase>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [earnedXP, setEarnedXP] = useState(0)
  const [finalScore, setFinalScore] = useState(0)

  // Ref para acumular respostas sem re-renders; lido apenas ao finalizar
  const answersRef = useRef<{ questionId: string; correct: boolean }[]>([])

  useEffect(() => {
    if (!lessonId) return
    let cancelled = false

    getLessonWithQuestions(lessonId)
      .then(result => {
        if (!cancelled) {
          setLesson(result?.lesson ?? null)
          setQuestions(result?.questions ?? [])
        }
      })
      .catch(err => {
        console.error('Erro ao carregar lição:', err)
        if (!cancelled) setLesson(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [lessonId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen font-nunito">
        <p className="text-gray-500">Lição não encontrada.</p>
      </div>
    )
  }

  function handleLessonStart() {
    answersRef.current = []
    setPhase('playing')
  }

  function handleAnswerConfirm(isCorrect: boolean) {
    answersRef.current.push({ questionId: questions[currentQuestionIndex].id, correct: isCorrect })
    const newCorrectCount = correctCount + (isCorrect ? 1 : 0)
    const isLastQuestion = currentQuestionIndex === questions.length - 1

    if (isLastQuestion) {
      handleLessonComplete(newCorrectCount)
    } else {
      setCorrectCount(newCorrectCount)
      setCurrentQuestionIndex(i => i + 1)
    }
  }

  function handleLessonComplete(finalCorrectCount: number) {
    const score = Math.round((finalCorrectCount / questions.length) * 100)
    const baseXP = finalCorrectCount * 10
    const bonusXP = score === 100 ? 20 : 0
    const totalXP = baseXP + bonusXP

    setCorrectCount(finalCorrectCount)
    setFinalScore(score)
    setEarnedXP(totalXP)
    setPhase('result')

    // Salva no Firestore em background sem bloquear a tela de resultado
    if (user) {
      saveLessonProgress(user.uid, lessonId!, score, totalXP, answersRef.current)
        .then(() => refreshUser())
        .catch(err => console.error('Erro ao salvar progresso:', err))
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] font-nunito">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <IntroScreen lesson={lesson} onStart={handleLessonStart} />
          </motion.div>
        )}

        {phase === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            <div className="sticky top-0 z-10 bg-[#f7f7f7] px-4 pt-4 pb-2">
              <LessonProgressBar
                current={currentQuestionIndex}
                total={questions.length}
                onExit={() => navigate('/dashboard')}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.2 }}
              >
                <QuestionRenderer
                  question={questions[currentQuestionIndex]}
                  onAnswerConfirm={handleAnswerConfirm}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ResultScreen
              lesson={lesson}
              score={finalScore}
              earnedXP={earnedXP}
              correctCount={correctCount}
              totalQuestions={questions.length}
              onBackToDashboard={() => navigate('/dashboard')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Tela de introdução ───────────────────────────────────────────────────────

function IntroScreen({ lesson, onStart }: { lesson: Lesson; onStart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1CB0F6]/20 to-[#f7f7f7] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center gap-6 text-center"
      >
        <motion.span
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="text-7xl"
        >
          📖
        </motion.span>

        <div>
          <p className="text-sm font-black text-[#1CB0F6] uppercase tracking-wider">
            Semana {lesson.weekNumber}
          </p>
          <h1 className="text-3xl font-black text-gray-800 mt-1">{lesson.title}</h1>
          <p className="text-base text-gray-500 font-semibold mt-2">{lesson.theme}</p>
        </div>

        <div className="bg-white rounded-2xl px-6 py-5 w-full shadow-sm border border-gray-100">
          <p className="text-xs font-black text-[#1CB0F6] uppercase tracking-wider mb-2">
            {lesson.baseVerse}
          </p>
          <p className="text-lg font-bold text-gray-700 leading-relaxed italic">
            "{lesson.verseText}"
          </p>
        </div>

        <p className="text-gray-600 font-semibold text-base leading-relaxed">
          {lesson.description}
        </p>

        <div className="flex items-center gap-2 text-sm font-bold text-[#FF9600]">
          <span className="text-xl">⭐</span> Até {lesson.xpReward} XP ao completar
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-[#58CC02]/25 transition-colors"
        >
          Começar!
        </motion.button>

        <button
          onClick={() => window.history.back()}
          className="text-gray-400 font-bold text-sm hover:text-gray-600"
        >
          ← Voltar
        </button>
      </motion.div>
    </div>
  )
}

// ─── Barra de progresso da lição ──────────────────────────────────────────────

function LessonProgressBar({
  current,
  total,
  onExit,
}: {
  current: number
  total: number
  onExit: () => void
}) {
  const percent = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onExit}
        className="text-gray-400 hover:text-gray-600 p-1 shrink-0 transition-colors"
        aria-label="Sair da lição"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#58CC02] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <span className="text-xs font-black text-gray-400 shrink-0 tabular-nums">
        {current + 1}/{total}
      </span>
    </div>
  )
}

// ─── Roteador de tipo de questão ──────────────────────────────────────────────

function QuestionRenderer({
  question,
  onAnswerConfirm,
}: {
  question: Question
  onAnswerConfirm: (isCorrect: boolean) => void
}) {
  if (question.type === 'multiple_choice') {
    return <MultipleChoiceGame question={question} onAnswerConfirm={onAnswerConfirm} />
  }
  return <FillBlankGame question={question} onAnswerConfirm={onAnswerConfirm} />
}

// ─── Tela de resultado ────────────────────────────────────────────────────────

function ResultScreen({
  lesson,
  score,
  earnedXP,
  correctCount,
  totalQuestions,
  onBackToDashboard,
}: {
  lesson: Lesson
  score: number
  earnedXP: number
  correctCount: number
  totalQuestions: number
  onBackToDashboard: () => void
}) {
  const trophy = score === 100 ? '🏆' : score >= 60 ? '⭐' : '📖'
  const starsCount = score === 100 ? 3 : score >= 60 ? 2 : 1
  const animatedXP = useCountUp(earnedXP, 1400)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          className="text-8xl"
        >
          {trophy}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-black text-gray-800">Parabéns!</h1>
          <p className="text-gray-500 font-bold mt-1">
            Você completou a lição <span className="text-gray-700">"{lesson.title}"</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex gap-2"
        >
          {[1, 2, 3].map(i => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: i <= starsCount ? 1 : 0.5 }}
              transition={{ delay: 0.4 + i * 0.1, type: 'spring', stiffness: 300 }}
              className={`text-4xl ${i <= starsCount ? '' : 'opacity-30'}`}
            >
              ⭐
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-[#FFD900]/15 border-2 border-[#FFD900] rounded-2xl px-8 py-4"
        >
          <p className="text-4xl font-black text-[#FF9600]">+{animatedXP} XP</p>
          <p className="text-sm text-gray-500 font-semibold mt-1">
            {correctCount}/{totalQuestions} acertos · {score}%
            {score === 100 && <span className="text-[#58CC02] font-black"> · Bônus perfeito!</span>}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-white rounded-2xl px-6 py-5 shadow-sm border border-gray-100 w-full"
        >
          <p className="text-xs font-black text-[#1CB0F6] uppercase tracking-wider mb-2">
            {lesson.baseVerse}
          </p>
          <p className="text-base font-bold text-gray-700 leading-relaxed italic">
            "{lesson.verseText}"
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBackToDashboard}
          className="w-full bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-[#58CC02]/25 transition-colors"
        >
          Voltar ao início
        </motion.button>
      </div>
    </div>
  )
}

// ─── Hook: contador animado de XP ─────────────────────────────────────────────

function useCountUp(target: number, durationMs: number): number {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (target === 0) return
    const startTime = Date.now()

    const tick = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress
      setDisplayed(Math.round(eased * target))
      if (progress >= 1) clearInterval(tick)
    }, 16)

    return () => clearInterval(tick)
  }, [target, durationMs])

  return displayed
}
