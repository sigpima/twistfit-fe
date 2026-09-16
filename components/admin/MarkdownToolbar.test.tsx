import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import MarkdownToolbar from './MarkdownToolbar'

function Harness({ initialValue = '', onRequestImage = vi.fn() }: { initialValue?: string; onRequestImage?: () => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState(initialValue)
  return (
    <div>
      <MarkdownToolbar textareaRef={textareaRef} value={value} onChange={setValue} onRequestImage={onRequestImage} />
      <textarea ref={textareaRef} value={value} onChange={(event) => setValue(event.target.value)} />
    </div>
  )
}

describe('MarkdownToolbar', () => {
  it('wraps the current selection in ** when Bold is clicked', () => {
    renderWithIntl(<Harness initialValue="Xin chào" />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    textarea.focus()
    textarea.setSelectionRange(0, 3)

    fireEvent.click(screen.getByRole('button', { name: 'In đậm' }))

    expect(textarea.value).toBe('**Xin** chào')
  })

  it('prefixes the current line with ## when Heading 2 is clicked', () => {
    renderWithIntl(<Harness initialValue="Tiêu đề" />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    textarea.focus()
    textarea.setSelectionRange(0, 0)

    fireEvent.click(screen.getByRole('button', { name: 'Tiêu đề 2' }))

    expect(textarea.value).toBe('## Tiêu đề')
  })

  it('calls onRequestImage when the image button is clicked', () => {
    const onRequestImage = vi.fn()
    renderWithIntl(<Harness onRequestImage={onRequestImage} />)

    fireEvent.click(screen.getByRole('button', { name: 'Ảnh' }))

    expect(onRequestImage).toHaveBeenCalled()
  })
})
