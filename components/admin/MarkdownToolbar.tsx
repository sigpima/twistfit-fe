'use client'

import { useTranslations } from 'next-intl'
import type { RefObject } from 'react'
import {
  applyBlockquote,
  applyBold,
  applyBulletList,
  applyHeading,
  applyInlineCode,
  applyItalic,
  applyLink,
  applyNumberedList,
  type EditOutcome,
} from '@/lib/markdownEditor'

const buttonClass =
  'rounded-lg px-3 py-1.5 text-label-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high'

export default function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
  onRequestImage,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (value: string) => void
  onRequestImage: () => void
}) {
  const t = useTranslations('Admin.MarkdownToolbar')

  function applyEdit(edit: EditOutcome) {
    onChange(edit.text)
    const textarea = textareaRef.current
    if (!textarea) return
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd)
    })
  }

  function withSelection(format: (value: string, selection: { start: number; end: number }) => EditOutcome) {
    const textarea = textareaRef.current
    const selection = {
      start: textarea?.selectionStart ?? value.length,
      end: textarea?.selectionEnd ?? value.length,
    }
    applyEdit(format(value, selection))
  }

  type Format = (value: string, selection: { start: number; end: number }) => EditOutcome

  const formatButtons: Array<{ label: string; format: Format }> = [
    { label: t('heading2'), format: (v, s) => applyHeading(v, s, 2) },
    { label: t('heading3'), format: (v, s) => applyHeading(v, s, 3) },
    { label: t('bold'), format: applyBold },
    { label: t('italic'), format: applyItalic },
    { label: t('bulletList'), format: applyBulletList },
    { label: t('numberedList'), format: applyNumberedList },
    { label: t('blockquote'), format: applyBlockquote },
    { label: t('inlineCode'), format: applyInlineCode },
    { label: t('link'), format: applyLink },
  ]

  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-surface p-1.5">
      {formatButtons.map((button) => (
        <button
          key={button.label}
          type="button"
          onClick={() => withSelection(button.format)}
          className={buttonClass}
        >
          {button.label}
        </button>
      ))}
      <button type="button" onClick={onRequestImage} className={buttonClass}>
        {t('image')}
      </button>
    </div>
  )
}
