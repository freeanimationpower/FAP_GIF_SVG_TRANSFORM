export type OutputFormat = 'gif' | 'svg'

export interface EditorSettings {
  width: number
  height: number
  fps: number
  quality: number
  startTime: number
  endTime: number
}

export type ProcessingStatus = 'idle' | 'processing' | 'done' | 'error'

export interface FrameData {
  dataUrl: string
  delay: number
}

export interface AppState {
  videoFile: File | null
  videoUrl: string | null
  videoDuration: number
  videoWidth: number
  videoHeight: number
  format: OutputFormat
  settings: EditorSettings
  status: ProcessingStatus
  resultBlob: Blob | null
  resultUrl: string | null
  estimatedSize: number
  progress: number
  errorMessage: string | null
  fpsAutoAdjusted: boolean
}
