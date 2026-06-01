import { useMemo, useState, useEffect, useRef } from 'react'
import PlotlyBase from 'react-plotly.js'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (PlotlyBase as any).default ?? PlotlyBase

// Movimiento de una partícula cargada en campo B uniforme
// F = qv × B  → movimiento circular/helicoidal
// r = mv/(|q|B),  T = 2πm/(|q|B)
// Con componente vz → hélice

interface FuerzaLorentzProps {
  B: number       // T (campo magnético en eje Z)
  charge: number  // C (carga de la partícula)
  mass: number    // kg (masa)
  v0x: number     // m/s componente x inicial
  v0z: number     // m/s componente z inicial (da paso helicoidal)
}

function computeTrajectory(B: number, charge: number, mass: number, v0x: number, v0z: number) {
  if (Math.abs(charge) < 1e-30 || Math.abs(B) < 1e-10) {
    return { xs: [0], ys: [0], zs: [0], r: 0, T: 0 }
  }
  const omega = (Math.abs(charge) * Math.abs(B)) / mass  // frecuencia ciclotrón
  const r = (mass * Math.abs(v0x)) / (Math.abs(charge) * Math.abs(B))  // radio
  const T = (2 * Math.PI * mass) / (Math.abs(charge) * Math.abs(B))    // período

  const sign = charge * B > 0 ? 1 : -1
  const steps = 400
  const tMax = 3 * T
  const xs: number[] = []
  const ys: number[] = []
  const zs: number[] = []

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * tMax
    xs.push(r * Math.sin(sign * omega * t))
    ys.push(r * (1 - Math.cos(sign * omega * t)))
    zs.push(v0z * t)
  }

  return { xs, ys, zs, r, T }
}

export function FuerzaLorentzScene({ B, charge, mass, v0x, v0z }: FuerzaLorentzProps) {
  const [animIndex, setAnimIndex] = useState(0)
  const [running, setRunning] = useState(true)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  const { xs, ys, zs, r, T } = useMemo(
    () => computeTrajectory(B, charge, mass, v0x, v0z),
    [B, charge, mass, v0x, v0z],
  )

  // Reset al cambiar parámetros
  useEffect(() => {
    setAnimIndex(0)
    startRef.current = null
    setRunning(true)
  }, [B, charge, mass, v0x, v0z])

  // Animación
  useEffect(() => {
    if (!running) return
    const total = xs.length

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = (ts - startRef.current) / 1000  // segundos
      const idx = Math.min(Math.floor((elapsed / (T * 3)) * total), total - 1)
      setAnimIndex(idx)
      if (idx < total - 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setRunning(false)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [running, xs.length, T])

  const isHelix = Math.abs(v0z) > 0.01
  const rLabel = r >= 1e-3 ? `${(r * 1e3).toFixed(2)} mm`
    : r >= 1e-6 ? `${(r * 1e6).toFixed(2)} µm`
    : `${(r * 1e9).toFixed(2)} nm`
  const TLabel = T >= 1e-3 ? `${(T * 1e3).toFixed(3)} ms`
    : T >= 1e-6 ? `${(T * 1e6).toFixed(3)} µs`
    : T >= 1e-9 ? `${(T * 1e9).toFixed(3)} ns`
    : `${(T * 1e12).toFixed(2)} ps`
  const chargeLabel = charge > 0 ? '+q' : '−q'
  const particleColor = charge > 0 ? '#ef4444' : '#3b82f6'

  return (
    <div className="flex flex-col h-full" style={{ background: '#050912' }}>
      <Plot
        style={{ flex: 1, minHeight: 0 }}
        data={[
          // Trayectoria completa (atenuada)
          {
            type: 'scatter3d' as const,
            x: xs,
            y: ys,
            z: zs,
            mode: 'lines',
            line: { color: '#1e3a5f', width: 2 },
            name: 'Trayectoria',
            hoverinfo: 'none',
          },
          // Trayectoria animada
          {
            type: 'scatter3d' as const,
            x: xs.slice(0, animIndex + 1),
            y: ys.slice(0, animIndex + 1),
            z: zs.slice(0, animIndex + 1),
            mode: 'lines',
            line: { color: '#06b6d4', width: 3 },
            name: 'Recorrido actual',
            hoverinfo: 'none',
          },
          // Partícula
          {
            type: 'scatter3d' as const,
            x: [xs[animIndex] ?? 0],
            y: [ys[animIndex] ?? 0],
            z: [zs[animIndex] ?? 0],
            mode: 'markers',
            marker: { size: 8, color: particleColor, symbol: 'circle' },
            name: chargeLabel,
          },
          // Origen
          {
            type: 'scatter3d' as const,
            x: [0],
            y: [0],
            z: [0],
            mode: 'markers',
            marker: { size: 5, color: '#64748b' },
            name: 'Origen',
            hoverinfo: 'none',
          },
        ]}
        layout={{
          paper_bgcolor: '#050912',
          scene: {
            bgcolor: '#0a0f1e',
            xaxis: { title: 'x (m)', gridcolor: '#1e293b', color: '#64748b', zerolinecolor: '#334155' },
            yaxis: { title: 'y (m)', gridcolor: '#1e293b', color: '#64748b', zerolinecolor: '#334155' },
            zaxis: { title: 'z (m)', gridcolor: '#1e293b', color: '#64748b', zerolinecolor: '#334155' },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } },
            annotations: [
              {
                x: 0, y: 0, z: 0,
                text: `B = ${B.toFixed(2)} T (↑z)`,
                showarrow: false,
                font: { color: '#34d399', size: 11 },
              },
            ],
          },
          margin: { t: 20, b: 10, l: 10, r: 10 },
          legend: {
            x: 0.02, y: 0.98,
            bgcolor: '#0f172a',
            bordercolor: '#1e293b',
            borderwidth: 1,
            font: { color: '#94a3b8', size: 10 },
          },
          title: {
            text: isHelix ? '🌀 Movimiento Helicoidal' : '⭕ Movimiento Circular',
            font: { color: '#94a3b8', size: 13 },
            x: 0.5,
          },
        }}
        config={{ displayModeBar: false, responsive: true }}
      />

      {/* Panel de valores */}
      <div className="flex items-center gap-6 px-4 py-2 border-t border-slate-800/60 text-xs font-mono flex-wrap">
        <span style={{ color: '#06b6d4' }}>r = {rLabel}</span>
        <span style={{ color: '#a78bfa' }}>T = {TLabel}</span>
        <span style={{ color: particleColor }}>{chargeLabel} = {charge > 0 ? '+' : ''}{(charge * 1e19).toFixed(1)}×10⁻¹⁹ C</span>
        <span style={{ color: '#34d399' }}>B = {B.toFixed(2)} T</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => { setAnimIndex(0); startRef.current = null; setRunning(true) }}
            className="px-3 py-1 rounded text-xs border border-slate-700 text-slate-400 hover:border-slate-500 transition-colors"
          >
            ↺ Reset
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            className="px-3 py-1 rounded text-xs border transition-colors"
            style={{ borderColor: running ? '#ef4444' : '#10b981', color: running ? '#ef4444' : '#10b981' }}
          >
            {running ? '⏸ Pausar' : '▶ Continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}
