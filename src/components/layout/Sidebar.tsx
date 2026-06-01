import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Lock, Clock, BookOpen, Zap } from 'lucide-react'
import { MODULES } from '../../data/modules'
import { useProgress } from '../../hooks/useProgress'
import type { SceneInfo } from '../../data/modules'

// ── Categorías ─────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'electrostatica',
    label: 'Electrostática',
    moduleIds: ['campo-electrico', 'ley-gauss', 'potencial'],
  },
  {
    id: 'circuitos',
    label: 'Circuitos y Energía',
    moduleIds: ['capacitancia', 'circuitos'],
  },
  {
    id: 'magnetismo',
    label: 'Magnetismo',
    moduleIds: ['magnetismo'],
  },
]

const MODULE_TIME: Record<string, string> = {
  'campo-electrico': '45 min',
  'ley-gauss':       '40 min',
  'potencial':       '50 min',
  'capacitancia':    '45 min',
  'circuitos':       '60 min',
  'magnetismo':      '55 min',
}

// ── Estado del módulo ──────────────────────────────────────────
type ModState = 'active' | 'completed' | 'visited' | 'available' | 'locked'

function moduleState(
  _moduleId: string,
  isActive: boolean,
  quizScore: number | null | undefined,
  visited: boolean | undefined,
  isAvailable: boolean,
): ModState {
  if (!isAvailable) return 'locked'
  if (isActive)     return 'active'
  if (quizScore != null) return 'completed'
  if (visited)      return 'visited'
  return 'available'
}

// ── Indicador visual de estado ─────────────────────────────────
function StateIcon({ state, color }: { state: ModState; color: string }) {
  if (state === 'completed')
    return <CheckCircle2 size={12} style={{ color }} />
  if (state === 'active')
    return (
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 7px ${color}` }}
      />
    )
  if (state === 'visited')
    return <div className="w-2 h-2 rounded-full border" style={{ borderColor: color + '55' }} />
  if (state === 'locked')
    return <Lock size={10} className="text-white/15" />
  return <Circle size={11} className="text-white/10" />
}

// ── Sub-escenas (steps conectados) ─────────────────────────────
function SceneSteps({
  scenes,
  activeScene,
  color,
  onSelect,
}: {
  scenes: SceneInfo[]
  activeScene?: string
  color: string
  onSelect?: (id: string) => void
}) {
  return (
    <div className="pl-7 pr-3 pb-2 mt-0.5 space-y-0">
      {scenes.map((scene, i) => {
        const isActive = activeScene === scene.id
        return (
          <div key={scene.id} className="relative flex items-stretch gap-2.5">
            {/* Connector line */}
            <div className="flex flex-col items-center" style={{ width: 16 }}>
              <div
                className="w-px flex-1"
                style={{ background: i === 0 ? 'transparent' : 'rgba(255,255,255,0.06)', minHeight: 8 }}
              />
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 border transition-all"
                style={isActive
                  ? { background: color, borderColor: color, boxShadow: `0 0 6px ${color}60` }
                  : { background: 'transparent', borderColor: 'rgba(255,255,255,0.12)' }
                }
              />
              <div
                className="w-px flex-1"
                style={{ background: i === scenes.length - 1 ? 'transparent' : 'rgba(255,255,255,0.06)', minHeight: 8 }}
              />
            </div>
            {/* Label */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect?.(scene.id)}
              className="flex-1 text-left py-1.5 min-w-0"
            >
              <p
                className="text-xs leading-snug transition-colors"
                style={{ color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)', fontWeight: isActive ? 500 : 400 }}
              >
                {scene.title}
              </p>
            </motion.button>
          </div>
        )
      })}
    </div>
  )
}

// ── Panel contextual del módulo activo ─────────────────────────
function ActiveModulePanel({
  color,
  icon,
  title,
  scenesTotal,
  time,
  quizScore,
  quizTotal,
}: {
  color: string
  icon: string
  title: string
  scenesTotal: number
  time: string
  quizScore: number | null
  quizTotal: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3 }}
      className="mx-3 mb-3 rounded-xl p-3"
      style={{
        background: `${color}0c`,
        border: `1px solid ${color}22`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-base">{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/70 truncate">{title}</p>
          <p className="text-xs text-white/25">Módulo activo</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Zap size={10} style={{ color }} />
          <span className="text-xs text-white/35">{scenesTotal} sims</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={10} className="text-white/25" />
          <span className="text-xs text-white/35">{time}</span>
        </div>
      </div>

      {/* Quiz status */}
      <div className="mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${color}18` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpen size={10} className="text-white/30" />
            <span className="text-xs text-white/30">Quiz</span>
          </div>
          {quizScore !== null ? (
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
              style={{ background: `${color}25`, color }}
            >
              {quizScore}/{quizTotal} ✓
            </span>
          ) : (
            <span className="text-xs text-white/20">Disponible</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Sidebar principal ──────────────────────────────────────────
interface SidebarProps {
  activeScene?: string
  onSceneChange?: (sceneId: string) => void
}

export function Sidebar({ activeScene, onSceneChange }: SidebarProps) {
  const location = useLocation()
  const { getProgress } = useProgress()

  const currentModule = MODULES.find(
    m => location.pathname.startsWith(m.path) && m.path !== '/',
  )

  // Overall progress
  const available = MODULES.filter(m => m.isAvailable)
  const completedCount = available.filter(m => getProgress(m.id)?.quizScore != null).length
  const visitedCount  = available.filter(m => getProgress(m.id)?.visited).length
  const progressPct   = Math.round(((completedCount * 1 + (visitedCount - completedCount) * 0.4) / available.length) * 100)

  return (
    <aside
      className="flex flex-col h-full shrink-0 border-r"
      style={{
        width: 224,
        background: 'rgba(2,6,23,0.97)',
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      {/* ── Progress header ──────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/30 tracking-wider uppercase">Progreso</span>
          <span className="text-xs font-mono" style={{ color: completedCount === available.length ? '#34d399' : 'rgba(255,255,255,0.35)' }}>
            {completedCount}/{available.length}
          </span>
        </div>
        {/* Bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }}
          />
        </div>
        <p className="text-xs text-white/20 mt-1.5">
          {completedCount === available.length
            ? 'Laboratorio completado 🎉'
            : `${available.length - completedCount} módulos restantes`}
        </p>
      </div>

      {/* ── Module navigation ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {CATEGORIES.map(cat => {
          const catModules = MODULES.filter(m => cat.moduleIds.includes(m.id))

          return (
            <div key={cat.id} className="mb-3">
              {/* Category label */}
              <p
                className="px-4 pb-1.5 text-xs uppercase tracking-[0.15em]"
                style={{ color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}
              >
                {cat.label}
              </p>

              {catModules.map(mod => {
                const prog  = getProgress(mod.id)
                const isActive = location.pathname.startsWith(mod.path) && mod.path !== '/'
                const state = moduleState(mod.id, isActive, prog?.quizScore, prog?.visited, mod.isAvailable)

                return (
                  <div key={mod.id}>
                    <Link
                      to={mod.isAvailable ? mod.path : '#'}
                      className="group relative flex items-center gap-2.5 px-4 py-2 transition-all"
                      style={{
                        pointerEvents: mod.isAvailable ? 'auto' : 'none',
                        background: isActive ? `${mod.color}10` : 'transparent',
                        borderLeft: isActive ? `2px solid ${mod.color}` : '2px solid transparent',
                      }}
                    >
                      {/* Icon */}
                      <span
                        className="text-base shrink-0 transition-all"
                        style={{ opacity: state === 'locked' ? 0.25 : 1 }}
                      >
                        {mod.icon}
                      </span>

                      {/* Label */}
                      <span
                        className="flex-1 text-xs truncate transition-colors"
                        style={{
                          color: isActive
                            ? 'rgba(255,255,255,0.9)'
                            : state === 'locked'
                            ? 'rgba(255,255,255,0.18)'
                            : state === 'completed'
                            ? 'rgba(255,255,255,0.6)'
                            : state === 'visited'
                            ? 'rgba(255,255,255,0.45)'
                            : 'rgba(255,255,255,0.35)',
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        {mod.title}
                      </span>

                      {/* State indicator */}
                      <div className="shrink-0">
                        <StateIcon state={state} color={mod.color} />
                      </div>
                    </Link>

                    {/* Scene steps (only when this module is active) */}
                    <AnimatePresence>
                      {isActive && currentModule?.scenes.length ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <SceneSteps
                            scenes={currentModule.scenes}
                            activeScene={activeScene}
                            color={mod.color}
                            onSelect={onSceneChange}
                          />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* ── Active module panel ────────────────────────────── */}
      <AnimatePresence>
        {currentModule && (
          <ActiveModulePanel
            key={currentModule.id}
            color={currentModule.color}
            icon={currentModule.icon}
            title={currentModule.title}
            scenesTotal={currentModule.scenes.length}
            time={MODULE_TIME[currentModule.id] ?? '—'}
            quizScore={getProgress(currentModule.id)?.quizScore ?? null}
            quizTotal={4}
          />
        )}
      </AnimatePresence>

      {/* ── Footer ────────────────────────────────────────── */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="text-xs text-white/18">UAC · Física Eléctrica</span>
        <Link to="/">
          <span className="text-xs text-white/18 hover:text-white/40 transition-colors">Inicio</span>
        </Link>
      </div>
    </aside>
  )
}
