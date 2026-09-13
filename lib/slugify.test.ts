import { describe, expect, it } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Bí quyết chọn trang phục')).toBe('bi-quyet-chon-trang-phuc')
  })

  it('strips Vietnamese diacritics including đ/Đ', () => {
    expect(slugify('Đổi Quần Áo Cũ')).toBe('doi-quan-ao-cu')
  })

  it('collapses punctuation into single hyphens and trims edges', () => {
    expect(slugify("  'Chiến dịch' -- Nhận Quà!!  ")).toBe('chien-dich-nhan-qua')
  })
})
