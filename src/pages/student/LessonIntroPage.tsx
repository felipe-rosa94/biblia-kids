import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getLessonWithQuestions } from '../../lib/firestore'
import type { Lesson } from '../../types'

export function LessonIntroPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lessonId) return
    getLessonWithQuestions(lessonId)
      .then(result => setLesson(result?.lesson ?? null))
      .catch(() => setLesson(null))
      .finally(() => setLoading(false))
  }, [lessonId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-[#1CB0F6] border-t-transparent rounded-full animate-spin" />
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1CB0F6]/20 to-white flex flex-col items-center justify-center px-6 font-nunito">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center gap-6 text-center"
      >
        <span className="text-7xl">📖</span>

        <div>
          <p className="text-sm font-black text-[#1CB0F6] uppercase tracking-wider">Semana {lesson.weekNumber}</p>
          <h1 className="text-3xl font-black text-gray-800 mt-1">{lesson.title}</h1>
          <p className="text-base text-gray-500 font-semibold mt-2">{lesson.theme}</p>
        </div>

        <div className="bg-[#1CB0F6]/10 rounded-2xl px-6 py-5 w-full">
          <p className="text-xs font-black text-[#1CB0F6] uppercase tracking-wider mb-2">{lesson.baseVerse}</p>
          <p className="text-lg font-bold text-gray-700 leading-relaxed italic">"{lesson.verseText}"</p>
        </div>

        <p className="text-gray-600 font-semibold text-base leading-relaxed">{lesson.description}</p>

        <div className="flex items-center gap-2 text-sm font-bold text-[#FFD900]">
          <span className="text-xl">⭐</span> {lesson.xpReward} XP ao completar
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/lesson/${lesson.id}`)}
          className="w-full bg-[#58CC02] hover:bg-[#46A302] text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-[#58CC02]/30 transition-colors"
        >
          Começar a lição!
        </motion.button>

        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 font-bold text-sm hover:text-gray-600"
        >
          ← Voltar
        </button>
      </motion.div>
    </div>
  )
}
