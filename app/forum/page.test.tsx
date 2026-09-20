import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPage, { metadata } from './page'

describe('ForumPage', () => {
  it('sets a self-referencing canonical URL', () => {
    expect(metadata.alternates?.canonical).toBe('/forum')
  })

  it('renders the forum page content', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumPage />)
    expect(screen.getByRole('link', { name: 'Đăng bài mới' })).toHaveAttribute('href', '/forum/new')
  })
})
