// Simulación SVG de circuito con Leyes de Kirchhoff
interface CircuitoKirchhoffProps {
  fem: number     // V
  r: number       // Ω (resistencia interna)
  R1: number      // Ω
  R2: number      // Ω
  R3: number      // Ω
}

export function CircuitoKirchhoffScene({ fem, r, R1, R2, R3 }: CircuitoKirchhoffProps) {
  // Circuito: FEM en serie con r, R1 y (R2 ∥ R3)
  const R23 = (R2 * R3) / (R2 + R3)
  const Rtotal = r + R1 + R23
  const I = fem / Rtotal              // corriente total (A)
  const Vr = I * r                    // caída en resistencia interna
  const V1 = I * R1                   // caída en R1
  const V23 = I * R23                 // caída en R2||R3
  const I2 = V23 / R2                 // corriente en R2
  const I3 = V23 / R3                 // corriente en R3
  const Pbat = fem * I

  const W = 700
  const H = 420

  // Grosor de línea proporcional a corriente
  const lineW = (frac: number) => Math.max(1.5, frac * 5)

  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#050912' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="90%" style={{ maxHeight: '480px' }}>
        <rect width={W} height={H} fill="#050912" />

        {/* ── Circuito principal ─────────────────────────── */}

        {/* Nodo A (arriba-izq) */}
        <circle cx={100} cy={80} r={5} fill="#10b981" />
        {/* Nodo B (arriba-der) */}
        <circle cx={600} cy={80} r={5} fill="#f59e0b" />
        {/* Nodo C (abajo-izq) */}
        <circle cx={100} cy={330} r={5} fill="#10b981" />
        {/* Nodo D (abajo-der) */}
        <circle cx={600} cy={330} r={5} fill="#f59e0b" />

        {/* Rama izquierda — FEM + r */}
        <line x1={100} y1={80} x2={100} y2={330} stroke="#10b981" strokeWidth={lineW(1)} />

        {/* Batería (izq) */}
        <g transform="translate(100,200)">
          <line x1={-14} y1={-10} x2={14} y2={-10} stroke="#10b981" strokeWidth={3} />
          <line x1={-8} y1={0} x2={8} y2={0} stroke="#10b981" strokeWidth={1.5} />
          <text x={20} y={-6} fill="#10b981" fontSize={12} fontFamily="monospace">+</text>
          <text x={20} y={8} fill="#10b981" fontSize={12} fontFamily="monospace">−</text>
          <text x={-60} y={3} fill="#10b981" fontSize={13} fontFamily="monospace" textAnchor="middle">
            ε={fem}V
          </text>
        </g>

        {/* Bus superior A→B */}
        <line x1={100} y1={80} x2={600} y2={80} stroke="#34d399" strokeWidth={lineW(1)} />

        {/* r (interna) — arriba izq */}
        <rect x={140} y={60} width={60} height={40} rx={4} fill="none" stroke="#64748b" strokeWidth={1.5} />
        <text x={170} y={85} textAnchor="middle" fill="#64748b" fontSize={11} fontFamily="monospace">r={r}Ω</text>
        <text x={170} y={55} textAnchor="middle" fill="#475569" fontSize={10} fontFamily="monospace">
          {Vr.toFixed(2)}V
        </text>

        {/* R1 — bus superior */}
        <rect x={260} y={60} width={80} height={40} rx={4} fill="none" stroke="#f59e0b" strokeWidth={2} />
        <text x={300} y={85} textAnchor="middle" fill="#f59e0b" fontSize={12} fontFamily="monospace">R₁={R1}Ω</text>
        <text x={300} y={55} textAnchor="middle" fill="#fbbf24" fontSize={10} fontFamily="monospace">
          {V1.toFixed(2)}V / {(I * 1000).toFixed(1)}mA
        </text>

        {/* Nodo E (bifurcación) */}
        <circle cx={430} cy={80} r={6} fill="#a78bfa" />
        <text x={430} y={68} textAnchor="middle" fill="#a78bfa" fontSize={10}>E</text>

        {/* Nodo F (reunión abajo) */}
        <circle cx={430} cy={330} r={6} fill="#a78bfa" />
        <text x={430} y={350} textAnchor="middle" fill="#a78bfa" fontSize={10}>F</text>

        {/* R2 (rama superior del paralelo) */}
        <line x1={430} y1={80} x2={430} y2={140} stroke="#8b5cf6" strokeWidth={lineW(I2 / I)} />
        <rect x={400} y={140} width={60} height={40} rx={4} fill="none" stroke="#8b5cf6" strokeWidth={2} />
        <text x={430} y={165} textAnchor="middle" fill="#8b5cf6" fontSize={12} fontFamily="monospace">R₂={R2}Ω</text>
        <line x1={430} y1={180} x2={430} y2={200} stroke="#8b5cf6" strokeWidth={lineW(I2 / I)} />

        {/* R3 (rama del paralelo a la derecha) */}
        <line x1={430} y1={80} x2={530} y2={80} stroke="#ec4899" strokeWidth={lineW(I3 / I)} />
        <line x1={530} y1={80} x2={530} y2={140} stroke="#ec4899" strokeWidth={lineW(I3 / I)} />
        <rect x={500} y={140} width={60} height={40} rx={4} fill="none" stroke="#ec4899" strokeWidth={2} />
        <text x={530} y={165} textAnchor="middle" fill="#ec4899" fontSize={12} fontFamily="monospace">R₃={R3}Ω</text>
        <line x1={530} y1={180} x2={530} y2={200} stroke="#ec4899" strokeWidth={lineW(I3 / I)} />
        <line x1={430} y1={200} x2={530} y2={200} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />

        {/* Reunión abajo */}
        <line x1={430} y1={200} x2={430} y2={330} stroke="#a78bfa" strokeWidth={lineW(1)} />
        <line x1={530} y1={200} x2={530} y2={330} stroke="#ec4899" strokeWidth={lineW(I3 / I)} />
        <line x1={430} y1={330} x2={530} y2={330} stroke="#a78bfa" strokeWidth={1.5} />

        {/* Bus inferior B→A */}
        <line x1={100} y1={330} x2={600} y2={330} stroke="#334155" strokeWidth={2} />
        <line x1={600} y1={80} x2={600} y2={330} stroke="#334155" strokeWidth={1.5} />

        {/* ── Panel KCL / KVL ───────────────────────── */}
        <rect x={10} y={360} width={680} height={55} rx={8} fill="#0f172a" stroke="#1e293b" />

        <text x={20} y={378} fill="#64748b" fontSize={10} fontFamily="monospace">KCL en E:</text>
        <text x={20} y={392} fill="#10b981" fontSize={11} fontFamily="monospace">
          {`I = I₂ + I₃  →  ${(I*1000).toFixed(1)} = ${(I2*1000).toFixed(1)} + ${(I3*1000).toFixed(1)} mA ✓`}
        </text>

        <text x={280} y={378} fill="#64748b" fontSize={10} fontFamily="monospace">KVL malla:</text>
        <text x={280} y={392} fill="#f59e0b" fontSize={11} fontFamily="monospace">
          {`ε = Vr+V₁+V₂₃  ${fem} ≈ ${(Vr+V1+V23).toFixed(1)} V`}
        </text>

        <text x={500} y={378} fill="#64748b" fontSize={10} fontFamily="monospace">Potencia:</text>
        <text x={500} y={392} fill="#a78bfa" fontSize={11} fontFamily="monospace">
          {`P_bat=${Pbat.toFixed(2)}W`}
        </text>

        {/* Etiquetas corriente */}
        <text x={165} y={78} fill="#fbbf24" fontSize={10} fontFamily="monospace" textAnchor="middle">
          →{(I*1000).toFixed(1)}mA
        </text>
        <text x={455} y={110} fill="#8b5cf6" fontSize={10} fontFamily="monospace">
          I₂={( I2*1000).toFixed(1)}mA↓
        </text>
        <text x={540} y={110} fill="#ec4899" fontSize={10} fontFamily="monospace">
          I₃={( I3*1000).toFixed(1)}mA↓
        </text>
      </svg>
    </div>
  )
}
