import BlogHero from '@/components/blog/BlogHero'
import BlogFeaturedArticle from '@/components/blog/BlogFeaturedArticle'
import BlogArticleGrid from '@/components/blog/BlogArticleGrid'
import FaqSection from '@/components/faq/FaqSection'
import FaqSupportBanner from '@/components/faq/FaqSupportBanner'
import { apiFetch } from '@/lib/apiClient'
import type { BlogPost } from '@/lib/db'
import type { FaqItem } from '@/lib/faq'

export default async function BlogPage() {
  const [blogResponse, faqResponse] = await Promise.all([
    apiFetch('/blog', { cache: 'no-store' }),
    apiFetch('/faq', { cache: 'no-store' }),
  ])
  const posts = blogResponse.ok ? ((await blogResponse.json()) as BlogPost[]) : []
  const faqItems = faqResponse.ok ? ((await faqResponse.json()) as FaqItem[]) : []
  const featured = posts.find((post) => post.isFeatured) ?? posts[0]
  const rest = featured ? posts.filter((post) => post.id !== featured.id) : posts

  return (
    <main className="w-full bg-surface">
      <div className="mx-auto max-w-7xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
        <BlogHero />
        {featured && <BlogFeaturedArticle post={featured} />}
        <BlogArticleGrid posts={rest} />
      </div>
      <div id="faq">
        <FaqSection items={faqItems} />
      </div>
      <FaqSupportBanner />
    </main>
  )
}
