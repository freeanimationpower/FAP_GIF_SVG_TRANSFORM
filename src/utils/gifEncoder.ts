import GIF from 'gif.js'
import type { FrameData, EditorSettings } from '../types'

export function encodeGif(
  frames: FrameData[],
  settings: EditorSettings,
  onProgress: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality: Math.max(1, Math.floor(21 - (settings.quality / 100) * 20)),
      width: settings.width,
      height: settings.height,
      workerScript: '/gif.worker.js',
      repeat: 0,
    })

    const canvas = document.createElement('canvas')
    canvas.width = settings.width
    canvas.height = settings.height
    const ctx = canvas.getContext('2d')!

    let loadedCount = 0
    const total = frames.length

    for (const frame of frames) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        gif.addFrame(ctx, { delay: frame.delay, copy: true })
        loadedCount++
        onProgress(Math.round((loadedCount / total) * 100))

        if (loadedCount === total) {
          gif.render()
        }
      }
      img.onerror = () => reject(new Error('Error al cargar un frame'))
      img.src = frame.dataUrl
    }

    gif.on('finished', (blob: Blob) => {
      resolve(blob)
    })

    gif.on('error', () => {
      reject(new Error('Error al generar el GIF'))
    })
  })
}
