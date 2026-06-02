import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Question } from '../../types'

interface Props {
  question: Question
  onAnswerConfirm: (isCorrect: boolean) => void
}

export function MultipleChoiceGame({ question, onAnswerConfirm }: Props) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const isCorrect = selectedOption === question.correctOption

  function handleAnswerSelect(index: number) {
    if (isConfirmed) return
    setSelectedOption(index)
  }

  function handleAnswerConfirm() {
    if (selectedOption === null) return
    setIsConfirmed(true)
  }

  return (
    <>
      {/* Pergunta + opções (padding inferior para não ficar atrás do footer fixo) */}
      <div className="px-4 pt-8 pb-36">
        <p className="text-2xl font-black text-gray-800 mb-8 leading-snug">
          {question.prompt}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {question.options?.map((option, index) => (
            <OptionCard
              key={index}
              text={option}
              isSelected={selectedOption === index}
              isConfirmed={isConfirmed}
              isCorrectOption={index === question.correctOption}
              onClick={() => handleAnswerSelect(index)}
            />
          ))}
        </div>
      </div>

      {/* Footer fixo: botão de confirmar → banner de feedback */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-white border-t border-gray-100">
        <AnimatePresence mode="wait">
          {isConfirmed ? (
            <FeedbackBanner
              key="feedback"
              isCorrect={isCorrect}
              correctAnswerLabel={question.options?.[question.correctOption ?? 0]}
              onContinue={() => onAnswerConfirm(isCorrect)}
            />
          ) : (
            <motion.button
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleAnswerConfirm}
              disabled={selectedOption === null}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-colors
                ${selectedOption !== null
                  ? 'bg-[#58CC02] text-white shadow-lg shadow-[#58CC02]/25'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Confirmar
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// ─── Sub-componentes locais ───────────────────────────────────────────────────

interface OptionCardProps {
  text: string
  isSelected: boolean
  isConfirmed: boolean
  isCorrectOption: boolean
  onClick: () => void
}

function OptionCard({ text, isSelected, isConfirmed, isCorrectOption, onClick }: OptionCardProps) {
  // Cores calculadas por estado: padrão → selecionado → confirmado certo/errado
  const style = (() => {
    if (isConfirmed && isSelected && isCorrectOption)
      return 'border-[#58CC02] bg-[#58CC02]/10 text-[#3e9101]'
    if (isConfirmed && isSelected && !isCorrectOption)
      return 'border-[#FF4B4B] bg-[#FF4B4B]/10 text-[#cc2a2a]'
    if (isConfirmed)
      return 'border-gray-100 bg-white text-gray-400'
    if (isSelected)
      return 'border-[#1CB0F6] bg-[#1CB0F6]/10 text-[#0a9bd8]'
    return 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
  })()

  return (
    <motion.button
      whileTap={{ scale: isConfirmed ? 1 : 0.96 }}
      onClick={onClick}
      className={`border-2 ${style} rounded-2xl p-4 font-bold text-base shadow-sm min-h-[80px] flex items-center transition-colors`}
    >
      {text}
    </motion.button>
  )
}

interface FeedbackBannerProps {
  isCorrect: boolean
  correctAnswerLabel: string | undefined
  onContinue: () => void
}

function FeedbackBanner({ isCorrect, correctAnswerLabel, onContinue }: FeedbackBannerProps) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`rounded-2xl px-5 py-4 flex items-center justify-between gap-4
        ${isCorrect ? 'bg-[#58CC02]' : 'bg-[#FF4B4B]'}`}
    >
      <div>
        <p className="text-white font-black text-lg leading-tight">
          {isCorrect ? 'Correto! 🎉' : 'Errado!'}
        </p>
        {!isCorrect && correctAnswerLabel && (
          <p className="text-white/90 font-semibold text-sm mt-1">
            Resposta certa: <span className="font-black">{correctAnswerLabel}</span>
          </p>
        )}
      </div>
      <button
        onClick={onContinue}
        className="shrink-0 bg-white font-black text-sm px-6 py-3 rounded-xl transition-opacity hover:opacity-90"
        style={{ color: isCorrect ? '#3e9101' : '#cc2a2a' }}
      >
        Continuar
      </button>
    </motion.div>
  )
}
