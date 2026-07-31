import type { FrameData, EditorSettings } from '../types'

export function encodeSvg(
  frames: FrameData[],
  settings: EditorSettings
): Blob {
  const { width, height } = settings
  const totalDuration = frames.length * (1000 / settings.fps)

  const keyframesSteps = frames
    .map((_, i) => {
      const pct = (i / (frames.length - 1 || 1)) * 100
      return `${pct.toFixed(0)}% { visibility: visible }`
    })
    .join('\n        ')

  const images = frames
    .map(
      (frame, i) => `
      <image
        class="frame f${i}"
        x="0" y="0"
        width="${width}" height="${height}"
        href="${frame.dataUrl}"
        preserveAspectRatio="xMidYMid slice"
      />`
    )
    .join('')

  const cssRules = frames
    .map(
      (_, i) => {
        const start = (i / frames.length) * 100
        return `
        .f${i} {
          animation: showFrame ${totalDuration}ms step-end infinite;
          animation-delay: ${start * totalDuration / 100}ms;
        }`
      }
    )
    .join('')

  const svgContent = `<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
>
  <style>
    .frame {
      position: absolute;
      top: 0;
      left: 0;
      visibility: hidden;
    }
    @keyframes showFrame {
      ${keyframesSteps}
    }
    ${cssRules}
  </style>
  ${images}
</svg>`

  return new Blob([svgContent], { type: 'image/svg+xml' })
}
