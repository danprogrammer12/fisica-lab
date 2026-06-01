import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Trophy, RotateCcw, ChevronRight } from 'lucide-react'
import type { ModuleQuiz } from '../../data/quizzes'

interface QuizEngineProps {
  quiz: ModuleQuiz
  onComplete?: (score: number, total: number) => void
  accentColor?: string
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect'

export function QuizEngine({ quiz, onComplete, accentColor = '#3b82f6' }: QuizEngineProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('unanswered')
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const question = quiz.questions[currentIdx]
  const isLast = currentIdx === quiz.questions.length - 1

  const handleSelect = useCallback(
    (optionIdx: number) => {
      if (answerState !== 'unanswered') return
      setSelected(optionIdx)
      const isCorrect = optionIdx === question.correct
      setAnswerState(isCorrect ? 'correct' : 'incorrect')
      if (isCorrect) setScore((s) => s + 1)
      setShowExplanation(true)
    },
    [answerState, question.correct],
  )

  const handleNext = useCallback(() => {
    if (isLast) {
      const finalScore = answerState === 'correct' ? score : score
      setFinished(true)
      onComplete?.(finalScore, quiz.questions.length)
    } else {
      setCurrentIdx((i) => i + 1)
      setSelected(null)
      setAnswerState('unanswered')
      setShowExplanation(false)
    }
  }, [isLast, answerState, score, onComplete, quiz.questions.length])

  const handleReset = useCallback(() => {
    setCurrentIdx(0)
    setSelected(null)
    setAnswerState('unanswered')
    setScore(0)
    setFinished(false)
    setShowExplanation(false)
  }, [])

  if (finished) {
    const pct = Math.round((score / quiz.questions.length) * 100)
    const passed = pct >= 75
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 py-8 px-6 text-center"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: passed ? '#10b98120' : '#ef444420' }}
        >
          <Trophy size={36} style={{ color: passed ? '#10b981' : '#ef4444' }} />
        </div>

        <div>
          <p className="text-3xl font-black mb-1" style={{ color: passed ? '#10b981' : '#ef4444' }}>
            {score}/{quiz.questions.length}
          </p>
          <p className="text-lg font-semibold text-slate-200">{pct}% de respuestas correctas</p>
          <p className="text-sm text-slate-400 mt-1">
            {passed ? '¡Excelente dominio del tema!' : 'Revisa el material y vuelve a intentarlo.'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-700 text-slate-300 hover:border-slate-500 transition-colors"
          >
            <RotateCcw size={14} />
            Reintentar
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      {/* Progreso */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((currentIdx) / quiz.questions.length) * 100}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
        <span className="text-xs text-slate-500 font-mono shrink-0">
          {currentIdx + 1}/{quiz.questions.length}
        </span>
      </div>

      {/* Pregunta */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-200 leading-relaxed">
            {question.question}
          </h3>

          {/* Opciones */}
          <div className="space-y-2">
            {question.options.map((option, i) => {
              let borderColor = '#1e293b'
              let bgColor = 'transparent'
              let textColor = '#94a3b8'
              let icon = null

              if (selected === i) {
                if (answerState === 'correct') {
                  borderColor = '#10b981'
                  bgColor = '#10b98115'
                  textColor = '#10b981'
                  icon = <CheckCircle size={16} className="shrink-0" style={{ color: '#10b981' }} />
                } else {
                  borderColor = '#ef4444'
                  bgColor = '#ef444415'
                  textColor = '#ef4444'
                  icon = <XCircle size={16} className="shrink-0" style={{ color: '#ef4444' }} />
                }
              } else if (answerState !== 'unanswered' && i === question.correct) {
                borderColor = '#10b981'
                bgColor = '#10b98110'
                textColor = '#34d399'
                icon = <CheckCircle size={16} className="shrink-0" style={{ color: '#10b981' }} />
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={answerState !== 'unanswered'}
                  className="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-3"
                  style={{
                    borderColor,
                    backgroundColor: bgColor,
                    color: textColor,
                    cursor: answerState !== 'unanswered' ? 'default' : 'pointer',
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ borderColor, color: textColor }}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {icon}
                </button>
              )
            })}
          </div>

          {/* Explicación */}
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl text-xs text-slate-300 leading-relaxed"
              style={{
                backgroundColor: answerState === 'correct' ? '#10b98110' : '#ef444410',
                border: `1px solid ${answerState === 'correct' ? '#10b98130' : '#ef444430'}`,
              }}
            >
              <span className="font-semibold" style={{ color: answerState === 'correct' ? '#10b981' : '#ef4444' }}>
                {answerState === 'correct' ? '✓ Correcto — ' : '✗ Incorrecto — '}
              </span>
              {question.explanation}
            </motion.div>
          )}

          {/* Botón siguiente */}
          {answerState !== 'unanswered' && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNext}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}30` }}
            >
              {isLast ? 'Ver resultado' : 'Siguiente pregunta'}
              <ChevronRight size={16} />
            </motion.button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
