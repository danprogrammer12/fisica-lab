import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, BarChart2, Lock, Layers } from 'lucide-react'
import type { ModuleInfo } from '../../data/modules'

const MODULE_META: Record<string, { level: string; time: string; difficulty: 1 | 2 | 3 }> = {
  'campo-electrico': { level: 'Fundamentos', time: '45 min', difficulty: 1 },
  'ley-gauss':       { level: 'Fundamentos', time: '40 min', difficulty: 1 },
  'potencial':       { level: 'Intermedio',  time: '50 min', difficulty: 2 },
  'capacitancia':    { level: 'Intermedio',  time: '45 min', difficulty: 2 },
  'circuitos':       { level: 'Avanzado',    time: '60 min', difficulty: 3 },
  'magnetismo':      { level: 'Avanzado',    time: '55 min', difficulty: 3 },
}

const DIFFICULTY_LABEL = ['', 'Básico', 'Intermedio', 'Avanzado']

interface ModuleCardProps {
  module: ModuleInfo
  index: number
}

export function ModuleCard({ module, index }: ModuleCardProps) {
  const meta = MODULE_META[module.id] ?? { level: 'Fundamentos', time: '45 min', difficulty: 1 }

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
      whileHover={module.isAvailable ? { y: -5, scale: 1.015 } : {}}
      className="group relative rounded-2xl overflow-hidden h-full cursor-pointer"
      style={{
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Color accent top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${module.color}, transparent)` }}
      />

      {/* Glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `0 0 40px ${module.color}18, inset 0 0 40px ${module.color}08` }}
      />

      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{ background: `radial-gradient(ellipse at top left, ${module.color}12, transparent 60%)` }}
      />

      <div className="relative p-5 flex flex-col h-full">
        {/* Top: icon + badge */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: `${module.color}18`,
              border: `1px solid ${module.color}30`,
              boxShadow: `0 0 14px ${module.color}20`,
            }}
          >
            {module.icon}
          </div>

          {module.isAvailable ? (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${module.color}18`, color: module.color, border: `1px solid ${module.color}30` }}
            >
              Disponible
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-slate-600"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Lock size={9} /> Próximamente
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: module.color }}>
          {module.subtitle}
        </p>
        <h3 className="text-base font-bold text-slate-100 mb-2 leading-snug">{module.title}</h3>

        {/* Description */}
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 flex-1">
          {module.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="flex items-center gap-1 text-xs text-slate-600">
            <Clock size={10} />
            {meta.time}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-600">
            <BarChart2 size={10} />
            {DIFFICULTY_LABEL[meta.difficulty]}
          </span>
          {module.scenes.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-600">
              <Layers size={10} />
              {module.scenes.length} simulaciones
            </span>
          )}
        </div>

        {/* CTA */}
        {module.isAvailable && (
          <motion.div
            className="flex items-center gap-1.5 mt-3 text-xs font-semibold"
            style={{ color: module.color }}
            initial={{ opacity: 0, x: -4 }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              Explorar módulo <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )

  if (module.isAvailable) {
    return <Link to={module.path} className="block h-full">{card}</Link>
  }
  return <div className="opacity-50 h-full">{card}</div>
}
