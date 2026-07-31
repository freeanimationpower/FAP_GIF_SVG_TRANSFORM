import type { EditorSettings, FrameData } from '../types'

const MAX_CAPTURE_DIMENSION = 960
const FRAME_TIMEOUT_MS = 12000

function calculateCaptureSize(
  targetW: number,
  targetH: number
): { cw: number; ch: number } {
  const longest = Math.max(targetW, targetH)
  if (longest <= MAX_CAPTURE_DIMENSION) {
    return { cw: targetW, ch: targetH }
  }
  const ratio = MAX_CAPTURE_DIMENSION / longest
  return {
    cw: Math.max(32, Math.round(targetW * ratio)),
    ch: Math.max(32, Math.round(targetH * ratio)),
  }
}

function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false

    const onSeeked = () => {
      if (settled) return
      settled = true
      video.removeEventListener('seeked', onSeeked)
      clearTimeout(timer)
      resolve()
    }

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      video.removeEventListener('seeked', onSeeked)
      reject(new Error(`Timeout al posicionar en ${time.toFixed(2)}s`))
    }, FRAME_TIMEOUT_MS)

    video.addEventListener('seeked', onSeeked)
    video.currentTime = time
  })
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function domCleanup(video: HTMLVideoElement): void {
  try {
    video.pause()
    video.removeAttribute('src')
    video.load()
    if (video.parentNode) {
      video.parentNode.removeChild(video)
    }
  } catch {
    // element already removed
  }
}

export async function extractFrames(
  videoFile: File,
  settings: EditorSettings,
  onProgress?: (percent: number) => void
): Promise<FrameData[]> {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', '')
  video.setAttribute('webkit-playsinline', '')
  video.setAttribute('autoplay', '')
  video.crossOrigin = 'anonymous'
  video.preload = 'auto'
  video.style.position = 'fixed'
  video.style.top = '-9999px'
  video.style.left = '-9999px'
  video.style.width = '1px'
  video.style.height = '1px'
  video.style.opacity = '0'
  video.style.pointerEvents = 'none'

  document.body.appendChild(video)

  const videoUrl = URL.createObjectURL(videoFile)
  video.src = videoUrl

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Error al cargar el video'))
      setTimeout(() => reject(new Error('Timeout al cargar metadata del video')), 15000)
    })

    const duration = Math.min(video.duration, settings.endTime)
    const start = settings.startTime
    const totalFrames = Math.floor((duration - start) * settings.fps)

    if (totalFrames <= 0) {
      throw new Error('El recorte seleccionado no contiene frames')
    }

    const frameDelay = Math.round(1000 / settings.fps)

    const { cw, ch } = calculateCaptureSize(settings.width, settings.height)

    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!

    const frames: FrameData[] = []

    for (let i = 0; i < totalFrames; i++) {
      const seekTime = start + i / settings.fps

      await seekToTime(video, seekTime)

      ctx.clearRect(0, 0, cw, ch)
      ctx.drawImage(video, 0, 0, cw, ch)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      frames.push({ dataUrl, delay: frameDelay })

      onProgress?.(Math.round(((i + 1) / totalFrames) * 100))

      await yieldToMain()
    }

    return frames
  } finally {
    domCleanup(video)
    URL.revokeObjectURL(videoUrl)
  }
}
