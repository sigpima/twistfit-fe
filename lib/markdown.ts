import { Marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

function slugify(text: string): string {
  return text
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function renderMarkdown(content: string): string {
  const slugCounts = new Map<string, number>()

  const marked = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        if (depth !== 2 && depth !== 3) {
          return `<h${depth}>${html}</h${depth}>\n`
        }
        const base = slugify(html.replace(/<[^>]+>/g, '')) || 'section'
        const count = slugCounts.get(base) ?? 0
        slugCounts.set(base, count + 1)
        const id = count === 0 ? base : `${base}-${count + 1}`
        return `<h${depth} id="${id}">${html}</h${depth}>\n`
      },
    },
  })

  const html = marked.parse(content, { async: false }) as string
  return DOMPurify.sanitize(html)
}

export type HeadingEntry = {
  id: string
  depth: 2 | 3
  text: string
}

export function extractHeadings(html: string): HeadingEntry[] {
  const matches = html.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)
  return Array.from(matches, (match) => ({
    depth: Number(match[1]) as 2 | 3,
    id: match[2],
    text: match[3].replace(/<[^>]+>/g, '').trim(),
  }))
}
