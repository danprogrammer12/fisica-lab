import { motion } from 'framer-motion'
import { Atom, Zap, BookOpen, Target, ChevronRight, Code2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ModuleCard } from '../components/ui/ModuleCard'
import { MODULES } from '../data/modules'

// ────────────────────────────────────────────────────────────
// Partícula de fondo (CSS puro, sin Three.js en Home)
// ────────────────────────────────────────────────────────────
function ParticleField() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 6,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.id % 3 === 0 ? '#3b82f6' : p.id % 3 === 1 ? '#10b981' : '#8b5cf6',
            opacity: 0.4,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Feature item en la sección de capacidades
// ────────────────────────────────────────────────────────────
function Feature({
  icon,
  title,
  description,
  color,
  index,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="flex gap-4 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
      style={{ backgroundColor: '#111827' }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

// ────────────────────────────────────────────────────────────
// Página principal
// ────────────────────────────────────────────────────────────
export function Home() {
  const availableModules = MODULES.filter((m) => m.isAvailable)
  const upcomingModules = MODULES.filter((m) => !m.isAvailable)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#070b14' }}>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center hero-gradient">
        <ParticleField />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 mb-8"
          >
            <Atom size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Laboratorio Virtual Interactivo
            </span>
          </motion.div>

          {/* Título principal */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-slate-100 mb-6 leading-tight"
          >
            Física Eléctrica
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #10b981 100%)',
              }}
            >
              en 3D Interactivo
            </span>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Explora campos eléctricos, Ley de Gauss, potencial eléctrico y magnetismo
            mediante simulaciones interactivas en tiempo real. Diseñado para ingeniería.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/campo-electrico">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 rounded-xl font-semibold text-white flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
                }}
              >
                <Zap size={18} />
                Comenzar a Explorar
                <ChevronRight size={16} />
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.02 }}
              className="px-6 py-3.5 rounded-xl font-medium text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors flex items-center gap-2"
            >
              <BookOpen size={16} />
              Ver Temario
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 mt-16 pt-8 border-t border-slate-800/60"
          >
            {[
              { value: '6', label: 'Módulos de contenido' },
              { value: '12', label: 'Simulaciones interactivas' },
              { value: '6', label: 'Disponibles hoy' },
              { value: '∞', label: 'Interacciones posibles' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-black text-blue-400">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── MÓDULOS DISPONIBLES ───────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">
            Disponible ahora
          </p>
          <h2 className="text-3xl font-bold text-slate-100 mb-4">
            Módulos Interactivos
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Cada módulo contiene teoría, simulaciones en 3D controlables por el usuario
            y preguntas de reflexión basadas en el temario del Prof. Carlos Montoya.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {availableModules.map((module, i) => (
            <div key={module.id} className="h-72">
              <ModuleCard module={module} index={i} />
            </div>
          ))}
        </div>

        {/* Módulos próximamente */}
        {upcomingModules.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4 text-center">
              En desarrollo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {upcomingModules.map((module, i) => (
                <div key={module.id} className="h-44">
                  <ModuleCard module={module} index={availableModules.length + i} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── CARACTERÍSTICAS ───────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-slate-100 mb-3">
            Diseñado para aprender
          </h2>
          <p className="text-slate-400 text-sm">
            Inspirado en PhET Simulations y GeoGebra — optimizado para ingeniería universitaria.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature
            index={0}
            icon={<Target size={20} />}
            color="#3b82f6"
            title="Visualización 3D en tiempo real"
            description="Three.js y React Three Fiber para simular campos eléctricos, líneas de campo y superficies gaussianas con rotación, zoom y paneo libres."
          />
          <Feature
            index={1}
            icon={<Zap size={20} />}
            color="#10b981"
            title="Controles interactivos"
            description="Modifica magnitud de carga, área, ángulo y radio en tiempo real con sliders que actualizan la física y la fórmula simultáneamente."
          />
          <Feature
            index={2}
            icon={<BookOpen size={20} />}
            color="#8b5cf6"
            title="Fórmulas con KaTeX"
            description="Cada simulación muestra las ecuaciones físicas correspondientes renderizadas con KaTeX para máxima legibilidad matemática."
          />
          <Feature
            index={3}
            icon={<Atom size={20} />}
            color="#f59e0b"
            title="Contenido del curso"
            description="Basado directamente en los PDFs del curso de Física Eléctrica: Coulomb, Gauss, Potencial, Capacitores, Corriente y Magnetismo."
          />
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 py-8 mt-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Atom size={16} className="text-slate-700" />
            <span>PhysicsLab · MVP v1</span>
          </div>
          <span>
            UAC · Física Eléctrica · Prof. Carlos Montoya · 2026
          </span>
          <div className="flex items-center gap-2">
            <Code2 size={16} />
            <span>Webcore Solutions</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
