import { afterEach, describe, expect, it } from 'vitest'
import { getAnonymousQuizResult, saveAnonymousQuizResult } from './quizResultStorage'

describe('quizResultStorage', () => {
  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('returns null when nothing has been saved yet', () => {
    expect(getAnonymousQuizResult()).toBeNull()
  })

  it('saves and reads back the full result', () => {
    saveAnonymousQuizResult({
      subSeason: 'true-winter',
      parentSeason: 'winter',
      hueResult: 'cool',
      valueResult: 'medium',
      chromaResult: 'neutral',
    })
    const result = getAnonymousQuizResult()
    expect(result?.subSeason).toBe('true-winter')
    expect(result?.parentSeason).toBe('winter')
  })

  it('includes a createdAt timestamp', () => {
    saveAnonymousQuizResult({
      subSeason: 'true-spring',
      parentSeason: 'spring',
      hueResult: 'warm',
      valueResult: 'medium',
      chromaResult: 'neutral',
    })
    const result = getAnonymousQuizResult()
    expect(typeof result?.createdAt).toBe('string')
    expect(Number.isNaN(Date.parse(result!.createdAt!))).toBe(false)
  })

  it('overwrites a previously saved result', () => {
    saveAnonymousQuizResult({
      subSeason: 'true-spring',
      parentSeason: 'spring',
      hueResult: 'warm',
      valueResult: 'medium',
      chromaResult: 'neutral',
    })
    saveAnonymousQuizResult({
      subSeason: 'true-winter',
      parentSeason: 'winter',
      hueResult: 'cool',
      valueResult: 'medium',
      chromaResult: 'neutral',
    })
    expect(getAnonymousQuizResult()?.subSeason).toBe('true-winter')
  })

  it('returns null when the stored value is corrupted JSON', () => {
    window.sessionStorage.setItem('twistfit.quizResult', 'not-json')
    expect(getAnonymousQuizResult()).toBeNull()
  })
})
