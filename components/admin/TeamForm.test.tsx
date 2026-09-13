import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TeamForm from './TeamForm'
import type { TeamMember } from '@/lib/team'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_MEMBER: TeamMember = {
  id: 6,
  image: '/about/team-existing.jpg',
  name: 'Thành viên hiện có',
  role: 'Vai trò hiện có',
  bio: 'Tiểu sử hiện có',
  badgeVariant: 'tertiary',
  roleVariant: 'tertiary',
  footerIcon: 'verified',
  footerLabel: 'Footer hiện có',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('TeamForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('POSTs to /api/team when creating and redirects on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<TeamForm />)
    fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'Thành viên mới' } })
    fireEvent.change(screen.getByLabelText('Vai trò'), { target: { value: 'Vai trò mới' } })
    fireEvent.change(screen.getByLabelText('Tiểu sử'), { target: { value: 'Tiểu sử mới' } })
    fireEvent.change(screen.getByLabelText('Ảnh (URL)'), { target: { value: '/about/new.jpg' } })
    fireEvent.change(screen.getByLabelText('Icon cuối thẻ'), { target: { value: 'star' } })
    fireEvent.change(screen.getByLabelText('Nhãn cuối thẻ'), { target: { value: 'Nhãn mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo thành viên' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/team'))
    expect(fetch).toHaveBeenCalledWith('/api/team', expect.objectContaining({ method: 'POST' }))
  })

  it('pre-fills fields and PUTs to /api/team/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_MEMBER }))
    renderWithIntl(<TeamForm initialMember={EXISTING_MEMBER} />)
    expect(screen.getByLabelText('Họ tên')).toHaveValue('Thành viên hiện có')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/team'))
    expect(fetch).toHaveBeenCalledWith('/api/team/6', expect.objectContaining({ method: 'PUT' }))
  })

  it('shows field errors returned by the API instead of redirecting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errors: { name: 'Tên không được để trống' } }),
      })
    )
    renderWithIntl(<TeamForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo thành viên' }))

    await waitFor(() => expect(screen.getByText('Tên không được để trống')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
