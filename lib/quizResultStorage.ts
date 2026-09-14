import type { Season } from './db'

const STORAGE_KEY = 'twistfit.quizResult'

export type AnonymousQuizResult = {
  season: Season
  createdAt: string
}

export function saveAnonymousQuizResult(season: Season): void {
  const result: AnonymousQuizResult = { season, createdAt: new Date().toISOString() }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result))
}

export function getAnonymousQuizResult(): AnonymousQuizResult | null {
  const stored = window.sessionStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as AnonymousQuizResult
  } catch {
    return null
  }
}
