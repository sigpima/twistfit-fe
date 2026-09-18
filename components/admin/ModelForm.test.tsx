import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ModelForm from './ModelForm'
import type { CatalogModel } from '@/lib/modelCatalog'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_MODEL: CatalogModel = {
  id: 5,
  name: 'Model hiện có',
  image: '/outfit/models/existing.jpg',
  dossierImage: '/outfit/models/existing-dossier.jpg',
  sideImage: null,
  poseCount: 12,
  tagline: 'Tagline hiện có',
  undertone: 'cool',
  height: '1m70',
  bodyShape: 'Chữ nhật',
  waist: '70cm',
  personalColor: 'Cool Winter',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('ModelForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('POSTs to /api/model-catalog when creating and redirects on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<ModelForm />)
    fireEvent.change(screen.getByLabelText('Tên người mẫu'), { target: { value: 'Model Mới' } })
    fireEvent.change(screen.getByLabelText('Ảnh đại diện (URL)'), { target: { value: '/outfit/models/new.jpg' } })
    fireEvent.change(screen.getByLabelText('Ảnh hồ sơ (URL)'), { target: { value: '/outfit/models/new-dossier.jpg' } })
    fireEvent.change(screen.getByLabelText('Số dáng chụp'), { target: { value: '15' } })
    fireEvent.change(screen.getByLabelText('Tagline'), { target: { value: 'Tagline mới' } })
    fireEvent.change(screen.getByLabelText('Chiều cao'), { target: { value: '1m70' } })
    fireEvent.change(screen.getByLabelText('Dáng người'), { target: { value: 'Chữ nhật' } })
    fireEvent.change(screen.getByLabelText('Số đo vòng eo'), { target: { value: '68cm' } })
    fireEvent.change(screen.getByLabelText('Màu sắc cá nhân'), { target: { value: 'Warm Spring' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo người mẫu' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/model-catalog'))
    expect(fetch).toHaveBeenCalledWith('/model-catalog', expect.objectContaining({ method: 'POST', credentials: 'include' }))
  })

  it('pre-fills fields and PUTs to /api/model-catalog/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_MODEL }))
    renderWithIntl(<ModelForm initialModel={EXISTING_MODEL} />)
    expect(screen.getByLabelText('Tên người mẫu')).toHaveValue('Model hiện có')
    expect(screen.getByLabelText('Undertone')).toHaveValue('cool')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/model-catalog'))
    expect(fetch).toHaveBeenCalledWith('/model-catalog/5', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
  })

  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<ModelForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo người mẫu' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
