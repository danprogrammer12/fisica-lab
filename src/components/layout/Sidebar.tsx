import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { MODULES } from '../../data/modules'
import type { SceneInfo } from '../../data/modules'

interface SidebarProps {
  activeScene?: string
  onSceneChange?: (sceneId: string) => void
}

export function Sidebar({ activeScene, onSceneChange }: SidebarProps) {
  const location = useLocation()

  const currentModule = MODULES.find(
    (m) => location.pathname.startsWith(m.path) && m.path !== '/',
  )

  return (
    <aside className="flex flex-col h-full w-56 shrink-0 border-r border-slate-800/60 py-4">
      {/* Módulos */}
      <div className="px-3 mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 px-2 mb-2">
          Módulos
        </p>
        <nav className="space-y-0.5">
          {MODULES.map((module) => {
            const isActive = location.pathname.startsWith(module.path) && module.path !== '/'
            return (
              <div key={module.id}>
                <Link
                  to={module.isAvailable ? module.path : '#'}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all group"
                  style={
                    isActive
                      ? {
                          color: module.color,
                          backgroundColor: `${module.color}15`,
                        }
                      : module.isAvailable
                      ? { color: '#94a3b8' }
                      : { color: '#475569', cursor: 'default' }
                  }
                >
                  <span className="text-base">{module.icon}</span>
                  <span className="font-medium truncate">{module.title}</span>
                  {isActive && (
                    <ChevronRight
                      size={14}
                      className="ml-auto shrink-0"
                      style={{ color: module.color }}
                    />
                  )}
                  {!module.isAvailable && (
                    <span className="ml-auto text-xs text-slate-700 shrink-0">🔒</span>
                  )}
                </Link>

                {/* Sub-escenas del módulo activo */}
                {isActive && currentModule && currentModule.scenes.length > 0 && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {currentModule.scenes.map((scene: SceneInfo) => {
                      const isSceneActive = activeScene === scene.id
                      return (
                        <motion.button
                          key={scene.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onSceneChange?.(scene.id)}
                          className="w-full text-left px-2 py-1.5 rounded-md text-xs transition-all flex items-center gap-2"
                          style={
                            isSceneActive
                              ? {
                                  color: currentModule.color,
                                  backgroundColor: `${currentModule.color}20`,
                                  fontWeight: 600,
                                }
                              : { color: '#64748b' }
                          }
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: isSceneActive
                                ? currentModule.color
                                : '#334155',
                            }}
                          />
                          {scene.title}
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      <div className="flex-1" />

      {/* Footer del sidebar */}
      <div className="px-4 pt-3 border-t border-slate-800/60">
        <p className="text-xs text-slate-600 text-center">UAC — Física Eléctrica</p>
        <p className="text-xs text-slate-700 text-center">Prof. Carlos Montoya</p>
      </div>
    </aside>
  )
}
