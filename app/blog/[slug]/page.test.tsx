import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { BlogPost } from '@/lib/db'

function makePost(overrides: Partial<BlogPost>): BlogPost {
  return {
    id: 1,
    slug: 'mua-dong-2026',
    title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
    excerpt: 'Mô tả ngắn',
    content: '## Tiêu đề phụ\n\nNội dung **đầy đủ** của bài viết.',
    coverImageUrl: '/blog/featured-winter-outfit.jpg',
    coverImageAlt: null,
    category: 'personal-color',
    authorName: 'Stylist Mai Anh',
    isFeatured: true,
    publishedAt: '2026-06-18',
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
    ...overrides,
  }
}

const POST = makePost({})

const notFoundMock = vi.fn()

vi.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}))

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

describe('BlogPostPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    notFoundMock.mockClear()
  })

  it('renders the post title and markdown content when the slug exists', async () => {
    stubFetchByUrl({ '/blog/slug/mua-dong-2026': POST, '/blog': [POST] })
    const { default: BlogPostPage } = await import('./page')
    const ui = await BlogPostPage({ params: Promise.resolve({ slug: 'mua-dong-2026' }) })
    renderWithIntl(ui!)
    expect(
      screen.getByRole('heading', { name: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông' })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiêu đề phụ' })).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
  })

  it('calls notFound() when the slug does not exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const { default: BlogPostPage } = await import('./page')
    await BlogPostPage({ params: Promise.resolve({ slug: 'khong-ton-tai' }) })
    expect(notFoundMock).toHaveBeenCalled()
  })

  it('sets the tab title to the post title and the description to its excerpt', async () => {
    stubFetchByUrl({ '/blog/slug/mua-dong-2026': POST, '/blog': [POST] })
    const { generateMetadata } = await import('./page')
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'mua-dong-2026' }) })
    expect(metadata.title).toBe('Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông | TwistFit')
    expect(metadata.description).toBe('Mô tả ngắn')
  })

  it('returns empty metadata when the slug does not exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const { generateMetadata } = await import('./page')
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'khong-ton-tai' }) })
    expect(metadata).toEqual({})
  })

  it('renders a table of contents built from the post headings', async () => {
    stubFetchByUrl({ '/blog/slug/mua-dong-2026': POST, '/blog': [POST] })
    const { default: BlogPostPage } = await import('./page')
    const ui = await BlogPostPage({ params: Promise.resolve({ slug: 'mua-dong-2026' }) })
    renderWithIntl(ui!)
    expect(screen.getByRole('navigation', { name: 'Mục lục bài viết' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tiêu đề phụ' })).toHaveAttribute('href', '#tieu-de-phu')
  })

  it('renders related posts from the same category, excluding the current post and other categories', async () => {
    const sameCategory = makePost({ id: 2, slug: 'bai-lien-quan', title: 'Bài liên quan', category: 'personal-color' })
    const otherCategory = makePost({ id: 3, slug: 'bai-khac-cate', title: 'Bài khác chuyên mục', category: 'beauty' })
    stubFetchByUrl({ '/blog/slug/mua-dong-2026': POST, '/blog': [POST, sameCategory, otherCategory] })

    const { default: BlogPostPage } = await import('./page')
    const ui = await BlogPostPage({ params: Promise.resolve({ slug: 'mua-dong-2026' }) })
    renderWithIntl(ui!)

    expect(screen.getByRole('link', { name: /Bài liên quan/ })).toHaveAttribute('href', '/blog/bai-lien-quan')
    expect(screen.queryByText('Bài khác chuyên mục')).not.toBeInTheDocument()
  })
})
