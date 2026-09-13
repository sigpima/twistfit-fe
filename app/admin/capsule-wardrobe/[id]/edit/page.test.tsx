import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditCapsuleSetPage from './page'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const SET: CapsuleSet = {
  id: 4,
  image: '/outfit/capsule-set-x.jpg',
  alt: 'Ảnh X',
  tagVariant: 'primary',
  tagLabel: 'Set X',
  fitFor: 'Phù hợp: Test',
  title: 'Set cần sửa',
  tone: 'Test Tone',
  description: 'Mô tả',
  items: [{ label: 'Món đồ:', price: '100.000 ₫' }],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditCapsuleSetPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => SET }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the set by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditCapsuleSetPage params={Promise.resolve({ id: '4' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Set cần sửa'))
    expect(fetch).toHaveBeenCalledWith('/capsule-wardrobe/4', { credentials: 'include' })
  })
})
