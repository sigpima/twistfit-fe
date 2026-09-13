import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AdminDashboard from './AdminDashboard'
import { AuthProvider } from './AuthProvider'

describe('AdminDashboard', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
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
  })
})
