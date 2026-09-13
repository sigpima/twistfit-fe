import { COLOR_VARIANTS, type ColorVariant, type TeamMemberInput } from '@/lib/team'

type RawTeamBody = {
  image?: unknown
  name?: unknown
  role?: unknown
  bio?: unknown
  badgeVariant?: unknown
  roleVariant?: unknown
  footerIcon?: unknown
  footerLabel?: unknown
}

function requiredString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateTeamMemberBody(
  body: unknown
): { errors: Record<string, string> } | { data: TeamMemberInput } {
  const raw = (body ?? {}) as RawTeamBody
  const errors: Record<string, string> = {}

  const image = requiredString(raw.image)
  if (!image) errors.image = 'Ảnh không được để trống'

  const name = requiredString(raw.name)
  if (!name) errors.name = 'Tên không được để trống'

  const role = requiredString(raw.role)
  if (!role) errors.role = 'Vai trò không được để trống'

  const bio = requiredString(raw.bio)
  if (!bio) errors.bio = 'Tiểu sử không được để trống'

  const badgeVariant = raw.badgeVariant as ColorVariant
  if (!COLOR_VARIANTS.includes(badgeVariant)) errors.badgeVariant = 'Màu badge không hợp lệ'

  const roleVariant = raw.roleVariant as ColorVariant
  if (!COLOR_VARIANTS.includes(roleVariant)) errors.roleVariant = 'Màu vai trò không hợp lệ'

  const footerIcon = requiredString(raw.footerIcon)
  if (!footerIcon) errors.footerIcon = 'Icon không được để trống'

  const footerLabel = requiredString(raw.footerLabel)
  if (!footerLabel) errors.footerLabel = 'Nhãn cuối không được để trống'

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { image, name, role, bio, badgeVariant, roleVariant, footerIcon, footerLabel } }
}
