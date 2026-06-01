import { useMemo, useState, useEffect, useRef } from 'react'
import PlotlyBase from 'react-plotly.js'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (PlotlyBase as any).default ?? PlotlyBase

interface CircuitoRCProps {
  R: number       // kΩ
  C: number       // µF
  fem: number     // V
  mode: 'carga' | 'descarga'
}

export function CircuitoRCScene({ R, C, fem, mode }: CircuitoRCProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [running, setRunning] = useState(true)
  const animRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  const tau = R * 1000 * C * 1e-6  // τ = RC en segundos
  const tMax = 5 * tau

  // Reset cuando cambian los parámetros
  useEffect(() => {
    setCurrentTime(0)
    startRef.current = null
    setRunning(true)
  }, [R, C, fem, mode])

  // Animación
  useEffect(() => {
    if (!running) return

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = (timestamp - startRef.current) / 1000  // segundos reales
      const simTime = elapsed * (tMax / 8)  // escalar para que 8s reales = 5τ

      if (simTime >= tMax) {
        setCurrentTime(tMax)
        setRunning(false)
        return
      }

      setCurrentTime(simTime)
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [running, tMax])

  const { tValues, qValues, vValues, iValues } = useMemo(() => {
    const steps = 300
    const ts: number[] = []
    const qs: number[] = []
    const vs: number[] = []
    const is: number[] = []

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tMax
      ts.push(t * 1000)  // en ms para mejor lectura

      const q0 = C * 1e-6 * fem  // carga máxima en Coulombs

      if (mode === 'carga') {
        const q = q0 * (1 - Math.exp(-t / tau))
        const v = fem * (1 - Math.exp(-t / tau))
        const curr = (fem / (R * 1000)) * Math.exp(-t / tau)
        qs.push(q * 1e6)    // µC
        vs.push(v)          // V
        is.push(curr * 1000) // mA
      } else {
        const q = q0 * Math.exp(-t / tau)
        const v = fem * Math.exp(-t / tau)
        const curr = -(fem / (R * 1000)) * Math.exp(-t / tau)
        qs.push(q * 1e6)
        vs.push(v)
        is.push(curr * 1000)
      }
    }

    return { tValues: ts, qValues: qs, vValues: vs, iValues: is }
  }, [R, C, fem, mode, tau, tMax])

  // Valor actual en la animación
  const tCurrent = currentTime * 1000
  const vCurrent =
    mode === 'carga'
      ? fem * (1 - Math.exp(-currentTime / tau))
      : fem * Math.exp(-currentTime / tau)
  const iCurrent =
    mode === 'carga'
      ? (fem / (R * 1000)) * Math.exp(-currentTime / tau) * 1000
      : -(fem / (R * 1000)) * Math.exp(-currentTime / tau) * 1000

  const tauMs = tau * 1000

  return (
    <div className="flex flex-col h-full" style={{ background: '#050912' }}>
      <Plot
        style={{ flex: 1, minHeight: 0 }}
        data={[
          // Carga q(t)
          {
            type: 'scatter' as const,
            x: tValues,
            y: qValues,
            mode: 'lines',
            name: 'Carga q(t) [µC]',
            line: { color: '#3b82f6', width: 2.5 },
            yaxis: 'y',
          },
          // Voltaje V(t)
          {
            type: 'scatter' as const,
            x: tValues,
            y: vValues,
            mode: 'lines',
            name: 'Voltaje V(t) [V]',
            line: { color: '#10b981', width: 2.5 },
            yaxis: 'y2',
          },
          // Corriente I(t)
          {
            type: 'scatter' as const,
            x: tValues,
            y: iValues,
            mode: 'lines',
            name: 'Corriente I(t) [mA]',
            line: { color: '#f59e0b', width: 1.5, dash: 'dot' },
            yaxis: 'y2',
          },
          // Línea de tiempo actual
          {
            type: 'scatter' as const,
            x: [tCurrent, tCurrent],
            y: [Math.min(...qValues), Math.max(...qValues)],
            mode: 'lines',
            line: { color: '#ef4444', width: 1.5, dash: 'dash' },
            name: 'Tiempo actual',
            showlegend: false,
            yaxis: 'y',
          },
          // Línea τ
          {
            type: 'scatter' as const,
            x: [tauMs, tauMs],
            y: [Math.min(...qValues), Math.max(...qValues)],
            mode: 'lines',
            line: { color: '#a78bfa', width: 1, dash: 'longdash' },
            name: `τ = ${tauMs.toFixed(1)} ms`,
            yaxis: 'y',
          },
        ]}
        layout={{
          paper_bgcolor: '#050912',
          plot_bgcolor: '#0a0f1e',
          margin: { t: 30, b: 50, l: 50, r: 60 },
          font: { color: '#94a3b8', size: 11 },
          xaxis: {
            title: { text: 'Tiempo (ms)', font: { color: '#64748b' } },
            gridcolor: '#1e293b',
            zerolinecolor: '#334155',
            color: '#64748b',
          },
          yaxis: {
            title: { text: 'Carga q (µC)', font: { color: '#3b82f6' } },
            gridcolor: '#1e293b',
            color: '#3b82f6',
          },
          yaxis2: {
            title: { text: 'V (V) / I (mA)', font: { color: '#10b981' } },
            overlaying: 'y',
            side: 'right',
            color: '#10b981',
            showgrid: false,
          },
          legend: {
            x: 0.5,
            y: 0.95,
            bgcolor: '#0f172a',
            bordercolor: '#1e293b',
            borderwidth: 1,
            font: { size: 10 },
          },
          annotations: [
            {
              x: tauMs,
              y: Math.max(...qValues) * 0.9,
              text: `τ = RC`,
              showarrow: false,
              font: { color: '#a78bfa', size: 11 },
              xref: 'x',
              yref: 'y',
            },
          ],
        }}
        config={{ displayModeBar: false, responsive: true }}
      />

      {/* Panel de valores actuales */}
      <div className="flex items-center gap-6 px-4 py-2 border-t border-slate-800/60 text-xs font-mono">
        <span style={{ color: '#3b82f6' }}>q = {(vCurrent * C).toFixed(2)} µC</span>
        <span style={{ color: '#10b981' }}>V = {vCurrent.toFixed(2)} V</span>
        <span style={{ color: '#f59e0b' }}>I = {iCurrent.toFixed(3)} mA</span>
        <span style={{ color: '#a78bfa' }}>τ = {tauMs.toFixed(1)} ms</span>
        <span className="text-slate-500">t = {tCurrent.toFixed(1)} ms</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => { setCurrentTime(0); startRef.current = null; setRunning(true) }}
            className="px-3 py-1 rounded text-xs border border-slate-700 text-slate-400 hover:border-slate-500 transition-colors"
          >
            ↺ Reset
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            className="px-3 py-1 rounded text-xs border text-xs transition-colors"
            style={{ borderColor: running ? '#ef4444' : '#10b981', color: running ? '#ef4444' : '#10b981' }}
          >
            {running ? '⏸ Pausar' : '▶ Continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}
