import { useState, useCallback, useMemo, useEffect } from 'react'
import VideoUploader from './components/VideoUploader'
import VideoPreview from './components/VideoPreview'
import EditorPanel from './components/EditorPanel'
import FormatSelector from './components/FormatSelector'
import DownloadButton from './components/DownloadButton'
import type { AppState, EditorSettings, OutputFormat } from './types'
import { extractFrames } from './utils/videoProcessor'
import { encodeGif } from './utils/gifEncoder'
import { encodeSvg } from './utils/svgEncoder'
import { estimateGifSize, estimateSvgSize } from './utils/sizeEstimator'
import './App.css'

const DEFAULT_SETTINGS: EditorSettings = {
  width: 480,
  height: 270,
  fps: 10,
  quality: 70,
  startTime: 0,
  endTime: 3,
}

const MAX_DIMENSION = 960

function scaleDimensions(origW: number, origH: number): { width: number; height: number } {
  const longest = Math.max(origW, origH)
  if (longest <= MAX_DIMENSION) return { width: origW, height: origH }
  const ratio = MAX_DIMENSION / longest
  return {
    width: Math.round(origW * ratio),
    height: Math.round(origH * ratio),
  }
}

export default function App() {
  const [state, setState] = useState<AppState>({
    videoFile: null,
    videoUrl: null,
    videoDuration: 0,
    videoWidth: 0,
    videoHeight: 0,
    format: 'gif',
    settings: DEFAULT_SETTINGS,
    status: 'idle',
    resultBlob: null,
    resultUrl: null,
    estimatedSize: 0,
    progress: 0,
    errorMessage: null,
    fpsAutoAdjusted: false,
  })

  const handleVideoSelected = useCallback(
    (file: File, url: string, duration: number, videoWidth: number, videoHeight: number) => {
      const scaled = scaleDimensions(videoWidth, videoHeight)
      setState((prev) => ({
        ...prev,
        videoFile: file,
        videoUrl: url,
        videoDuration: duration,
        videoWidth,
        videoHeight,
        settings: {
          ...prev.settings,
          width: scaled.width,
          height: scaled.height,
          endTime: Math.min(3, duration),
        },
        status: 'idle',
        resultBlob: null,
        resultUrl: null,
        errorMessage: null,
        fpsAutoAdjusted: false,
      }))
    },
    []
  )

  const handleError = useCallback((message: string) => {
    setState((prev) => ({ ...prev, errorMessage: message }))
    setTimeout(() => setState((prev) => ({ ...prev, errorMessage: null })), 5000)
  }, [])

  const handleSettingsChange = useCallback((settings: EditorSettings) => {
    setState((prev) => ({ ...prev, settings }))
  }, [])

  const handleFormatChange = useCallback((format: OutputFormat) => {
    setState((prev) => ({ ...prev, format, status: 'idle', resultBlob: null, resultUrl: null }))
  }, [])

  const frameCount = useMemo(() => {
    const { startTime, endTime, fps } = state.settings
    return Math.floor((endTime - startTime) * fps)
  }, [state.settings])

  const estimatedSize = useMemo(() => {
    if (state.format === 'gif') {
      return estimateGifSize(state.settings, frameCount)
    }
    return estimateSvgSize(state.settings, frameCount)
  }, [state.format, state.settings, frameCount])

  useEffect(() => {
    const isMobile = window.innerWidth <= 600
    if (frameCount > 400 && isMobile && state.settings.fps > 15 && !state.fpsAutoAdjusted) {
      handleSettingsChange({ ...state.settings, fps: 15 })
      setState((prev) => ({ ...prev, fpsAutoAdjusted: true }))
    }
  }, [frameCount, state.settings.fps, state.fpsAutoAdjusted, handleSettingsChange])

  const handleGenerate = useCallback(async () => {
    if (!state.videoFile) return

    setState((prev) => ({ ...prev, status: 'processing', progress: 0 }))

    try {
      const frames = await extractFrames(state.videoFile, state.settings, (pct) => {
        setState((prev) => ({ ...prev, progress: Math.round(pct * 0.5) }))
      })

      if (state.format === 'gif') {
        const blob = await encodeGif(frames, state.settings, (pct) => {
          setState((prev) => ({ ...prev, progress: 50 + Math.round(pct * 0.5) }))
        })
        const url = URL.createObjectURL(blob)
        setState((prev) => ({
          ...prev,
          status: 'done',
          resultBlob: blob,
          resultUrl: url,
          progress: 100,
        }))
      } else {
        const blob = encodeSvg(frames, state.settings)
        const url = URL.createObjectURL(blob)
        setState((prev) => ({
          ...prev,
          status: 'done',
          resultBlob: blob,
          resultUrl: url,
          progress: 100,
        }))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setState((prev) => ({ ...prev, status: 'error', errorMessage: msg }))
      setTimeout(() => setState((prev) => ({ ...prev, errorMessage: null })), 5000)
    }
  }, [state.videoFile, state.settings, state.format])

  const reset = useCallback(() => {
    if (state.videoUrl) URL.revokeObjectURL(state.videoUrl)
    if (state.resultUrl) URL.revokeObjectURL(state.resultUrl)
    setState({
      videoFile: null,
      videoUrl: null,
      videoDuration: 0,
      videoWidth: 0,
      videoHeight: 0,
      format: 'gif',
      settings: DEFAULT_SETTINGS,
      status: 'idle',
      resultBlob: null,
      resultUrl: null,
      estimatedSize: 0,
      progress: 0,
      errorMessage: null,
      fpsAutoAdjusted: false,
    })
  }, [state.videoUrl, state.resultUrl])

  const frameCountAt30 = Math.floor((state.settings.endTime - state.settings.startTime) * 30)
  const isMobile = window.innerWidth <= 600
  const showMobileFpsHint = state.settings.fps <= 15 && frameCountAt30 > 400 && isMobile

  return (
    <div className="app">
      <header className="app-header">
        <img src="/logo.png" alt="Transformador GIF / SVG Online" className="app-logo" />
        {state.videoFile && (
          <button className="btn-reset" onClick={reset}>
            Nuevo video
          </button>
        )}
      </header>

      {state.errorMessage && (
        <div className="toast-error">{state.errorMessage}</div>
      )}

      {!state.videoFile ? (
        <VideoUploader
          onVideoSelected={handleVideoSelected}
          onError={handleError}
        />
      ) : (
        <div className="workspace">
          <div className="workspace-left">
            <FormatSelector
              format={state.format}
              onChange={handleFormatChange}
              disabled={state.status === 'processing'}
            />

            <VideoPreview
              videoUrl={state.videoUrl!}
              startTime={state.settings.startTime}
              endTime={state.settings.endTime}
              onStartTimeChange={(t) =>
                handleSettingsChange({ ...state.settings, startTime: t })
              }
              onEndTimeChange={(t) =>
                handleSettingsChange({ ...state.settings, endTime: t })
              }
              duration={state.videoDuration}
            />
          </div>

          <div className="workspace-right">
            <EditorPanel
              settings={state.settings}
              onChange={handleSettingsChange}
              estimatedSize={estimatedSize}
              frameCount={frameCount}
              disabled={state.status === 'processing'}
              originalWidth={state.videoWidth}
              originalHeight={state.videoHeight}
              showMobileFpsHint={showMobileFpsHint}
            />

            <DownloadButton
              resultUrl={state.resultUrl}
              format={state.format}
              status={state.status}
              progress={state.progress}
              onGenerate={handleGenerate}
            />
          </div>
        </div>
      )}
    </div>
  )
}
