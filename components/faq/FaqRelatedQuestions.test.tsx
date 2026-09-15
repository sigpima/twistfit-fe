import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FaqRelatedQuestions from './FaqRelatedQuestions'

describe('FaqRelatedQuestions', () => {
  it('renders nothing when there are no related items', () => {
    const { container } = render(
      <FaqRelatedQuestions heading="Câu hỏi liên quan" items={[]} onSelect={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a button per related item and calls onSelect with its id', () => {
    const onSelect = vi.fn()
    render(
      <FaqRelatedQuestions
        heading="Câu hỏi liên quan"
        items={[
          { id: 2, question: 'Câu hỏi liên quan A?' },
          { id: 3, question: 'Câu hỏi liên quan B?' },
        ]}
        onSelect={onSelect}
      />
    )
    expect(screen.getByText('Câu hỏi liên quan')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Câu hỏi liên quan A?' }))
    expect(onSelect).toHaveBeenCalledWith(2)
  })
})
