import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function drawField(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  charge: number,
  _magnitude: number,
  numLines: number,
) {
  ctx.clearRect(0, 0, W, H)

  // Background grid
  ctx.strokeStyle = 'rgba(30,41,59,0.5)'
  ctx.lineWidth = 0.5
  for (let x = 0; x <= W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  for (let y = 0; y <= H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  const cx = W / 2
  const cy = H / 2
  const isPos = charge >= 0
  const lineColor = isPos ? 'rgba(249,115,22,' : 'rgba(129,140,248,'

  // Field lines
  for (let k = 0; k < numLines; k++) {
    const angle = (k / numLines) * Math.PI * 2
    let x = cx + Math.cos(angle) * 18
    let y = cy + Math.sin(angle) * 18

    ctx.beginPath()
    ctx.moveTo(x, y)

    for (let s = 0; s < 120; s++) {
      const dx = x - cx
      const dy = y - cy
      const r2 = dx * dx + dy * dy
      if (r2 < 4 || Math.sqrt(r2) > Math.max(W, H) * 0.55) break

      const r = Math.sqrt(r2)
      const ex = (dx / r) * (isPos ? 1 : -1)
      const ey = (dy / r) * (isPos ? 1 : -1)

      x += ex * 4
      y += ey * 4
      ctx.lineTo(x, y)
    }

    const opacity = 0.35 + (k % 3 === 0 ? 0.3 : 0)
    ctx.strokeStyle = lineColor + opacity + ')'
    ctx.lineWidth = k % 3 === 0 ? 1.5 : 1
    ctx.stroke()

    // Arrow
    const arrowDist = 60
    const ax = cx + Math.cos(angle) * arrowDist
    const ay = cy + Math.sin(angle) * arrowDist
    const dir = isPos ? 1 : -1
    const adx = Math.cos(angle) * dir
    const ady = Math.sin(angle) * dir
    const arrowSize = 5
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(ax - adx * arrowSize + ady * arrowSize * 0.5, ay - ady * arrowSize - adx * arrowSize * 0.5)
    ctx.lineTo(ax - adx * arrowSize - ady * arrowSize * 0.5, ay - ady * arrowSize + adx * arrowSize * 0.5)
    ctx.closePath()
    ctx.fillStyle = lineColor + '0.7)'
    ctx.fill()
  }

  // Glow around charge
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50)
  grd.addColorStop(0, isPos ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)')
  grd.addColorStop(1, 'transparent')
  ctx.beginPath()
  ctx.arc(cx, cy, 50, 0, Math.PI * 2)
  ctx.fillStyle = grd
  ctx.fill()

  // Charge marker
  const markerGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14)
  markerGrd.addColorStop(0, isPos ? '#ef4444' : '#3b82f6')
  markerGrd.addColorStop(1, isPos ? '#991b1b' : '#1e3a8a')
  ctx.beginPath()
  ctx.arc(cx, cy, 14, 0, Math.PI * 2)
  ctx.fillStyle = markerGrd
  ctx.fill()
  ctx.strokeStyle = isPos ? 'rgba(239,68,68,0.6)' : 'rgba(59,130,246,0.6)'
  ctx.lineWidth = 2
  ctx.stroke()

  // +/- symbol
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 16px Inter, system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(isPos ? '+' : '−', cx, cy)

  // Field value label
  const E = 8.99e9 * Math.abs(charge) * 1e-9 / (1 * 1)
  ctx.fillStyle = 'rgba(148,163,184,0.8)'
  ctx.font = '11px Inter, monospace'
  ctx.textAlign = 'right'
  ctx.fillText(`E = ${E.toFixed(0)} N/C @ 1m`, W - 12, H - 10)
}

export function QuickLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [chargeSign, setChargeSign] = useState<1 | -1>(1)
  const [magnitude, setMagnitude] = useState(5)
  const [numLines, setNumLines] = useState(12)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    drawField(ctx, W, H, chargeSign * magnitude, magnitude, numLines)
  }, [chargeSign, magnitude, numLines])

  const accentColor = chargeSign > 0 ? '#f97316' : '#818cf8'

  return (
    <div
      className="rounded-2xl overflow-hidden border"
      style={{
        background: 'rgba(2,6,23,0.8)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.06)',
        boxShadow: '0 0 60px rgba(59,130,246,0.08)',
      }}
    >
      <div className="flex flex-col lg:flex-row">
        {/* Controls */}
        <div className="w-full lg:w-72 p-6 border-b lg:border-b-0 lg:border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)' }}>
              <Zap size={14} className="text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-slate-300">Laboratorio Rápido</span>
          </div>

          {/* Charge selector */}
          <div className="mb-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Tipo de carga</p>
            <div className="flex gap-2">
              {([1, -1] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setChargeSign(s)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                  style={chargeSign === s
                    ? { background: s > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', color: s > 0 ? '#ef4444' : '#3b82f6', border: `1px solid ${s > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}` }
                    : { background: 'rgba(255,255,255,0.03)', color: '#475569', border: '1px solid rgba(255,255,255,0.06)' }
                  }
                >
                  {s > 0 ? '+ Positiva' : '− Negativa'}
                </button>
              ))}
            </div>
          </div>

          {/* Magnitude slider */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Magnitud</p>
              <span className="text-xs font-mono" style={{ color: accentColor }}>{magnitude.toFixed(1)} nC</span>
            </div>
            <input
              type="range" min={0.5} max={15} step={0.5} value={magnitude}
              onChange={(e) => setMagnitude(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor }}
            />
            <div className="flex justify-between text-xs text-slate-700 mt-1">
              <span>0.5 nC</span><span>15 nC</span>
            </div>
          </div>

          {/* Density slider */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Densidad de líneas</p>
              <span className="text-xs font-mono text-slate-400">{numLines}</span>
            </div>
            <input
              type="range" min={6} max={24} step={2} value={numLines}
              onChange={(e) => setNumLines(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#06b6d4' }}
            />
          </div>

          {/* Info */}
          <div className="p-3 rounded-xl mb-5 text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-slate-400">Campo a 1 m:</p>
            <p className="font-mono font-bold mt-1" style={{ color: accentColor }}>
              E = {(8.99e9 * magnitude * 1e-9).toFixed(0)} N/C
            </p>
          </div>

          <Link to="/campo-electrico">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
            >
              Iniciar Simulación 3D
              <ChevronRight size={14} />
            </motion.button>
          </Link>
        </div>

        {/* Canvas preview */}
        <div className="flex-1 relative min-h-[320px] flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            width={480}
            height={320}
            className="rounded-xl w-full"
            style={{ maxHeight: 320, background: '#020617' }}
          />
          <div
            className="absolute top-4 left-4 px-2 py-1 rounded-lg text-xs font-mono"
            style={{ background: 'rgba(2,6,23,0.8)', color: '#475569', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Vista previa 2D
          </div>
        </div>
      </div>
    </div>
  )
}
