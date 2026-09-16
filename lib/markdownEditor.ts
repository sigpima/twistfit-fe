export interface TextSelection {
  start: number
  end: number
}

export interface EditOutcome {
  text: string
  selectionStart: number
  selectionEnd: number
}

function wrapInline(value: string, selection: TextSelection, marker: string): EditOutcome {
  const { start, end } = selection
  const selected = value.slice(start, end)
  const text = `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`

  if (selected) {
    return { text, selectionStart: start + marker.length, selectionEnd: start + marker.length + selected.length }
  }
  const cursor = start + marker.length
  return { text, selectionStart: cursor, selectionEnd: cursor }
}

function prefixLines(value: string, selection: TextSelection, prefix: string): EditOutcome {
  const { start, end } = selection
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const nextNewline = value.indexOf('\n', end)
  const lineEnd = nextNewline === -1 ? value.length : nextNewline

  const block = value.slice(lineStart, lineEnd)
  const prefixedBlock = block
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n')
  const text = value.slice(0, lineStart) + prefixedBlock + value.slice(lineEnd)

  return { text, selectionStart: start + prefix.length, selectionEnd: end + (prefixedBlock.length - block.length) }
}

export function applyBold(value: string, selection: TextSelection): EditOutcome {
  return wrapInline(value, selection, '**')
}

export function applyItalic(value: string, selection: TextSelection): EditOutcome {
  return wrapInline(value, selection, '*')
}

export function applyInlineCode(value: string, selection: TextSelection): EditOutcome {
  return wrapInline(value, selection, '`')
}

export function applyHeading(value: string, selection: TextSelection, level: 2 | 3): EditOutcome {
  return prefixLines(value, selection, `${'#'.repeat(level)} `)
}

export function applyBulletList(value: string, selection: TextSelection): EditOutcome {
  return prefixLines(value, selection, '- ')
}

export function applyNumberedList(value: string, selection: TextSelection): EditOutcome {
  return prefixLines(value, selection, '1. ')
}

export function applyBlockquote(value: string, selection: TextSelection): EditOutcome {
  return prefixLines(value, selection, '> ')
}

export function applyLink(value: string, selection: TextSelection): EditOutcome {
  const { start, end } = selection
  const linkText = value.slice(start, end) || 'văn bản liên kết'
  const text = `${value.slice(0, start)}[${linkText}](url)${value.slice(end)}`
  const urlStart = start + linkText.length + 3
  return { text, selectionStart: urlStart, selectionEnd: urlStart + 3 }
}

export function insertImage(value: string, cursor: number, url: string, alt: string): EditOutcome {
  const inserted = `![${alt}](${url})`
  const text = value.slice(0, cursor) + inserted + value.slice(cursor)
  const position = cursor + inserted.length
  return { text, selectionStart: position, selectionEnd: position }
}
