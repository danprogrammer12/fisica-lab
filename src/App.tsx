import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { Atom } from 'lucide-react'

// Lazy loading de páginas para mejorar el tiempo de carga inicial
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
const CampoElectrico = lazy(() =>
  import('./pages/CampoElectrico').then((m) => ({ default: m.CampoElectrico })),
)
const LeyDeGauss = lazy(() =>
  import('./pages/LeyDeGauss').then((m) => ({ default: m.LeyDeGauss })),
)
const PotencialElectrico = lazy(() =>
  import('./pages/PotencialElectrico').then((m) => ({ default: m.PotencialElectrico })),
)
const Capacitancia = lazy(() =>
  import('./pages/Capacitancia').then((m) => ({ default: m.Capacitancia })),
)
const CircuitosDC = lazy(() =>
  import('./pages/CircuitosDC').then((m) => ({ default: m.CircuitosDC })),
)
const Magnetismo = lazy(() =>
  import('./pages/Magnetismo').then((m) => ({ default: m.Magnetismo })),
)

// Pantalla de carga mientras los módulos hacen lazy load
function PageLoader() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-4"
      style={{ backgroundColor: '#070b14' }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Atom size={40} className="text-blue-500" />
      </motion.div>
      <p className="text-sm text-slate-500">Cargando simulación...</p>
    </div>
  )
}

// Página 404
function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-4"
      style={{ backgroundColor: '#070b14' }}
    >
      <span className="text-6xl">⚡</span>
      <h1 className="text-2xl font-bold text-slate-200">Página no encontrada</h1>
      <p className="text-slate-500">Esta ruta no existe en el laboratorio.</p>
      <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
        Volver al inicio
      </a>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campo-electrico" element={<CampoElectrico />} />
          <Route path="/ley-de-gauss" element={<LeyDeGauss />} />
          <Route path="/potencial" element={<PotencialElectrico />} />
          <Route path="/capacitancia" element={<Capacitancia />} />
          <Route path="/circuitos" element={<CircuitosDC />} />
          <Route path="/magnetismo" element={<Magnetismo />} />
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
