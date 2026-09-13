import { UNDERTONES, type CatalogModelInput, type Undertone } from '@/lib/modelCatalog'

type RawModelBody = {
  name?: unknown
  image?: unknown
  dossierImage?: unknown
  poseCount?: unknown
  tagline?: unknown
  undertone?: unknown
  height?: unknown
  bodyShape?: unknown
  waist?: unknown
  personalColor?: unknown
}

function requiredString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateModelBody(
  body: unknown
): { errors: Record<string, string> } | { data: CatalogModelInput } {
  const raw = (body ?? {}) as RawModelBody
  const errors: Record<string, string> = {}

  const name = requiredString(raw.name)
  if (!name) errors.name = 'Tên người mẫu không được để trống'

  const image = requiredString(raw.image)
  if (!image) errors.image = 'Ảnh đại diện không được để trống'

  const dossierImage = requiredString(raw.dossierImage)
  if (!dossierImage) errors.dossierImage = 'Ảnh hồ sơ không được để trống'

  const poseCount = typeof raw.poseCount === 'number' ? raw.poseCount : NaN
  if (!Number.isInteger(poseCount) || poseCount <= 0) {
    errors.poseCount = 'Số dáng chụp phải là số nguyên dương'
  }

  const tagline = requiredString(raw.tagline)
  if (!tagline) errors.tagline = 'Tagline không được để trống'

  const undertone = raw.undertone as Undertone
  if (!UNDERTONES.includes(undertone)) errors.undertone = 'Undertone không hợp lệ'

  const height = requiredString(raw.height)
  if (!height) errors.height = 'Chiều cao không được để trống'

  const bodyShape = requiredString(raw.bodyShape)
  if (!bodyShape) errors.bodyShape = 'Dáng người không được để trống'

  const waist = requiredString(raw.waist)
  if (!waist) errors.waist = 'Số đo vòng eo không được để trống'

  const personalColor = requiredString(raw.personalColor)
  if (!personalColor) errors.personalColor = 'Personal Color không được để trống'

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return {
    data: { name, image, dossierImage, poseCount, tagline, undertone, height, bodyShape, waist, personalColor },
  }
}
