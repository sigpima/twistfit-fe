'use client'

import { useTranslations } from 'next-intl'
import { renderMarkdown } from '@/lib/markdown'
import type { ForumPost } from '@/lib/forum'

export default function ForumPostViewDialog({ post, onClose }: { post: ForumPost | null; onClose: () => void }) {
  const t = useTranslations('Forum')

  if (!post) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-lg">
        <h3 className="text-headline-sm font-semibold text-on-surface">{post.title}</h3>
        <p className="mt-space-xs text-label-sm text-on-surface-variant">
          {t(`categories.${post.category}`)} · {post.authorName} · {post.createdAt}
        </p>
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt=""
            className="mt-space-md aspect-[4/3] w-full rounded-2xl object-cover"
          />
        )}
        <div
          className="prose mt-space-md max-w-none text-body-md text-on-surface"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
        />
        <div className="mt-space-lg flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-surface-container px-5 py-2.5 text-label-md font-semibold text-on-surface-variant hover:bg-surface-container-high"
          >
            {t('Moderation.ViewDialog.closeButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
