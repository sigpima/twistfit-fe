import type { AxisValue, ParentSeason, SubSeason } from './db'

const STORAGE_KEY = 'twistfit.quizResult'

export type AnonymousQuizResult = {
  subSeason: SubSeason
  parentSeason: ParentSeason
  hueResult: AxisValue
  valueResult: AxisValue
  chromaResult: AxisValue
  createdAt?: string
}

export function saveAnonymousQuizResult(result: Omit<AnonymousQuizResult, 'createdAt'>): void {
  const stored: AnonymousQuizResult = { ...result, createdAt: new Date().toISOString() }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
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
