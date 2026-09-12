import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AboutCtaBanner from './AboutCtaBanner'

describe('AboutCtaBanner', () => {
  it('links the two CTAs to the quiz and the outfit flow', () => {
    renderWithIntl(<AboutCtaBanner />)
    expect(screen.getByRole('link', { name: /Làm bài test Personal Color/ })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
    expect(screen.getByRole('link', { name: /Khám phá phòng thử đồ ảo/ })).toHaveAttribute(
      'href',
      '/outfit/step-1'
    )
  })
})
