import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqSearchBar from './FaqSearchBar'

describe('FaqSearchBar', () => {
  it('calls onChange when typing in the search input', () => {
    const onChange = vi.fn()
    renderWithIntl(<FaqSearchBar value="" onChange={onChange} onTagClick={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/Tìm kiếm thắc mắc/), { target: { value: 'ánh sáng' } })
    expect(onChange).toHaveBeenCalledWith('ánh sáng')
  })

  it('calls onTagClick with the tag value when a suggested tag is clicked', () => {
    const onTagClick = vi.fn()
    renderWithIntl(<FaqSearchBar value="" onChange={vi.fn()} onTagClick={onTagClick} />)
    fireEvent.click(screen.getByText('#PhốiĐồAI'))
    expect(onTagClick).toHaveBeenCalledWith('phối đồ')
  })
})
