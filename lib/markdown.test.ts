import { describe, expect, it } from 'vitest'
import { renderMarkdown, extractHeadings } from './markdown'

describe('renderMarkdown', () => {
  it('renders basic markdown to HTML', () => {
    const html = renderMarkdown('## Tiêu đề\n\nĐoạn **in đậm**.')
    expect(html).toContain('<h2 id="tieu-de">Tiêu đề</h2>')
    expect(html).toContain('<strong>in đậm</strong>')
  })

  it('strips script tags and inline event handlers', () => {
    const html = renderMarkdown('Nội dung <script>alert(1)</script> và <img src=x onerror=alert(2)>')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('onerror')
  })

  it('adds a slugified id to h2/h3 headings', () => {
    const html = renderMarkdown('## Bí quyết chọn màu\n\n### Tông da ấm')
    expect(html).toContain('<h2 id="bi-quyet-chon-mau">Bí quyết chọn màu</h2>')
    expect(html).toContain('<h3 id="tong-da-am">Tông da ấm</h3>')
  })

  it('downgrades a level-1 heading to h2, giving it an id like any other level-2 heading', () => {
    const html = renderMarkdown('# Tiêu đề chính\n\nĐoạn văn.')
    expect(html).not.toContain('<h1>')
    expect(html).toContain('<h2 id="tieu-de-chinh">Tiêu đề chính</h2>')
  })

  it('de-duplicates ids when two headings produce the same slug', () => {
    const html = renderMarkdown('## Kết luận\n\ncontent\n\n## Kết luận')
    expect(html).toContain('id="ket-luan"')
    expect(html).toContain('id="ket-luan-2"')
  })

  it('renders a plain image with no title as a bare img tag', () => {
    const html = renderMarkdown('![Mô tả](https://example.com/a.jpg)')
    expect(html).toContain('<img src="https://example.com/a.jpg" alt="Mô tả">')
    expect(html).not.toContain('<figure>')
  })

  it('renders an image with a title as a figure with a figcaption', () => {
    const html = renderMarkdown('![Mô tả](https://example.com/a.jpg "Chú thích ảnh")')
    expect(html).toContain(
      '<figure><img src="https://example.com/a.jpg" alt="Mô tả"><figcaption>Chú thích ảnh</figcaption></figure>'
    )
  })

  it('escapes HTML in an image caption instead of injecting markup', () => {
    const html = renderMarkdown('![Mô tả](https://example.com/a.jpg "<script>alert(1)</script>")')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
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

  it('includes a downgraded level-1 heading as a depth-2 entry', () => {
    const html = renderMarkdown('# Tiêu đề chính')
    expect(extractHeadings(html)).toEqual([{ id: 'tieu-de-chinh', depth: 2, text: 'Tiêu đề chính' }])
  })

  it('returns an empty list when the content has no headings at all', () => {
    expect(extractHeadings(renderMarkdown('Chỉ có đoạn văn.'))).toEqual([])
  })
})
