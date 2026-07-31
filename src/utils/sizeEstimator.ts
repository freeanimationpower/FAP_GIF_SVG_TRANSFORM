import type { EditorSettings } from '../types'

export function estimateGifSize(
  settings: EditorSettings,
  frameCount: number
): number {
  const { width, height, quality } = settings
  const pixels = width * height

  const baseSizePerFrame = pixels * 0.25

  const qualityMultiplier = 1.5 - (quality / 100) * 1.0

  const rawSize = baseSizePerFrame * frameCount * qualityMultiplier

  return Math.round(rawSize)
}

export function estimateSvgSize(
  settings: EditorSettings,
  frameCount: number
): number {
  const { width, height, quality } = settings
  const pixels = width * height

  const baseSizePerFrame = pixels * 0.45

  const qualityMultiplier = 1.5 - (quality / 100) * 1.0

  const rawSize = baseSizePerFrame * frameCount * qualityMultiplier + 500

  return Math.round(rawSize)
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
