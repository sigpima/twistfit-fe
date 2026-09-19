import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { BlogPost } from '@/lib/db'
import type { FaqItem } from '@/lib/faq'
import BlogPage from './page'

const POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'mua-dong-2026',
    title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
    excerpt: 'Khám phá sức hút mãnh liệt của sự tương phản cao.',
    content: 'Nội dung bài nổi bật.',
    coverImageUrl: '/blog/featured-winter-outfit.jpg',
    coverImageAlt: null,
    category: 'personal-color',
    authorName: 'Stylist Mai Anh',
    isFeatured: true,
    publishedAt: '2026-06-18',
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
  },
  {
    id: 2,
    slug: 'top-5-thoi-son',
    title: 'Top 5 thỏi son kinh điển dành riêng cho cô nàng thuộc nhóm Cool Undertone',
    excerpt: 'Sự thanh khiết và dịu mát của tone Mùa Hạ.',
    content: 'Nội dung bài thường.',
    coverImageUrl: '/blog/lipstick-flatlay.jpg',
    coverImageAlt: null,
    category: 'beauty',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-06-18',
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
  },
]

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    categories: ['personal-color'],
    question: 'Câu hỏi seed test?',
    answerMarkdown: 'Trả lời seed test.',
    highlightIcon: null,
    highlightText: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

function stubFetchByPath({ posts, faqItems }: { posts: BlogPost[]; faqItems: FaqItem[] }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/faq')) {
        return { ok: true, json: async () => faqItems }
      }
      return { ok: true, json: async () => posts }
    })
  )
}

describe('BlogPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the hero heading, featured article and article grid', async () => {
    stubFetchByPath({ posts: POSTS, faqItems: FAQ_ITEMS })
    const page = await BlogPage()
    renderWithIntl(page)
    expect(screen.getByRole('heading', { level: 1, name: 'Tạp Chí Phong Cách TwistFit' })).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
    expect(screen.getByText(/Top 5 thỏi son kinh điển/)).toBeInTheDocument()
  })

  it('renders the FAQ content below the blog content', async () => {
    stubFetchByPath({ posts: POSTS, faqItems: FAQ_ITEMS })
    const page = await BlogPage()
    renderWithIntl(page)
    expect(screen.getByText('Câu hỏi seed test?')).toBeInTheDocument()
  })
})
