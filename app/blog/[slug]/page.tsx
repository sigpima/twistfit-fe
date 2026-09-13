import Link from 'next/link'
import { notFound } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import { renderMarkdown } from '@/lib/markdown'
import type { BlogPost } from '@/lib/db'

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const response = await apiFetch(`/blog/slug/${slug}`, { cache: 'no-store' })

  if (!response.ok) {
    notFound()
    return null
  }

  const post = (await response.json()) as BlogPost

  return (
    <main className="w-full bg-surface">
      <article className="mx-auto max-w-3xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
        <Link href="/blog" className="text-label-md font-semibold text-primary hover:underline">
          ← Quay lại Blog
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
        <img src={post.coverImageUrl} alt={post.title} className="mt-space-lg w-full rounded-3xl object-cover" />
        <div
          className="prose mt-space-lg max-w-none text-body-md text-on-surface"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />
      </article>
    </main>
  )
}
