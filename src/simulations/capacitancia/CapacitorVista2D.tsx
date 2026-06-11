import { useRef, useEffect, useCallback } from 'react'

const EPSILON_0 = 8.854e-12

interface Props {
  area: number
  separation: number
  kappa: number
  voltage: number
}

export function CapacitorVista2DScene({ area, separation, kappa, voltage }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>()
  const tRef      = useRef(0)
  const lastTs    = useRef(0)

  const draw = useCallback((ts: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W   = canvas.clientWidth
    const H   = canvas.clientHeight
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width  = W * dpr
      canvas.height = H * dpr
    }
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const dt = Math.min((ts - lastTs.current) / 1000, 0.05)
    lastTs.current = ts
    tRef.current  += dt

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#070d1a'
    ctx.fillRect(0, 0, W, H)

    // ── Geometría base ────────────────────────────────────────
    const plateW  = Math.min(W * 0.50, 380)
    const plateH  = 18
    const gapVis  = Math.max(60, Math.min(H * 0.38, separation * 9000))
    const cx      = W * 0.52
    const midY    = H * 0.50
    const topY    = midY - gapVis / 2 - plateH
    const botY    = midY + gapVis / 2
    const leftX   = cx - plateW / 2
    const rightX  = cx + plateW / 2

    const posPlate = voltage >= 0  // placa superior es positiva cuando V >= 0
    const E        = Math.abs(voltage) / separation
    const C        = kappa * EPSILON_0 * area / separation
    const Q        = C * voltage
    const U        = 0.5 * C * voltage * voltage

    // ── Fondo entre placas (gradiente de potencial) ───────────
    if (Math.abs(voltage) > 0.1) {
      const alpha = Math.min(Math.abs(voltage) / 80, 1) * 0.28
      const topColor = posPlate ? `rgba(239,68,68,${alpha})` : `rgba(59,130,246,${alpha})`
      const botColor = posPlate ? `rgba(59,130,246,${alpha})` : `rgba(239,68,68,${alpha})`
      const grad = ctx.createLinearGradient(0, topY + plateH, 0, botY)
      grad.addColorStop(0,   topColor)
      grad.addColorStop(0.5, 'rgba(30,41,59,0.15)')
      grad.addColorStop(1,   botColor)
      ctx.fillStyle = grad
      ctx.fillRect(leftX, topY + plateH, plateW, gapVis)
    }

    // ── Dieléctrico ───────────────────────────────────────────
    if (kappa > 1.05) {
      const kAlpha = Math.min((kappa - 1) / 9, 1)
      ctx.fillStyle   = `rgba(109,40,217,${kAlpha * 0.20})`
      ctx.strokeStyle = `rgba(139,92,246,${kAlpha * 0.50})`
      ctx.lineWidth   = 1.5
      ctx.beginPath()
      ctx.rect(leftX + 2, topY + plateH, plateW - 4, gapVis)
      ctx.fill()
      ctx.stroke()

      // Etiqueta dieléctrico
      ctx.fillStyle    = `rgba(167,139,250,${0.5 + kAlpha * 0.4})`
      ctx.font         = 'bold 11px sans-serif'
      ctx.textAlign    = 'right'
      ctx.textBaseline = 'top'
      ctx.fillText(`Dieléctrico  κ = ${kappa.toFixed(1)}`, leftX - 8, topY + plateH + 4)

      // Moléculas polarizadas (dipoles alineados con el campo)
      const COLS = Math.max(3, Math.min(8, Math.floor(plateW / 55)))
      const ROWS = Math.max(2, Math.min(5, Math.floor(gapVis / 40)))
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const mx = leftX + (c + 0.5) * (plateW / COLS)
          const my = topY + plateH + (r + 0.5) * (gapVis / ROWS)
          const pw = 22, ph = 11

          // Cuerpo de la molécula
          ctx.beginPath()
          ctx.ellipse(mx, my, pw / 2, ph / 2, 0, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(167,139,250,${0.4 + kAlpha * 0.4})`
          ctx.lineWidth   = 1.2
          ctx.stroke()

          // Polo negativo (arriba → hacia placa positiva)
          ctx.beginPath()
          ctx.arc(mx, my - ph / 2 + 3, 3.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(59,130,246,${0.7 + kAlpha * 0.3})`
          ctx.fill()

          // Polo positivo (abajo → hacia placa negativa)
          ctx.beginPath()
          ctx.arc(mx, my + ph / 2 - 3, 3.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(239,68,68,${0.7 + kAlpha * 0.3})`
          ctx.fill()

          // Símbolos
          ctx.fillStyle    = 'rgba(255,255,255,0.9)'
          ctx.font         = 'bold 7px sans-serif'
          ctx.textAlign    = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('−', mx, my - ph / 2 + 3)
          ctx.fillText('+', mx, my + ph / 2 - 3)
        }
      }
    }

    // ── Líneas de campo E (sólidas, con múltiples flechas) ────
    if (Math.abs(voltage) > 0.1) {
      const numLines  = Math.max(4, Math.min(9, Math.floor(plateW / 48)))
      const lineAlpha = Math.min(0.35 + Math.abs(voltage) / 120, 0.85)
      const lineColor = posPlate ? `rgba(251,191,36,${lineAlpha})` : `rgba(96,165,250,${lineAlpha})`
      const dirDown   = posPlate  // campo de + a −: si placa top es positiva, campo va hacia abajo

      for (let i = 0; i < numLines; i++) {
        const x = leftX + (i + 0.5) * (plateW / numLines)

        // Línea continua
        ctx.beginPath()
        ctx.moveTo(x, topY + plateH + 4)
        ctx.lineTo(x, botY - 4)
        ctx.strokeStyle = lineColor
        ctx.lineWidth   = 1.8
        ctx.setLineDash([])
        ctx.stroke()

        // Tres flechas por línea distribuidas
        const arrowPositions = [0.25, 0.5, 0.75]
        for (const frac of arrowPositions) {
          const ay  = topY + plateH + gapVis * frac
          const aLen = 10
          const aDir = dirDown ? 1 : -1
          ctx.fillStyle = lineColor
          ctx.beginPath()
          ctx.moveTo(x,     ay + aDir * aLen / 2)
          ctx.lineTo(x - 6, ay - aDir * aLen / 2)
          ctx.lineTo(x + 6, ay - aDir * aLen / 2)
          ctx.closePath()
          ctx.fill()
        }
      }

      // Etiqueta E con flecha
      const labelX = rightX + 14
      const labelY = midY
      ctx.fillStyle    = lineColor
      ctx.font         = 'bold 13px monospace'
      ctx.textAlign    = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(`E⃗`, labelX, labelY - 18)
      ctx.font         = '12px monospace'
      ctx.fillStyle    = '#94a3b8'
      ctx.fillText(`${E.toFixed(0)} V/m`, labelX, labelY)
    }

    // ── Líneas equipotenciales ────────────────────────────────
    const NUM_EQUI = 4
    for (let i = 1; i <= NUM_EQUI; i++) {
      const frac  = i / (NUM_EQUI + 1)
      const ey    = topY + plateH + gapVis * frac
      const Vi    = voltage * (1 - frac)  // decrece de V a 0

      ctx.beginPath()
      ctx.moveTo(leftX, ey)
      ctx.lineTo(rightX, ey)
      ctx.strokeStyle = `rgba(100,116,139,0.4)`
      ctx.lineWidth   = 1
      ctx.setLineDash([4, 6])
      ctx.stroke()
      ctx.setLineDash([])

      // Etiqueta de voltaje en la equipotencial
      ctx.fillStyle    = 'rgba(100,116,139,0.75)'
      ctx.font         = '10px monospace'
      ctx.textAlign    = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${Vi.toFixed(1)} V`, rightX + 52, ey)
    }

    // ── Placas ────────────────────────────────────────────────
    const drawPlate = (y: number, positive: boolean) => {
      const col     = positive ? '#ef4444' : '#3b82f6'
      const colDim  = positive ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)'
      const symbol  = positive ? '+' : '−'
      const label   = positive ? 'Placa (+)' : 'Placa (−)'

      // Sombra/glow
      ctx.shadowColor = col
      ctx.shadowBlur  = 10
      ctx.fillStyle   = col
      ctx.beginPath()
      ctx.roundRect(leftX, y, plateW, plateH, 3)
      ctx.fill()
      ctx.shadowBlur = 0

      // Símbolos de carga en la placa
      const n       = Math.max(3, Math.min(14, Math.floor(plateW / 26)))
      const spacing = plateW / (n + 1)
      ctx.fillStyle    = 'rgba(255,255,255,0.92)'
      ctx.font         = 'bold 12px sans-serif'
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      for (let i = 1; i <= n; i++) {
        ctx.fillText(symbol, leftX + i * spacing, y + plateH / 2)
      }

      // Etiqueta lateral
      ctx.fillStyle    = col
      ctx.font         = '12px sans-serif'
      ctx.textAlign    = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, leftX - 10, y + plateH / 2)

      // Extensiones metálicas (conexión al circuito)
      ctx.strokeStyle = col
      ctx.lineWidth   = 3
      ctx.beginPath()
      ctx.moveTo(leftX, y + plateH / 2)
      ctx.lineTo(leftX - 70, y + plateH / 2)
      ctx.stroke()
    }

    drawPlate(topY, posPlate)
    drawPlate(botY, !posPlate)

    // ── Batería / fuente de voltaje ───────────────────────────
    const batX   = leftX - 70
    const batTop = topY + plateH / 2
    const batBot = botY + plateH / 2
    const batCX  = batX - 20
    const batMid = (batTop + batBot) / 2

    // Cable vertical
    ctx.strokeStyle = '#475569'
    ctx.lineWidth   = 2
    ctx.beginPath()
    ctx.moveTo(batX, batTop)
    ctx.lineTo(batCX, batTop)
    ctx.lineTo(batCX, batMid - 18)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(batX, batBot)
    ctx.lineTo(batCX, batBot)
    ctx.lineTo(batCX, batMid + 18)
    ctx.stroke()

    // Símbolo de batería (líneas alternadas)
    const batLines = [
      { y: batMid - 18, long: true  },
      { y: batMid - 9,  long: false },
      { y: batMid,      long: true  },
      { y: batMid + 9,  long: false },
      { y: batMid + 18, long: true  },
    ]
    for (const line of batLines) {
      const hw = line.long ? 12 : 7
      ctx.strokeStyle = line.long ? '#94a3b8' : '#64748b'
      ctx.lineWidth   = line.long ? 3 : 1.5
      ctx.beginPath()
      ctx.moveTo(batCX - hw, line.y)
      ctx.lineTo(batCX + hw, line.y)
      ctx.stroke()
    }

    // Etiqueta V en la batería
    ctx.fillStyle    = '#c4b5fd'
    ctx.font         = 'bold 13px monospace'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.abs(voltage).toFixed(0)} V`, batCX, batMid)

    // Signos + y − en la batería
    ctx.fillStyle = '#ef4444'
    ctx.font      = 'bold 14px sans-serif'
    ctx.fillText('+', batCX + 22, batMid - 22)
    ctx.fillStyle = '#3b82f6'
    ctx.fillText('−', batCX + 22, batMid + 22)

    // ── Partículas de carga animadas en las placas ────────────
    const t   = tRef.current
    const NUM = 10
    for (let i = 0; i < NUM; i++) {
      const frac   = ((i / NUM + t * 0.12) % 1 + 1) % 1
      const alpha  = Math.sin(frac * Math.PI) * 0.85
      const x      = leftX + frac * plateW

      // Placa superior
      const topCol = posPlate ? `rgba(255,150,150,${alpha})` : `rgba(100,160,255,${alpha})`
      ctx.fillStyle = topCol
      ctx.beginPath()
      ctx.arc(x, topY + plateH + 6, 3.5, 0, Math.PI * 2)
      ctx.fill()

      // Placa inferior (en sentido contrario)
      const botFrac = (1 - frac + 1) % 1
      const bx      = leftX + botFrac * plateW
      const botCol  = posPlate ? `rgba(100,160,255,${alpha})` : `rgba(255,150,150,${alpha})`
      ctx.fillStyle = botCol
      ctx.beginPath()
      ctx.arc(bx, botY - 6, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // ── Cota de separación d ──────────────────────────────────
    const cotaX = rightX + 48
    ctx.strokeStyle = '#475569'
    ctx.lineWidth   = 1
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    ctx.moveTo(rightX + 2, topY + plateH)
    ctx.lineTo(cotaX + 8, topY + plateH)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(rightX + 2, botY)
    ctx.lineTo(cotaX + 8, botY)
    ctx.stroke()
    ctx.setLineDash([])

    // Flecha de cota
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth   = 1.5
    ctx.beginPath()
    ctx.moveTo(cotaX, topY + plateH + 6)
    ctx.lineTo(cotaX, botY - 6)
    ctx.stroke()
    // Puntas
    for (const [y, dir] of [[topY + plateH + 5, -1], [botY - 5, 1]] as [number, number][]) {
      ctx.fillStyle = '#64748b'
      ctx.beginPath()
      ctx.moveTo(cotaX,     y)
      ctx.lineTo(cotaX - 4, y + dir * 8)
      ctx.lineTo(cotaX + 4, y + dir * 8)
      ctx.closePath(); ctx.fill()
    }
    ctx.fillStyle    = '#64748b'
    ctx.font         = '11px monospace'
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`d = ${(separation * 100).toFixed(1)} cm`, cotaX + 8, midY)

    // ── Panel de valores (esquina superior derecha) ───────────
    const panX = W - 14
    const panY = 14
    const lines = [
      { label: 'C = κε₀A/d', value: `${(C * 1e12).toFixed(2)} pF`, color: '#f59e0b' },
      { label: 'Q = C·V',    value: `${(Math.abs(Q) * 1e12).toFixed(1)} pC`, color: '#60a5fa' },
      { label: 'E = V/d',    value: `${E.toFixed(0)} V/m`, color: '#fbbf24' },
      { label: 'U = ½CV²',   value: `${U.toExponential(2)} J`, color: '#34d399' },
    ]
    ctx.textAlign    = 'right'
    ctx.textBaseline = 'top'
    for (let i = 0; i < lines.length; i++) {
      const ly = panY + i * 22
      ctx.fillStyle = 'rgba(15,23,42,0.75)'
      ctx.fillRect(panX - 210, ly - 2, 210, 18)
      ctx.fillStyle = '#475569'
      ctx.font      = '11px monospace'
      ctx.fillText(lines[i].label, panX - 108, ly)
      ctx.fillStyle = lines[i].color
      ctx.font      = 'bold 12px monospace'
      ctx.fillText(`= ${lines[i].value}`, panX, ly)
    }

    // ── Título ────────────────────────────────────────────────
    ctx.fillStyle    = 'rgba(148,163,184,0.6)'
    ctx.font         = '12px sans-serif'
    ctx.textAlign    = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('Capacitor Plano-Paralelo', 14, 14)
    if (kappa > 1.05) {
      ctx.fillStyle = 'rgba(167,139,250,0.7)'
      ctx.fillText(`κ = ${kappa.toFixed(1)} — con dieléctrico`, 14, 34)
    }

    animRef.current = requestAnimationFrame(draw)
  }, [area, separation, kappa, voltage])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', background: '#070d1a' }}
    />
  )
}
