import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BlogPost } from '@/lib/db'
import type { ForumPost } from '@/lib/forum'
import sitemap from './sitemap'

function makeBlogPost(overrides: Partial<BlogPost>): BlogPost {
  return {
    id: 1,
    slug: 'mua-dong-2026',
    title: 'Bài Test',
    excerpt: 'Mô tả',
    content: 'Nội dung',
    coverImageUrl: '/blog/test.jpg',
    coverImageAlt: null,
    category: 'styling',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-05',
    ...overrides,
  }
}

function makeForumPost(overrides: Partial<ForumPost>): ForumPost {
  return {
    id: 1,
    title: 'Bài forum',
    body: 'Nội dung',
    imageUrl: null,
    category: 'general',
    status: 'published',
    authorId: 1,
    authorName: 'Tester',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    bookmarkedByMe: false,
    canDelete: false,
    deletedAt: null,
    deletedByAdmin: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-02',
    ...overrides,
  }
}

function stubFetchByUrl(routes: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      for (const [path, body] of Object.entries(routes)) {
        if (url.includes(path)) return Promise.resolve({ ok: true, json: async () => body })
      }
      return Promise.resolve({ ok: false, status: 404 })
    })
  )
}

describe('sitemap', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('always includes the static routes', async () => {
    stubFetchByUrl({ '/blog': [], '/forum/posts': [] })
    const result = await sitemap()
    expect(result.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([
        'https://twistfit.org/',
        'https://twistfit.org/blog',
        'https://twistfit.org/forum',
        'https://twistfit.org/outfit/step-1',
        'https://twistfit.org/personal-color/quiz',
      ])
    )
  })

  it('includes a URL per blog post, using its slug and last-updated date', async () => {
    stubFetchByUrl({
      '/blog': [makeBlogPost({ slug: 'bai-mot', updatedAt: '2026-02-10' })],
      '/forum/posts': [],
    })
    const result = await sitemap()
    const entry = result.find((item) => item.url === 'https://twistfit.org/blog/bai-mot')
    expect(entry).toMatchObject({ lastModified: '2026-02-10' })
  })

  it('includes only published, non-deleted forum posts', async () => {
    stubFetchByUrl({
      '/blog': [],
      '/forum/posts': [
        makeForumPost({ id: 1, status: 'published' }),
        makeForumPost({ id: 2, status: 'pending' }),
        makeForumPost({ id: 3, status: 'published', deletedAt: '2026-01-03' }),
      ],
    })
    const result = await sitemap()
    const urls = result.map((entry) => entry.url)
    expect(urls).toContain('https://twistfit.org/forum/1')
    expect(urls).not.toContain('https://twistfit.org/forum/2')
    expect(urls).not.toContain('https://twistfit.org/forum/3')
  })

  it('falls back to the static routes alone when the backend requests fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const result = await sitemap()
    expect(result.map((entry) => entry.url)).toContain('https://twistfit.org/')
  })

  it('falls back to the static routes alone when the backend is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const result = await sitemap()
    expect(result.map((entry) => entry.url)).toContain('https://twistfit.org/')
  })
})
