import { TAG_VARIANTS, type CapsuleItem, type CapsuleSetInput, type TagVariant } from '@/lib/capsuleWardrobe'

type RawItem = { label?: unknown; price?: unknown }
type RawCapsuleBody = {
  image?: unknown
  alt?: unknown
  tagVariant?: unknown
  tagLabel?: unknown
  fitFor?: unknown
  title?: unknown
  tone?: unknown
  description?: unknown
  items?: unknown
}

function requiredString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateCapsuleSetBody(
  body: unknown
): { errors: Record<string, string> } | { data: CapsuleSetInput } {
  const raw = (body ?? {}) as RawCapsuleBody
  const errors: Record<string, string> = {}

  const image = requiredString(raw.image)
  if (!image) errors.image = 'Ảnh không được để trống'

  const alt = requiredString(raw.alt)
  if (!alt) errors.alt = 'Mô tả ảnh (alt) không được để trống'

  const tagVariant = raw.tagVariant as TagVariant
  if (!TAG_VARIANTS.includes(tagVariant)) errors.tagVariant = 'Màu nhãn không hợp lệ'

  const tagLabel = requiredString(raw.tagLabel)
  if (!tagLabel) errors.tagLabel = 'Nhãn không được để trống'

  const fitFor = requiredString(raw.fitFor)
  if (!fitFor) errors.fitFor = 'Phù hợp với không được để trống'

  const title = requiredString(raw.title)
  if (!title) errors.title = 'Tiêu đề không được để trống'

  const tone = requiredString(raw.tone)
  if (!tone) errors.tone = 'Tông màu không được để trống'

  const description = requiredString(raw.description)
  if (!description) errors.description = 'Mô tả không được để trống'

  const rawItems = Array.isArray(raw.items) ? (raw.items as RawItem[]) : []
  if (rawItems.length === 0) {
    errors.items = 'Cần ít nhất 1 món đồ'
  }

  const items: CapsuleItem[] = rawItems.map((item, index) => {
    const label = requiredString(item.label)
    const price = requiredString(item.price)
    if (!label) errors[`items.${index}.label`] = 'Tên món đồ không được để trống'
    if (!price) errors[`items.${index}.price`] = 'Giá không được để trống'
    return { label, price }
  })

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { image, alt, tagVariant, tagLabel, fitFor, title, tone, description, items } }
}
