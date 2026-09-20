import type { MetadataRoute } from 'next'
import { apiFetch } from '@/lib/apiClient'
import { SITE_URL } from '@/lib/site'
import type { BlogPost } from '@/lib/db'
import type { ForumPost } from '@/lib/forum'

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
  { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${SITE_URL}/how-it-works`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${SITE_URL}/forum`, changeFrequency: 'daily', priority: 0.8 },
  { url: `${SITE_URL}/outfit/step-1`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${SITE_URL}/personal-color/quiz`, changeFrequency: 'monthly', priority: 0.8 },
]

async function fetchBlogRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const response = await apiFetch('/blog', { cache: 'no-store' })
    if (!response.ok) return []

    const posts = (await response.json()) as BlogPost[]
    return posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.64,
    }))
  } catch {
    return []
  }
}

async function fetchForumRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const response = await apiFetch('/forum/posts', { cache: 'no-store' })
    if (!response.ok) return []

    const posts = (await response.json()) as ForumPost[]
    return posts
      .filter((post) => post.status === 'published' && !post.deletedAt)
      .map((post) => ({
        url: `${SITE_URL}/forum/${post.id}`,
        lastModified: post.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.5,
      }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogRoutes, forumRoutes] = await Promise.all([fetchBlogRoutes(), fetchForumRoutes()])
  return [...STATIC_ROUTES, ...blogRoutes, ...forumRoutes]
}
