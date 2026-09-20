import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPageContent from './ForumPageContent'

describe('ForumPageContent', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the heading and the post list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumPageContent />)
    expect(screen.getByRole('heading', { name: 'Diễn đàn TwistFit' })).toBeInTheDocument()
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/forum/posts', { credentials: 'include' }))
  })

  it('links to new post, my posts, and saved pages', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumPageContent />)
    expect(screen.getByRole('link', { name: 'Đăng bài mới' })).toHaveAttribute('href', '/forum/new')
    expect(screen.getByRole('link', { name: 'Bài của tôi' })).toHaveAttribute('href', '/forum/my-posts')
    expect(screen.getByRole('link', { name: 'Đã lưu' })).toHaveAttribute('href', '/forum/saved')
  })
})
