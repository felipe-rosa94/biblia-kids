import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Question } from '../../types'

interface Props {
  question: Question
  onAnswerConfirm: (isCorrect: boolean) => void
}

export function FillBlankGame({ question, onAnswerConfirm }: Props) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Comparação case-insensitive para tolerar capitalização diferente
  const isCorrect =
    selectedWord?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()

  const [beforeBlank, afterBlank] = question.sentence?.split('___') ?? ['', '']

  function handleWordSelect(word: string) {
    if (isConfirmed) return
    setSelectedWord(word)
  }

  function handleAnswerConfirm() {
    if (!selectedWord) return
    setIsConfirmed(true)
  }

  return (
    <>
      <div className="px-4 pt-8 pb-36">
        {/* Instrução acima da frase */}
        <p className="text-xl font-black text-gray-500 mb-4">{question.prompt}</p>

        {/* Card com a frase e a lacuna */}
        <div className="bg-white rounded-2xl p-5 mb-8 border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-gray-800 leading-relaxed">
            {beforeBlank}
            <BlankSlot word={selectedWord} isConfirmed={isConfirmed} isCorrect={isCorrect} />
            {afterBlank}
          </p>

          {/* Dica visível apenas antes de confirmar */}
          {question.hint && !isConfirmed && (
            <p className="text-sm text-gray-400 font-semibold mt-3 italic">
              💡 Dica: {question.hint}
            </p>
          )}
        </div>

        {/* Pills de palavras */}
        <div className="flex flex-wrap gap-3 justify-center">
          {question.wordOptions?.map((word) => (
            <WordPill
              key={word}
              word={word}
              isSelected={selectedWord === word}
              isConfirmed={isConfirmed}
              isCorrectWord={word.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()}
              onClick={() => handleWordSelect(word)}
            />
          ))}
        </div>
      </div>

      {/* Footer fixo: confirmar → feedback */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-white border-t border-gray-100">
        <AnimatePresence mode="wait">
          {isConfirmed ? (
            <FeedbackBanner
              key="feedback"
              isCorrect={isCorrect}
              correctAnswer={question.correctAnswer}
              onContinue={() => onAnswerConfirm(isCorrect)}
            />
          ) : (
            <motion.button
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleAnswerConfirm}
              disabled={!selectedWord}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-colors
                ${selectedWord
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

interface BlankSlotProps {
  word: string | null
  isConfirmed: boolean
  isCorrect: boolean
}

function BlankSlot({ word, isConfirmed, isCorrect }: BlankSlotProps) {
  if (!word) {
    // Estado vazio: traço sublinhado convidando o clique
    return (
      <span className="inline-block border-b-4 border-[#1CB0F6] min-w-[80px] mx-1 align-bottom" />
    )
  }

  if (!isConfirmed) {
    // Palavra selecionada, aguardando confirmação
    return (
      <span className="inline-block bg-[#1CB0F6]/15 border-b-4 border-[#1CB0F6] mx-1 px-2 text-[#0a9bd8] font-black rounded-t-md">
        {word}
      </span>
    )
  }

  // Resultado confirmado: verde (acerto) ou tachado vermelho (erro)
  return (
    <span
      className={`inline-block mx-1 px-2 rounded-md font-black
        ${isCorrect
          ? 'bg-[#58CC02]/20 text-[#3e9101]'
          : 'bg-[#FF4B4B]/20 text-[#cc2a2a] line-through'}`}
    >
      {word}
    </span>
  )
}

interface WordPillProps {
  word: string
  isSelected: boolean
  isConfirmed: boolean
  isCorrectWord: boolean
  onClick: () => void
}

function WordPill({ word, isSelected, isConfirmed, isCorrectWord, onClick }: WordPillProps) {
  const style = (() => {
    if (isConfirmed && isSelected && isCorrectWord)
      return 'bg-[#58CC02]/10 border-[#58CC02] text-[#3e9101]'
    if (isConfirmed && isSelected && !isCorrectWord)
      return 'bg-[#FF4B4B]/10 border-[#FF4B4B] text-[#cc2a2a]'
    if (isConfirmed)
      return 'bg-gray-50 border-gray-100 text-gray-400'
    if (isSelected)
      return 'bg-[#1CB0F6]/10 border-[#1CB0F6] text-[#0a9bd8]'
    return 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
  })()

  return (
    <motion.button
      whileTap={{ scale: isConfirmed ? 1 : 0.95 }}
      onClick={onClick}
      className={`border-2 ${style} px-5 py-3 rounded-2xl font-bold text-base transition-colors`}
    >
      {word}
    </motion.button>
  )
}

interface FeedbackBannerProps {
  isCorrect: boolean
  correctAnswer: string | undefined
  onContinue: () => void
}

function FeedbackBanner({ isCorrect, correctAnswer, onContinue }: FeedbackBannerProps) {
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
        {!isCorrect && correctAnswer && (
          <p className="text-white/90 font-semibold text-sm mt-1">
            Resposta certa: <span className="font-black">{correctAnswer}</span>
          </p>
        )}
      </div>
      <button
        onClick={onContinue}
        className="shrink-0 bg-white font-black text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
        style={{ color: isCorrect ? '#3e9101' : '#cc2a2a' }}
      >
        Continuar
      </button>
    </motion.div>
  )
}
