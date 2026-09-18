import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RecommendationDisclosure from './RecommendationDisclosure'

describe('RecommendationDisclosure', () => {
  it('hides its content until clicked, then toggles it', () => {
    render(
      <RecommendationDisclosure title="Trang sức">
        <p>Nội dung ẩn</p>
      </RecommendationDisclosure>
    )
    expect(screen.queryByText('Nội dung ẩn')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Trang sức' }))
    expect(screen.getByText('Nội dung ẩn')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang sức' })).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Trang sức' }))
    expect(screen.queryByText('Nội dung ẩn')).not.toBeInTheDocument()
  })
})
