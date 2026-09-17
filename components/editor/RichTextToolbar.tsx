'use client'

import { useTranslations } from 'next-intl'
import { useEditorState, type Editor } from '@tiptap/react'

function buttonClass(isActive: boolean): string {
  return `flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-surface-container-high ${
    isActive ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant'
  }`
}

export default function RichTextToolbar({
  editor,
  onRequestImage,
}: {
  editor: Editor | null
  onRequestImage: () => void
}) {
  const t = useTranslations('Admin.RichTextToolbar')

  // useEditor()'s default shouldRerenderOnTransaction is false in TipTap v3 —
  // the editor instance mutates in place without re-rendering this component,
  // so active-format highlighting needs its own subscription via
  // useEditorState (the v3-recommended pattern) rather than reading
  // editor.isActive(...) directly during render.
  const activeState = useEditorState({
    editor,
    selector: (snapshot) => {
      if (!snapshot.editor) return null
      return {
        heading2: snapshot.editor.isActive('heading', { level: 2 }),
        heading3: snapshot.editor.isActive('heading', { level: 3 }),
        bold: snapshot.editor.isActive('bold'),
        italic: snapshot.editor.isActive('italic'),
        bulletList: snapshot.editor.isActive('bulletList'),
        orderedList: snapshot.editor.isActive('orderedList'),
        blockquote: snapshot.editor.isActive('blockquote'),
        code: snapshot.editor.isActive('code'),
        link: snapshot.editor.isActive('link'),
        linkHref: snapshot.editor.getAttributes('link').href as string | undefined,
      }
    },
  })

  if (!editor || !activeState) return null

  function handleLink() {
    const url = window.prompt(t('linkPrompt'), activeState!.linkHref ?? '')
    if (url === null) return
    if (url === '') {
      editor!.chain().focus().unsetLink().run()
      return
    }
    editor!.chain().focus().setLink({ href: url }).run()
  }

  const buttons: Array<{ label: string; icon: string; isActive: boolean; onClick: () => void }> = [
    {
      label: t('heading2'),
      icon: 'format_h2',
      isActive: activeState.heading2,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: t('heading3'),
      icon: 'format_h3',
      isActive: activeState.heading3,
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: t('bold'),
      icon: 'format_bold',
      isActive: activeState.bold,
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: t('italic'),
      icon: 'format_italic',
      isActive: activeState.italic,
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: t('bulletList'),
      icon: 'format_list_bulleted',
      isActive: activeState.bulletList,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: t('numberedList'),
      icon: 'format_list_numbered',
      isActive: activeState.orderedList,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: t('blockquote'),
      icon: 'format_quote',
      isActive: activeState.blockquote,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: t('inlineCode'),
      icon: 'code',
      isActive: activeState.code,
      onClick: () => editor.chain().focus().toggleCode().run(),
    },
    {
      label: t('link'),
      icon: 'link',
      isActive: activeState.link,
      onClick: handleLink,
    },
  ]

  return (
    <div className="flex flex-wrap gap-1 rounded-t-xl border border-b-0 border-outline-variant bg-surface p-1.5">
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          aria-label={button.label}
          aria-pressed={button.isActive}
          onClick={button.onClick}
          className={buttonClass(button.isActive)}
        >
          <span className="material-symbols-outlined text-[20px]">{button.icon}</span>
        </button>
      ))}
      <button type="button" aria-label={t('image')} onClick={onRequestImage} className={buttonClass(false)}>
        <span className="material-symbols-outlined text-[20px]">image</span>
      </button>
    </div>
  )
}
