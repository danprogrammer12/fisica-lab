import { useEffect, useRef, useState, useMemo } from 'react'

interface CircuitoRCProps {
  R: number       // kΩ
  C: number       // µF
  fem: number     // V
  mode: 'carga' | 'descarga'
}

export function CircuitoRCScene({ R, C, fem, mode }: CircuitoRCProps) {
  const graphRef   = useRef<HTMLCanvasElement>(null)
  const circuitRef = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef<number>(0)
  const tAnimRef   = useRef(0)
  const startRef   = useRef<number | null>(null)
  const [running, setRunning] = useState(true)
  const [currentT, setCurrentT] = useState(0)

  const tau  = R * 1000 * C * 1e-6
  const tMax = 5 * tau
  const tauMs = tau * 1000

  // Reset cuando cambian parámetros
  useEffect(() => {
    tAnimRef.current = 0
    startRef.current = null
    setCurrentT(0)
    setRunning(true)
  }, [R, C, fem, mode])

  const v = (t: number) =>
    mode === 'carga' ? fem * (1 - Math.exp(-t / tau)) : fem * Math.exp(-t / tau)
  const iAmp = (t: number) =>
    mode === 'carga'
      ? (fem / (R * 1000)) * Math.exp(-t / tau)
      : -(fem / (R * 1000)) * Math.exp(-t / tau)

  // ── Gráfico V(t) / I(t) ───────────────────────────────────────
  useEffect(() => {
    const canvas = graphRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      const p = canvas.parentElement!
      canvas.width  = p.clientWidth  * dpr
      canvas.height = p.clientHeight * dpr
      canvas.style.width  = p.clientWidth  + 'px'
      canvas.style.height = p.clientHeight + 'px'
    }
    resize()
    const obs = new ResizeObserver(resize)
    obs.observe(canvas.parentElement!)

    const draw = (ts: number) => {
      if (running) {
        if (!startRef.current) startRef.current = ts
        const elapsed = (ts - startRef.current) / 1000
        const simT = elapsed * (tMax / 8)
        if (simT < tMax) {
          tAnimRef.current = simT
          setCurrentT(simT)
        } else {
          tAnimRef.current = tMax
          setCurrentT(tMax)
        }
      }

      const ctx = canvas.getContext('2d')!
      const W = canvas.width, H = canvas.height
      const PAD = { l: 52 * dpr, r: 52 * dpr, t: 24 * dpr, b: 40 * dpr }
      const gW = W - PAD.l - PAD.r, gH = H - PAD.t - PAD.b

      // Fondo
      ctx.fillStyle = '#050912'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#0a101e'
      ctx.fillRect(PAD.l, PAD.t, gW, gH)

      // Ejes
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1 * dpr
      ctx.strokeRect(PAD.l, PAD.t, gW, gH)

      // Grid horizontal
      ctx.setLineDash([3 * dpr, 3 * dpr])
      for (let i = 1; i <= 4; i++) {
        const y = PAD.t + gH * (i / 4)
        ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(PAD.l + gW, y)
        ctx.strokeStyle = '#1e293b22'; ctx.stroke()
      }
      ctx.setLineDash([])

      // Label τ vertical
      const tauX = PAD.l + (tauMs / (tMax * 1000)) * gW
      ctx.setLineDash([4 * dpr, 3 * dpr])
      ctx.strokeStyle = 'rgba(167,139,250,0.5)'; ctx.lineWidth = 1.2 * dpr
      ctx.beginPath(); ctx.moveTo(tauX, PAD.t); ctx.lineTo(tauX, PAD.t + gH)
      ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = 'rgba(167,139,250,0.7)'; ctx.font = `${9 * dpr}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText('τ', tauX, PAD.t - 6 * dpr)

      const STEPS = 300
      const toX = (t: number) => PAD.l + (t / tMax) * gW
      const toYv = (val: number) => PAD.t + gH - (val / fem) * gH * 0.88
      const Imax = fem / (R * 1000)
      const toYi = (val: number) => PAD.t + gH - ((val + Imax) / (2 * Imax)) * gH

      // Curva V(t) — verde
      ctx.beginPath()
      for (let s = 0; s <= STEPS; s++) {
        const t = (s / STEPS) * tMax
        const x = toX(t), y = toYv(v(t))
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2.5 * dpr; ctx.stroke()

      // Curva I(t) — amarillo, trazo
      ctx.beginPath()
      for (let s = 0; s <= STEPS; s++) {
        const t = (s / STEPS) * tMax
        const x = toX(t), y = toYi(iAmp(t) * 1000)
        s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.8 * dpr
      ctx.setLineDash([5 * dpr, 3 * dpr]); ctx.stroke(); ctx.setLineDash([])

      // Línea tiempo actual
      const currentSimT = tAnimRef.current
      const tx = toX(currentSimT)
      ctx.strokeStyle = 'rgba(239,68,68,0.7)'; ctx.lineWidth = 1.5 * dpr
      ctx.setLineDash([4 * dpr, 3 * dpr])
      ctx.beginPath(); ctx.moveTo(tx, PAD.t); ctx.lineTo(tx, PAD.t + gH)
      ctx.stroke(); ctx.setLineDash([])

      // Punto en curvas
      const vNow = v(currentSimT), iNow = iAmp(currentSimT) * 1000
      ctx.beginPath(); ctx.arc(tx, toYv(vNow), 5 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = '#10b981'; ctx.fill()
      ctx.beginPath(); ctx.arc(tx, toYi(iNow), 4 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = '#f59e0b'; ctx.fill()

      // Eje X labels
      ctx.fillStyle = '#475569'; ctx.font = `${9 * dpr}px monospace`
      ctx.textAlign = 'center'
      for (let i = 0; i <= 5; i++) {
        const t = (i / 5) * tMax
        ctx.fillText(`${(t * 1000).toFixed(0)}ms`, toX(t), PAD.t + gH + 14 * dpr)
      }
      // Eje Y labels V
      ctx.fillStyle = '#10b981'; ctx.textAlign = 'right'
      ctx.fillText(`${fem}V`, PAD.l - 4 * dpr, PAD.t + gH * 0.08)
      ctx.fillText('0V', PAD.l - 4 * dpr, PAD.t + gH - 2 * dpr)

      // Leyenda
      ctx.font = `${9 * dpr}px monospace`; ctx.textAlign = 'left'
      ctx.fillStyle = '#10b981'; ctx.fillText('— V(t)', PAD.l + 8 * dpr, PAD.t + 16 * dpr)
      ctx.fillStyle = '#f59e0b'; ctx.fillText('- - I(t)', PAD.l + 70 * dpr, PAD.t + 16 * dpr)
      ctx.fillStyle = 'rgba(167,139,250,0.7)'; ctx.fillText(`τ=${tauMs.toFixed(1)}ms`, PAD.l + 140 * dpr, PAD.t + 16 * dpr)

      if (running && tAnimRef.current < tMax) rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(rafRef.current); obs.disconnect() }
  }, [R, C, fem, mode, running, tau, tMax, tauMs])

  // ── Diagrama del circuito RC animado ─────────────────────────
  useEffect(() => {
    const canvas = circuitRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width  = 240 * dpr; canvas.height = 180 * dpr
    canvas.style.width = '240px'; canvas.style.height = '180px'

    let animFrame = 0
    let tCirc = 0

    const drawCircuit = () => {
      const ctx = canvas.getContext('2d')!
      tCirc += 0.03
      ctx.fillStyle = '#0a101e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const s = dpr
      // Nodos del circuito simple: FEM — R — C
      // A(25,30) — top — B(215,30) — R (215,30→215,90) — C(215,90→215,150) — bot — A
      const nodes = { A: [25*s, 30*s], B: [215*s, 30*s], C: [215*s, 90*s], D: [215*s, 150*s], E: [25*s, 150*s] }

      const lineStyle = (color: string, w: number) => { ctx.strokeStyle = color; ctx.lineWidth = w * s }

      const iNow = Math.abs(iAmp(tAnimRef.current))
      const vNow = v(tAnimRef.current)
      const lineAlpha = Math.min(1, iNow / (fem / (R * 1000)) + 0.2)

      // Cables
      lineStyle(`rgba(52,211,153,${lineAlpha})`, 1.8)
      ctx.beginPath()
      ctx.moveTo(...nodes.A as [number,number]); ctx.lineTo(...nodes.B as [number,number])
      ctx.moveTo(...nodes.D as [number,number]); ctx.lineTo(...nodes.E as [number,number])
      ctx.moveTo(...nodes.E as [number,number]); ctx.lineTo(...nodes.A as [number,number])
      ctx.stroke()

      // Resistencia (zigzag)
      ctx.strokeStyle = `rgba(251,191,36,${lineAlpha})`; ctx.lineWidth = 1.8 * s
      const rx = 120*s, ry1 = 30*s, ry2 = 90*s, rw = 20*s
      ctx.beginPath()
      ctx.moveTo(nodes.B[0], nodes.B[1]); ctx.lineTo(rx + rw, ry1)
      const rzSteps = 6
      for (let i = 0; i <= rzSteps; i++) {
        const zy = ry1 + (i / rzSteps) * (ry2 - ry1)
        ctx.lineTo(rx + (i % 2 === 0 ? rw : -rw), zy)
      }
      ctx.lineTo(rx + rw, ry2); ctx.lineTo(nodes.C[0], nodes.C[1])
      ctx.stroke()
      ctx.fillStyle = 'rgba(251,191,36,0.7)'; ctx.font = `${9 * s}px monospace`
      ctx.textAlign = 'center'; ctx.fillText(`R=${R}kΩ`, rx - 20*s, (ry1+ry2)/2)

      // Capacitor (placas)
      const cy1 = 100*s, cy2 = 120*s, ch = 20*s, cx = 215*s
      lineStyle('rgba(59,130,246,0.85)', 2.5)
      ctx.beginPath()
      ctx.moveTo(nodes.C[0], nodes.C[1]); ctx.lineTo(cx, cy1)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - ch, cy1); ctx.lineTo(cx + ch, cy1)
      ctx.moveTo(cx - ch, cy2); ctx.lineTo(cx + ch, cy2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy2); ctx.lineTo(nodes.D[0], nodes.D[1])
      ctx.stroke()
      ctx.fillStyle = 'rgba(59,130,246,0.7)'; ctx.font = `${9 * s}px monospace`
      ctx.textAlign = 'left'; ctx.fillText(`C=${C}µF`, cx + ch + 3*s, (cy1+cy2)/2)

      // Batería (lado izquierdo)
      const bx = 25*s, by1 = 50*s, by2 = 130*s
      lineStyle('rgba(16,185,129,0.8)', 2)
      ctx.beginPath(); ctx.moveTo(nodes.A[0], nodes.A[1]); ctx.lineTo(bx, by1); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(bx - 14*s, by1); ctx.lineTo(bx + 14*s, by1); ctx.stroke()
      ctx.lineWidth = 1.2*s
      ctx.beginPath(); ctx.moveTo(bx - 8*s, by1+10*s); ctx.lineTo(bx + 8*s, by1+10*s); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(bx - 14*s, by2); ctx.lineTo(bx + 14*s, by2); ctx.stroke()
      ctx.lineWidth = 1.2*s
      ctx.beginPath(); ctx.moveTo(bx - 8*s, by2-10*s); ctx.lineTo(bx + 8*s, by2-10*s); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(bx, by1+10*s); ctx.lineTo(bx, by2-10*s); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(bx, by2); ctx.lineTo(nodes.E[0], nodes.E[1]); ctx.stroke()
      ctx.fillStyle = 'rgba(16,185,129,0.8)'; ctx.font = `bold ${10 * s}px monospace`
      ctx.textAlign = 'center'; ctx.fillText(`${fem}V`, bx - 28*s, (by1+by2)/2)

      // Indicador V capacitor
      const vcFrac = vNow / fem
      ctx.fillStyle = `rgba(59,130,246,${0.3 + vcFrac * 0.5})`
      ctx.fillRect(cx - ch + 2*s, cy1 + 2*s, (ch*2 - 4*s) * vcFrac, cy2 - cy1 - 4*s)

      // Partículas de corriente
      const numP = 4
      for (let i = 0; i < numP; i++) {
        const frac = ((i / numP + tCirc * 0.25 * lineAlpha) % 1 + 1) % 1
        // Recorrer: A→B→R→C placa→…
        const pathLen = 1.0
        let px: number, py: number
        if (frac < 0.35) {
          const t2 = frac / 0.35
          px = nodes.A[0] + t2 * (nodes.B[0] - nodes.A[0])
          py = nodes.A[1]
        } else if (frac < 0.7) {
          const t2 = (frac - 0.35) / 0.35
          px = nodes.B[0]
          py = nodes.B[1] + t2 * (nodes.C[1] - nodes.B[1])
        } else {
          const t2 = (frac - 0.7) / 0.3
          px = nodes.D[0] + t2 * (nodes.A[0] - nodes.D[0])
          py = nodes.D[1] + t2 * (nodes.A[1] - nodes.D[1])
        }
        const alpha2 = Math.sin(frac * Math.PI) * lineAlpha * 0.9
        ctx.beginPath(); ctx.arc(px, py, 4*s, 0, Math.PI*2)
        ctx.fillStyle = `rgba(52,211,153,${alpha2})`; ctx.fill()
      }

      animFrame = requestAnimationFrame(drawCircuit)
    }

    animFrame = requestAnimationFrame(drawCircuit)
    return () => cancelAnimationFrame(animFrame)
  }, [R, C, fem, mode])

  const vNow = v(currentT), iNow = iAmp(currentT) * 1000, qNow = vNow * C

  return (
    <div className="flex flex-col h-full" style={{ background: '#050912' }}>
      {/* Gráfico principal */}
      <div className="flex-1 relative min-h-0">
        <canvas ref={graphRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>

      {/* Panel inferior: diagrama + valores */}
      <div className="flex items-center gap-4 px-3 py-2 border-t border-slate-800/60" style={{ minHeight: 200 }}>
        <canvas ref={circuitRef} style={{ flexShrink: 0, borderRadius: 8, border: '1px solid #1e293b' }} />

        <div className="flex flex-col gap-1.5 flex-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
            <span style={{ color: '#10b981' }}>V(t) = {vNow.toFixed(2)} V</span>
            <span style={{ color: '#f59e0b' }}>I(t) = {iNow.toFixed(3)} mA</span>
            <span style={{ color: '#3b82f6' }}>q(t) = {qNow.toFixed(2)} µC</span>
            <span style={{ color: '#a78bfa' }}>τ = RC = {tauMs.toFixed(1)} ms</span>
            <span className="text-slate-500">t = {(currentT * 1000).toFixed(1)} ms</span>
            <span className="text-slate-500">{mode === 'carga' ? 'Cargando →' : 'Descargando →'}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { tAnimRef.current = 0; startRef.current = null; setCurrentT(0); setRunning(true) }}
              className="px-3 py-1 rounded text-xs border border-slate-700 text-slate-400 hover:border-slate-500 transition-colors"
            >↺ Reset</button>
            <button
              onClick={() => setRunning((r) => !r)}
              className="px-3 py-1 rounded text-xs border transition-colors"
              style={{ borderColor: running ? '#ef4444' : '#10b981', color: running ? '#ef4444' : '#10b981' }}
            >{running ? '⏸ Pausar' : '▶ Continuar'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
