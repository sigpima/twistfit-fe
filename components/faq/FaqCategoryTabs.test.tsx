import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqCategoryTabs, { FAQ_CATEGORIES } from './FaqCategoryTabs'

describe('FaqCategoryTabs', () => {
  it('marks the active category', () => {
    renderWithIntl(<FaqCategoryTabs active="all" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Tất cả' })).toHaveClass('bg-primary')
  })

  it('calls onChange with the clicked category id', () => {
    const onChange = vi.fn()
    renderWithIntl(<FaqCategoryTabs active="all" onChange={onChange} />)
    fireEvent.click(screen.getByText('Trắc nghiệm Personal Color'))
    expect(onChange).toHaveBeenCalledWith(FAQ_CATEGORIES[1].id)
  })
})
