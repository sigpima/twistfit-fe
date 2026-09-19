'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { useState } from 'react'
import ImagePickerDialog from '@/components/admin/ImagePickerDialog'
import RichTextToolbar from './RichTextToolbar'
import ImageEditBubbleMenu from './ImageEditBubbleMenu'

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
  const [editingImage, setEditingImage] = useState<{ src: string; alt: string; title: string } | null>(null)

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
      {editor && (
        <RichTextToolbar
          editor={editor}
          onRequestImage={() => setImageDialogOpen(true)}
          onEditImage={(attrs) => setEditingImage(attrs)}
        />
      )}
      <EditorContent editor={editor} />
      {editor && <ImageEditBubbleMenu editor={editor} onEditImage={setEditingImage} />}
      <ImagePickerDialog
        open={imageDialogOpen}
        uploadUrlEndpoint={uploadUrlEndpoint}
        onCancel={() => setImageDialogOpen(false)}
        onConfirm={({ url, alt, caption }) => {
          editor?.chain().focus().setImage({ src: url, alt, title: caption || undefined }).run()
          setImageDialogOpen(false)
        }}
      />
      <ImagePickerDialog
        open={editingImage !== null}
        uploadUrlEndpoint={uploadUrlEndpoint}
        initialUrl={editingImage?.src ?? ''}
        initialAlt={editingImage?.alt ?? ''}
        initialCaption={editingImage?.title ?? ''}
        onCancel={() => setEditingImage(null)}
        onConfirm={({ url, alt, caption }) => {
          editor?.chain().focus().updateAttributes('image', { src: url, alt, title: caption || undefined }).run()
          setEditingImage(null)
        }}
      />
    </div>
  )
}
