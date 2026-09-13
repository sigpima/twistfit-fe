export function estimateReadingMinutes(content: string): number {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(wordCount / 200))
}
