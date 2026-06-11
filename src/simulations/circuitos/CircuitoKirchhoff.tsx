import { useEffect, useRef } from 'react'

interface CircuitoKirchhoffProps {
  fem: number
  r: number
  R1: number
  R2: number
  R3: number
}

export function CircuitoKirchhoffScene({ fem, r, R1, R2, R3 }: CircuitoKirchhoffProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const tRef      = useRef(0)

  const R23    = (R2 * R3) / (R2 + R3)
  const Rtotal = r + R1 + R23
  const I      = fem / Rtotal
  const Vr     = I * r
  const V1     = I * R1
  const V23    = I * R23
  const I2     = V23 / R2
  const I3     = V23 / R3
  const Pbat   = fem * I

  useEffect(() => {
    const canvas = canvasRef.current
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

    const draw = () => {
      tRef.current += 0.018
      const t = tRef.current
      const ctx = canvas.getContext('2d')!
      const W = canvas.width, H = canvas.height
      const s = dpr

      ctx.fillStyle = '#050912'
      ctx.fillRect(0, 0, W, H)

      // ── Layout dinámico centrado ──────────────────────────
      const padX = W * 0.08, padY = H * 0.10
      const cW = W - padX * 2, cH = H * 0.68

      const ax = padX,         ay = padY           // A top-left
      const bx = padX + cW,    by = padY           // B top-right
      const ex = padX + cW,    ey = padY + cH      // E bottom-right
      const fx = padX,         fy = padY + cH      // F bottom-left

      // Split points on top wire for r and R1
      const rEndX  = ax + cW * 0.2
      const r1EndX = ax + cW * 0.55

      // Bifurcación en top wire (nodo E entre R1 y B)
      const nodeEx = ax + cW * 0.62, nodeEy = ay
      const nodeFx = ax + cW * 0.62, nodeFy = ey

      // R2 vertical center, R3 right branch
      const r2x = nodeEx, r2y1 = ay, r2y2 = ey
      const r3x = padX + cW * 0.82, r3y1 = ay, r3y2 = ey

      // ── Función para dibujar cable con grosor ∝ corriente ──
      const wire = (x1: number, y1: number, x2: number, y2: number, color: string, frac: number) => {
        ctx.strokeStyle = color
        ctx.lineWidth = Math.max(1.5 * s, frac * 5 * s)
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
      }

      const mainColor = 'rgba(52,211,153,0.7)'
      const r2Color   = 'rgba(139,92,246,0.7)'
      const r3Color   = 'rgba(236,72,153,0.7)'

      // Cables principales
      wire(ax, ay, rEndX, ay, mainColor, 1)
      wire(rEndX, ay, r1EndX, ay, 'rgba(251,191,36,0.7)', 1)
      wire(r1EndX, ay, nodeEx, ay, mainColor, 1)
      wire(ax, fy, bx, fy, 'rgba(51,65,85,0.6)', 1)
      wire(bx, ay, bx, ey, 'rgba(51,65,85,0.5)', 0.5)
      wire(ax, ay, ax, fy, mainColor, 1)

      // R2 rama
      wire(nodeEx, r2y1, r2x, r2y2, r2Color, I2 / I)
      // R3 rama
      wire(nodeEx, r3y1, r3x, r3y1, r3Color, I3 / I)
      wire(r3x, r3y1, r3x, r3y2, r3Color, I3 / I)
      wire(r3x, r3y2, nodeFx, nodeFy, r3Color, I3 / I)
      wire(nodeFx, nodeFy, bx, ey, 'rgba(139,92,246,0.5)', 1)

      // ── Batería (rama izquierda) ───────────────────────────
      const batY = ay + cH * 0.5
      ctx.strokeStyle = 'rgba(16,185,129,0.8)'; ctx.lineWidth = 2.5 * s
      ctx.beginPath()
      ctx.moveTo(ax - 14*s, batY - 8*s); ctx.lineTo(ax + 14*s, batY - 8*s)
      ctx.moveTo(ax - 8*s,  batY + 4*s); ctx.lineTo(ax + 8*s,  batY + 4*s)
      ctx.stroke()
      ctx.fillStyle = 'rgba(16,185,129,0.9)'; ctx.font = `bold ${10 * s}px monospace`
      ctx.textAlign = 'right'
      ctx.fillText(`ε=${fem}V`, ax - 18*s, batY)

      // ── Resistencia r (caja) ───────────────────────────────
      const rW = (rEndX - ax) * 0.5, rH = 18*s
      const rCx = (ax + rEndX) / 2
      ctx.strokeStyle = 'rgba(100,116,139,0.6)'; ctx.lineWidth = 1.5*s
      ctx.strokeRect(rCx - rW/2, ay - rH/2, rW, rH)
      ctx.fillStyle = 'rgba(100,116,139,0.7)'; ctx.font = `${9 * s}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText(`r=${r}Ω`, rCx, ay - rH/2 - 5*s)
      ctx.fillStyle = 'rgba(71,85,105,0.7)'
      ctx.fillText(`${Vr.toFixed(2)}V`, rCx, ay + rH/2 + 12*s)

      // ── Resistencia R1 ─────────────────────────────────────
      const r1W = (r1EndX - rEndX) * 0.6, r1Cx = (rEndX + r1EndX) / 2
      ctx.strokeStyle = 'rgba(251,191,36,0.75)'; ctx.lineWidth = 2*s
      ctx.strokeRect(r1Cx - r1W/2, ay - rH/2, r1W, rH)
      ctx.fillStyle = 'rgba(251,191,36,0.85)'; ctx.font = `${9.5 * s}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText(`R₁=${R1}Ω`, r1Cx, ay - rH/2 - 5*s)
      ctx.fillStyle = 'rgba(251,191,36,0.6)'
      ctx.fillText(`${V1.toFixed(2)}V / ${(I*1000).toFixed(1)}mA`, r1Cx, ay + rH/2 + 12*s)

      // ── Nodo bifurcación E ─────────────────────────────────
      ctx.beginPath(); ctx.arc(nodeEx, nodeEy, 6*s, 0, Math.PI*2)
      ctx.fillStyle = 'rgba(167,139,250,0.85)'; ctx.fill()
      ctx.fillStyle = 'rgba(167,139,250,0.8)'; ctx.font = `${9*s}px monospace`
      ctx.textAlign = 'center'; ctx.fillText('E', nodeEx, nodeEy - 10*s)

      ctx.beginPath(); ctx.arc(nodeFx, nodeFy, 6*s, 0, Math.PI*2)
      ctx.fillStyle = 'rgba(167,139,250,0.85)'; ctx.fill()
      ctx.fillStyle = 'rgba(167,139,250,0.8)'
      ctx.fillText('F', nodeFx, nodeFy + 16*s)

      // ── R2 (caja vertical centrada) ────────────────────────
      const r2midY = (r2y1 + r2y2) / 2, r2boxH = cH * 0.25, r2boxW = 28*s
      ctx.strokeStyle = 'rgba(139,92,246,0.75)'; ctx.lineWidth = 2*s
      ctx.strokeRect(r2x - r2boxW/2, r2midY - r2boxH/2, r2boxW, r2boxH)
      ctx.fillStyle = 'rgba(139,92,246,0.85)'; ctx.font = `${9.5 * s}px monospace`
      ctx.textAlign = 'left'
      ctx.fillText(`R₂=${R2}Ω`, r2x + r2boxW/2 + 4*s, r2midY - 4*s)
      ctx.fillStyle = 'rgba(139,92,246,0.6)'
      ctx.fillText(`${(I2*1000).toFixed(1)}mA`, r2x + r2boxW/2 + 4*s, r2midY + 12*s)

      // ── R3 (caja vertical derecha) ─────────────────────────
      const r3midY = (r3y1 + r3y2) / 2, r3boxW = 28*s
      ctx.strokeStyle = 'rgba(236,72,153,0.75)'; ctx.lineWidth = 2*s
      ctx.strokeRect(r3x - r3boxW/2, r3midY - r2boxH/2, r3boxW, r2boxH)
      ctx.fillStyle = 'rgba(236,72,153,0.85)'; ctx.font = `${9.5 * s}px monospace`
      ctx.textAlign = 'left'
      ctx.fillText(`R₃=${R3}Ω`, r3x + r3boxW/2 + 4*s, r3midY - 4*s)
      ctx.fillStyle = 'rgba(236,72,153,0.6)'
      ctx.fillText(`${(I3*1000).toFixed(1)}mA`, r3x + r3boxW/2 + 4*s, r3midY + 12*s)

      // ── Partículas de corriente ────────────────────────────
      const spawnParticle = (
        path: [number, number][], frac0: number, color: string, scale: number,
      ) => {
        const frac = ((frac0 + t * 0.22 * scale) % 1 + 1) % 1
        const totalLen = path.length - 1
        const idx = Math.min(Math.floor(frac * totalLen), totalLen - 1)
        const tf  = frac * totalLen - idx
        const p1 = path[idx], p2 = path[Math.min(idx + 1, totalLen)]
        const px = p1[0] + tf * (p2[0] - p1[0])
        const py = p1[1] + tf * (p2[1] - p1[1])
        const alpha = Math.sin(frac * Math.PI) * 0.9
        ctx.beginPath(); ctx.arc(px, py, 4.5*s, 0, Math.PI*2)
        ctx.fillStyle = color.replace(')', `,${alpha})`).replace('rgb', 'rgba')
        ctx.fill()
      }

      // Ruta principal: A→B (top), B→F (right down), F→A (bottom)
      const mainPath: [number, number][] = [
        [ax, ay], [rEndX, ay], [r1EndX, ay], [nodeEx, ay], [bx, ay], [bx, ey], [ax, fy], [ax, ay],
      ]
      // Ruta R2: E→R2→F
      const r2Path: [number, number][] = [[nodeEx, r2y1], [r2x, r2midY - r2boxH/2], [r2x, r2midY + r2boxH/2], [nodeFx, nodeFy]]
      // Ruta R3: E→R3→F
      const r3Path: [number, number][] = [[nodeEx, r3y1], [r3x, r3y1], [r3x, r3midY - r2boxH/2], [r3x, r3midY + r2boxH/2], [r3x, r3y2], [nodeFx, nodeFy]]

      const numP = 3
      for (let i = 0; i < numP; i++) {
        spawnParticle(mainPath, i / numP, 'rgba(52,211,153)', 1)
        spawnParticle(r2Path,   i / numP, 'rgba(139,92,246)', I2 / I)
        spawnParticle(r3Path,   i / numP, 'rgba(236,72,153)', I3 / I)
      }

      // ── Panel KCL / KVL ────────────────────────────────────
      const panY = padY + cH + H * 0.06
      ctx.fillStyle = '#0a101e'
      ctx.beginPath()
      ctx.roundRect(padX, panY, cW, H * 0.18, 8*s)
      ctx.fill()
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1*s; ctx.stroke()

      const textY1 = panY + H * 0.06, textY2 = panY + H * 0.13
      ctx.font = `${9 * s}px monospace`

      ctx.fillStyle = '#64748b'; ctx.textAlign = 'left'
      ctx.fillText('KCL en E:', padX + 10*s, textY1)
      ctx.fillStyle = '#10b981'
      ctx.fillText(
        `I = I₂ + I₃  →  ${(I*1000).toFixed(1)} = ${(I2*1000).toFixed(1)} + ${(I3*1000).toFixed(1)} mA ✓`,
        padX + 10*s, textY2,
      )

      ctx.fillStyle = '#64748b'
      ctx.fillText('KVL malla:', W * 0.38, textY1)
      ctx.fillStyle = '#f59e0b'
      ctx.fillText(
        `ε = Vr+V₁+V₂₃  →  ${fem} ≈ ${(Vr+V1+V23).toFixed(1)} V`,
        W * 0.38, textY2,
      )

      ctx.fillStyle = '#64748b'
      ctx.fillText('Potencia:', W * 0.75, textY1)
      ctx.fillStyle = '#a78bfa'
      ctx.fillText(`P = ${Pbat.toFixed(2)} W`, W * 0.75, textY2)

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(rafRef.current); obs.disconnect() }
  }, [fem, r, R1, R2, R3, I, I2, I3, Vr, V1, V23, Pbat, R23, Rtotal])

  return (
    <div className="w-full h-full" style={{ background: '#050912' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}
