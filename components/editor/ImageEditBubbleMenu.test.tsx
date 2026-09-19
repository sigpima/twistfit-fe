import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, act, fireEvent } from '@testing-library/react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { useEffect } from 'react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ImageEditBubbleMenu from './ImageEditBubbleMenu'

function Harness({
  initialValue,
  onReady,
  onEditImage = vi.fn(),
}: {
  initialValue: string
  onReady: (editor: Editor) => void
  onEditImage?: (attrs: { src: string; alt: string; title: string }) => void
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), ImageExtension, Markdown],
    content: initialValue,
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor) onReady(editor)
  }, [editor, onReady])

  if (!editor) return null

  return (
    <div>
      <EditorContent editor={editor} />
      <ImageEditBubbleMenu editor={editor} onEditImage={onEditImage} />
    </div>
  )
}

async function mount(initialValue: string, onEditImage?: (attrs: { src: string; alt: string; title: string }) => void) {
  let captured: Editor | null = null
  renderWithIntl(<Harness initialValue={initialValue} onReady={(e) => (captured = e)} onEditImage={onEditImage} />)
  await waitFor(() => expect(captured).not.toBeNull())
  return captured as unknown as Editor
}

describe('ImageEditBubbleMenu', () => {
  it('does not show the edit button while no image is selected', async () => {
    await mount('just text')
    expect(screen.queryByRole('button', { name: 'Sửa ảnh đang chọn' })).not.toBeInTheDocument()
  })

  it('shows the edit button once an image node is selected, and reports its current attrs on click', async () => {
    const onEditImage = vi.fn()
    const editor = await mount('', onEditImage)

    act(() => {
      editor.chain().insertContent({ type: 'image', attrs: { src: 'https://example.com/a.jpg', alt: 'Mô tả cũ' } }).run()
      editor.commands.setNodeSelection(0)
    })

    const editButton = await screen.findByRole('button', { name: 'Sửa ảnh đang chọn' })
    fireEvent.click(editButton)

    expect(onEditImage).toHaveBeenCalledWith({ src: 'https://example.com/a.jpg', alt: 'Mô tả cũ', title: '' })
  })

  it('hides the edit button again once the selection moves off the image', async () => {
    const editor = await mount('after')

    act(() => {
      editor.chain().insertContent({ type: 'image', attrs: { src: 'https://example.com/a.jpg', alt: 'x' } }).run()
      editor.commands.setNodeSelection(0)
    })
    await screen.findByRole('button', { name: 'Sửa ảnh đang chọn' })

    act(() => {
      editor.chain().focus('end').run()
    })
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Sửa ảnh đang chọn' })).not.toBeInTheDocument())
  })
})
