import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditModelPage from './page'
import type { CatalogModel } from '@/lib/modelCatalog'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const MODEL: CatalogModel = {
  id: 3,
  name: 'Model cần sửa',
  image: '/outfit/models/x.jpg',
  dossierImage: '/outfit/models/x.jpg',
  poseCount: 15,
  tagline: 'Tagline',
  undertone: 'neutral',
  height: '1m65',
  bodyShape: 'Đồng hồ cát',
  waist: '64cm',
  personalColor: 'Autumn Soft',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditModelPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MODEL }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the model by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditModelPage params={Promise.resolve({ id: '3' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Tên người mẫu')).toHaveValue('Model cần sửa'))
    expect(fetch).toHaveBeenCalledWith('/api/model-catalog/3')
  })
})
