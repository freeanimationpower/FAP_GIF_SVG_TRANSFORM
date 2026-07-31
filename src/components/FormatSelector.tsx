import type { OutputFormat } from '../types'

interface FormatSelectorProps {
  format: OutputFormat
  onChange: (f: OutputFormat) => void
  disabled: boolean
}

export default function FormatSelector({ format, onChange, disabled }: FormatSelectorProps) {
  return (
    <div className="format-selector">
      <button
        className={`format-btn ${format === 'gif' ? 'active' : ''}`}
        onClick={() => onChange('gif')}
        disabled={disabled}
      >
        <span className="format-badge">GIF</span>
        <span className="format-desc">Animación ligera · universal</span>
      </button>
      <button
        className={`format-btn ${format === 'svg' ? 'active' : ''}`}
        onClick={() => onChange('svg')}
        disabled={disabled}
      >
        <span className="format-badge">SVG</span>
        <span className="format-desc">Vector escalable · web</span>
      </button>
    </div>
  )
}
