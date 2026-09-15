import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FaqAccordionItem from './FaqAccordionItem'
import type { FaqItem } from '@/lib/faq'

const ITEM: FaqItem = {
  id: 1,
  question: 'Câu hỏi mẫu số 1?',
  categories: ['personal-color'],
  answerMarkdown: 'Nội dung trả lời **chi tiết**.',
  highlightIcon: null,
  highlightText: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('FaqAccordionItem', () => {
  it('hides the answer when collapsed', () => {
    render(<FaqAccordionItem item={ITEM} number="01" isOpen={false} onToggle={vi.fn()} />)
    expect(screen.getByText('Câu hỏi mẫu số 1?')).toBeInTheDocument()
    expect(screen.queryByText('chi tiết', { exact: false })).not.toBeInTheDocument()
  })

  it('shows the markdown-rendered answer when open', () => {
    render(<FaqAccordionItem item={ITEM} number="01" isOpen={true} onToggle={vi.fn()} />)
    expect(screen.getByText('chi tiết', { exact: false })).toBeInTheDocument()
  })

  it('shows a highlight box with icon and text when present', () => {
    render(
      <FaqAccordionItem
        item={{ ...ITEM, highlightIcon: 'palette', highlightText: 'Ghi chú nổi bật.' }}
        number="01"
        isOpen={true}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByText('Ghi chú nổi bật.')).toBeInTheDocument()
    expect(screen.getByText('palette')).toBeInTheDocument()
  })

  it('calls onToggle with the item id when clicked', () => {
    const onToggle = vi.fn()
    render(<FaqAccordionItem item={ITEM} number="01" isOpen={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith(1)
  })

  it('renders related questions when open and passed some, and forwards the selected id', () => {
    const onSelectRelated = vi.fn()
    render(
      <FaqAccordionItem
        item={ITEM}
        number="01"
        isOpen={true}
        onToggle={vi.fn()}
        relatedItems={[{ id: 2, question: 'Câu hỏi liên quan?' }]}
        relatedHeading="Câu hỏi liên quan"
        onSelectRelated={onSelectRelated}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Câu hỏi liên quan?' }))
    expect(onSelectRelated).toHaveBeenCalledWith(2)
  })

  it('carries an id on its toggle button matching the item id', () => {
    render(<FaqAccordionItem item={ITEM} number="01" isOpen={false} onToggle={vi.fn()} />)
    expect(document.getElementById('faq-question-1')).toBe(screen.getByRole('button'))
  })
})
