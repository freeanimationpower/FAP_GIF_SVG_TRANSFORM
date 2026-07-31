import { useRef, useEffect } from 'react'

interface VideoPreviewProps {
  videoUrl: string
  startTime: number
  endTime: number
  onStartTimeChange: (t: number) => void
  onEndTimeChange: (t: number) => void
  duration: number
}

export default function VideoPreview({
  videoUrl,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  duration,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const syncTime = () => {
      if (video.currentTime < startTime) {
        video.currentTime = startTime
      }
      if (video.currentTime > endTime) {
        video.currentTime = startTime
      }
    }

    video.addEventListener('timeupdate', syncTime)
    return () => video.removeEventListener('timeupdate', syncTime)
  }, [startTime, endTime])

  const formatTime = (s: number) => {
    const ms = Math.floor(s * 1000)
    const secs = Math.floor(ms / 1000)
    const millis = ms % 1000
    return `${secs}.${millis.toString().padStart(3, '0')}s`
  }

  return (
    <div className="preview">
      <h3>Vista previa</h3>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        muted
        loop
        className="preview-video"
        style={{ maxWidth: '100%', borderRadius: 8 }}
      />

      <div className="timeline-section">
        <div className="timeline-labels">
          <span>Inicio: {formatTime(startTime)}</span>
          <span>Fin: {formatTime(endTime)}</span>
        </div>

        <div className="range-group">
          <label>Inicio</label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={startTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              if (val < endTime - 0.1) onStartTimeChange(val)
            }}
          />
        </div>

        <div className="range-group">
          <label>Fin</label>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={endTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              if (val > startTime + 0.1) onEndTimeChange(val)
            }}
          />
        </div>

        <div className="timeline-bar">
          <div
            className="timeline-selection"
            style={{
              left: `${(startTime / duration) * 100}%`,
              width: `${((endTime - startTime) / duration) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
