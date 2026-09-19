'use client'

import { BubbleMenu } from '@tiptap/react/menus'
import { useTranslations } from 'next-intl'
import type { Editor } from '@tiptap/react'

export default function ImageEditBubbleMenu({
  editor,
  onEditImage,
}: {
  editor: Editor
  onEditImage: (attrs: { src: string; alt: string; title: string }) => void
}) {
  const t = useTranslations('Admin.RichTextToolbar')

  return (
    <BubbleMenu editor={editor} shouldShow={({ editor }) => editor.isActive('image')}>
      <button
        type="button"
        aria-label={t('editImage')}
        onClick={() => {
          const attrs = editor.getAttributes('image')
          onEditImage({ src: attrs.src ?? '', alt: attrs.alt ?? '', title: attrs.title ?? '' })
        }}
        className="flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-body-sm font-medium text-on-primary shadow-md"
      >
        <span className="material-symbols-outlined text-[18px]">edit</span>
        {t('editImage')}
      </button>
    </BubbleMenu>
  )
}
