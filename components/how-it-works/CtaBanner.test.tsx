import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CtaBanner from './CtaBanner'

describe('CtaBanner', () => {
  it('links the two CTAs to the quiz and the outfit flow', () => {
    render(<CtaBanner />)
    expect(screen.getByRole('link', { name: /Bắt đầu Test Personal Color/ })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
    expect(screen.getByRole('link', { name: /Khám phá phòng thử đồ/ })).toHaveAttribute(
      'href',
      '/outfit/step-1'
    )
  })
})
