'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { BlogPost } from '@/lib/db'

export default function BlogPostList() {
  const t = useTranslations('Admin.BlogList')
  const [posts, setPosts] = useState<BlogPost[] | null>(null)

  useEffect(() => {
    fetch('/api/blog')
      .then((response) => response.json())
      .then(setPosts)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/blog/${id}`, { method: 'DELETE' })
    setPosts((current) => current?.filter((post) => post.id !== id) ?? null)
  }

  if (posts === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (posts.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnTitle')}</th>
          <th className="py-2">{t('columnCategory')}</th>
          <th className="py-2">{t('columnDate')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{post.title}</td>
            <td className="py-3 text-on-surface-variant">{post.category}</td>
            <td className="py-3 text-on-surface-variant">{post.publishedAt}</td>
            <td className="py-3 text-right">
              <Link href={`/admin/blog/${post.id}/edit`} className="mr-4 font-semibold text-primary hover:underline">
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(post.id)}
                className="font-semibold text-error hover:underline"
              >
                {t('deleteButton')}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
