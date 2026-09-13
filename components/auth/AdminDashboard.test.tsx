import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AdminDashboard from './AdminDashboard'
import { AuthProvider } from './AuthProvider'

describe('AdminDashboard', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          blogPosts: { total: 0, new30d: 0 },
          forumPosts: { total: 0, new30d: 0 },
          users: { total: 0, new30d: 0 },
          quizAttempts: { total: 0, new30d: 0 },
          contactMessages: { total: 0, unread: 0 },
        }),
      })
    )
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('links to the blog and quiz admin sections', () => {
    renderWithIntl(
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    )
    expect(screen.getByRole('link', { name: /Quản lý Blog/ })).toHaveAttribute('href', '/admin/blog')
    expect(screen.getByRole('link', { name: /Quản lý câu hỏi Quiz/ })).toHaveAttribute('href', '/admin/quiz')
    expect(screen.getByRole('link', { name: /Quản lý FAQ/ })).toHaveAttribute('href', '/admin/faq')
    expect(screen.getByRole('link', { name: /Quản lý Model Catalog/ })).toHaveAttribute('href', '/admin/model-catalog')
    expect(screen.getByRole('link', { name: /Quản lý Capsule Wardrobe/ })).toHaveAttribute(
      'href',
      '/admin/capsule-wardrobe'
    )
    expect(screen.getByRole('link', { name: /Quản lý Team/ })).toHaveAttribute('href', '/admin/team')
    expect(screen.getByRole('link', { name: /Quản lý Diễn đàn/ })).toHaveAttribute('href', '/admin/forum')
    expect(screen.getByRole('link', { name: /Quản lý Hộp thư/ })).toHaveAttribute('href', '/admin/contact')
  })
})
