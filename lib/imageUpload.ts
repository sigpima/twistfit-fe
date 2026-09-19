export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const IMAGE_INPUT_ACCEPT = ALLOWED_IMAGE_TYPES.join(',')

export function isAllowedImageType(type: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(type)
}
