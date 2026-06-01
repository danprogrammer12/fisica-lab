import { useRef, useEffect, useCallback } from 'react'

// ── Physics ────────────────────────────────────────────────────
function dipoleField(px: number, py: number, d: number): [number, number] {
  const dx1 = px - d / 2, dy1 = py
  const dx2 = px + d / 2, dy2 = py
  const r1 = Math.hypot(dx1, dy1)
  const r2 = Math.hypot(dx2, dy2)
  if (r1 < 0.08 || r2 < 0.08) return [0, 0]
  const Ex = dx1 / r1 ** 3 - dx2 / r2 ** 3
  const Ey = dy1 / r1 ** 3 - dy2 / r2 ** 3
  const mag = Math.hypot(Ex, Ey)
  return mag > 1e-12 ? [Ex / mag, Ey / mag] : [0, 0]
}

function traceLine(startX: number, startY: number, d: number, maxSteps = 800, dt = 0.06) {
  const pts: [number, number][] = [[startX, startY]]
  let x = startX, y = startY
  for (let s = 0; s < maxSteps; s++) {
    const [k1x, k1y] = dipoleField(x, y, d)
    const [k2x, k2y] = dipoleField(x + dt * k1x / 2, y + dt * k1y / 2, d)
    const [k3x, k3y] = dipoleField(x + dt * k2x / 2, y + dt * k2y / 2, d)
    const [k4x, k4y] = dipoleField(x + dt * k3x, y + dt * k3y, d)
    x += dt * (k1x + 2 * k2x + 2 * k3x + k4x) / 6
    y += dt * (k1y + 2 * k2y + 2 * k3y + k4y) / 6
    pts.push([x, y])
    if (Math.hypot(x + d / 2, y) < 0.18) break
    if (Math.abs(x) > 5.5 || Math.abs(y) > 4.5) break
  }
  return pts
}

// ── Renderer ───────────────────────────────────────────────────
function render(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  separation: number,
  mouse: [number, number] | null,
) {
  ctx.clearRect(0, 0, W, H)

  // Background
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)

  // Subtle potential heatmap (fast pixel pass, 4px grid)
  const blockSize = 6
  const cols = Math.ceil(W / blockSize)
  const rows = Math.ceil(H / blockSize)
  const scale = Math.min(W, H) / 9
  const cx = W / 2, cy = H / 2

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sx = col * blockSize + blockSize / 2
      const sy = row * blockSize + blockSize / 2
      const px = (sx - cx) / scale
      const py = -(sy - cy) / scale
      const r1 = Math.hypot(px - separation / 2, py)
      const r2 = Math.hypot(px + separation / 2, py)
      if (r1 < 0.15 || r2 < 0.15) continue
      const V = (1 / r1 - 1 / r2) * 0.5
      const t = Math.max(-1, Math.min(1, V))
      if (t > 0) {
        ctx.fillStyle = `rgba(139,92,246,${Math.min(0.12, t * 0.12)})`
      } else {
        ctx.fillStyle = `rgba(59,130,246,${Math.min(0.12, -t * 0.12)})`
      }
      ctx.fillRect(col * blockSize, row * blockSize, blockSize, blockSize)
    }
  }

  // Screen ↔ physics helpers
  const toS = (px: number, py: number): [number, number] => [cx + px * scale, cy - py * scale]
  const toP = (sx: number, sy: number): [number, number] => [(sx - cx) / scale, -(sy - cy) / scale]

  // Field lines
  const d = separation
  const numLines = 20
  for (let k = 0; k < numLines; k++) {
    const angle = (k / numLines) * Math.PI * 2
    const startX = d / 2 + Math.cos(angle) * 0.22
    const startY = Math.sin(angle) * 0.22
    const pts = traceLine(startX, startY, d)
    if (pts.length < 4) continue

    ctx.beginPath()
    const [sx0, sy0] = toS(pts[0][0], pts[0][1])
    ctx.moveTo(sx0, sy0)
    for (let i = 1; i < pts.length; i++) {
      const [sx, sy] = toS(pts[i][0], pts[i][1])
      ctx.lineTo(sx, sy)
    }
    const primary = k % 5 === 0
    ctx.strokeStyle = primary
      ? 'rgba(147,197,253,0.75)'
      : 'rgba(99,155,235,0.42)'
    ctx.lineWidth = primary ? 1.5 : 1
    ctx.stroke()

    // Arrow midpoint
    const mid = Math.floor(pts.length * 0.45)
    if (mid > 0 && mid < pts.length - 1) {
      const [ax, ay] = toS(pts[mid][0], pts[mid][1])
      const [bx, by] = toS(pts[mid + 1][0], pts[mid + 1][1])
      const adx = bx - ax, ady = by - ay
      const alen = Math.hypot(adx, ady)
      if (alen > 0.5) {
        const nx = adx / alen, ny = ady / alen
        const arrowLen = 7
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax + nx * arrowLen - ny * arrowLen * 0.4, ay + ny * arrowLen + nx * arrowLen * 0.4)
        ctx.lineTo(ax + nx * arrowLen + ny * arrowLen * 0.4, ay + ny * arrowLen - nx * arrowLen * 0.4)
        ctx.closePath()
        ctx.fillStyle = primary ? 'rgba(147,197,253,0.75)' : 'rgba(99,155,235,0.42)'
        ctx.fill()
      }
    }
  }

  // Charges
  const charges: [number, number, number, string, string][] = [
    [d / 2, 0, 1, '#ef4444', '+'],
    [-d / 2, 0, -1, '#60a5fa', '−'],
  ]
  for (const [qx, qy, , color, label] of charges) {
    const [sx, sy] = toS(qx, qy)
    // Glow
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 28)
    g.addColorStop(0, color + 'aa')
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(sx, sy, 28, 0, Math.PI * 2)
    ctx.fill()
    // Core
    ctx.beginPath()
    ctx.arc(sx, sy, 9, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    // Label
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px Inter, system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, sx, sy)
  }

  // Dipole axis (dashed)
  const [lx, ] = toS(-d / 2 - 1.2, 0)
  const [rx, ] = toS(d / 2 + 1.2, 0)
  ctx.setLineDash([3, 5])
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(lx, cy)
  ctx.lineTo(rx, cy)
  ctx.stroke()
  ctx.setLineDash([])

  // Corner watermark
  ctx.fillStyle = 'rgba(71,85,105,0.5)'
  ctx.font = '11px monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText(`d = ${separation.toFixed(1)} m`, W - 14, H - 10)

  // Mouse field vector
  if (mouse) {
    const [mpx, mpy] = toP(mouse[0], mouse[1])
    if (Math.abs(mpx) < 5 && Math.abs(mpy) < 4) {
      const [Ex, Ey] = dipoleField(mpx, mpy, d)
      if (Math.hypot(Ex, Ey) > 0.01) {
        const arrowLen = 38
        const tx = mouse[0] + Ex * arrowLen
        const ty = mouse[1] - Ey * arrowLen
        // Line
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(mouse[0], mouse[1])
        ctx.lineTo(tx, ty)
        ctx.stroke()
        // Arrow head
        const ang = Math.atan2(ty - mouse[1], tx - mouse[0])
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(tx - 9 * Math.cos(ang - 0.35), ty - 9 * Math.sin(ang - 0.35))
        ctx.lineTo(tx - 9 * Math.cos(ang + 0.35), ty - 9 * Math.sin(ang + 0.35))
        ctx.closePath()
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fill()
        // Dot at cursor
        ctx.beginPath()
        ctx.arc(mouse[0], mouse[1], 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.fill()
      }
    }
  }
}

// ── Component ──────────────────────────────────────────────────
interface DipoleFieldCanvasProps {
  separation: number
  className?: string
}

export function DipoleFieldCanvas({ separation, className }: DipoleFieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const mouseRef = useRef<[number, number] | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    render(ctx, canvas.width, canvas.height, separation, mouseRef.current)
  }, [separation])

  useEffect(() => {
    draw()
  }, [draw])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scaleX = e.currentTarget.width / rect.width
    const scaleY = e.currentTarget.height / rect.height
    mouseRef.current = [
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
    ]
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(draw)
  }, [draw])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(draw)
  }, [draw])

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth * window.devicePixelRatio
      canvas.height = parent.clientHeight * window.devicePixelRatio
      canvas.style.width = parent.clientWidth + 'px'
      canvas.style.height = parent.clientHeight + 'px'
      draw()
    })
    observer.observe(canvas.parentElement!)
    return () => observer.disconnect()
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'block', cursor: 'crosshair' }}
    />
  )
}
