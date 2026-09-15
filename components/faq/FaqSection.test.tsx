import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqSection from './FaqSection'
import type { FaqItem } from '@/lib/faq'

const ITEMS: FaqItem[] = [
  {
    id: 1,
    categories: ['personal-color'],
    question: 'Personal Color Test trên TwistFit hoạt động như thế nào qua camera?',
    answerMarkdown: 'Quy trình 3 bước cốt lõi.',
    highlightIcon: null,
    highlightText: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 2,
    categories: ['fitting-room'],
    question: 'Tính năng Thử Đồ Ảo có giữ đúng tỷ lệ vóc dáng của tôi không?',
    answerMarkdown: 'Có, hoàn toàn chính xác.',
    highlightIcon: null,
    highlightText: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('FaqSection', () => {
  it('renders every question passed in', () => {
    renderWithIntl(<FaqSection items={ITEMS} />)
    expect(screen.getByText(/Personal Color Test trên TwistFit hoạt động/)).toBeInTheDocument()
    expect(screen.getByText(/Tính năng Thử Đồ Ảo/)).toBeInTheDocument()
  })

  it('expands only one answer at a time', () => {
    renderWithIntl(<FaqSection items={ITEMS} />)
    const q1 = screen.getByText(/Personal Color Test trên TwistFit hoạt động/)
    const q2 = screen.getByText(/Tính năng Thử Đồ Ảo/)
    fireEvent.click(q1)
    expect(screen.getByText('Quy trình 3 bước cốt lõi.')).toBeInTheDocument()
    fireEvent.click(q2)
    expect(screen.queryByText('Quy trình 3 bước cốt lõi.')).not.toBeInTheDocument()
  })

  it('filters questions by category', () => {
    renderWithIntl(<FaqSection items={ITEMS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Phòng thử đồ ảo (Fitting Room)' }))
    expect(screen.getByText(/Tính năng Thử Đồ Ảo/)).toBeInTheDocument()
    expect(screen.queryByText(/Personal Color Test trên TwistFit hoạt động/)).not.toBeInTheDocument()
  })

  it('filters questions by search text and shows a no-results message', () => {
    renderWithIntl(<FaqSection items={ITEMS} />)
    fireEvent.change(screen.getByPlaceholderText(/Tìm kiếm thắc mắc/), {
      target: { value: 'không tồn tại xyz' },
    })
    expect(screen.getByText('Không tìm thấy câu hỏi phù hợp')).toBeInTheDocument()
  })

  it('pre-selects the category passed via initialCategory', () => {
    renderWithIntl(<FaqSection items={ITEMS} initialCategory="fitting-room" />)
    expect(screen.getByRole('button', { name: 'Phòng thử đồ ảo (Fitting Room)' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByText(/Tính năng Thử Đồ Ảo/)).toBeInTheDocument()
    expect(screen.queryByText(/Personal Color Test trên TwistFit hoạt động/)).not.toBeInTheDocument()
  })
})
