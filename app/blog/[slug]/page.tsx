import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import { extractHeadings, renderMarkdown } from '@/lib/markdown'
import type { BlogPost } from '@/lib/db'
import BlogTableOfContents from '@/components/blog/BlogTableOfContents'
import BlogRelatedPosts from '@/components/blog/BlogRelatedPosts'
import { buildBlogPostingJsonLd, buildBreadcrumbJsonLd } from '@/lib/jsonLd'
import JsonLd from '@/components/seo/JsonLd'

const MAX_RELATED_POSTS = 4

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const response = await apiFetch(`/blog/slug/${slug}`, { cache: 'no-store' })
  if (!response.ok) {
    return {}
  }

  const post = (await response.json()) as BlogPost
  return {
    title: `${post.title} | TwistFit`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [postResponse, listResponse] = await Promise.all([
    apiFetch(`/blog/slug/${slug}`, { cache: 'no-store' }),
    apiFetch('/blog', { cache: 'no-store' }),
  ])

  if (!postResponse.ok) {
    notFound()
    return null
  }

  const post = (await postResponse.json()) as BlogPost
  const allPosts = listResponse.ok ? ((await listResponse.json()) as BlogPost[]) : []
  const relatedPosts = allPosts
    .filter((candidate) => candidate.category === post.category && candidate.id !== post.id)
    .slice(0, MAX_RELATED_POSTS)

  const contentHtml = renderMarkdown(post.content)
  const headings = extractHeadings(contentHtml)

  return (
    <main className="w-full bg-surface">
      <JsonLd data={buildBlogPostingJsonLd(post)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: 'Trang chủ', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
      <div className="mx-auto max-w-7xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl lg:grid lg:grid-cols-[240px_minmax(0,1fr)_300px] lg:gap-space-xl">
        <div className="hidden lg:block">
          <BlogTableOfContents headings={headings} />
        </div>

        <article className="mx-auto w-full max-w-3xl">
          <Link href="/blog" className="text-label-md font-semibold text-primary hover:underline">
            ← Quay lại
          </Link>
          <h1 className="mt-space-md text-headline-lg font-bold text-on-surface">{post.title}</h1>
          <div className="mt-space-xs flex items-center gap-space-sm text-label-sm text-on-surface-variant">
            <span>{post.publishedAt}</span>
            {post.authorName && (
              <>
                <span>•</span>
                <span>Bởi {post.authorName}</span>
              </>
            )}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt || post.title}
            className="mt-space-lg w-full rounded-3xl object-cover"
          />
          <div
            className="prose mt-space-lg max-w-none text-body-lg text-on-surface [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </article>

        <BlogRelatedPosts posts={relatedPosts} />
      </div>
    </main>
  )
}
