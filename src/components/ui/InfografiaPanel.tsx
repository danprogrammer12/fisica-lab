import { useState } from 'react'
import { X, ZoomIn, ZoomOut, Image } from 'lucide-react'

interface InfografiaPanelProps {
  src: string
  title: string
  accentColor?: string
}

export function InfografiaPanel({ src, title, accentColor = '#3b82f6' }: InfografiaPanelProps) {
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(1)

  return (
    <>
      {/* Botón flotante — estilo distinto a los tabs */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all hover:opacity-90"
        style={{ color: accentColor, backgroundColor: 'transparent', border: `1px solid ${accentColor}55` }}
      >
        <Image size={12} />
        Infografía
      </button>

      {/* Overlay modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ maxWidth: '95vw', maxHeight: '92vh', border: `1px solid ${accentColor}40`, backgroundColor: '#0a101e' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ borderColor: `${accentColor}30`, backgroundColor: '#080c14' }}
            >
              <span className="text-sm font-bold text-slate-200">{title}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-xs text-slate-500 font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors ml-1"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Imagen scrollable */}
            <div
              className="overflow-auto"
              style={{ maxHeight: 'calc(92vh - 48px)' }}
            >
              <img
                src={src}
                alt={title}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  width: `${100 / zoom}%`,
                  display: 'block',
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
