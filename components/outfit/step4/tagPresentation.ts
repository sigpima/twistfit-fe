import type { TagVariant } from '@/lib/capsuleWardrobe'

export const TAG_VARIANT_CLASSES: Record<TagVariant, string> = {
  primary: 'bg-surface-container-lowest/90 text-primary',
  secondary: 'bg-secondary-fixed text-on-secondary-fixed',
  tertiary: 'bg-surface-container-highest text-on-surface',
}
