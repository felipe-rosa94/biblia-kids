import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../features/auth/useAuth'
import { getPublishedLessons, getUserProgress } from '../../lib/firestore'
import { calculateLevel, levelProgressPercent, xpForCurrentLevel, xpToNextLevel } from '../../utils/xp'
import type { Lesson, LessonCompletion } from '../../types'

const LEVEL_NAMES = [
  'Novato', 'Discípulo', 'Escriba', 'Profeta', 'Guardião',
  'Sábio', 'Ancião', 'Apóstolo', 'Arauto', 'Sumo Sacerdote',
]

const CARD_THEMES = [
  { bg: 'bg-[#EBF8FF]', icon: '🌍', accent: '#1CB0F6' },
  { bg: 'bg-[#F0FFF4]', icon: '⛵', accent: '#58CC02' },
  { bg: 'bg-[#FFFBEB]', icon: '🌊', accent: '#FF9600' },
  { bg: 'bg-[#FDF4FF]', icon: '⚔️', accent: '#CE82FF' },
]

type LessonStatus = 'completed' | 'available' | 'locked'

function getLessonStatus(lesson: Lesson, completed: Record<string, LessonCompletion>): LessonStatus {
  if (completed[lesson.id]) return 'completed'
  if (lesson.availableFrom.toDate() > new Date()) return 'locked'
  return 'available'
}

function buildStreakData(completed: Record<string, LessonCompletion>) {
  const WEEKDAY_INITIAL = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - i))
    const active = Object.values(completed).some(
      r => new Date(r.completedAt).toDateString() === day.toDateString()
    )
    return { active, label: WEEKDAY_INITIAL[day.getDay()] }
  })
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [completedMap, setCompletedMap] = useState<Record<string, LessonCompletion>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalXP = user?.xp ?? 0
  const level = calculateLevel(totalXP)
  const levelName = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)]
  const progressPercent = levelProgressPercent(totalXP)
  const xpCurrent = xpForCurrentLevel(totalXP)
  const xpNext = xpToNextLevel(totalXP)
  const firstName = user?.displayName.split(' ')[0] ?? 'Aluno'

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function load() {
      try {
        const [fetchedLessons, progress] = await Promise.all([
          getPublishedLessons(),
          getUserProgress(user!.uid),
        ])
        if (!cancelled) {
          setLessons(fetchedLessons)
          setCompletedMap(progress)
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err)
        if (!cancelled) setError('Não foi possível carregar as lições.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user?.uid])

  const streakData = buildStreakData(completedMap)
  const featuredLesson =
    lessons.find(l => getLessonStatus(l, completedMap) === 'available') ??
    lessons[lessons.length - 1]

  if (loading) return <PageSpinner />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <p className="text-4xl">⚠️</p>
        <p className="font-bold">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Saudação */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-[#1CB0F6] flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-md shadow-[#1CB0F6]/30">
          {user?.photoURL
            ? <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
            : firstName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-800">Olá, {firstName}! 👋</h1>
          <p className="text-sm text-gray-500 font-semibold">Continue sua jornada pela Bíblia!</p>
        </div>
      </motion.div>

      {/* Lição da semana — card de destaque */}
      {featuredLesson && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl bg-gradient-to-br from-[#1CB0F6] to-[#0087CC] p-6 text-white shadow-lg shadow-[#1CB0F6]/25"
        >
          <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-2">
            ✨ Lição da semana
          </p>
          <h2 className="text-2xl font-black leading-tight mb-1">{featuredLesson.title}</h2>
          <p className="text-sm font-semibold text-white/80 mb-3">📖 {featuredLesson.baseVerse}</p>
          <p className="text-sm italic text-white/70 mb-5 leading-relaxed">
            "{featuredLesson.verseText}"
          </p>
          <button
            onClick={() => navigate(`/lesson/${featuredLesson.id}`)}
            className="bg-white text-[#0087CC] font-extrabold py-3 px-8 rounded-xl hover:bg-white/90 transition-all active:scale-95 shadow-sm"
          >
            Jogar agora →
          </button>
        </motion.div>
      )}

      {/* Barra de XP */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⭐</span>
            <div>
              <p className="font-black text-gray-800">Nível {level} — {levelName}</p>
              <p className="text-xs text-gray-400 font-semibold">{totalXP} XP acumulados</p>
            </div>
          </div>
          <span className="text-sm font-bold text-gray-400 shrink-0">
            {xpCurrent}/{xpNext} XP
          </span>
        </div>
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FFD900] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Streak semanal */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🔥</span>
          <p className="font-extrabold text-gray-800">Sequência semanal</p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 justify-between">
          {streakData.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-black
                  ${day.active
                    ? 'bg-[#58CC02] text-white shadow-md shadow-[#58CC02]/30'
                    : 'bg-gray-100 text-gray-300'}`}
              >
                {day.active ? '✓' : ''}
              </motion.div>
              <span className="text-xs font-bold text-gray-400">{day.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Grade de lições */}
      {lessons.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold text-gray-700 mb-4">Todas as lições</h2>
          <div className="flex flex-col gap-3">
            {lessons.map((lesson, index) => {
              const status = getLessonStatus(lesson, completedMap)
              const theme = CARD_THEMES[index % CARD_THEMES.length]
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  status={status}
                  result={completedMap[lesson.id]}
                  theme={theme}
                  index={index}
                  onStart={() => status !== 'locked' && navigate(`/lesson/${lesson.id}`)}
                />
              )
            })}
          </div>
        </section>
      )}

      {lessons.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📖</p>
          <p className="font-bold text-lg text-gray-500">Nenhuma lição disponível ainda</p>
          <p className="text-sm">Aguarde o seu professor publicar novas lições.</p>
        </div>
      )}
    </div>
  )
}

interface LessonCardProps {
  lesson: Lesson
  status: LessonStatus
  result: LessonCompletion | undefined
  theme: { bg: string; icon: string; accent: string }
  index: number
  onStart: () => void
}

function LessonCard({ lesson, status, result, theme, index, onStart }: LessonCardProps) {
  const isLocked = status === 'locked'
  const isCompleted = status === 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={onStart}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all select-none
        ${isLocked
          ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
          : 'bg-white border-gray-100 cursor-pointer hover:shadow-md active:scale-[0.99]'}`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0
          ${isLocked ? 'bg-gray-200' : isCompleted ? 'bg-[#58CC02]/15' : theme.bg}`}
      >
        {isLocked ? '🔒' : isCompleted ? '✅' : theme.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wide">
          Semana {lesson.weekNumber}
        </p>
        <h3 className="font-extrabold text-gray-800 leading-tight truncate">{lesson.title}</h3>
        <p className="text-xs text-gray-500 font-semibold truncate">{lesson.baseVerse}</p>
      </div>

      <div className="shrink-0 text-right">
        {isCompleted && result && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-bold bg-[#58CC02]/10 text-[#3e9101] px-2 py-0.5 rounded-full">
              {result.score}% ⭐
            </span>
            <span className="text-xs text-gray-400 font-semibold">+{result.xpEarned} XP</span>
          </div>
        )}
        {status === 'available' && (
          <div
            className="py-2 px-4 rounded-xl font-extrabold text-sm text-white shadow-sm"
            style={{ background: theme.accent }}
          >
            Jogar
          </div>
        )}
        {isLocked && (
          <span className="text-xs text-gray-400 font-bold">
            {lesson.availableFrom.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        )}
      </div>
    </motion.div>
  )
}

function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-[#1CB0F6] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
