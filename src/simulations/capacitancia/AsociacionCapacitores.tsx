// Simulación SVG interactiva de asociaciones de capacitores (serie y paralelo)
interface AsociacionProps {
  c1: number       // µF
  c2: number       // µF
  c3: number       // µF
  voltage: number  // V
  mode: 'serie' | 'paralelo'
}

function CapacitorSymbol({
  x,
  y,
  label,
  value,
  color = '#3b82f6',
}: {
  x: number
  y: number
  label: string
  value: number
  color?: string
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Línea izquierda */}
      <line x1={-30} y1={0} x2={-6} y2={0} stroke={color} strokeWidth={2} />
      {/* Placa izquierda */}
      <line x1={-6} y1={-18} x2={-6} y2={18} stroke={color} strokeWidth={3} />
      {/* Placa derecha */}
      <line x1={6} y1={-18} x2={6} y2={18} stroke={color} strokeWidth={3} />
      {/* Línea derecha */}
      <line x1={6} y1={0} x2={30} y2={0} stroke={color} strokeWidth={2} />
      {/* Label */}
      <text x={0} y={-26} textAnchor="middle" fill={color} fontSize={12} fontFamily="JetBrains Mono, monospace">
        {label}
      </text>
      <text x={0} y={34} textAnchor="middle" fill="#94a3b8" fontSize={11} fontFamily="JetBrains Mono, monospace">
        {value.toFixed(1)} µF
      </text>
    </g>
  )
}

function BatterySymbol({ x, y, voltage }: { x: number; y: number; voltage: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={0} y1={-40} x2={0} y2={-8} stroke="#10b981" strokeWidth={2} />
      <line x1={-14} y1={-8} x2={14} y2={-8} stroke="#10b981" strokeWidth={3} />
      <line x1={-8} y1={0} x2={8} y2={0} stroke="#10b981" strokeWidth={1.5} />
      <line x1={0} y1={0} x2={0} y2={40} stroke="#10b981" strokeWidth={2} />
      <text x={20} y={-4} fill="#10b981" fontSize={12} fontFamily="monospace">
        {voltage}V
      </text>
      <text x={-6} y={-14} fill="#ef4444" fontSize={13} fontWeight="bold">+</text>
      <text x={-6} y={10} fill="#3b82f6" fontSize={13} fontWeight="bold">−</text>
    </g>
  )
}

export function AsociacionCapacitoresScene({
  c1,
  c2,
  c3,
  voltage,
  mode,
}: AsociacionProps) {
  const ceq =
    mode === 'paralelo'
      ? c1 + c2 + c3
      : 1 / (1 / c1 + 1 / c2 + 1 / c3)

  const qtotal = ceq * voltage  // µC
  const colors = ['#3b82f6', '#f59e0b', '#8b5cf6']

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center"
      style={{ background: '#050912' }}
    >
      <svg viewBox="0 0 600 400" width="100%" height="85%" style={{ maxHeight: '500px' }}>
        {/* Fondo */}
        <rect width={600} height={400} fill="#050912" />

        {mode === 'paralelo' ? (
          /* ──── PARALELO ──── */
          <g>
            {/* Bus superior */}
            <line x1={80} y1={80} x2={520} y2={80} stroke="#334155" strokeWidth={2} />
            {/* Bus inferior */}
            <line x1={80} y1={300} x2={520} y2={300} stroke="#334155" strokeWidth={2} />
            {/* Batería izquierda */}
            <line x1={80} y1={80} x2={80} y2={152} stroke="#10b981" strokeWidth={2} />
            <BatterySymbol x={80} y={190} voltage={voltage} />
            <line x1={80} y1={228} x2={80} y2={300} stroke="#10b981" strokeWidth={2} />
            {/* Capacitores en paralelo */}
            {[c1, c2, c3].map((c, i) => (
              <g key={i}>
                <line x1={160 + i * 120} y1={80} x2={160 + i * 120} y2={162} stroke={colors[i]} strokeWidth={2} />
                <CapacitorSymbol
                  x={160 + i * 120}
                  y={190}
                  label={`C${i + 1}`}
                  value={c}
                  color={colors[i]}
                />
                <line x1={160 + i * 120} y1={218} x2={160 + i * 120} y2={300} stroke={colors[i]} strokeWidth={2} />
              </g>
            ))}
          </g>
        ) : (
          /* ──── SERIE ──── */
          <g>
            {/* Batería izquierda */}
            <line x1={60} y1={60} x2={60} y2={152} stroke="#10b981" strokeWidth={2} />
            <BatterySymbol x={60} y={190} voltage={voltage} />
            <line x1={60} y1={228} x2={60} y2={320} stroke="#10b981" strokeWidth={2} />
            {/* Bus inferior */}
            <line x1={60} y1={320} x2={540} y2={320} stroke="#334155" strokeWidth={2} />
            {/* Bus superior (nodo desde batería) */}
            <line x1={60} y1={60} x2={120} y2={60} stroke="#334155" strokeWidth={2} />
            {/* Capacitores en serie */}
            {[c1, c2, c3].map((c, i) => (
              <g key={i}>
                {i > 0 && (
                  <line x1={60 + i * 140} y1={60} x2={120 + i * 140} y2={60} stroke={colors[i - 1]} strokeWidth={2} />
                )}
                <CapacitorSymbol
                  x={152 + i * 140}
                  y={60}
                  label={`C${i + 1}`}
                  value={c}
                  color={colors[i]}
                />
              </g>
            ))}
            {/* Línea final */}
            <line x1={60 + 3 * 140} y1={60} x2={540} y2={60} stroke="#334155" strokeWidth={2} />
            <line x1={540} y1={60} x2={540} y2={320} stroke="#334155" strokeWidth={2} />
          </g>
        )}

        {/* Panel de resultados */}
        <g transform="translate(20, 340)">
          <rect width={560} height={50} rx={8} fill="#0f172a" stroke="#1e293b" />
          <text x={20} y={20} fill="#94a3b8" fontSize={11} fontFamily="monospace">
            Modo: {mode === 'paralelo' ? 'PARALELO' : 'SERIE'}
          </text>
          <text x={20} y={37} fill="#34d399" fontSize={13} fontFamily="monospace" fontWeight="bold">
            Ceq = {ceq.toFixed(2)} µF
          </text>
          <text x={200} y={37} fill="#f59e0b" fontSize={13} fontFamily="monospace" fontWeight="bold">
            Q = {qtotal.toFixed(1)} µC
          </text>
          <text x={380} y={37} fill="#a78bfa" fontSize={13} fontFamily="monospace" fontWeight="bold">
            U = {((0.5 * ceq * voltage * voltage) * 1e-6).toExponential(2)} J
          </text>
        </g>
      </svg>
    </div>
  )
}
