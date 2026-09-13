import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import CapsuleForm from './CapsuleForm'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_SET: CapsuleSet = {
  id: 9,
  image: '/outfit/capsule-set-existing.jpg',
  alt: 'Ảnh hiện có',
  tagVariant: 'secondary',
  tagLabel: 'Set hiện có',
  fitFor: 'Phù hợp: Test',
  title: 'Set hiện có',
  tone: 'Test Tone',
  description: 'Mô tả hiện có',
  items: [
    { label: 'Món đồ 1:', price: '100.000 ₫' },
    { label: 'Món đồ 2:', price: '200.000 ₫' },
  ],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('CapsuleForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('starts with 2 empty items when creating', () => {
    renderWithIntl(<CapsuleForm />)
    expect(screen.getAllByLabelText(/Món đồ \d/)).toHaveLength(2)
  })

  it('can add and remove items', () => {
    renderWithIntl(<CapsuleForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm món đồ' }))
    expect(screen.getAllByLabelText(/Món đồ \d/)).toHaveLength(3)

    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa món đồ' })[0])
    expect(screen.getAllByLabelText(/Món đồ \d/)).toHaveLength(2)
  })

  it('POSTs to /api/capsule-wardrobe when creating and redirects on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<CapsuleForm />)
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Set Mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo set đồ' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/capsule-wardrobe'))
    expect(fetch).toHaveBeenCalledWith('/capsule-wardrobe', expect.objectContaining({ method: 'POST', credentials: 'include' }))
  })

  it('pre-fills fields and PUTs to /api/capsule-wardrobe/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_SET }))
    renderWithIntl(<CapsuleForm initialSet={EXISTING_SET} />)
    expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Set hiện có')
    expect(screen.getAllByLabelText(/Món đồ \d/)).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/capsule-wardrobe'))
    expect(fetch).toHaveBeenCalledWith('/capsule-wardrobe/9', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
  })

  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<CapsuleForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo set đồ' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
