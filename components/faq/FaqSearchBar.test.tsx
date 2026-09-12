import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FaqSearchBar from './FaqSearchBar'

describe('FaqSearchBar', () => {
  it('calls onChange when typing in the search input', () => {
    const onChange = vi.fn()
    render(<FaqSearchBar value="" onChange={onChange} onTagClick={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/Tìm kiếm thắc mắc/), { target: { value: 'ánh sáng' } })
    expect(onChange).toHaveBeenCalledWith('ánh sáng')
  })

  it('calls onTagClick with the tag value when a suggested tag is clicked', () => {
    const onTagClick = vi.fn()
    render(<FaqSearchBar value="" onChange={vi.fn()} onTagClick={onTagClick} />)
    fireEvent.click(screen.getByText('#ThửĐồẢo'))
    expect(onTagClick).toHaveBeenCalledWith('thử đồ ảo')
  })
})
