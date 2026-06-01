import { Suspense, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Atom, Zap, BookOpen, ChevronRight, Target, Code2,
  Eye, Cpu, FlaskConical, GraduationCap, CheckCircle2, Circle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ModuleCard } from '../components/ui/ModuleCard'
import { HeroScene } from '../components/home/HeroScene'
import { QuickLab } from '../components/home/QuickLab'
import { MODULES } from '../data/modules'

// ── Cosmic background ─────────────────────────────────────────
function CosmicBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Base */}
      <div className="absolute inset-0" style={{ background: '#020617' }} />

      {/* Nebula blobs */}
      <div className="absolute" style={{
        top: '-20%', left: '-10%', width: '60%', height: '60%',
        background: 'radial-gradient(ellipse, rgba(29,78,216,0.12) 0%, transparent 65%)',
      }} />
      <div className="absolute" style={{
        top: '10%', right: '-15%', width: '55%', height: '55%',
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.10) 0%, transparent 65%)',
      }} />
      <div className="absolute" style={{
        bottom: '5%', left: '20%', width: '50%', height: '40%',
        background: 'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 65%)',
      }} />

      {/* Floating particles */}
      {Array.from({ length: 30 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            background: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#8b5cf6' : '#06b6d4',
          }}
          animate={{ y: [0, -30, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{
            duration: 5 + Math.random() * 6,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Horizontal grid lines (subtle) */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(30,41,59,0.15) 1px, transparent 1px)',
        backgroundSize: '100% 80px',
      }} />
    </div>
  )
}

// ── Top nav ───────────────────────────────────────────────────
function TopNav() {
  const { scrollY } = useScroll()
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6"
      style={{
        background: 'rgba(2,6,23,0.75)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0)',
      }}
    >
      <motion.div
        className="absolute inset-0 border-b"
        style={{ borderColor: `rgba(30,41,59,${borderOpacity})`, pointerEvents: 'none' }}
      />
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <Atom size={16} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100 leading-none">PhysicsLab</p>
            <p className="text-xs text-slate-600 leading-none mt-0.5">Física Eléctrica</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {MODULES.filter(m => m.isAvailable).map(m => (
            <Link
              key={m.id}
              to={m.path}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors hover:bg-white/5"
            >
              {m.title}
            </Link>
          ))}
        </nav>

        <Link to="/campo-electrico">
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 0 16px rgba(59,130,246,0.3)' }}
          >
            Explorar
          </motion.button>
        </Link>
      </div>
    </motion.header>
  )
}

// ── Hero section ─────────────────────────────────────────────
function HeroSection() {
  const [heroCharge, setHeroCharge] = useState(5)
  const chargeIsPos = heroCharge >= 0

  return (
    <section className="relative min-h-screen flex items-center pt-14" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto w-full px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left: text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            <FlaskConical size={12} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-widest">
              Laboratorio Virtual Interactivo
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-6xl xl:text-7xl font-black text-slate-100 leading-[1.05] mb-5"
          >
            Física Eléctrica
            <br />
            <span style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              en 3D Interactivo
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-slate-400 max-w-lg mb-8 leading-relaxed"
          >
            Explora, experimenta y comprende los fenómenos eléctricos y magnéticos mediante simulaciones 3D en tiempo real. Diseñado para ingeniería.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-3 mb-10"
          >
            <Link to="/campo-electrico">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(59,130,246,0.4)' }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 text-sm"
                style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 0 24px rgba(59,130,246,0.3)' }}
              >
                <Zap size={16} />
                Comenzar a Explorar
                <ChevronRight size={14} />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => document.getElementById('modulos')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 rounded-xl font-medium text-slate-400 text-sm flex items-center gap-2 transition-colors hover:text-slate-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <BookOpen size={15} />
              Ver Temario
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-wrap gap-6 pt-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            {[
              { value: '6', label: 'Módulos', color: '#3b82f6' },
              { value: '12', label: 'Simulaciones', color: '#8b5cf6' },
              { value: '∞', label: 'Interacciones', color: '#06b6d4' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs text-slate-600 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: 3D scene */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative h-[480px] lg:h-[560px] rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(2,6,23,0.6)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 0 80px rgba(59,130,246,0.12)',
          }}
        >
          {/* Corner decoration */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            {['#ef4444', '#f59e0b', '#10b981'].map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.7 }} />
            ))}
          </div>

          <div className="absolute top-3 right-3 z-10">
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(2,6,23,0.8)', color: '#334155', border: '1px solid rgba(255,255,255,0.05)' }}>
              Campo Eléctrico 3D
            </span>
          </div>

          {/* Scan line effect */}
          <motion.div
            className="absolute inset-x-0 h-px pointer-events-none z-10"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)' }}
            animate={{ y: [0, 560, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />

          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <Atom size={32} className="text-blue-500" />
              </motion.div>
            </div>
          }>
            <HeroScene charge={heroCharge} numLines={20} />
          </Suspense>

          {/* Control overlay */}
          <div
            className="absolute bottom-4 left-4 right-4 p-3 rounded-xl"
            style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                {([5, -5] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setHeroCharge(v)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                    style={heroCharge === v
                      ? { background: v > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', color: v > 0 ? '#ef4444' : '#3b82f6', border: `1px solid ${v > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}` }
                      : { background: 'rgba(255,255,255,0.04)', color: '#475569', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {v > 0 ? '+q' : '−q'}
                  </button>
                ))}
              </div>
              <div className="flex-1">
                <input
                  type="range" min={1} max={10} step={0.5} value={Math.abs(heroCharge)}
                  onChange={e => setHeroCharge(chargeIsPos ? Number(e.target.value) : -Number(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: chargeIsPos ? '#ef4444' : '#3b82f6' }}
                />
              </div>
              <span className="text-xs font-mono" style={{ color: chargeIsPos ? '#ef4444' : '#3b82f6' }}>
                {heroCharge > 0 ? '+' : ''}{heroCharge.toFixed(1)} nC
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ── Quick lab section ─────────────────────────────────────────
function QuickLabSection() {
  return (
    <section className="relative py-16 px-6" style={{ zIndex: 1 }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">Interactivo</p>
          <h2 className="text-2xl font-bold text-slate-100">Experimenta sin entrar a un módulo</h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
        >
          <QuickLab />
        </motion.div>
      </div>
    </section>
  )
}

// ── Learning path roadmap ─────────────────────────────────────
const ROADMAP = [
  { id: 'campo-electrico', step: 1, title: 'Campo Eléctrico',    time: '45 min', color: '#3b82f6' },
  { id: 'ley-gauss',       step: 2, title: 'Ley de Gauss',       time: '40 min', color: '#10b981' },
  { id: 'potencial',       step: 3, title: 'Potencial Eléctrico', time: '50 min', color: '#8b5cf6' },
  { id: 'capacitancia',    step: 4, title: 'Capacitancia',       time: '45 min', color: '#f59e0b' },
  { id: 'circuitos',       step: 5, title: 'Corriente Eléctrica', time: '60 min', color: '#ef4444' },
  { id: 'magnetismo',      step: 6, title: 'Magnetismo',         time: '55 min', color: '#06b6d4' },
]

function LearningPath() {
  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <GraduationCap size={15} className="text-blue-400" />
        <span className="text-sm font-semibold text-slate-300">Ruta de Aprendizaje</span>
      </div>

      <div className="relative">
        {/* Vertical connector */}
        <div
          className="absolute left-[18px] top-5 bottom-5 w-px"
          style={{ background: 'linear-gradient(to bottom, rgba(59,130,246,0.4), rgba(6,182,212,0.4))' }}
        />

        <div className="space-y-1">
          {ROADMAP.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex items-center gap-3 relative group"
            >
              {/* Step circle */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-200"
                style={{
                  background: `${item.color}20`,
                  border: `1.5px solid ${item.color}50`,
                  boxShadow: `0 0 10px ${item.color}20`,
                }}
              >
                <CheckCircle2 size={14} style={{ color: item.color }} />
              </div>

              <Link
                to={MODULES.find(m => m.id === item.id)?.path ?? '/'}
                className="flex-1 flex items-center justify-between py-2 px-3 rounded-xl transition-all duration-200 group-hover:bg-white/5"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-600">{item.time}</p>
                </div>
                <ChevronRight size={12} className="text-slate-700 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-xs text-slate-600">6 módulos · ~295 min en total</p>
      </div>
    </div>
  )
}

// ── Modules section ───────────────────────────────────────────
function ModulesSection() {
  const availableModules = MODULES.filter(m => m.isAvailable)
  const upcomingModules  = MODULES.filter(m => !m.isAvailable)

  return (
    <section id="modulos" className="relative py-16 px-6" style={{ zIndex: 1 }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">Disponible ahora</p>
          <h2 className="text-3xl font-bold text-slate-100 mb-3">Módulos Interactivos</h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto">
            Cada módulo incluye teoría, simulaciones 3D controlables y preguntas de reflexión basadas en el temario del Prof. Carlos Montoya.
          </p>
        </motion.div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Roadmap sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="xl:w-64 shrink-0"
          >
            <LearningPath />
          </motion.div>

          {/* Cards grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableModules.map((module, i) => (
                <div key={module.id} style={{ minHeight: 240 }}>
                  <ModuleCard module={module} index={i} />
                </div>
              ))}
            </div>

            {upcomingModules.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-slate-700 uppercase tracking-wider mb-3 text-center">En desarrollo</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {upcomingModules.map((m, i) => (
                    <div key={m.id} style={{ minHeight: 160 }}>
                      <ModuleCard module={m} index={availableModules.length + i} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Features section ──────────────────────────────────────────
const FEATURES = [
  {
    icon: <Eye size={20} />,
    color: '#3b82f6',
    title: 'Visualización 3D',
    desc: 'Three.js y React Three Fiber para simular campos, superficies y partículas con rotación y zoom libres.',
  },
  {
    icon: <Target size={20} />,
    color: '#8b5cf6',
    title: 'Control Total',
    desc: 'Sliders en tiempo real que actualizan física y fórmulas simultáneamente. Sin recargas.',
  },
  {
    icon: <Cpu size={20} />,
    color: '#06b6d4',
    title: 'Fórmulas Integradas',
    desc: 'Cada simulación muestra las ecuaciones KaTeX renderizadas con variables en vivo.',
  },
  {
    icon: <GraduationCap size={20} />,
    color: '#f59e0b',
    title: 'Diseñado para Ingeniería',
    desc: 'Basado en el temario de Física Eléctrica: Coulomb, Gauss, Potencial, Capacitores, Corriente y Magnetismo.',
  },
]

function FeaturesSection() {
  return (
    <section className="relative py-16 px-6" style={{ zIndex: 1 }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Diseñado para aprender</h2>
          <p className="text-sm text-slate-500">Inspirado en PhET Simulations y GeoGebra — optimizado para universidad.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -3 }}
              className="flex gap-4 p-5 rounded-2xl transition-all"
              style={{
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${f.color}18`, border: `1px solid ${f.color}28` }}
              >
                <div style={{ color: f.color }}>{f.icon}</div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="relative py-8 px-6" style={{ zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Atom size={15} className="text-slate-700" />
          <span className="text-xs text-slate-600">PhysicsLab · v1.0</span>
        </div>
        <span className="text-xs text-slate-600">UAC · Física Eléctrica · Prof. Carlos Montoya · 2026</span>
        <div className="flex items-center gap-1.5">
          <Code2 size={13} className="text-slate-700" />
          <span className="text-xs text-slate-600">Webcore Solutions</span>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────
export function Home() {
  return (
    <div className="relative min-h-screen" style={{ background: '#020617' }}>
      <CosmicBackground />
      <TopNav />
      <HeroSection />
      <QuickLabSection />
      <ModulesSection />
      <FeaturesSection />
      <Footer />
    </div>
  )
}
