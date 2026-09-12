import BlogHero from '@/components/blog/BlogHero'
import BlogFeaturedArticle from '@/components/blog/BlogFeaturedArticle'
import BlogArticleGrid from '@/components/blog/BlogArticleGrid'
import BlogQuizCallout from '@/components/blog/BlogQuizCallout'
import BlogNewsletterSection from '@/components/blog/BlogNewsletterSection'

export default function BlogPage() {
  return (
    <main className="w-full bg-surface">
      <div className="mx-auto max-w-7xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
        <BlogHero />
        <BlogFeaturedArticle />
        <BlogArticleGrid />
        <BlogQuizCallout />
        <BlogNewsletterSection />
      </div>
    </main>
  )
}
