import { Suspense, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Atom, ChevronRight, ArrowDown, MoveRight } from 'lucide-react'
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
      <Footer />
    </div>
  )
}
