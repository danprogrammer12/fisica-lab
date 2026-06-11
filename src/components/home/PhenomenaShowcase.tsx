import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import { MoveRight, Clock, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'

// ── Data ──────────────────────────────────────────────────────
interface Phenomenon {
  id: string
  path: string
  category: string
  title: string
  description: string
  concepts: string[]
  time: string
  color: string
}

const PHENOMENA: Phenomenon[] = [
  {
    id: 'campo-electrico',
    path: '/campo-electrico',
    category: 'Electrostática',
    title: 'Campo Eléctrico',
    description: 'Las cargas eléctricas distorsionan el espacio a su alrededor creando un campo vectorial. La magnitud decrece con el cuadrado de la distancia.',
    concepts: ['Ley de Coulomb', 'Líneas de campo', 'Superposición vectorial'],
    time: '45 min',
    color: '#60a5fa',
  },
  {
    id: 'ley-gauss',
    path: '/ley-de-gauss',
    category: 'Electrostática',
    title: 'Ley de Gauss',
    description: 'El flujo eléctrico total a través de cualquier superficie cerrada es proporcional a la carga encerrada. Independiente del tamaño o forma.',
    concepts: ['Flujo eléctrico', 'Superficie gaussiana', 'Simetría esférica'],
    time: '40 min',
    color: '#34d399',
  },
  {
    id: 'potencial',
    path: '/potencial',
    category: 'Electrostática',
    title: 'Potencial Eléctrico',
    description: 'Energía potencial por unidad de carga. Las superficies equipotenciales son siempre perpendiculares a las líneas de campo.',
    concepts: ['Trabajo eléctrico', 'Equipotenciales', 'Gradiente del campo'],
    time: '50 min',
    color: '#a78bfa',
  },
  {
    id: 'capacitancia',
    path: '/capacitancia',
    category: 'Almacenamiento de energía',
    title: 'Capacitancia',
    description: 'Dos conductores separados acumulan carga opuesta creando un campo uniforme entre ellos. La capacitancia depende de geometría y dieléctrico.',
    concepts: ['Capacitor plano', 'Dieléctricos', 'Energía almacenada'],
    time: '45 min',
    color: '#fbbf24',
  },
  {
    id: 'circuitos',
    path: '/circuitos',
    category: 'Corriente eléctrica',
    title: 'Circuitos DC',
    description: 'El flujo ordenado de carga eléctrica obedece las leyes de conservación de Kirchhoff. Cada nodo y malla revelan la física subyacente.',
    concepts: ['Leyes de Kirchhoff', 'Circuito RC', 'Potencia disipada'],
    time: '60 min',
    color: '#f87171',
  },
  {
    id: 'magnetismo',
    path: '/magnetismo',
    category: 'Magnetostática',
    title: 'Campo Magnético',
    description: 'Las corrientes y cargas en movimiento generan campos magnéticos de líneas cerradas. La fuerza de Lorentz curva trayectorias de partículas.',
    concepts: ['Ley de Ampère', 'Fuerza de Lorentz', 'Solenoide'],
    time: '55 min',
    color: '#22d3ee',
  },
]

// ── Draw functions ─────────────────────────────────────────────
type DrawFn = (ctx: CanvasRenderingContext2D, W: number, H: number, t: number, hover: boolean) => void

const drawCampoElectrico: DrawFn = (ctx, W, H, t, hover) => {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const r0 = 20, r1 = Math.min(W, H) * 0.42
  const numLines = hover ? 20 : 14
  const alpha = hover ? 0.7 : 0.4

  for (let k = 0; k < numLines; k++) {
    const angle = (k / numLines) * Math.PI * 2
    const x0 = cx + Math.cos(angle) * r0, y0 = cy + Math.sin(angle) * r0
    const x1 = cx + Math.cos(angle) * r1, y1 = cy + Math.sin(angle) * r1
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0, `rgba(96,165,250,${alpha})`)
    g.addColorStop(1, `rgba(96,165,250,${alpha * 0.25})`)
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1)
    ctx.strokeStyle = g; ctx.lineWidth = hover ? 1.5 : 1; ctx.stroke()

    const af = 0.58
    const ax = cx + Math.cos(angle) * (r0 + (r1 - r0) * af)
    const ay = cy + Math.sin(angle) * (r0 + (r1 - r0) * af)
    const al = 8, pa = angle + Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(ax + Math.cos(angle) * al, ay + Math.sin(angle) * al)
    ctx.lineTo(ax - Math.cos(angle) * al + Math.cos(pa) * al * 0.45, ay - Math.sin(angle) * al + Math.sin(pa) * al * 0.45)
    ctx.lineTo(ax - Math.cos(angle) * al - Math.cos(pa) * al * 0.45, ay - Math.sin(angle) * al - Math.sin(pa) * al * 0.45)
    ctx.closePath(); ctx.fillStyle = `rgba(96,165,250,${alpha})`; ctx.fill()
  }

  // Particles
  const np = hover ? 22 : 14
  const sp = hover ? 0.1 : 0.06
  for (let p = 0; p < np; p++) {
    const angle = (p / np) * Math.PI * 2
    const dist = r0 + (((t * sp + p / np) % 1) * (r1 - r0) * 0.88)
    ctx.beginPath()
    ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, hover ? 3 : 2.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(251,191,36,${hover ? 0.95 : 0.65})`; ctx.fill()
  }

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, hover ? 30 : 22)
  glow.addColorStop(0, `rgba(239,68,68,${hover ? 0.55 : 0.35})`); glow.addColorStop(1, 'transparent')
  ctx.beginPath(); ctx.arc(cx, cy, hover ? 30 : 22, 0, Math.PI * 2); ctx.fillStyle = glow; ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy, hover ? 12 : 9, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill()
  ctx.fillStyle = 'white'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('+', cx, cy)
}

const drawLeyDeGauss: DrawFn = (ctx, W, H, t, hover) => {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const sR = Math.min(W, H) * 0.31
  const rot = t * 0.22
  const alpha = hover ? 0.5 : 0.22

  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI + rot
    const cosA = Math.cos(a)
    ctx.beginPath()
    ctx.ellipse(cx, cy, Math.max(1, sR * Math.abs(cosA)), sR, 0, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(52,211,153,${alpha * (0.4 + 0.6 * Math.abs(cosA))})`
    ctx.lineWidth = 1; ctx.stroke()
  }
  for (let i = 1; i <= 3; i++) {
    const dy = ((i / 4) * 2 - 1) * sR * 0.8
    const rr = Math.sqrt(Math.max(0, sR ** 2 - dy ** 2))
    ctx.beginPath(); ctx.ellipse(cx, cy + dy, rr, rr * 0.18, 0, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(52,211,153,${alpha * 0.5})`; ctx.lineWidth = 0.75; ctx.stroke()
  }

  const nL = 12
  for (let k = 0; k < nL; k++) {
    const angle = (k / nL) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * 11, cy + Math.sin(angle) * 11)
    ctx.lineTo(cx + Math.cos(angle) * sR, cy + Math.sin(angle) * sR)
    ctx.strokeStyle = `rgba(52,211,153,${hover ? 0.35 : 0.18})`; ctx.lineWidth = 1; ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * sR, cy + Math.sin(angle) * sR)
    ctx.lineTo(cx + Math.cos(angle) * (sR + 48), cy + Math.sin(angle) * (sR + 48))
    ctx.strokeStyle = `rgba(52,211,153,${hover ? 0.6 : 0.35})`; ctx.lineWidth = 1.5; ctx.stroke()

    const ax = cx + Math.cos(angle) * (sR + 14)
    const ay = cy + Math.sin(angle) * (sR + 14)
    const al = 8, pa = angle + Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(ax + Math.cos(angle) * al, ay + Math.sin(angle) * al)
    ctx.lineTo(ax - Math.cos(angle) * al + Math.cos(pa) * al * 0.42, ay - Math.sin(angle) * al + Math.sin(pa) * al * 0.42)
    ctx.lineTo(ax - Math.cos(angle) * al - Math.cos(pa) * al * 0.42, ay - Math.sin(angle) * al - Math.sin(pa) * al * 0.42)
    ctx.closePath(); ctx.fillStyle = `rgba(52,211,153,${hover ? 0.65 : 0.4})`; ctx.fill()
  }

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24)
  g.addColorStop(0, 'rgba(239,68,68,0.5)'); g.addColorStop(1, 'transparent')
  ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fillStyle = '#ef4444'; ctx.fill()
  ctx.fillStyle = 'white'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('q', cx, cy)
  ctx.fillStyle = `rgba(52,211,153,${hover ? 0.55 : 0.3})`
  ctx.font = '12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('Φ = q / ε₀', cx, cy + sR + 24)
}

const drawPotencialElectrico: DrawFn = (ctx, W, H, t, hover) => {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const maxR = Math.min(W, H) * 0.43
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR)
  bg.addColorStop(0, `rgba(139,92,246,${hover ? 0.22 : 0.14})`)
  bg.addColorStop(0.45, `rgba(59,130,246,${hover ? 0.1 : 0.06})`)
  bg.addColorStop(1, 'transparent')
  ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill()

  const nR = hover ? 9 : 6
  for (let i = 1; i <= nR; i++) {
    const pulse = hover ? Math.sin(t * 1.5 + i * 0.5) * 0.018 : 0
    const r = (i / (nR + 1) + pulse) * maxR
    const a = Math.max(0.05, (hover ? 0.6 : 0.35) - (i / nR) * 0.32)
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(167,139,250,${a})`; ctx.lineWidth = 1; ctx.stroke()
  }

  const nA = hover ? 14 : 9
  for (let k = 0; k < nA; k++) {
    const angle = (k / nA) * Math.PI * 2
    const ar = maxR * 0.58, al = 14, pa = angle + Math.PI / 2
    const ax = cx + Math.cos(angle) * ar, ay = cy + Math.sin(angle) * ar
    ctx.beginPath()
    ctx.moveTo(ax + Math.cos(angle) * al, ay + Math.sin(angle) * al)
    ctx.lineTo(ax - Math.cos(angle) * al + Math.cos(pa) * al * 0.42, ay - Math.sin(angle) * al + Math.sin(pa) * al * 0.42)
    ctx.lineTo(ax - Math.cos(angle) * al - Math.cos(pa) * al * 0.42, ay - Math.sin(angle) * al - Math.sin(pa) * al * 0.42)
    ctx.closePath(); ctx.fillStyle = `rgba(167,139,250,${hover ? 0.5 : 0.28})`; ctx.fill()
  }

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, hover ? 32 : 24)
  g.addColorStop(0, `rgba(167,139,250,${hover ? 0.75 : 0.5})`); g.addColorStop(1, 'transparent')
  ctx.beginPath(); ctx.arc(cx, cy, hover ? 32 : 24, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fillStyle = '#a78bfa'; ctx.fill()
  ctx.fillStyle = 'white'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('+q', cx, cy)
}

const drawCapacitancia: DrawFn = (ctx, W, H, t, hover) => {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const pH = H * 0.55, pW = 7
  const gap = W * 0.3
  const lx = cx - gap / 2, rx = cx + gap / 2

  ctx.fillStyle = hover ? 'rgba(239,68,68,0.65)' : 'rgba(239,68,68,0.4)'
  ctx.fillRect(lx - pW, cy - pH / 2, pW, pH)
  ctx.fillStyle = hover ? 'rgba(96,165,250,0.65)' : 'rgba(96,165,250,0.4)'
  ctx.fillRect(rx, cy - pH / 2, pW, pH)

  const nSym = 6
  ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  for (let i = 0; i < nSym; i++) {
    const y = cy - pH / 2 + (i + 0.5) * (pH / nSym)
    ctx.fillStyle = `rgba(252,165,165,${hover ? 0.8 : 0.5})`; ctx.fillText('+', lx - pW - 9, y)
    ctx.fillStyle = `rgba(147,197,253,${hover ? 0.8 : 0.5})`; ctx.fillText('−', rx + pW + 9, y)
  }

  const nL = 6, la = hover ? 0.55 : 0.32
  for (let i = 0; i < nL; i++) {
    const y = cy - pH / 2 * 0.78 + (i / (nL - 1)) * pH * 0.78
    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(rx, y)
    ctx.strokeStyle = `rgba(251,191,36,${la})`; ctx.lineWidth = 1.5; ctx.stroke()
    const mx = (lx + rx) / 2
    ctx.beginPath()
    ctx.moveTo(mx + 8, y); ctx.lineTo(mx - 2, y - 4); ctx.lineTo(mx - 2, y + 4)
    ctx.closePath(); ctx.fillStyle = `rgba(251,191,36,${la + 0.1})`; ctx.fill()
  }

  const np2 = hover ? 9 : 6, sp2 = hover ? 0.42 : 0.24
  for (let p = 0; p < np2; p++) {
    const phase = ((t * sp2 + p / np2) % 1)
    const px = lx + phase * gap
    const li = p % nL
    const py = cy - pH / 2 * 0.78 + (li / (nL - 1)) * pH * 0.78
    ctx.beginPath(); ctx.arc(px, py, hover ? 3.5 : 2.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${hover ? 0.9 : 0.6})`; ctx.fill()
    ctx.beginPath(); ctx.arc(px, py, hover ? 6 : 5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill()
  }

  ctx.font = '13px Inter'; ctx.textAlign = 'center'
  ctx.fillStyle = `rgba(252,165,165,${hover ? 0.65 : 0.4})`
  ctx.fillText('+Q', lx - pW / 2, cy - pH / 2 - 16)
  ctx.fillStyle = `rgba(147,197,253,${hover ? 0.65 : 0.4})`
  ctx.fillText('−Q', rx + pW / 2, cy - pH / 2 - 16)
  ctx.fillStyle = `rgba(251,191,36,${hover ? 0.5 : 0.28})`
  ctx.font = '12px monospace'
  ctx.fillText('E⃗  uniforme', cx, cy + pH / 2 + 22)
}

const drawCircuitosDC: DrawFn = (ctx, W, H, t, hover) => {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  const mx = W * 0.13, my = H * 0.2
  const rW = W - mx * 2, rH = H - my * 2
  const x0 = mx, y0 = my, x1 = x0 + rW, y1 = y0 + rH

  ctx.strokeStyle = hover ? 'rgba(148,163,184,0.45)' : 'rgba(100,116,139,0.28)'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0)
  ctx.moveTo(x1, y0); ctx.lineTo(x1, y1)
  ctx.moveTo(x1, y1); ctx.lineTo(x0, y1)
  ctx.moveTo(x0, y1); ctx.lineTo(x0, y0)
  ctx.stroke()

  // Battery (left, center)
  const bcy = (y0 + y1) / 2
  ctx.lineWidth = 3; ctx.strokeStyle = hover ? 'rgba(52,211,153,0.8)' : 'rgba(52,211,153,0.5)'
  ctx.beginPath(); ctx.moveTo(x0 - 12, bcy - 9); ctx.lineTo(x0 + 12, bcy - 9); ctx.stroke()
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(x0 - 7, bcy + 2); ctx.lineTo(x0 + 7, bcy + 2); ctx.stroke()
  ctx.fillStyle = hover ? 'rgba(52,211,153,0.6)' : 'rgba(52,211,153,0.4)'
  ctx.font = '10px monospace'; ctx.textAlign = 'center'
  ctx.fillText('+', x0, bcy - 18); ctx.fillText('−', x0, bcy + 14)

  // Resistor (top, center) — zigzag
  const rCx = (x0 + x1) / 2, rW2 = 52, rH2 = 11
  ctx.strokeStyle = hover ? 'rgba(251,191,36,0.75)' : 'rgba(251,191,36,0.45)'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(rCx - rW2 / 2, y0)
  for (let i = 0; i <= 6; i++) {
    const rx2 = rCx - rW2 / 2 + (i / 6) * rW2
    ctx.lineTo(rx2, y0 + (i % 2 === 0 ? -rH2 / 2 : rH2 / 2))
  }
  ctx.lineTo(rCx + rW2 / 2, y0); ctx.stroke()

  // Electrons
  const ne = hover ? 11 : 7, sp3 = hover ? 0.14 : 0.08
  const perim = 2 * (rW + rH)
  for (let e = 0; e < ne; e++) {
    const ph = ((t * sp3 + e / ne) % 1) * perim
    let px: number, py: number
    if (ph < rW) { px = x0 + ph; py = y0 }
    else if (ph < rW + rH) { px = x1; py = y0 + (ph - rW) }
    else if (ph < 2 * rW + rH) { px = x1 - (ph - rW - rH); py = y1 }
    else { px = x0; py = y1 - (ph - 2 * rW - rH) }
    ctx.beginPath(); ctx.arc(px, py, hover ? 4 : 3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(96,165,250,${hover ? 0.9 : 0.65})`; ctx.fill()
    ctx.beginPath(); ctx.arc(px, py, hover ? 7 : 6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(96,165,250,0.12)'; ctx.fill()
  }

  // Direction arrows
  const arrows: [number, number, number][] = [
    [(x0 + x1) * 0.72, y0, 0],
    [x1, (y0 + y1) * 0.72, Math.PI / 2],
    [(x0 + x1) * 0.28, y1, Math.PI],
    [x0, (y0 + y1) * 0.28, -Math.PI / 2],
  ]
  for (const [ax2, ay2, ang] of arrows) {
    const al2 = 9, pa2 = ang + Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(ax2 + Math.cos(ang) * al2, ay2 + Math.sin(ang) * al2)
    ctx.lineTo(ax2 - Math.cos(ang) * al2 + Math.cos(pa2) * al2 * 0.5, ay2 - Math.sin(ang) * al2 + Math.sin(pa2) * al2 * 0.5)
    ctx.lineTo(ax2 - Math.cos(ang) * al2 - Math.cos(pa2) * al2 * 0.5, ay2 - Math.sin(ang) * al2 - Math.sin(pa2) * al2 * 0.5)
    ctx.closePath(); ctx.fillStyle = `rgba(148,163,184,${hover ? 0.42 : 0.22})`; ctx.fill()
  }
}

const drawCampoMagnetico: DrawFn = (ctx, W, H, _t, hover) => {
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, W, H)
  const cx = W / 2, cy = H / 2
  const alpha = hover ? 0.65 : 0.35
  const nL = hover ? 6 : 5
  const lc = `rgba(34,211,238,${alpha})`

  for (let i = 1; i <= nL; i++) {
    const sc = (i / nL) * 0.8 + 0.12
    const rx = Math.min(W, H) * sc * 0.41
    const ry = Math.min(W, H) * sc * 0.33
    ctx.beginPath(); ctx.ellipse(cx, cy - H * 0.025, rx, ry * 0.68, 0, Math.PI, 0)
    ctx.strokeStyle = lc; ctx.lineWidth = hover ? 1.5 : 1; ctx.stroke()
    ctx.beginPath(); ctx.ellipse(cx, cy + H * 0.025, rx, ry * 0.68, 0, 0, Math.PI)
    ctx.strokeStyle = lc; ctx.lineWidth = hover ? 1.5 : 1; ctx.stroke()
  }

  // Bar magnet
  const mW = W * 0.28, mH = H * 0.11
  const mx = cx - mW / 2, my = cy - mH / 2
  ctx.fillStyle = hover ? 'rgba(59,130,246,0.65)' : 'rgba(59,130,246,0.45)'
  ctx.fillRect(mx, my, mW / 2, mH)
  ctx.fillStyle = hover ? 'rgba(239,68,68,0.65)' : 'rgba(239,68,68,0.45)'
  ctx.fillRect(cx, my, mW / 2, mH)
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1
  ctx.strokeRect(mx, my, mW, mH)
  ctx.beginPath(); ctx.moveTo(cx, my); ctx.lineTo(cx, my + mH); ctx.stroke()
  ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(147,197,253,0.85)'; ctx.fillText('S', cx - mW / 4, cy)
  ctx.fillStyle = 'rgba(252,165,165,0.85)'; ctx.fillText('N', cx + mW / 4, cy)

  // Arrows on field lines
  const outerR = Math.min(W, H) * 0.38
  for (let k = 0; k < 4; k++) {
    const ang = ((k + 0.5) / 4) * Math.PI
    const ax = cx - Math.cos(ang) * outerR * 0.68
    const ay = cy - Math.sin(ang) * outerR * 0.5
    const tang = ang - Math.PI / 2, al3 = 9
    ctx.beginPath()
    ctx.moveTo(ax + Math.cos(tang) * al3, ay + Math.sin(tang) * al3)
    ctx.lineTo(ax - Math.cos(tang) * al3 + Math.cos(tang + Math.PI / 2) * al3 * 0.45, ay - Math.sin(tang) * al3 + Math.sin(tang + Math.PI / 2) * al3 * 0.45)
    ctx.lineTo(ax - Math.cos(tang) * al3 - Math.cos(tang + Math.PI / 2) * al3 * 0.45, ay - Math.sin(tang) * al3 - Math.sin(tang + Math.PI / 2) * al3 * 0.45)
    ctx.closePath(); ctx.fillStyle = `rgba(34,211,238,${hover ? 0.65 : 0.38})`; ctx.fill()
  }

  ctx.fillStyle = `rgba(34,211,238,${hover ? 0.45 : 0.25})`
  ctx.font = '11px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('B = μ₀nI', cx, cy + mH / 2 + outerR * 0.45 + 18)
}

const DRAW_FNS: Record<string, DrawFn> = {
  'campo-electrico': drawCampoElectrico,
  'ley-gauss': drawLeyDeGauss,
  'potencial': drawPotencialElectrico,
  'capacitancia': drawCapacitancia,
  'circuitos': drawCircuitosDC,
  'magnetismo': drawCampoMagnetico,
}

// ── VizCanvas ──────────────────────────────────────────────────
function VizCanvas({ phenId, hover }: { phenId: string; hover: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const tRef = useRef(0)
  const hoverRef = useRef(hover)
  hoverRef.current = hover

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    tRef.current += hoverRef.current ? 0.016 : 0.008
    const fn = DRAW_FNS[phenId]
    if (fn) fn(ctx, canvas.width, canvas.height, tRef.current, hoverRef.current)
    rafRef.current = requestAnimationFrame(draw)
  }, [phenId])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [draw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const obs = new ResizeObserver(() => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = parent.clientWidth * dpr
      canvas.height = parent.clientHeight * dpr
      canvas.style.width = parent.clientWidth + 'px'
      canvas.style.height = parent.clientHeight + 'px'
    })
    obs.observe(canvas.parentElement!)
    return () => obs.disconnect()
  }, [])

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
}

// ── PhenomenonRow ──────────────────────────────────────────────
function PhenomenonRow({ phen, index }: { phen: Phenomenon; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rowRef, { once: true, margin: '-12%' })
  const [hover, setHover] = useState(false)
  const reversed = index % 2 === 1

  const textPanel = (
    <motion.div
      initial={{ opacity: 0, x: reversed ? 24 : -24 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="flex flex-col justify-center px-8 py-12 xl:px-14"
      style={{ width: '40%', flexShrink: 0 }}
    >
      {/* Category */}
      <div className="flex items-center gap-2 mb-5">
        <Tag size={11} style={{ color: phen.color, opacity: 0.7 }} />
        <span className="text-xs tracking-[0.18em] uppercase" style={{ color: phen.color, opacity: 0.7 }}>
          {phen.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-4xl xl:text-5xl font-black text-white leading-[1.0] tracking-tight mb-5">
        {phen.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-white/40 leading-relaxed mb-7 max-w-xs">
        {phen.description}
      </p>

      {/* Concepts */}
      <div className="flex flex-wrap gap-2 mb-8">
        {phen.concepts.map(c => (
          <span
            key={c}
            className="text-xs px-2.5 py-1 rounded-lg"
            style={{ background: phen.color + '10', color: phen.color + 'aa', border: `1px solid ${phen.color}20` }}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Time + CTA */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-white/20" />
          <span className="text-xs text-white/25">{phen.time}</span>
        </div>
        <Link to={phen.path}>
          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: phen.color }}
          >
            Explorar <MoveRight size={14} />
          </motion.div>
        </Link>
      </div>
    </motion.div>
  )

  const vizPanel = (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      style={{ flex: 1, minHeight: 420 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Canvas container */}
      <div className="absolute inset-0">
        <VizCanvas phenId={phen.id} hover={hover} />
      </div>

      {/* Glow on hover */}
      <motion.div
        animate={{ opacity: hover ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 pointer-events-none rounded-none"
        style={{ boxShadow: `inset 0 0 80px ${phen.color}10` }}
      />

      {/* Floating explore button on hover */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: hover ? 1 : 0, y: hover ? 0 : 8 }}
        transition={{ duration: 0.25 }}
        className="absolute bottom-6 right-6 pointer-events-none"
      >
        <Link to={phen.path} className="pointer-events-auto">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(2,6,23,0.85)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${phen.color}35`,
              color: phen.color,
            }}
          >
            Abrir simulación <MoveRight size={12} />
          </div>
        </Link>
      </motion.div>

      {/* Top-left label */}
      <div
        className="absolute top-5 left-5 px-2 py-1 rounded-lg text-xs font-mono"
        style={{ background: 'rgba(2,6,23,0.7)', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {phen.id}.sim
      </div>
    </motion.div>
  )

  return (
    <div
      ref={rowRef}
      className={`relative flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
      style={{
        minHeight: '80vh',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {textPanel}
      {vizPanel}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────
export function PhenomenaShowcase() {
  const titleRef = useRef<HTMLDivElement>(null)
  const inView = useInView(titleRef, { once: true })

  return (
    <section style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Section header */}
      <div ref={titleRef} className="px-8 md:px-14 pt-24 pb-16 max-w-3xl">
        <motion.p
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-xs tracking-[0.2em] text-white/25 uppercase mb-4"
        >
          Fenómenos físicos
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-6xl font-black text-white leading-[1.0] tracking-tight"
        >
          Explora los<br />
          <span style={{ color: 'transparent', backgroundImage: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
            fenómenos
          </span>
          <span className="text-white">.</span>
        </motion.h2>
      </div>

      {/* Rows */}
      {PHENOMENA.map((p, i) => (
        <PhenomenonRow key={p.id} phen={p} index={i} />
      ))}
    </section>
  )
}
