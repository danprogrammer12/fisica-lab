import { useMemo } from 'react'
import PlotlyBase from 'react-plotly.js'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (PlotlyBase as any).default ?? PlotlyBase
import { K_COULOMB, NC_TO_C, MIN_DISTANCE } from '../../physics/constants'

interface EquipotencialesSceneProps {
  charge: number      // nC
  numLines: number    // número de niveles equipotenciales
}

export function EquipotencialesScene({ charge, numLines }: EquipotencialesSceneProps) {
  const { x, y, z, fieldX, fieldY, startX, startY } = useMemo(() => {
    const N = 80
    const range = 4
    const step = (2 * range) / N
    const q_C = charge * NC_TO_C

    const xs: number[] = []
    const ys: number[] = []
    const zs: number[][] = []

    for (let j = 0; j <= N; j++) {
      const yv = -range + j * step
      ys.push(yv)
      const row: number[] = []
      for (let i = 0; i <= N; i++) {
        const xv = -range + i * step
        if (j === 0) xs.push(xv)
        const r = Math.sqrt(xv * xv + yv * yv)
        const V = r < MIN_DISTANCE ? 0 : (K_COULOMB * q_C) / r
        row.push(Math.max(-2e10, Math.min(2e10, V)))
      }
      zs.push(row)
    }

    // Vectores de campo en grilla reducida para quiver
    const Ng = 12
    const stepQ = (2 * range) / Ng
    const fx: number[] = []
    const fy: number[] = []
    const sx: number[] = []
    const sy: number[] = []

    for (let j = 1; j < Ng; j++) {
      for (let i = 1; i < Ng; i++) {
        const xv = -range + i * stepQ
        const yv = -range + j * stepQ
        const r = Math.sqrt(xv * xv + yv * yv)
        if (r < 0.6) continue
        const Ex = K_COULOMB * q_C * xv / (r * r * r)
        const Ey = K_COULOMB * q_C * yv / (r * r * r)
        const mag = Math.sqrt(Ex * Ex + Ey * Ey)
        if (mag < 1e3) continue
        const scale = 0.25
        sx.push(xv)
        sy.push(yv)
        fx.push((Ex / mag) * scale)
        fy.push((Ey / mag) * scale)
      }
    }

    return { x: xs, y: ys, z: zs, fieldX: fx, fieldY: fy, startX: sx, startY: sy }
  }, [charge])

  const isPos = charge >= 0
  const chargeColor = isPos ? 'red' : 'blue'

  return (
    <div style={{ width: '100%', height: '100%', background: '#050912' }}>
      <Plot
        style={{ width: '100%', height: '100%' }}
        data={[
          // Mapa de equipotenciales
          {
            type: 'contour' as const,
            x,
            y,
            z,
            colorscale: [
              [0, '#3b82f6'],
              [0.45, '#1e293b'],
              [0.5, '#0f172a'],
              [0.55, '#1e293b'],
              [1, '#ef4444'],
            ],
            contours: {
              coloring: 'heatmap',
              showlines: true,
              start: -2e10,
              end: 2e10,
              size: 4e9,
            },
            line: { width: 1.5, color: '#34d399' },
            ncontours: numLines,
            showscale: false,
          },
          // Vectores de campo (flechas aproximadas con annotations no soportado en contour — usamos scatter)
          {
            type: 'scatter' as const,
            x: startX.flatMap((sx, i) => [sx, sx + fieldX[i], null]),
            y: startY.flatMap((sy, i) => [sy, sy + fieldY[i], null]),
            mode: 'lines',
            line: { color: '#fbbf24', width: 1 },
            hoverinfo: 'none',
          },
          // Carga puntual
          {
            type: 'scatter' as const,
            x: [0],
            y: [0],
            mode: 'text+markers' as const,
            marker: { size: 18, color: chargeColor, symbol: 'circle' },
            text: [isPos ? '+q' : '−q'],
            textposition: 'top center',
            textfont: { color: chargeColor, size: 14 },
            hoverinfo: 'none',
          },
        ]}
        layout={{
          paper_bgcolor: '#050912',
          plot_bgcolor: '#050912',
          margin: { t: 20, b: 30, l: 30, r: 10 },
          xaxis: {
            range: [-4, 4],
            gridcolor: '#1e293b',
            zerolinecolor: '#334155',
            color: '#64748b',
            title: { text: 'x (m)', font: { color: '#64748b', size: 11 } },
          },
          yaxis: {
            range: [-4, 4],
            gridcolor: '#1e293b',
            zerolinecolor: '#334155',
            color: '#64748b',
            scaleanchor: 'x',
            title: { text: 'y (m)', font: { color: '#64748b', size: 11 } },
          },
          showlegend: false,
          annotations: [
            {
              x: 3.5,
              y: 3.5,
              text: '— Equipotenciales',
              showarrow: false,
              font: { color: '#34d399', size: 11 },
              xref: 'x',
              yref: 'y',
            },
            {
              x: 3.5,
              y: 3.2,
              text: '→ Campo E',
              showarrow: false,
              font: { color: '#fbbf24', size: 11 },
              xref: 'x',
              yref: 'y',
            },
          ],
        }}
        config={{ displayModeBar: false, responsive: true }}
      />
    </div>
  )
}
