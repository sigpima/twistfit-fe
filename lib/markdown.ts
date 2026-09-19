import { Marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

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
        const effectiveDepth = depth === 1 ? 2 : depth
        if (effectiveDepth !== 2 && effectiveDepth !== 3) {
          return `<h${depth}>${html}</h${depth}>\n`
        }
        const base = slugify(html.replace(/<[^>]+>/g, '')) || 'section'
        const count = slugCounts.get(base) ?? 0
        slugCounts.set(base, count + 1)
        const id = count === 0 ? base : `${base}-${count + 1}`
        return `<h${effectiveDepth} id="${id}">${html}</h${effectiveDepth}>\n`
      },
      image({ href, title, text }) {
        const src = escapeHtml(href)
        const alt = escapeHtml(text)
        if (title) {
          return `<figure><img src="${src}" alt="${alt}"><figcaption>${escapeHtml(title)}</figcaption></figure>`
        }
        return `<img src="${src}" alt="${alt}">`
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
