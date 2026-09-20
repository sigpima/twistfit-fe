import type {
  BlogPosting,
  BreadcrumbList,
  DiscussionForumPosting,
  FAQPage,
  Organization,
  WebSite,
  WithContext,
} from 'schema-dts'
import { renderMarkdown } from '@/lib/markdown'
import { SITE_URL } from '@/lib/site'
import type { BlogPost } from '@/lib/db'
import type { FaqItem } from '@/lib/faq'
import type { ForumPost } from '@/lib/forum'

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

function stripToPlainText(markdown: string): string {
  return renderMarkdown(markdown)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => HTML_ENTITIES[entity])
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildOrganizationJsonLd(): WithContext<Organization> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TwistFit',
    url: SITE_URL,
    logo: `${SITE_URL}/home/logo.png`,
  }
}

export function buildWebsiteJsonLd(): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TwistFit',
    url: SITE_URL,
  }
}

export function buildBlogPostingJsonLd(post: BlogPost): WithContext<BlogPosting> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl.startsWith('http') ? post.coverImageUrl : `${SITE_URL}${post.coverImageUrl}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.authorName ? { '@type': 'Person', name: post.authorName } : { '@type': 'Organization', name: 'TwistFit' },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  }
}

export function buildFaqPageJsonLd(items: FaqItem[]): WithContext<FAQPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripToPlainText(item.answerMarkdown),
      },
    })),
  }
}

export function buildDiscussionForumPostingJsonLd(post: ForumPost): WithContext<DiscussionForumPosting> {
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: post.title,
    text: post.body,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.authorName },
    mainEntityOfPage: `${SITE_URL}/forum/${post.id}`,
  }
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}
