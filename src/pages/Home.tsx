import { Suspense, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Atom, ChevronRight, ArrowDown, MoveRight, X, ZoomIn, ZoomOut, Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HeroScene } from '../components/home/HeroScene'
import { DipoleFieldCanvas } from '../components/home/DipoleFieldCanvas'
import { PhenomenaShowcase } from '../components/home/PhenomenaShowcase'
import { MODULES } from '../data/modules'

// ── Minimal nav ────────────────────────────────────────────────
function Nav() {
  const { scrollY } = useScroll()
  const bg = useTransform(scrollY, [0, 60], ['rgba(2,6,23,0)', 'rgba(2,6,23,0.92)'])
  const border = useTransform(scrollY, [0, 60], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.05)'])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-14"
      style={{ background: bg, borderBottom: `1px solid`, borderColor: border, backdropFilter: 'blur(16px)' }}
    >
      <div className="flex items-center gap-2">
        <Atom size={16} className="text-blue-400" />
        <span className="text-sm font-semibold text-white/80 tracking-tight">PhysicsLab</span>
      </div>
      <nav className="hidden md:flex items-center gap-6">
        {MODULES.filter(m => m.isAvailable).map(m => (
          <Link key={m.id} to={m.path} className="text-xs text-white/30 hover:text-white/70 transition-colors tracking-wide">
            {m.title}
          </Link>
        ))}
      </nav>
      <Link to="/campo-electrico">
        <span className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1">
          Explorar <ChevronRight size={12} />
        </span>
      </Link>
    </motion.header>
  )
}

// ── SECTION 1: Full-screen hero simulation ─────────────────────
function HeroSection() {
  const [charge, setCharge] = useState(5)

  return (
    <section className="relative w-full h-screen overflow-hidden">

      {/* Physics fills the screen */}
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <HeroScene charge={charge} numLines={24} />
        </Suspense>
      </div>

      {/* Dark vignette bottom */}
      <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #020617 0%, transparent 100%)' }} />
      <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, #020617 0%, transparent 100%)' }} />

      {/* Minimal overlay — bottom left */}
      <div className="absolute bottom-16 left-10 md:left-16 max-w-lg">
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }}
          className="text-xs tracking-[0.25em] text-white/30 uppercase mb-3"
        >
          Laboratorio Virtual · UAC 2026
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tight mb-6"
        >
          Física<br />
          <span style={{ color: 'transparent', backgroundImage: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
            Eléctrica
          </span>
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75, duration: 0.8 }}
          className="flex items-center gap-5"
        >
          <Link to="/campo-electrico">
            <motion.span
              whileHover={{ x: 3 }}
              className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Comenzar a explorar <MoveRight size={15} />
            </motion.span>
          </Link>
          <span className="w-px h-4 bg-white/10" />
          <span className="text-xs text-white/25">6 módulos · 12 simulaciones</span>
        </motion.div>
      </div>

      {/* Charge switcher — top right corner */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.6 }}
        className="absolute top-20 right-8 flex items-center gap-2"
      >
        <span className="text-xs text-white/20 mr-1">carga</span>
        {([5, -5] as const).map(v => (
          <button
            key={v}
            onClick={() => setCharge(v)}
            className="w-8 h-8 rounded-full text-xs font-bold transition-all border"
            style={charge === v
              ? { background: v > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(99,155,235,0.25)', color: v > 0 ? '#fca5a5' : '#93c5fd', borderColor: v > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(99,155,235,0.4)' }
              : { background: 'transparent', color: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.08)' }
            }
          >
            {v > 0 ? '+' : '−'}
          </button>
        ))}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
          <ArrowDown size={14} className="text-white/15" />
        </motion.div>
      </motion.div>
    </section>
  )
}

// ── SECTION 2: Dipole visualization ───────────────────────────
function DipoleSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15%' })
  const [separation, setSeparation] = useState(2.4)

  return (
    <section ref={ref} className="relative flex flex-col lg:flex-row" style={{ minHeight: '90vh' }}>

      {/* Canvas — takes most of the space */}
      <div className="relative flex-1" style={{ minHeight: '55vh' }}>
        <DipoleFieldCanvas separation={separation} className="absolute inset-0 w-full h-full" />
        {/* Left edge gradient */}
        <div className="absolute inset-y-0 left-0 w-16 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #020617, transparent)' }} />
      </div>

      {/* Panel — right side */}
      <motion.div
        initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="lg:w-80 xl:w-96 flex flex-col justify-center px-8 py-16 lg:py-0"
        style={{
          background: 'rgba(2,6,23,0.7)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <p className="text-xs tracking-[0.2em] text-blue-400/60 uppercase mb-4">Campo Eléctrico</p>
        <h2 className="text-3xl font-bold text-white leading-tight mb-2">
          Dipolo<br />Eléctrico
        </h2>
        <p className="text-sm text-white/35 mb-8 leading-relaxed">
          Dos cargas iguales y opuestas generan un campo con patrón característico.
          Mueve el cursor sobre la visualización para ver la dirección del campo en cualquier punto.
        </p>

        {/* Formula display */}
        <div className="mb-8 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs text-white/25 mb-2 font-mono">Momento dipolar</p>
          <p className="text-xl font-mono text-white/80 tracking-wider">p⃗ = q · d⃗</p>
          <p className="text-xs text-white/20 mt-2 font-mono">Campo eje: E ≈ 2kp / r³</p>
        </div>

        {/* Separation control */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-white/30 uppercase tracking-wider">Separación</span>
            <span className="text-xs font-mono text-blue-300/70">{separation.toFixed(1)} m</span>
          </div>
          <input
            type="range" min={0.8} max={4} step={0.1} value={separation}
            onChange={e => setSeparation(Number(e.target.value))}
            className="w-full h-px cursor-pointer"
            style={{ accentColor: '#60a5fa' }}
          />
        </div>

        <Link to="/campo-electrico">
          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white/90 transition-colors"
          >
            Explorar módulo completo <MoveRight size={14} />
          </motion.div>
        </Link>
      </motion.div>
    </section>
  )
}


// ── Micro gráficas SVG (de las infografías) ────────────────────
function ChartVvsR() {
  const pts = Array.from({ length: 60 }, (_, i) => {
    const r = 0.15 + (i / 59) * 0.85
    const v = 1 / r
    return { x: 20 + r * 220, y: 110 - Math.min(v * 28, 96) }
  })
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 260 120" className="w-full" style={{ height: 90 }}>
      <defs>
        <linearGradient id="chart-vgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="20" y1="110" x2="240" y2="110" stroke="#1e293b" strokeWidth="1" />
      <line x1="20" y1="14" x2="20" y2="110" stroke="#1e293b" strokeWidth="1" />
      <path d={d} fill="none" stroke="#f59e0b" strokeWidth="2" />
      <path d={d + ` L240,110 L20,110 Z`} fill="url(#chart-vgrad)" opacity="0.25" />
      <text x="242" y="113" fill="#64748b" fontSize="9" fontFamily="monospace">r</text>
      <text x="4" y="18" fill="#64748b" fontSize="9" fontFamily="monospace">V</text>
      <text x="60" y="30" fill="#f59e0b" fontSize="8" fontFamily="monospace">V = kQ/r</text>
    </svg>
  )
}

function ChartEvsR() {
  const pts = Array.from({ length: 60 }, (_, i) => {
    const r = 0.18 + (i / 59) * 0.82
    const e = 1 / (r * r)
    return { x: 20 + r * 220, y: 110 - Math.min(e * 18, 96) }
  })
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 260 120" className="w-full" style={{ height: 90 }}>
      <defs>
        <linearGradient id="chart-egrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="20" y1="110" x2="240" y2="110" stroke="#1e293b" strokeWidth="1" />
      <line x1="20" y1="14" x2="20" y2="110" stroke="#1e293b" strokeWidth="1" />
      <path d={d} fill="none" stroke="#60a5fa" strokeWidth="2" />
      <path d={d + ` L240,110 L20,110 Z`} fill="url(#chart-egrad)" opacity="0.2" />
      <text x="242" y="113" fill="#64748b" fontSize="9" fontFamily="monospace">r</text>
      <text x="4" y="18" fill="#64748b" fontSize="9" fontFamily="monospace">E</text>
      <text x="55" y="30" fill="#60a5fa" fontSize="8" fontFamily="monospace">E = kq/r²</text>
    </svg>
  )
}

function ChartCvsD() {
  const pts = Array.from({ length: 55 }, (_, i) => {
    const dv = 0.12 + (i / 54) * 0.88
    const c = 1 / dv
    return { x: 20 + dv * 220, y: 110 - Math.min(c * 38, 96) }
  })
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 260 120" className="w-full" style={{ height: 90 }}>
      <defs>
        <linearGradient id="chart-cgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="20" y1="110" x2="240" y2="110" stroke="#1e293b" strokeWidth="1" />
      <line x1="20" y1="14" x2="20" y2="110" stroke="#1e293b" strokeWidth="1" />
      <path d={d} fill="none" stroke="#a78bfa" strokeWidth="2" />
      <path d={d + ` L240,110 L20,110 Z`} fill="url(#chart-cgrad)" opacity="0.2" />
      <text x="242" y="113" fill="#64748b" fontSize="9" fontFamily="monospace">d</text>
      <text x="4" y="18" fill="#64748b" fontSize="9" fontFamily="monospace">C</text>
      <text x="50" y="30" fill="#a78bfa" fontSize="8" fontFamily="monospace">C = ε₀A/d</text>
    </svg>
  )
}

function ChartDischarge() {
  const steps = 55
  const batPts = Array.from({ length: steps }, (_, i) => ({ x: 20 + (i / (steps - 1)) * 220, y: 14 + (i / (steps - 1)) * 90 }))
  const capPts = Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1)
    return { x: 20 + t * 220, y: 14 + (1 - Math.exp(-t * 4.5)) * 90 }
  })
  const bat = batPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const cap = capPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox="0 0 260 120" className="w-full" style={{ height: 90 }}>
      <line x1="20" y1="110" x2="240" y2="110" stroke="#1e293b" strokeWidth="1" />
      <line x1="20" y1="14" x2="20" y2="110" stroke="#1e293b" strokeWidth="1" />
      <path d={bat} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
      <path d={cap} fill="none" stroke="#fbbf24" strokeWidth="2" />
      <text x="242" y="113" fill="#64748b" fontSize="9" fontFamily="monospace">t</text>
      <text x="4" y="18" fill="#64748b" fontSize="9" fontFamily="monospace">U</text>
      <text x="80" y="68" fill="#3b82f6" fontSize="8" fontFamily="monospace">Batería</text>
      <text x="125" y="95" fill="#fbbf24" fontSize="8" fontFamily="monospace">Capacitor</text>
    </svg>
  )
}

function ChartGaussFlux() {
  // Flujo vs radio — constante (línea horizontal)
  return (
    <svg viewBox="0 0 260 120" className="w-full" style={{ height: 90 }}>
      <line x1="20" y1="110" x2="240" y2="110" stroke="#1e293b" strokeWidth="1" />
      <line x1="20" y1="14" x2="20" y2="110" stroke="#1e293b" strokeWidth="1" />
      {/* Phi = constante */}
      <line x1="20" y1="55" x2="240" y2="55" stroke="#10b981" strokeWidth="2.5" />
      <circle cx="130" cy="55" r="4" fill="#10b981" />
      <text x="242" y="113" fill="#64748b" fontSize="9" fontFamily="monospace">R</text>
      <text x="4" y="18" fill="#64748b" fontSize="9" fontFamily="monospace">Φ</text>
      <text x="50" y="42" fill="#10b981" fontSize="8" fontFamily="monospace">Φ = q/ε₀ (constante)</text>
      {/* E vs R curva decreciente */}
      {(() => {
        const pts = Array.from({ length: 50 }, (_, i) => {
          const r = 0.2 + (i / 49) * 0.8
          return { x: 20 + r * 220, y: 110 - (1 / (r * r)) * 16 }
        })
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
        return <path d={d} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
      })()}
      <text x="160" y="100" fill="#60a5fa" fontSize="8" fontFamily="monospace" opacity="0.7">E ~ 1/R²</text>
    </svg>
  )
}

function ChartLorentz() {
  const cx = 130, cy = 62, r = 42
  const steps = 80
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
  })
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z'
  return (
    <svg viewBox="0 0 260 120" className="w-full" style={{ height: 90 }}>
      <defs>
        <marker id="chart-arv" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#2de0a5" />
        </marker>
        <marker id="chart-arf" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#ff4d6d" />
        </marker>
      </defs>
      <path d={d} fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" strokeDasharray="3 2" />
      <circle cx={cx + r} cy={cy} r="5" fill="#ef4444" />
      {/* v — tangente hacia arriba */}
      <line x1={cx + r} y1={cy} x2={cx + r} y2={cy - 28} stroke="#2de0a5" strokeWidth="2" markerEnd="url(#chart-arv)" />
      {/* B — entrando en la página */}
      <text x={cx - 8} y={cy + 5} fill="#f5c542" fontSize="14" textAnchor="middle">⊗</text>
      {/* F — hacia el centro, con punta de flecha */}
      <line x1={cx + r - 2} y1={cy} x2={cx + 16} y2={cy} stroke="#ff4d6d" strokeWidth="2" markerEnd="url(#chart-arf)" />
      <text x="220" y="30" fill="#2de0a5" fontSize="8" fontFamily="monospace">v</text>
      <text x="118" y="67" fill="#f5c542" fontSize="8" fontFamily="monospace">B</text>
      <text x="168" y="67" fill="#ff4d6d" fontSize="8" fontFamily="monospace">F</text>
      <text x="20" y="112" fill="#06b6d4" fontSize="8" fontFamily="monospace">F = q(v × B)</text>
    </svg>
  )
}

// ── Sección Fórmulas por Módulo ────────────────────────────────
const MODULE_FORMULAS = [
  {
    id: 'campo-electrico',
    title: 'Campo Eléctrico',
    color: '#60a5fa',
    path: '/campo-electrico',
    formulas: ['E = kq / r²', 'F = kq₁q₂ / r²'],
    labels: ['Campo de carga puntual', 'Fuerza de Coulomb'],
    note: 'Las líneas salen de +q y llegan a −q. Nunca se cruzan.',
    chart: <ChartEvsR />,
    chartLabel: 'E decae como 1/r²',
  },
  {
    id: 'ley-gauss',
    title: 'Ley de Gauss',
    color: '#10b981',
    path: '/ley-de-gauss',
    formulas: ['Φ = ∮ E·dA = q_enc / ε₀', 'E = q / (4πε₀r²)'],
    labels: ['Flujo a través de sup. cerrada', 'Campo en esfera gaussiana'],
    note: 'Φ no depende del radio de la superficie, solo de q_enc.',
    chart: <ChartGaussFlux />,
    chartLabel: 'Φ es constante, E cae con r²',
  },
  {
    id: 'potencial',
    title: 'Potencial Eléctrico',
    color: '#a78bfa',
    path: '/potencial',
    formulas: ['V = kQ / r', 'ΔV = V_B − V_A = −W/q'],
    labels: ['Potencial de carga puntual', 'Diferencia de potencial'],
    note: 'Las superficies equipotenciales son ⊥ a las líneas de campo E.',
    chart: <ChartVvsR />,
    chartLabel: 'V disminuye como 1/r',
  },
  {
    id: 'capacitancia',
    title: 'Capacitancia',
    color: '#fbbf24',
    path: '/capacitancia',
    formulas: ['C = Q / V = ε₀A / d', 'U = ½CV² = Q²/2C'],
    labels: ['Capacitor plano-paralelo', 'Energía almacenada'],
    note: 'El capacitor libera energía muy rápido vs. la batería (gradual).',
    chart: <ChartCvsD />,
    chartLabel: 'C aumenta al reducir d',
  },
  {
    id: 'circuitos',
    title: 'Circuitos DC',
    color: '#f87171',
    path: '/circuitos',
    formulas: ['V = IR  (Ley de Ohm)', 'ΣV = 0  (KVL),  ΣI = 0  (KCL)'],
    labels: ['Resistencia y voltaje', 'Leyes de Kirchhoff'],
    note: 'q(t) = Q·e^(−t/RC) — el capacitor se descarga exponencialmente.',
    chart: <ChartDischarge />,
    chartLabel: 'Descarga: Batería vs Capacitor',
  },
  {
    id: 'magnetismo',
    title: 'Campo Magnético',
    color: '#22d3ee',
    path: '/magnetismo',
    formulas: ['F = q(v × B)', 'B = μ₀nI  (solenoide)'],
    labels: ['Fuerza de Lorentz', 'Campo dentro del solenoide'],
    note: 'Regla mano derecha: índice→v, medio→B, pulgar→F (para +q).',
    chart: <ChartLorentz />,
    chartLabel: 'Trayectoria circular en campo B',
  },
]

function FormulasSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-8%' })

  return (
    <section ref={ref} className="px-8 md:px-16 py-20" style={{ backgroundColor: '#020617', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12"
      >
        <p className="text-xs tracking-[0.2em] text-white/25 uppercase mb-3">Referencia rápida</p>
        <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
          Fórmulas por módulo
        </h2>
        <p className="text-sm text-white/30 mt-3 max-w-xl leading-relaxed">
          Las ecuaciones clave de cada tema con sus gráficas características.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {MODULE_FORMULAS.map((mod, i) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#0a101e', border: `1px solid ${mod.color}28` }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${mod.color}15` }}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: `${mod.color}80` }}>
                  Módulo
                </p>
                <h3 className="text-base font-black text-white">{mod.title}</h3>
              </div>
              <Link to={mod.path}>
                <motion.div whileHover={{ x: 3 }} className="flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: `${mod.color}90` }}>
                  Ver <MoveRight size={11} />
                </motion.div>
              </Link>
            </div>

            {/* Gráfica */}
            <div className="px-4 pt-4 pb-1" style={{ backgroundColor: '#070b13' }}>
              {mod.chart}
              <p className="text-center text-xs pb-2" style={{ color: `${mod.color}60`, fontFamily: 'monospace' }}>{mod.chartLabel}</p>
            </div>

            {/* Fórmulas */}
            <div className="px-5 py-4 space-y-2.5">
              {mod.formulas.map((f, fi) => (
                <div key={fi} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ backgroundColor: `${mod.color}08`, border: `1px solid ${mod.color}15` }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: mod.color }} />
                  <div>
                    <p className="text-xs font-bold font-mono" style={{ color: mod.color }}>{f}</p>
                    <p className="text-xs text-white/30 mt-0.5">{mod.labels[fi]}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Nota clave */}
            <div className="px-5 pb-5">
              <div className="flex items-start gap-2 border-t pt-3" style={{ borderColor: `${mod.color}18` }}>
                <Lightbulb size={11} className="mt-0.5 shrink-0" style={{ color: `${mod.color}55` }} />
                <p className="text-xs text-white/25 leading-relaxed">{mod.note}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── SECTION 3: Infografías ─────────────────────────────────────
const INFOGRAFIAS = [
  { src: '/infografias/campo-electrico.png',  title: 'Líneas de Campo Eléctrico', color: '#ef4444',  path: '/campo-electrico' },
  { src: '/infografias/ley-gauss.png',         title: 'Ley de Gauss',              color: '#10b981',  path: '/ley-de-gauss' },
  { src: '/infografias/potencial.png',         title: 'Potencial Eléctrico',       color: '#f59e0b',  path: '/potencial' },
  { src: '/infografias/capacitancia.png',      title: 'Capacitancia',              color: '#a78bfa',  path: '/capacitancia' },
  { src: '/infografias/mano-derecha.png',      title: 'Regla de la Mano Derecha',  color: '#06b6d4',  path: '/magnetismo' },
]

function InfografiaModal({ src, title, color, onClose }: { src: string; title: string; color: string; onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxWidth: '95vw', maxHeight: '92vh', border: `1px solid ${color}30`, backgroundColor: '#0a101e' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: `${color}25`, backgroundColor: '#080c14' }}>
          <span className="text-sm font-bold text-slate-200">{title}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><ZoomOut size={14} /></button>
            <span className="text-xs text-slate-500 font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><ZoomIn size={14} /></button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors ml-1"><X size={14} /></button>
          </div>
        </div>
        <div className="overflow-auto" style={{ maxHeight: 'calc(92vh - 48px)' }}>
          <img src={src} alt={title} style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${100 / zoom}%`, display: 'block' }} draggable={false} />
        </div>
      </motion.div>
    </motion.div>
  )
}

function InfografiasSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })
  const [active, setActive] = useState<number | null>(null)

  return (
    <section ref={ref} className="px-8 md:px-16 py-20" style={{ backgroundColor: '#020617' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12"
      >
        <p className="text-xs tracking-[0.2em] text-white/25 uppercase mb-3">Material de referencia</p>
        <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
          Infografías
        </h2>
        <p className="text-sm text-white/30 mt-3 max-w-xl">
          Resúmenes visuales de cada tema. Haz clic para ver en pantalla completa.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {INFOGRAFIAS.map((inf, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => setActive(i)}
            className={`cursor-pointer rounded-xl overflow-hidden group ${i === INFOGRAFIAS.length - 1 && INFOGRAFIAS.length % 2 !== 0 ? 'col-span-2 md:col-span-1' : ''}`}
            style={{ border: `1px solid ${inf.color}28`, backgroundColor: '#0a101e' }}
          >
            {/* Thumbnail */}
            <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <img
                src={inf.src}
                alt={inf.title}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
                <ZoomIn size={22} style={{ color: inf.color }} />
              </div>
              {/* Color accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: inf.color }} />
            </div>

            {/* Title */}
            <div className="px-3 py-2.5">
              <p className="text-xs font-semibold text-white/70 leading-snug">{inf.title}</p>
              <Link
                to={inf.path}
                onClick={e => e.stopPropagation()}
                className="text-xs mt-1 flex items-center gap-1 transition-colors"
                style={{ color: `${inf.color}80` }}
              >
                Ver módulo <MoveRight size={10} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {active !== null && (
        <InfografiaModal
          src={INFOGRAFIAS[active].src}
          title={INFOGRAFIAS[active].title}
          color={INFOGRAFIAS[active].color}
          onClose={() => setActive(null)}
        />
      )}
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="px-8 py-8 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Atom size={13} className="text-white/15" />
        <span className="text-xs text-white/15">PhysicsLab v1</span>
      </div>
      <span className="text-xs text-white/15">UAC · Física Eléctrica · Prof. Carlos Montoya · 2026</span>
      <span className="text-xs text-white/15">Webcore Solutions</span>
    </footer>
  )
}

// ── Page ───────────────────────────────────────────────────────
export function Home() {
  return (
    <div style={{ background: '#020617', minHeight: '100vh' }}>
      <Nav />
      <HeroSection />
      <DipoleSection />
      <PhenomenaShowcase />
      <FormulasSection />
      <InfografiasSection />
      <Footer />
    </div>
  )
}
