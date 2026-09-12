import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogQuizCallout from './BlogQuizCallout'

describe('BlogQuizCallout', () => {
  it('links to the personal color quiz', () => {
    renderWithIntl(<BlogQuizCallout />)
    expect(screen.getByRole('link', { name: /Test Personal Color Ngay/ })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
  })
})
