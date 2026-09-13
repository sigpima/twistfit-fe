'use client'

import AuthGate from '@/components/auth/AuthGate'
import ForumPostForm from '@/components/forum/ForumPostForm'

export default function NewForumPostPage() {
  return (
    <main className="w-full bg-surface">
      <AuthGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <ForumPostForm />
        </section>
      </AuthGate>
    </main>
  )
}
