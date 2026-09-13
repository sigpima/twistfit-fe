'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import AuthGate from '@/components/auth/AuthGate'
import ForumPostForm from '@/components/forum/ForumPostForm'
import { apiFetch } from '@/lib/apiClient'
import type { ForumPost } from '@/lib/forum'

export default function EditForumPostPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('Forum')
  const [post, setPost] = useState<ForumPost | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      apiFetch(`/forum/posts/${id}`).then((response) => {
        if (!response.ok) {
          setNotFound(true)
          return
        }
        response.json().then(setPost)
      })
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AuthGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {notFound && <p className="text-body-md text-on-surface-variant">{t('Edit.notFoundBody')}</p>}
          {post && <ForumPostForm initialPost={post} />}
        </section>
      </AuthGate>
    </main>
  )
}
