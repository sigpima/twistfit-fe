import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResultActionsPanel from './ResultActionsPanel'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('ResultActionsPanel', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders the primary result actions', () => {
    render(<ResultActionsPanel />)
    expect(screen.getByRole('button', { name: /Tải xuống ảnh HD/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lưu Vào Tủ Đồ Ảo/ })).toBeInTheDocument()
  })

  it('navigates back to step 3 when changing the pose', () => {
    render(<ResultActionsPanel />)
    fireEvent.click(screen.getByRole('button', { name: /Đổi Tư Thế Mẫu/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-3')
  })
})
