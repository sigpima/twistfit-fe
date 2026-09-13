export type ColorVariant = 'primary' | 'secondary' | 'tertiary'
export const COLOR_VARIANTS: ColorVariant[] = ['primary', 'secondary', 'tertiary']

export type TeamMember = {
  id: number
  image: string
  name: string
  role: string
  bio: string
  badgeVariant: ColorVariant
  roleVariant: ColorVariant
  footerIcon: string
  footerLabel: string
  createdAt: string
  updatedAt: string
}

export type TeamMemberInput = {
  image: string
  name: string
  role: string
  bio: string
  badgeVariant: ColorVariant
  roleVariant: ColorVariant
  footerIcon: string
  footerLabel: string
}
