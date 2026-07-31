declare module 'gif.js' {
  interface GIFOptions {
    workers?: number
    quality?: number
    width?: number
    height?: number
    workerScript?: string
    repeat?: number
    background?: string
    transparent?: string | null
    dither?: boolean
    debug?: boolean
  }

  interface GIFFrameOptions {
    delay?: number
    copy?: boolean
    dispose?: number
  }

  type GIFEvent = 'finished' | 'progress' | 'error' | 'abort'

  class GIF {
    constructor(options: GIFOptions)
    addFrame(
      element: CanvasImageSource | CanvasRenderingContext2D,
      options?: GIFFrameOptions
    ): void
    on(event: 'finished', callback: (blob: Blob, data: Uint8Array) => void): void
    on(event: 'progress', callback: (progress: number) => void): void
    on(event: 'error', callback: () => void): void
    on(event: 'abort', callback: () => void): void
    on(event: string, callback: (...args: unknown[]) => void): void
    render(): void
    abort(): void
    removeListener(event: GIFEvent): void
  }

  export default GIF
}
