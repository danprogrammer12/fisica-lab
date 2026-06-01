import { Link, useLocation } from 'react-router-dom'
import { Atom, ChevronRight } from 'lucide-react'
import { MODULES } from '../../data/modules'
import { useProgress } from '../../hooks/useProgress'

export function Navbar() {
  const location = useLocation()
  const { getProgress } = useProgress()

  const currentModule = MODULES.find(
    m => location.pathname.startsWith(m.path) && m.path !== '/',
  )

  // Compact progress indicator (completed/total)
  const available     = MODULES.filter(m => m.isAvailable)
  const completedCount = available.filter(m => getProgress(m.id)?.quizScore != null).length

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-3"
      style={{
        background: 'rgba(2,6,23,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.3)' }}
        >
          <Atom size={15} className="text-blue-400" />
        </div>
        <span className="hidden sm:block text-sm font-bold text-white/75 tracking-tight">
          PhysicsLab
        </span>
      </Link>

      {/* Breadcrumb */}
      {currentModule && (
        <nav className="hidden md:flex items-center gap-1 text-xs">
          <Link to="/" className="text-white/25 hover:text-white/50 transition-colors">
            Inicio
          </Link>
          <ChevronRight size={11} className="text-white/15" />
          <span className="font-medium" style={{ color: currentModule.color }}>
            {currentModule.title}
          </span>
        </nav>
      )}

      <div className="flex-1" />

      {/* Compact progress pill */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex gap-1">
          {available.map(m => {
            const done = getProgress(m.id)?.quizScore != null
            return (
              <div
                key={m.id}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  background: done ? m.color : 'rgba(255,255,255,0.1)',
                  boxShadow: done ? `0 0 4px ${m.color}` : 'none',
                }}
              />
            )
          })}
        </div>
        <span className="text-white/30 font-mono">{completedCount}/{available.length}</span>
      </div>

      {/* Current module badge (mobile fallback) */}
      {currentModule && (
        <span
          className="md:hidden text-xs px-2 py-1 rounded-lg font-medium"
          style={{ background: `${currentModule.color}15`, color: currentModule.color }}
        >
          {currentModule.title}
        </span>
      )}
    </header>
  )
}
