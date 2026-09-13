export type TagVariant = 'primary' | 'secondary' | 'tertiary'
export const TAG_VARIANTS: TagVariant[] = ['primary', 'secondary', 'tertiary']

export type CapsuleItem = {
  label: string
  price: string
}

export type CapsuleSet = {
  id: number
  image: string
  alt: string
  tagVariant: TagVariant
  tagLabel: string
  fitFor: string
  title: string
  tone: string
  description: string
  items: CapsuleItem[]
  createdAt: string
  updatedAt: string
}

export type CapsuleSetInput = {
  image: string
  alt: string
  tagVariant: TagVariant
  tagLabel: string
  fitFor: string
  title: string
  tone: string
  description: string
  items: CapsuleItem[]
}
