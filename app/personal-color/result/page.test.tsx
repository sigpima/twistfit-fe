import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { saveAnonymousQuizResult } from '@/lib/quizResultStorage'
import ResultPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

function setStoredUser(user: { name: string; email: string; role: 'user' | 'admin' } | null) {
  if (user) {
    window.localStorage.setItem('twistfit.auth', JSON.stringify(user))
  } else {
    window.localStorage.removeItem('twistfit.auth')
  }
}

function renderResultPage() {
  return renderWithIntl(
    <AuthProvider>
      <ResultPage />
    </AuthProvider>
  )
}

const AUTUMN_RESULT = {
  subSeason: 'true-autumn' as const,
  parentSeason: 'autumn' as const,
  hueResult: 'warm' as const,
  valueResult: 'medium' as const,
  chromaResult: 'muted' as const,
}

describe('ResultPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('renders the page heading regardless of result state, with no breadcrumb trail', () => {
    setStoredUser(null)
    renderResultPage()
    expect(
      screen.getByRole('heading', { level: 1, name: 'KẾT QUẢ ĐÁNH GIÁ MÀU SẮC CÁ NHÂN' })
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Trang chủ' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Kiểm tra Màu Sắc Cá Nhân' })).not.toBeInTheDocument()
  })

  it('shows an empty state when a signed-out visitor has no saved result', async () => {
    setStoredUser(null)
    renderResultPage()
    await waitFor(() =>
      expect(screen.getByText('Bạn chưa có kết quả màu sắc cá nhân nào')).toBeInTheDocument()
    )
    expect(screen.getByRole('link', { name: 'Làm bài test ngay' })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
  })

  it('shows the result and the anonymous sign-up banner when a guest has a session result', async () => {
    setStoredUser(null)
    saveAnonymousQuizResult(AUTUMN_RESULT)
    renderResultPage()
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 3, name: 'Thu Thuần Ấm' })).toBeInTheDocument()
    )
    expect(screen.getByText('Lưu lại kết quả của bạn!')).toBeInTheDocument()
  })

  it('shows the result without the anonymous banner when logged in with a saved attempt', async () => {
    setStoredUser({ name: 'Test', email: 'user@twistfit.vn', role: 'user' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ id: 1, ...AUTUMN_RESULT, userId: 1, createdAt: '2026-01-01' }))
    )
    renderResultPage()
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 3, name: 'Thu Thuần Ấm' })).toBeInTheDocument()
    )
    expect(screen.queryByText('Lưu lại kết quả của bạn!')).not.toBeInTheDocument()
  })

  it('shows the empty state when logged in with no saved attempt and no session fallback', async () => {
    setStoredUser({ name: 'Test', email: 'user@twistfit.vn', role: 'user' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null)))
    renderResultPage()
    await waitFor(() =>
      expect(screen.getByText('Bạn chưa có kết quả màu sắc cá nhân nào')).toBeInTheDocument()
    )
  })

  it('falls back to the session result when logged in but the backend request fails', async () => {
    setStoredUser({ name: 'Test', email: 'user@twistfit.vn', role: 'user' })
    saveAnonymousQuizResult(AUTUMN_RESULT)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 500 })))
    renderResultPage()
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 3, name: 'Thu Thuần Ấm' })).toBeInTheDocument()
    )
  })
})
