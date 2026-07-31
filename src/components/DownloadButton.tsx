import type { OutputFormat, ProcessingStatus } from '../types'

interface DownloadButtonProps {
  resultUrl: string | null
  format: OutputFormat
  status: ProcessingStatus
  progress: number
  onGenerate: () => void
}

export default function DownloadButton({
  resultUrl,
  format,
  status,
  progress,
  onGenerate,
}: DownloadButtonProps) {
  const isProcessing = status === 'processing'
  const isDone = status === 'done'

  if (isDone && resultUrl) {
    return (
      <div className="download-section">
        <div className="result-preview">
          {format === 'gif' ? (
            <img src={resultUrl} alt="Resultado GIF" className="result-media" />
          ) : (
            <img src={resultUrl} alt="Resultado SVG" className="result-media" />
          )}
        </div>
        <a
          href={resultUrl}
          download={`animacion.${format}`}
          className="btn-download"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Descargar {format.toUpperCase()}
        </a>
      </div>
    )
  }

  return (
    <div className="generate-section">
      {isProcessing && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span className="progress-text">Procesando... {progress}%</span>
        </div>
      )}
      <button
        className="btn-generate"
        onClick={onGenerate}
        disabled={isProcessing}
      >
        {isProcessing ? 'Generando...' : `Generar ${format.toUpperCase()}`}
      </button>
    </div>
  )
}
