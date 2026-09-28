// Kept in sync with backend/app/core/blob_storage.py's
// ALLOWED_IMAGE_CONTENT_TYPES — blog/forum never decode these server-side,
// so anything modern browsers render natively in <img> is safe to allow.
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']

export const IMAGE_INPUT_ACCEPT = ALLOWED_IMAGE_TYPES.join(',')

export function isAllowedImageType(type: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(type)
}
