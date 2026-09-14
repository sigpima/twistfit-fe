import { afterEach, describe, expect, it } from 'vitest'
import { getAnonymousQuizResult, saveAnonymousQuizResult } from './quizResultStorage'

describe('quizResultStorage', () => {
  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('returns null when nothing has been saved yet', () => {
    expect(getAnonymousQuizResult()).toBeNull()
  })

  it('saves and reads back the season', () => {
    saveAnonymousQuizResult('autumn')
    const result = getAnonymousQuizResult()
    expect(result?.season).toBe('autumn')
  })

  it('includes a createdAt timestamp', () => {
    saveAnonymousQuizResult('spring')
    const result = getAnonymousQuizResult()
    expect(typeof result?.createdAt).toBe('string')
    expect(Number.isNaN(Date.parse(result!.createdAt))).toBe(false)
  })

  it('overwrites a previously saved result', () => {
    saveAnonymousQuizResult('spring')
    saveAnonymousQuizResult('winter')
    expect(getAnonymousQuizResult()?.season).toBe('winter')
  })

  it('returns null when the stored value is corrupted JSON', () => {
    window.sessionStorage.setItem('twistfit.quizResult', 'not-json')
    expect(getAnonymousQuizResult()).toBeNull()
  })
})
