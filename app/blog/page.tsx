import BlogHero from '@/components/blog/BlogHero'
import BlogFeaturedArticle from '@/components/blog/BlogFeaturedArticle'
import BlogArticleGrid from '@/components/blog/BlogArticleGrid'
import BlogQuizCallout from '@/components/blog/BlogQuizCallout'
import BlogNewsletterSection from '@/components/blog/BlogNewsletterSection'
import { apiFetch } from '@/lib/apiClient'
import type { BlogPost } from '@/lib/db'

export default async function BlogPage() {
  const response = await apiFetch('/blog', { cache: 'no-store' })
  const posts = response.ok ? ((await response.json()) as BlogPost[]) : []
  const featured = posts.find((post) => post.isFeatured) ?? posts[0]
  const rest = featured ? posts.filter((post) => post.id !== featured.id) : posts

  return (
    <main className="w-full bg-surface">
      <div className="mx-auto max-w-7xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
        <BlogHero />
        {featured && <BlogFeaturedArticle post={featured} />}
        <BlogArticleGrid posts={rest} />
        <BlogQuizCallout />
        <BlogNewsletterSection />
      </div>
    </main>
  )
}
