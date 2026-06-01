import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Lock } from 'lucide-react'
import type { ModuleInfo } from '../../data/modules'

interface ModuleCardProps {
  module: ModuleInfo
  index: number
}

export function ModuleCard({ module, index }: ModuleCardProps) {
  const card = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={module.isAvailable ? { y: -4, scale: 1.01 } : {}}
      className="group relative rounded-2xl border border-slate-800 overflow-hidden cursor-pointer h-full"
      style={{
        background: `linear-gradient(135deg, #111827 0%, #0d1524 100%)`,
      }}
    >
      {/* Fondo de gradiente de color */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-60`}
      />

      {/* Borde con glow en hover */}
      <div
        className="absolute inset-0 rounded-2xl border opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ borderColor: module.color, boxShadow: `inset 0 0 20px ${module.color}20` }}
      />

      <div className="relative p-6 flex flex-col h-full">
        {/* Icono + Badge */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${module.color}20` }}
          >
            {module.icon}
          </div>

          {module.isAvailable ? (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${module.color}20`, color: module.color }}
            >
              Disponible
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-500 flex items-center gap-1">
              <Lock size={10} />
              Próximamente
            </span>
          )}
        </div>

        {/* Texto */}
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: module.color }}>
            {module.subtitle}
          </p>
          <h3 className="text-lg font-bold text-slate-100 mb-2">{module.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
            {module.description}
          </p>
        </div>

        {/* Scenes preview */}
        {module.isAvailable && module.scenes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <p className="text-xs text-slate-500 mb-2">Simulaciones incluidas</p>
            <div className="flex flex-wrap gap-1">
              {module.scenes.map((scene) => (
                <span
                  key={scene.id}
                  className="text-xs px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${module.color}15`, color: `${module.color}cc` }}
                >
                  {scene.title}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {module.isAvailable && (
          <div
            className="mt-4 flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: module.color }}
          >
            Explorar módulo
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </motion.div>
  )

  if (module.isAvailable) {
    return <Link to={module.path} className="block h-full">{card}</Link>
  }

  return <div className="opacity-60 h-full">{card}</div>
}
