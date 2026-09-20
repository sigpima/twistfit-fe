import { describe, expect, it } from 'vitest'
import {
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd,
  buildDiscussionForumPostingJsonLd,
  buildFaqPageJsonLd,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from './jsonLd'
import type { BlogPost } from './db'
import type { FaqItem } from './faq'
import type { ForumPost } from './forum'

function makeBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
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

function makeForumPost(overrides: Partial<ForumPost> = {}): ForumPost {
  return {
    id: 4,
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

describe('buildOrganizationJsonLd', () => {
  it('describes TwistFit as an Organization', () => {
    expect(buildOrganizationJsonLd()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'TwistFit',
      url: 'https://twistfit.org',
      logo: 'https://twistfit.org/home/logo.png',
    })
  })
})

describe('buildWebsiteJsonLd', () => {
  it('describes the site as a WebSite', () => {
    expect(buildWebsiteJsonLd()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'TwistFit',
      url: 'https://twistfit.org',
    })
  })
})

describe('buildBlogPostingJsonLd', () => {
  it('maps a blog post to a BlogPosting, falling back to TwistFit when there is no author', () => {
    const post = makeBlogPost({ authorName: null, coverImageUrl: '/blog/test.jpg' })
    const result = buildBlogPostingJsonLd(post)
    expect(result).toMatchObject({
      '@type': 'BlogPosting',
      headline: 'Bài Test',
      description: 'Mô tả',
      image: 'https://twistfit.org/blog/test.jpg',
      datePublished: '2026-01-01',
      dateModified: '2026-01-05',
      author: { '@type': 'Organization', name: 'TwistFit' },
      mainEntityOfPage: 'https://twistfit.org/blog/mua-dong-2026',
    })
  })

  it('attributes the post to its author when one is set', () => {
    const post = makeBlogPost({ authorName: 'Stylist Mai Anh' })
    expect(buildBlogPostingJsonLd(post).author).toEqual({ '@type': 'Person', name: 'Stylist Mai Anh' })
  })

  it('leaves an already-absolute cover image URL untouched', () => {
    const post = makeBlogPost({ coverImageUrl: 'https://cdn.example.com/cover.jpg' })
    expect(buildBlogPostingJsonLd(post).image).toBe('https://cdn.example.com/cover.jpg')
  })
})

describe('buildFaqPageJsonLd', () => {
  it('maps each FAQ item to a Question with a plain-text answer', () => {
    const items: FaqItem[] = [
      {
        id: 1,
        categories: ['account'],
        question: 'Làm sao đổi mật khẩu?',
        answerMarkdown: 'Vào **Hồ sơ** > *Đổi mật khẩu*.',
        highlightIcon: null,
        highlightText: null,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]
    const result = buildFaqPageJsonLd(items)
    expect(result['@type']).toBe('FAQPage')
    expect(result.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'Làm sao đổi mật khẩu?',
        acceptedAnswer: { '@type': 'Answer', text: 'Vào Hồ sơ > Đổi mật khẩu.' },
      },
    ])
  })
})

describe('buildDiscussionForumPostingJsonLd', () => {
  it('maps a forum post to a DiscussionForumPosting', () => {
    const post = makeForumPost()
    expect(buildDiscussionForumPostingJsonLd(post)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: 'Bài forum',
      text: 'Nội dung',
      datePublished: '2026-01-01',
      dateModified: '2026-01-02',
      author: { '@type': 'Person', name: 'Tester' },
      mainEntityOfPage: 'https://twistfit.org/forum/4',
    })
  })
})

describe('buildBreadcrumbJsonLd', () => {
  it('numbers each item by its position and resolves paths to absolute URLs', () => {
    const result = buildBreadcrumbJsonLd([
      { name: 'Trang chủ', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: 'Bài viết', path: '/blog/bai-viet' },
    ])
    expect(result.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://twistfit.org/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://twistfit.org/blog' },
      { '@type': 'ListItem', position: 3, name: 'Bài viết', item: 'https://twistfit.org/blog/bai-viet' },
    ])
  })
})
