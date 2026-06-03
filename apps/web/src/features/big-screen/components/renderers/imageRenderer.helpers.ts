export function isAllowedImageSource(src: string): boolean {
  const trimmed = src.trim()
  if (trimmed === '') return true
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true
  if (trimmed.startsWith('https://')) return true
  if (trimmed.startsWith('data:image/')) return true
  return false
}
