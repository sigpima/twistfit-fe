'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { useState } from 'react'
import ImagePickerDialog from '@/components/admin/ImagePickerDialog'
import RichTextToolbar from './RichTextToolbar'

export default function RichTextEditor({
  value,
  onChange,
  labelId,
  uploadUrlEndpoint,
}: {
  value: string
  onChange: (value: string) => void
  labelId: string
  uploadUrlEndpoint: string
}) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), ImageExtension, Markdown],
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
      onChange(editor.storage.markdown.getMarkdown())
    },
  })

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant">
      {/* RichTextToolbar uses useEditorState, which does not pick up a prop
          transitioning from null to a real editor across renders — mount it
          only once a real editor exists, instead of passing it null. */}
      {editor && <RichTextToolbar editor={editor} onRequestImage={() => setImageDialogOpen(true)} />}
      <EditorContent editor={editor} />
      <ImagePickerDialog
        open={imageDialogOpen}
        uploadUrlEndpoint={uploadUrlEndpoint}
        onCancel={() => setImageDialogOpen(false)}
        onConfirm={({ url, alt }) => {
          editor?.chain().focus().setImage({ src: url, alt }).run()
          setImageDialogOpen(false)
        }}
      />
    </div>
  )
}
