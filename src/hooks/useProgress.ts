import { useState, useCallback } from 'react'

export interface ModuleProgress {
  moduleId: string
  visited: boolean
  quizScore: number | null   // null = no completado
  quizTotal: number
  lastVisited: string        // ISO date
}

const STORAGE_KEY = 'physicslab_progress'

function loadProgress(): Record<string, ModuleProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveProgress(progress: Record<string, ModuleProgress>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // localStorage no disponible (ej. modo privado estricto)
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>(loadProgress)

  const markVisited = useCallback((moduleId: string) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        [moduleId]: {
          moduleId,
          visited: true,
          quizScore: prev[moduleId]?.quizScore ?? null,
          quizTotal: prev[moduleId]?.quizTotal ?? 0,
          lastVisited: new Date().toISOString(),
        },
      }
      saveProgress(next)
      return next
    })
  }, [])

  const saveQuizScore = useCallback((moduleId: string, score: number, total: number) => {
    setProgress((prev) => {
      const existing = prev[moduleId]
      // Solo actualizar si el nuevo score es mayor
      if (existing?.quizScore !== null && existing.quizScore >= score) return prev
      const next = {
        ...prev,
        [moduleId]: {
          moduleId,
          visited: true,
          quizScore: score,
          quizTotal: total,
          lastVisited: existing?.lastVisited ?? new Date().toISOString(),
        },
      }
      saveProgress(next)
      return next
    })
  }, [])

  const getProgress = useCallback(
    (moduleId: string): ModuleProgress | null => progress[moduleId] ?? null,
    [progress],
  )

  const resetAll = useCallback(() => {
    setProgress({})
    saveProgress({})
  }, [])

  return { progress, markVisited, saveQuizScore, getProgress, resetAll }
}
