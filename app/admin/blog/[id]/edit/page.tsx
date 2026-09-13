'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import BlogPostForm from '@/components/admin/BlogPostForm'
import { apiFetch } from '@/lib/apiClient'
import type { BlogPost } from '@/lib/db'

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const [post, setPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      apiFetch(`/blog/${id}`)
        .then((response) => response.json())
        .then(setPost)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {post && <BlogPostForm initialPost={post} />}
        </section>
      </AdminGate>
    </main>
  )
}
