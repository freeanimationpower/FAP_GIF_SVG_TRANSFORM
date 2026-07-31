# Transformador GIF / SVG Online

> **Accede directamente**: [freeanimationpower.org/tools/gif-maker/](https://freeanimationpower.org/tools/gif-maker/) — Convierte videos a GIF/SVG sin instalar nada.

Herramienta web 100% cliente para convertir videos cortos a GIF animados o SVG animados. Sin backend, sin subidas a servidor — todo el procesamiento ocurre en el navegador.

## Funcionalidades

### Subida de video
- **Drag & drop** o click para seleccionar archivo
- Formatos aceptados: MP4, WebM, MOV y cualquier video soportado por el navegador
- Validación automática de duración: **máximo 20 segundos**
- Detección automática de dimensiones originales del video

### Recorte de timeline
- Sliders independientes para **inicio** y **fin** del fragmento a convertir
- Vista previa en tiempo real con reproducción limitada al rango seleccionado
- Barra visual con el segmento activo resaltado
- Precisión de centésimas de segundo

### Ajustes de salida

| Control | Rango | Descripción |
|---|---|---|
| **Ancho / Alto** | 32 – 3840 px | Dimensiones del archivo de salida. Se inicializan automáticamente escaladas desde el video original (máx 960 px en el lado más largo) |
| **Bloqueo de proporción** | On / Off | Al activarlo, cambiar un lado ajusta el otro automáticamente manteniendo el aspect ratio actual |
| **50%** | — | Reduce ancho y alto a la mitad, respetando el bloqueo de proporción |
| **Tamaño original** | — | Restaura las dimensiones exactas del video fuente |
| **FPS** | 1 – 30 | Cuadros por segundo del archivo generado. Determina fluidez vs peso. En móvil, si la combinación genera más de 400 frames, el sistema sugiere 15 FPS automáticamente (el usuario puede subirlo manualmente a 30). |
| **Calidad** | 5% – 100% | Afecta la compresión y por tanto el peso final del archivo |

### Estadísticas en tiempo real
- **Frames**: cantidad total de cuadros que se generarán
- **Duración**: longitud del fragmento seleccionado
- **Peso estimado**: cálculo aproximado del tamaño del archivo final
- **Advertencia de rendimiento**: si la combinación duración × FPS supera 400 frames, aparece una alerta informando que la animación puede tardar más en dispositivos móviles

### Formatos de salida

| | GIF | SVG |
|---|---|---|
| **Tipo** | Animación rasterizada | Animación vectorial con frames incrustados |
| **Compatibilidad** | Universal (navegadores, apps, redes sociales) | Navegadores modernos, web |
| **Compresión** | GIF con paleta de colores optimizada | SVG con frames JPEG embebidos + CSS animation |
| **Caso de uso** | Memes, stickers, previews rápidos | Web, presentaciones, documentación |

### Procesamiento
- Barra de progreso en **dos fases**: extracción de frames (0–50%) y codificación GIF (50–100%)
- Procesamiento **100% cliente** — los datos nunca salen de tu dispositivo
- GIF generado con `gif.js` usando Web Workers para no congelar la UI
- SVG generado con CSS `@keyframes` para animación nativa del navegador
- Motor de extracción **seek-based frame-by-frame** optimizado para desktop y mobile

### Descarga
- Vista previa del resultado final
- Botón de descarga directa con nombre `animacion.gif` o `animacion.svg`

### Diseño responsive
- **Desktop** (>1024px): layout de 2 columnas (video + editor)
- **Tablet** (≤1024px): columnas más estrechas, logo reducido
- **Mobile** (≤600px): columna única apilada, botones ampliados para touch, sliders con touch target ≥36px

---

## Arquitectura

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Bundler** | Vite 8 |
| **GIF encoding** | gif.js (Web Workers) |
| **SVG encoding** | Generación propia (CSS keyframes + imágenes embebidas) |
| **Procesamiento de video** | APIs nativas del navegador: `<video>` + `<canvas>`, extracción seek-based frame-by-frame (`currentTime` + `seeked`) |
| **Estilos** | CSS puro con variables (`:root` tokens) |
| **Tipografía** | Outfit (headings) + Plus Jakarta Sans (cuerpo) vía Google Fonts |

### Estructura del proyecto

```
creador-gif/
├── index.html                     # Entry HTML + Google Fonts
├── package.json                   # Dependencias y scripts
├── vite.config.ts                 # Configuración de Vite
├── tsconfig.json                  # TypeScript base
├── tsconfig.app.json              # TypeScript para la app
├── public/
│   ├── gif.worker.js              # Worker de gif.js
│   └── logo.png                   # Logo de la herramienta
└── src/
    ├── main.tsx                   # Punto de entrada React
    ├── App.tsx                    # Componente raíz: estado global y orquestación
    ├── App.css                    # Estilos completos con tema y media queries
    ├── types.ts                   # Tipos TypeScript compartidos
    ├── gif.js.d.ts                # Declaración de tipos para gif.js
    ├── components/
    │   ├── VideoUploader.tsx      # Upload con drag & drop + validación
    │   ├── VideoPreview.tsx       # Reproductor + timeline con sliders
    │   ├── EditorPanel.tsx        # Controles de tamaño, FPS, calidad, stats
    │   ├── FormatSelector.tsx     # Toggle GIF / SVG
    │   └── DownloadButton.tsx     # Botón generar + progreso + descarga
    └── utils/
        ├── videoProcessor.ts      # Extracción de frames (seek-based, DOM-injected, memory-aware)
        ├── gifEncoder.ts          # Codificación GIF vía gif.js
        ├── svgEncoder.ts          # Generación de SVG animado
        └── sizeEstimator.ts       # Estimación de peso del archivo

```

### Flujo de procesamiento

```
┌─────────────────┐
│  Usuario sube   │
│  video (≤20s)   │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Detección de   │
│  dimensiones    │
│  originales     │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Usuario ajusta │
│  timeline,      │
│  tamaño, FPS,   │
│  calidad        │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Click "Generar"│
└────────┬────────┘
         ▼
┌───────────────────────────────────────┐
│  videoProcessor.ts (Fase 1: 0–50%)    │
│  ┌──────────────────────────────────┐ │
│  │ Crea <video> oculto en DOM      │ │
│  │ (iOS requiere árbol DOM)         │ │
│  │ muted playsinline autoplay       │ │
│  │ crossOrigin="anonymous"           │ │
│  │                                  │ │
│  │ ┌──────────────────────────────┐ │ │
│  │ │ Frame-by-frame seeking:      │ │ │
│  │ │ video.currentTime = T        │ │ │
│  │ │ await 'seeked' event         │ │ │
│  │ │ drawImage → canvas           │ │ │
│  │ │ toDataURL → FrameData        │ │ │
│  │ │ await yieldToMain()          │ │ │
│  │ │ (evita "Página no responde") │ │ │
│  │ └──────────────┬───────────────┘ │ │
│  │                ▼                 │ │
│  │ Array de FrameData[]             │ │
│  └──────────────────────────────────┘ │
└────────┬──────────────────────────────┘
         ▼
    ┌────┴────┐
    │  Formato │
    └────┬────┘
         ▼
   ┌──────────────────┬──────────────────┐
   │  GIF (50–100%)   │  SVG (directo)   │
   ▼                  ▼                  ▼
┌──────────┐   ┌────────────────────────┐
│ gif.js   │   │ svgEncoder.ts           │
│ Web      │   │ ┌────────────────────┐  │
│ Workers  │   │ │ <svg> con <image>  │  │
│          │   │ │ por frame + CSS    │  │
│ drawImage│   │ │ @keyframes anim    │  │
│ upscale  │   │ └────────────────────┘  │
│ al output│   │                         │
└────┬─────┘   └───────────┬─────────────┘
     ▼                     ▼
┌──────────────────────────────────────┐
│  Blob → URL.createObjectURL          │
│  Vista previa + Descarga             │
└──────────────────────────────────────┘
```

### Robustez mobile — Optimizaciones del motor de extracción

| Optimización | Implementación |
|---|---|
| **Extracción seek-based** | Se abandona `play()` + `requestAnimationFrame`. Se usa `video.currentTime = T` + `addEventListener('seeked')` frame por frame. Más fiable en iOS y Android. |
| **Inyección en DOM** | El `<video>` oculto se inserta en el árbol DOM (`document.body.appendChild`) con posicionamiento fuera de pantalla. iOS Safari bloquea la reproducción si el elemento no está en el DOM. |
| **Atributos mobile** | `muted`, `playsinline`, `webkit-playsinline`, `autoplay`, `crossOrigin="anonymous"`, `preload="auto"`. Evitan bloqueos del sistema operativo y permiten lectura de píxeles. |
| **Gestión de memoria (OOM)** | El canvas de captura aplica `calculateCaptureSize()`: si el output supera 960 px en cualquier lado, el canvas interno captura a resolución reducida. El encoder (`gif.js` o `svgEncoder`) hace el upscale al tamaño final con `drawImage(img, 0, 0, w, h)`. |
| **Yield al hilo principal** | `await new Promise(r => setTimeout(r, 0))` después de cada frame. Permite que React actualice la barra de progreso sin que el navegador arroje "Página no responde". |
| **Timeout por frame** | 12 segundos por seek. Si `seeked` no se dispara (video corrupto, códec no soportado), la promesa rechaza con mensaje descriptivo del tiempo exacto. |
| **Patrón de promesas** | Flag `settled` + `addEventListener`/`removeEventListener` (nunca `onseeked`). Timeout y listener se limpian mutuamente para evitar memory leaks. |
| **Limpieza garantizada** | Bloque `finally`: `pause()`, `removeAttribute('src')`, `load()`, `parentNode.removeChild()`, `revokeObjectURL()`. Sin recursos huérfanos. |
| **Contexto canvas optimizado** | `getContext('2d', { willReadFrequently: true })` para acelerar `toDataURL()` repetido. |
| **Reducción semi-automática de FPS** | En viewport ≤600px, si la extracción supera 400 frames, el FPS baja automáticamente a 15. El badge "⚡ Óptimo para móvil" lo indica. El usuario puede subirlo manualmente a 30 sin restricciones. |

### Tipos de datos principales

```typescript
type OutputFormat = 'gif' | 'svg'

interface EditorSettings {
  width: number       // px (32–3840)
  height: number      // px (32–3840)
  fps: number         // 1–30
  quality: number     // 5–100
  startTime: number   // segundos
  endTime: number     // segundos
}

interface FrameData {
  dataUrl: string     // JPEG base64
  delay: number       // ms entre frames
}

type ProcessingStatus = 'idle' | 'processing' | 'done' | 'error'

interface AppState {
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
}
```

### Tema visual

El diseño sigue la identidad **Free Animation Power** (Yellow / Ink Editorial):

| Token | Valor |
|---|---|
| Fondo | `#ffdc00` (amarillo) |
| Texto principal | `#070706` (ink) |
| Superficies | `#ffffff` (blanco) con borde `#ede4c0` |
| Acento | `#ff4200` (naranja) |
| Inputs | `#faf6e8` (warm) |
| Tipografía headings | Outfit 700–900 |
| Tipografía cuerpo | Plus Jakarta Sans 400–700 |
| Bordes redondeados | 10px – 50px (pill para botones) |
| Transiciones | `cubic-bezier(0.16, 1, 0.3, 1)` |

---

## Scripts

```bash
npm run dev       # Servidor de desarrollo en http://localhost:5173
npm run build     # Build de producción → carpeta dist/
npm run preview   # Previsualizar build de producción
npm run lint      # Lint con oxlint
```

## Deploy

El proyecto genera una carpeta `dist/` con archivos estáticos. Se puede desplegar en cualquier hosting de sitios estáticos:

- **Vercel**: arrastrar la carpeta o conectar el repo
- **Netlify**: `npm run build` → publicar `dist/`
- **GitHub Pages**: configurar Actions o publicar `dist/`
- **Cualquier CDN / servidor web**: servir los archivos de `dist/`

No requiere backend, bases de datos ni configuración de servidor.

## Requisitos del navegador

- Navegador moderno con soporte para:
  - `<video>` + `<canvas>` + `toDataURL()`
  - Web Workers (para gif.js)
  - `URL.createObjectURL`
  - Evento `seeked` en `<video>`
- Probado en Chrome, Firefox, Safari, Edge (desktop y mobile, iOS y Android)
