import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Atom, Menu, X, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { MODULES } from '../../data/modules'

export function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentModule = MODULES.find((m) =>
    location.pathname.startsWith(m.path) && m.path !== '/',
  )

  const breadcrumbs = [
    { label: 'Inicio', path: '/' },
    ...(currentModule ? [{ label: currentModule.title, path: currentModule.path }] : []),
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-slate-800/80"
      style={{ backgroundColor: 'rgba(7, 11, 20, 0.95)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center h-full px-4 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30"
          >
            <Atom size={18} className="text-blue-400" />
          </motion.div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-100 leading-none">PhysicsLab</p>
            <p className="text-xs text-slate-500 leading-none">Física Eléctrica</p>
          </div>
        </Link>

        {/* Breadcrumb */}
        {breadcrumbs.length > 1 && (
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={12} className="text-slate-600" />}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-slate-300 font-medium">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="text-slate-500 hover:text-slate-300 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex-1" />

        {/* Módulos rápidos — desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {MODULES.filter((m) => m.isAvailable).map((m) => (
            <Link
              key={m.id}
              to={m.path}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                location.pathname.startsWith(m.path)
                  ? { color: m.color, backgroundColor: `${m.color}15` }
                  : { color: '#64748b' }
              }
            >
              {m.title}
            </Link>
          ))}
        </nav>

        {/* Badge versión */}
        <span className="hidden sm:block text-xs text-slate-600 font-mono border border-slate-800 px-2 py-0.5 rounded-full">
          MVP v1
        </span>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden text-slate-400 hover:text-slate-200 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-14 left-0 right-0 border-b border-slate-800 py-2 px-4 space-y-1"
          style={{ backgroundColor: '#070b14' }}
        >
          {MODULES.map((m) => (
            <Link
              key={m.id}
              to={m.isAvailable ? m.path : '#'}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={
                m.isAvailable
                  ? { color: '#cbd5e1' }
                  : { color: '#475569', pointerEvents: 'none' }
              }
            >
              <span>{m.icon}</span>
              <span>{m.title}</span>
              {!m.isAvailable && <span className="text-xs text-slate-600 ml-auto">Próximamente</span>}
            </Link>
          ))}
        </motion.div>
      )}
    </header>
  )
}
