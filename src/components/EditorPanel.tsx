import { useState } from 'react'
import type { EditorSettings } from '../types'
import { formatSize } from '../utils/sizeEstimator'

interface EditorPanelProps {
  settings: EditorSettings
  onChange: (s: EditorSettings) => void
  estimatedSize: number
  frameCount: number
  disabled: boolean
  originalWidth: number
  originalHeight: number
  showMobileFpsHint?: boolean
}

export default function EditorPanel({
  settings,
  onChange,
  estimatedSize,
  frameCount,
  disabled,
  originalWidth,
  originalHeight,
  showMobileFpsHint,
}: EditorPanelProps) {
  const [locked, setLocked] = useState(true)

  const showMobileWarning = frameCount > 400

  const ratio = settings.width / settings.height

  const update = (partial: Partial<EditorSettings>) => {
    onChange({ ...settings, ...partial })
  }

  const handleWidthChange = (newW: number) => {
    if (locked) {
      update({ width: newW, height: Math.round(newW / ratio) })
    } else {
      update({ width: newW })
    }
  }

  const handleHeightChange = (newH: number) => {
    if (locked) {
      update({ height: newH, width: Math.round(newH * ratio) })
    } else {
      update({ height: newH })
    }
  }

  const restoreOriginal = () => {
    update({ width: originalWidth, height: originalHeight })
  }

  const halfSize = () => {
    const w = Math.round(settings.width * 0.5)
    if (locked) {
      update({ width: Math.max(32, w), height: Math.max(32, Math.round(w / ratio)) })
    } else {
      update({ width: Math.max(32, w), height: Math.max(32, Math.round(settings.height * 0.5)) })
    }
  }

  return (
    <div className={`editor-panel ${disabled ? 'disabled' : ''}`}>
      <h3>Ajustes de salida</h3>

      <div className="editor-grid">
        <div className="field">
          <label>Ancho (px)</label>
          <input
            type="number"
            min={32}
            max={3840}
            step={2}
            value={settings.width}
            onChange={(e) => handleWidthChange(Math.max(32, parseInt(e.target.value) || 32))}
            disabled={disabled}
          />
        </div>

        <div className="field">
          <label>Alto (px)</label>
          <input
            type="number"
            min={32}
            max={3840}
            step={2}
            value={settings.height}
            onChange={(e) => handleHeightChange(Math.max(32, parseInt(e.target.value) || 32))}
            disabled={disabled}
          />
        </div>

        <div className="field field-lock">
          <label>&nbsp;</label>
          <button
            className={`btn-icon ${locked ? 'active' : ''}`}
            onClick={() => setLocked(!locked)}
            disabled={disabled}
            title={locked ? 'Proporción bloqueada' : 'Proporción libre'}
          >
            {locked ? 'Bloqueado' : 'Libre'}
          </button>
        </div>
      </div>

      <div className="ratio-actions">
        <button
          className="btn-ratio"
          onClick={halfSize}
          disabled={disabled}
        >
          50%
        </button>
        <button
          className="btn-ratio"
          onClick={restoreOriginal}
          disabled={disabled}
        >
          Tamaño original ({originalWidth}x{originalHeight})
        </button>
      </div>

      <div className="field">
        <label>
          FPS: {settings.fps}
          {showMobileFpsHint && (
            <span className="fps-hint">⚡ Óptimo para móvil</span>
          )}
        </label>
        <input
          type="range"
          min={1}
          max={30}
          value={settings.fps}
          onChange={(e) => update({ fps: parseInt(e.target.value) })}
          disabled={disabled}
        />
        <div className="range-ends">
          <span>1</span>
          <span>30</span>
        </div>
      </div>

      <div className="field">
        <label>Calidad: {settings.quality}%</label>
        <input
          type="range"
          min={5}
          max={100}
          value={settings.quality}
          onChange={(e) => update({ quality: parseInt(e.target.value) })}
          disabled={disabled}
        />
        <div className="range-ends">
          <span>Ligero</span>
          <span>Alta</span>
        </div>
      </div>

      {showMobileWarning && (
        <div className="mobile-warning">
          Animaciones muy largas pueden tardar más en procesarse en dispositivos móviles
        </div>
      )}

      <div className="stats">
        <div className="stat">
          <span className="stat-label">Frames</span>
          <span className="stat-value">{frameCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Duración</span>
          <span className="stat-value">
            {(settings.endTime - settings.startTime).toFixed(1)}s
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Peso estimado</span>
          <span className="stat-value">{formatSize(estimatedSize)}</span>
        </div>
      </div>
    </div>
  )
}
