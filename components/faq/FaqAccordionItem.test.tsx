import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FaqAccordionItem from './FaqAccordionItem'

const ITEM = {
  id: 'q1',
  number: '01',
  question: 'Câu hỏi mẫu số 1?',
  categories: ['personal-color'],
  answer: <p>Câu trả lời mẫu.</p>,
}

describe('FaqAccordionItem', () => {
  it('hides the answer when collapsed', () => {
    render(<FaqAccordionItem item={ITEM} isOpen={false} onToggle={vi.fn()} />)
    expect(screen.getByText('Câu hỏi mẫu số 1?')).toBeInTheDocument()
    expect(screen.queryByText('Câu trả lời mẫu.')).not.toBeInTheDocument()
  })

  it('shows the answer when open', () => {
    render(<FaqAccordionItem item={ITEM} isOpen={true} onToggle={vi.fn()} />)
    expect(screen.getByText('Câu trả lời mẫu.')).toBeInTheDocument()
  })

  it('calls onToggle with the item id when clicked', () => {
    const onToggle = vi.fn()
    render(<FaqAccordionItem item={ITEM} isOpen={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith('q1')
  })
})
