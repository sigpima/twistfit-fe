'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type { ContactMessage } from '@/lib/contact'

export default function ContactMessageList() {
  const t = useTranslations('Admin.ContactList')
  const [messages, setMessages] = useState<ContactMessage[] | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/contact')
      .then((response) => response.json())
      .then(setMessages)
  }, [])

  async function handleToggleRead(message: ContactMessage) {
    const response = await fetch(`/api/contact/${message.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: !message.isRead }),
    })
    const updated = await response.json()
    setMessages((current) => current?.map((item) => (item.id === message.id ? updated : item)) ?? null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/contact/${id}`, { method: 'DELETE' })
    setMessages((current) => current?.filter((item) => item.id !== id) ?? null)
  }

  if (messages === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (messages.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <ul className="space-y-space-md">
      {messages.map((message) => (
        <li key={message.id} className="rounded-2xl border border-outline-variant p-space-lg">
          <button
            type="button"
            onClick={() => setExpandedId((current) => (current === message.id ? null : message.id))}
            className="flex w-full flex-wrap items-center justify-between gap-space-sm text-left"
          >
            <span className="flex items-center gap-space-sm">
              {!message.isRead && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label={t('unreadBadge')} />
              )}
              <span className="font-semibold text-on-surface">{message.name}</span>
              <span className="text-label-sm text-on-surface-variant">{t(`subjects.${message.subject}`)}</span>
            </span>
            <span className="text-label-sm text-on-surface-variant">{message.createdAt}</span>
          </button>
          {expandedId === message.id && (
            <div className="mt-space-sm space-y-space-xs text-body-sm text-on-surface-variant">
              <p>
                {t('detailEmailLabel')}: {message.email}
              </p>
              {message.phone && (
                <p>
                  {t('detailPhoneLabel')}: {message.phone}
                </p>
              )}
              <p className="whitespace-pre-wrap text-on-surface">{message.message}</p>
              <div className="mt-space-sm flex gap-space-md">
                <button
                  type="button"
                  onClick={() => handleToggleRead(message)}
                  className="font-semibold text-primary hover:underline"
                >
                  {message.isRead ? t('markUnreadButton') : t('markReadButton')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(message.id)}
                  className="font-semibold text-error hover:underline"
                >
                  {t('deleteButton')}
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
