import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import RichTextEditor from './RichTextEditor'

// Uses renderWithIntl (not a plain RTL render) from the very first test in this
// file — Task 2 wires a toolbar with useTranslations() into RichTextEditor, and
// that requires an intl context to exist by then. Starting here avoids having to
// swap the render helper out from under later tests.
function setup(initialValue = '') {
  const onChange = vi.fn()
  renderWithIntl(
    <div>
      <span id="content-label">Nội dung</span>
      <RichTextEditor
        value={initialValue}
        onChange={onChange}
        labelId="content-label"
        uploadUrlEndpoint="/blog/upload-url"
      />
    </div>
  )
  return { onChange }
}

describe('RichTextEditor', () => {
  it('mounts and renders the initial markdown content', async () => {
    setup('## Xin chào\n\nĐoạn văn.')
    await waitFor(() => expect(screen.getByLabelText('Nội dung')).toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 2, name: 'Xin chào' })).toBeInTheDocument()
    expect(screen.getByText('Đoạn văn.')).toBeInTheDocument()
  })

  it('cannot represent a level-1 heading — restricted to levels 2 and 3', async () => {
    // A literal "# ..." in loaded markdown is not coerced up to H2 — the level-1
    // heading node type isn't in the schema at all, so it silently becomes a
    // plain paragraph. Accepted trade-off (see spec): this only affects admins
    // re-opening old content that already had the duplicate-H1 SEO problem this
    // migration exists to fix, and the text itself is not lost, only its
    // heading-ness, which the admin can restore as a proper H2/H3 if intended.
    setup('# Cấp 1\n\nNội dung.')
    await waitFor(() => expect(screen.getByLabelText('Nội dung')).toBeInTheDocument())
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(screen.getByText('Cấp 1')).toBeInTheDocument()
  })

  it('calls onChange with markdown text when the document changes', async () => {
    const { onChange } = setup('hello')
    const editable = await screen.findByLabelText('Nội dung')
    editable.focus()
    fireEvent.keyDown(editable, { key: 'a', code: 'KeyA', ctrlKey: true })
    fireEvent.click(screen.getByRole('button', { name: 'In đậm' }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('**hello**'))
  })

  it('inserts an image via the toolbar image button and ImagePickerDialog', async () => {
    const { onChange } = setup('before')
    await waitFor(() => expect(screen.getByLabelText('Nội dung')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Ảnh' }))
    fireEvent.change(screen.getByLabelText('Đường dẫn ảnh'), { target: { value: 'https://example.com/a.jpg' } })
    fireEvent.change(screen.getByLabelText('Mô tả ảnh (alt text)'), { target: { value: 'Mô tả ảnh' } })
    fireEvent.click(screen.getByRole('button', { name: 'Chèn ảnh' }))

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('![Mô tả ảnh](https://example.com/a.jpg)'))
    )
    expect(screen.queryByLabelText('Đường dẫn ảnh')).not.toBeInTheDocument()
  })
})
