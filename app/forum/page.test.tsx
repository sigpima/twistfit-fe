import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPage from './page'

describe('ForumPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the heading and the post list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumPage />)
    expect(screen.getByRole('heading', { name: 'Diễn đàn TwistFit' })).toBeInTheDocument()
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/forum/posts', { credentials: 'include' }))
  })
})
