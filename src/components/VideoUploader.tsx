import { useRef, useState } from 'react'
import type { DragEvent, ChangeEvent } from 'react'

interface VideoUploaderProps {
  onVideoSelected: (file: File, url: string, duration: number, width: number, height: number) => void
  onError: (message: string) => void
}

export default function VideoUploader({ onVideoSelected, onError }: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      onError('Por favor selecciona un archivo de video válido')
      return
    }

    setLoading(true)
    try {
      const video = document.createElement('video')
      const url = URL.createObjectURL(file)

      const info = await new Promise<{ duration: number; width: number; height: number }>((resolve, reject) => {
        video.onloadedmetadata = () => {
          resolve({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          })
          URL.revokeObjectURL(url)
        }
        video.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('No se pudo leer el video'))
        }
        video.src = url
      })

      if (info.duration > 20) {
        onError('El video no debe superar los 20 segundos de duración')
        setLoading(false)
        return
      }

      const previewUrl = URL.createObjectURL(file)
      onVideoSelected(file, previewUrl, info.duration, info.width, info.height)
    } catch {
      onError('No se pudo procesar el video')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className={`uploader ${isDragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={onInputChange}
        hidden
      />

      {loading ? (
        <div className="uploader-content">
          <div className="spinner" />
          <p>Analizando video...</p>
        </div>
      ) : (
        <div className="uploader-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="uploader-title">Arrastra tu video aquí</p>
          <p className="uploader-sub">o haz clic para seleccionar</p>
          <p className="uploader-limit">Máximo 20 segundos · MP4, WebM, MOV</p>
        </div>
      )}
    </div>
  )
}
