import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders basic markdown to HTML', () => {
    const html = renderMarkdown('# Tiêu đề\n\nĐoạn **in đậm**.')
    expect(html).toContain('<h1>Tiêu đề</h1>')
    expect(html).toContain('<strong>in đậm</strong>')
  })

  it('strips script tags and inline event handlers', () => {
    const html = renderMarkdown('Nội dung <script>alert(1)</script> và <img src=x onerror=alert(2)>')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('onerror')
  })
})
