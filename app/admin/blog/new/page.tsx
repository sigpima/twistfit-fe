'use client'

import AdminGate from '@/components/auth/AdminGate'
import BlogPostForm from '@/components/admin/BlogPostForm'

export default function NewBlogPostPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <BlogPostForm />
        </section>
      </AdminGate>
    </main>
  )
}
