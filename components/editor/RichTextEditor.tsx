'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import RichTextToolbar from './RichTextToolbar'

export default function RichTextEditor({
  value,
  onChange,
  labelId,
}: {
  value: string
  onChange: (value: string) => void
  labelId: string
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Markdown],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId,
        class: 'prose max-w-none rounded-b-xl bg-surface p-4 text-body-md text-on-surface focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange((editor.storage.markdown as { getMarkdown: () => string }).getMarkdown())
    },
  })

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant">
      <RichTextToolbar editor={editor} onRequestImage={() => {}} />
      <EditorContent editor={editor} />
    </div>
  )
}
