'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type { AdminStats } from '@/lib/stats'

export default function AdminStatsOverview() {
  const t = useTranslations('Admin.StatsOverview')
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((response) => response.json())
      .then(setStats)
  }, [])

  if (stats === null) {
    return <p className="mt-6 text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  const cards = [
    { title: t('blogTitle'), total: stats.blogPosts.total, sub: t('new30d', { count: stats.blogPosts.new30d }) },
    { title: t('forumTitle'), total: stats.forumPosts.total, sub: t('new30d', { count: stats.forumPosts.new30d }) },
    { title: t('usersTitle'), total: stats.users.total, sub: t('new30d', { count: stats.users.new30d }) },
    {
      title: t('quizTitle'),
      total: stats.quizAttempts.total,
      sub: t('new30d', { count: stats.quizAttempts.new30d }),
    },
    {
      title: t('contactTitle'),
      total: stats.contactMessages.total,
      sub: t('unread', { count: stats.contactMessages.unread }),
    },
  ]

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.title} className="rounded-2xl bg-surface-container p-4">
          <p className="text-label-sm text-on-surface-variant">{card.title}</p>
          <p className="mt-1 text-headline-sm font-bold text-on-surface">{card.total}</p>
          <p className="mt-1 text-label-sm text-on-surface-variant">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}
