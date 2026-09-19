import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, act, fireEvent } from '@testing-library/react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { useEffect } from 'react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import RichTextToolbar from './RichTextToolbar'

function Harness({
  initialValue,
  onReady,
  onRequestImage = vi.fn(),
  onEditImage = vi.fn(),
}: {
  initialValue: string
  onReady: (editor: Editor) => void
  onRequestImage?: () => void
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
      <RichTextToolbar editor={editor} onRequestImage={onRequestImage} onEditImage={onEditImage} />
      <EditorContent editor={editor} />
    </div>
  )
}

async function mount(initialValue: string, onRequestImage?: () => void, onEditImage?: (attrs: { src: string; alt: string; title: string }) => void) {
  let captured: Editor | null = null
  renderWithIntl(
    <Harness
      initialValue={initialValue}
      onReady={(e) => (captured = e)}
      onRequestImage={onRequestImage}
      onEditImage={onEditImage}
    />
  )
  await waitFor(() => expect(captured).not.toBeNull())
  const editor = captured as unknown as Editor
  // select the whole document, the same way a user pressing Ctrl+A would —
  // no direct .selectAll() call needed, this goes through the toolbar's own
  // click handlers exactly like the real component will be driven.
  act(() => {
    editor.chain().focus().selectAll().run()
  })
  return editor
}

describe('RichTextToolbar', () => {
  it('renders nothing while the editor is not ready yet', () => {
    renderWithIntl(<RichTextToolbar editor={null} onRequestImage={vi.fn()} onEditImage={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('every format button has an accessible name via aria-label', async () => {
    await mount('text')
    for (const name of [
      'Tiêu đề 2',
      'Tiêu đề 3',
      'In đậm',
      'In nghiêng',
      'Danh sách gạch đầu dòng',
      'Danh sách đánh số',
      'Trích dẫn',
      'Mã (code)',
      'Chèn liên kết',
      'Ảnh',
    ]) {
      // getByRole with `name` already asserts the accessible name resolves to
      // this exact aria-label — the icon glyph's own text (e.g. "format_h2")
      // never becomes the accessible name because aria-label takes priority.
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('toggles bold on the current selection and reports active state', async () => {
    const editor = await mount('some text')
    fireEvent.click(screen.getByRole('button', { name: 'In đậm' }))
    expect(editor.storage.markdown.getMarkdown()).toBe('**some text**')
    expect(screen.getByRole('button', { name: 'In đậm' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('applies heading level 2', async () => {
    const editor = await mount('a heading')
    fireEvent.click(screen.getByRole('button', { name: 'Tiêu đề 2' }))
    expect(editor.storage.markdown.getMarkdown()).toBe('## a heading')
  })

  it('toggles a bullet list', async () => {
    const editor = await mount('item one')
    fireEvent.click(screen.getByRole('button', { name: 'Danh sách gạch đầu dòng' }))
    expect(editor.storage.markdown.getMarkdown()).toBe('- item one')
  })

  it('applies a link via window.prompt', async () => {
    const editor = await mount('a link')
    vi.stubGlobal('prompt', () => 'https://example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Chèn liên kết' }))
    expect(editor.storage.markdown.getMarkdown()).toBe('[a link](https://example.com)')
    vi.unstubAllGlobals()
  })

  it('calls onRequestImage when the image button is clicked', async () => {
    const onRequestImage = vi.fn()
    await mount('x', onRequestImage)
    fireEvent.click(screen.getByRole('button', { name: 'Ảnh' }))
    expect(onRequestImage).toHaveBeenCalled()
  })

  it('does not show an edit-image button while no image is selected', async () => {
    await mount('just text')
    expect(screen.queryByRole('button', { name: 'Sửa ảnh đang chọn' })).not.toBeInTheDocument()
  })

  it('shows the edit-image button once an image node is selected, and reports its current attrs', async () => {
    const onEditImage = vi.fn()
    const editor = await mount('', undefined, onEditImage)

    act(() => {
      editor.chain().insertContent({ type: 'image', attrs: { src: 'https://example.com/a.jpg', alt: 'Mô tả cũ' } }).run()
      // Select the node we just inserted, the same way TipTap does for a clicked image.
      editor.commands.setNodeSelection(0)
    })

    const editButton = await screen.findByRole('button', { name: 'Sửa ảnh đang chọn' })
    fireEvent.click(editButton)

    expect(onEditImage).toHaveBeenCalledWith({ src: 'https://example.com/a.jpg', alt: 'Mô tả cũ', title: '' })
  })

  it('hides the edit-image button again once the selection moves off the image', async () => {
    const editor = await mount('after', undefined)

    act(() => {
      editor.chain().insertContent({ type: 'image', attrs: { src: 'https://example.com/a.jpg', alt: 'x' } }).run()
      editor.commands.setNodeSelection(0)
    })
    await screen.findByRole('button', { name: 'Sửa ảnh đang chọn' })

    act(() => {
      editor.chain().focus('end').run()
    })
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Sửa ảnh đang chọn' })).not.toBeInTheDocument()
    )
  })
})
