import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Info, BookOpen, Cpu } from 'lucide-react'

interface InfoPanelProps {
  title: string
  concept: string
  children: ReactNode
  color?: string
}

export function InfoPanel({ title, concept, children, color = '#3b82f6' }: InfoPanelProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col h-full overflow-y-auto"
    >
      {/* Header del panel */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50"
        style={{ borderBottomColor: `${color}30` }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Info size={16} style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Información</p>
          <p className="text-sm font-semibold text-slate-200">{title}</p>
        </div>
      </div>

      {/* Concepto destacado */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="rounded-lg px-3 py-2 flex items-start gap-2"
          style={{ backgroundColor: `${color}10`, borderLeft: `3px solid ${color}` }}
        >
          <BookOpen size={14} style={{ color, marginTop: 2, flexShrink: 0 }} />
          <p className="text-xs text-slate-300 leading-relaxed">{concept}</p>
        </div>
      </div>

      {/* Contenido dinámico (fórmulas, valores, explicaciones) */}
      <div className="flex-1 px-4 pb-4 space-y-3 overflow-y-auto">
        {children}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800/50 flex items-center gap-2">
        <Cpu size={12} className="text-slate-600" />
        <span className="text-xs text-slate-600">Físicas Eléctricas · Prof. Carlos Montoya</span>
      </div>
    </motion.aside>
  )
}

interface ValueDisplayProps {
  label: string
  value: string | number
  unit?: string
  color?: string
}

export function ValueDisplay({ label, value, unit, color = '#3b82f6' }: ValueDisplayProps) {
  const formatted = typeof value === 'number'
    ? Math.abs(value) > 1e6 || (Math.abs(value) < 1e-3 && value !== 0)
      ? value.toExponential(3)
      : value.toFixed(4)
    : value

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/40">
      <span className="text-xs text-slate-400">{label}</span>
      <span
        className="text-sm font-mono font-semibold"
        style={{ color }}
      >
        {formatted}
        {unit && <span className="text-xs ml-1 opacity-60">{unit}</span>}
      </span>
    </div>
  )
}
