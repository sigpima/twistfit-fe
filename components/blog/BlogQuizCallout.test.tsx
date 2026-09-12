import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BlogQuizCallout from './BlogQuizCallout'

describe('BlogQuizCallout', () => {
  it('links to the personal color quiz', () => {
    render(<BlogQuizCallout />)
    expect(screen.getByRole('link', { name: /Test Personal Color Ngay/ })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
  })
})
