import { describe, expect, it } from 'vitest'
import {
  applyBlockquote,
  applyBold,
  applyBulletList,
  applyHeading,
  applyInlineCode,
  applyItalic,
  applyLink,
  applyNumberedList,
  insertImage,
} from './markdownEditor'

describe('applyBold', () => {
  it('wraps the selected text in ** and selects the wrapped text', () => {
    const result = applyBold('Xin chào thế giới', { start: 4, end: 8 })
    expect(result.text).toBe('Xin **chào** thế giới')
    expect(result.text.slice(result.selectionStart, result.selectionEnd)).toBe('chào')
  })

  it('inserts an empty ** pair with the cursor in the middle when nothing is selected', () => {
    const result = applyBold('Xin chào', { start: 8, end: 8 })
    expect(result.text).toBe('Xin chào****')
    expect(result.selectionStart).toBe(10)
    expect(result.selectionEnd).toBe(10)
  })
})

describe('applyItalic', () => {
  it('wraps the selected text in single asterisks', () => {
    const result = applyItalic('Xin chào thế giới', { start: 4, end: 8 })
    expect(result.text).toBe('Xin *chào* thế giới')
  })
})

describe('applyInlineCode', () => {
  it('wraps the selected text in backticks', () => {
    const result = applyInlineCode('gọi hàm foo()', { start: 8, end: 13 })
    expect(result.text).toBe('gọi hàm `foo()`')
  })
})

describe('applyHeading', () => {
  it('prefixes the current line with ## for level 2', () => {
    const result = applyHeading('Tiêu đề', { start: 0, end: 0 }, 2)
    expect(result.text).toBe('## Tiêu đề')
  })

  it('prefixes the current line with ### for level 3', () => {
    const result = applyHeading('Tiêu đề', { start: 0, end: 0 }, 3)
    expect(result.text).toBe('### Tiêu đề')
  })

  it('only prefixes the line the cursor is on, not the whole document', () => {
    const value = 'Dòng một\nDòng hai'
    const cursorOnLineTwo = value.indexOf('Dòng hai')
    const result = applyHeading(value, { start: cursorOnLineTwo, end: cursorOnLineTwo }, 2)
    expect(result.text).toBe('Dòng một\n## Dòng hai')
  })
})

describe('applyBulletList', () => {
  it('prefixes every selected line with a dash', () => {
    const value = 'Một\nHai\nBa'
    const result = applyBulletList(value, { start: 0, end: value.length })
    expect(result.text).toBe('- Một\n- Hai\n- Ba')
  })
})

describe('applyNumberedList', () => {
  it('prefixes every selected line with "1. "', () => {
    const value = 'Một\nHai'
    const result = applyNumberedList(value, { start: 0, end: value.length })
    expect(result.text).toBe('1. Một\n1. Hai')
  })
})

describe('applyBlockquote', () => {
  it('prefixes the selected line with "> "', () => {
    const result = applyBlockquote('Trích dẫn', { start: 0, end: 0 })
    expect(result.text).toBe('> Trích dẫn')
  })
})

describe('applyLink', () => {
  it('turns the selected text into link text and selects the url placeholder', () => {
    const result = applyLink('Xem thêm bài viết', { start: 9, end: 17 })
    expect(result.text).toBe('Xem thêm [bài viết](url)')
    expect(result.text.slice(result.selectionStart, result.selectionEnd)).toBe('url')
  })
})

describe('insertImage', () => {
  it('inserts markdown image syntax at the cursor position', () => {
    const result = insertImage('Trước đó. Sau đó.', 9, 'https://example.com/a.jpg', 'Mô tả ảnh')
    expect(result.text).toBe('Trước đó.![Mô tả ảnh](https://example.com/a.jpg) Sau đó.')
    expect(result.selectionStart).toBe(result.selectionEnd)
  })
})
