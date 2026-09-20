import type { Metadata } from 'next'
import { apiFetch } from '@/lib/apiClient'
import type { ForumPost } from '@/lib/forum'
import ForumPostPageContent from '@/components/forum/ForumPostPageContent'
import { buildBreadcrumbJsonLd, buildDiscussionForumPostingJsonLd } from '@/lib/jsonLd'
import JsonLd from '@/components/seo/JsonLd'

const DESCRIPTION_MAX_LENGTH = 160

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const response = await apiFetch(`/forum/posts/${id}`, { cache: 'no-store' })
  if (!response.ok) {
    return {}
  }

  const post = (await response.json()) as ForumPost
  const description =
    post.body.length > DESCRIPTION_MAX_LENGTH ? `${post.body.slice(0, DESCRIPTION_MAX_LENGTH)}…` : post.body

  return {
    title: `${post.title} | TwistFit`,
    description,
    alternates: { canonical: `/forum/${post.id}` },
  }
}

export default async function ForumPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const response = await apiFetch(`/forum/posts/${id}`, { cache: 'no-store' })
  const post = response.ok ? ((await response.json()) as ForumPost) : null

  return (
    <>
      {post && (
        <>
          <JsonLd data={buildDiscussionForumPostingJsonLd(post)} />
          <JsonLd
            data={buildBreadcrumbJsonLd([
              { name: 'Trang chủ', path: '/' },
              { name: 'Diễn đàn', path: '/forum' },
              { name: post.title, path: `/forum/${post.id}` },
            ])}
          />
        </>
      )}
      <ForumPostPageContent id={id} />
    </>
  )
}
