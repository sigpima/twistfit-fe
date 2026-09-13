import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

export function renderMarkdown(content: string): string {
  const html = marked.parse(content, { async: false }) as string
  return DOMPurify.sanitize(html)
}
