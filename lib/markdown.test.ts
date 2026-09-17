import { describe, expect, it } from 'vitest'
import { renderMarkdown, extractHeadings } from './markdown'

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

  it('adds a slugified id to h2/h3 headings but not h1', () => {
    const html = renderMarkdown('# Tiêu đề chính\n\n## Bí quyết chọn màu\n\n### Tông da ấm')
    expect(html).toContain('<h1>Tiêu đề chính</h1>')
    expect(html).toContain('<h2 id="bi-quyet-chon-mau">Bí quyết chọn màu</h2>')
    expect(html).toContain('<h3 id="tong-da-am">Tông da ấm</h3>')
  })

  it('de-duplicates ids when two headings produce the same slug', () => {
    const html = renderMarkdown('## Kết luận\n\ncontent\n\n## Kết luận')
    expect(html).toContain('id="ket-luan"')
    expect(html).toContain('id="ket-luan-2"')
  })
})

describe('extractHeadings', () => {
  it('extracts h2/h3 entries with their id, depth, and plain text', () => {
    const html = renderMarkdown('## Bí quyết **chọn** màu\n\n### Tông da ấm\n\n## Phụ kiện đi kèm')
    expect(extractHeadings(html)).toEqual([
      { id: 'bi-quyet-chon-mau', depth: 2, text: 'Bí quyết chọn màu' },
      { id: 'tong-da-am', depth: 3, text: 'Tông da ấm' },
      { id: 'phu-kien-di-kem', depth: 2, text: 'Phụ kiện đi kèm' },
    ])
  })

  it('returns an empty list when the content has no h2/h3 headings', () => {
    expect(extractHeadings(renderMarkdown('# Tiêu đề\n\nChỉ có đoạn văn.'))).toEqual([])
  })
})
