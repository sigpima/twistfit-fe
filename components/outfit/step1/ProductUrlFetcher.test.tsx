import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ProductUrlFetcher from './ProductUrlFetcher'

describe('ProductUrlFetcher', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('flags the input when submitting an empty URL', () => {
    renderWithIntl(<ProductUrlFetcher />)
    fireEvent.click(screen.getByRole('button', { name: /Lấy dữ liệu đồ/ }))
    expect(screen.getByPlaceholderText(/shopee\.vn/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('walks through loading and success states before returning to idle', () => {
    renderWithIntl(<ProductUrlFetcher />)
    const input = screen.getByPlaceholderText(/shopee\.vn/)
    fireEvent.change(input, { target: { value: 'https://shopee.vn/ao-peplum-voan-xep-ly-TF8821' } })
    fireEvent.click(screen.getByRole('button', { name: /Lấy dữ liệu đồ/ }))

    expect(screen.getByRole('button', { name: /Đang bóc tách đồ/ })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(screen.getByRole('button', { name: /Đã nạp xong/ })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByRole('button', { name: /Lấy dữ liệu đồ/ })).toBeInTheDocument()
  })
})
