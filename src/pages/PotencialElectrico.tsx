import { useState, useEffect, useMemo } from 'react'
import { Wifi, BookOpen } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { InfografiaPanel } from '../components/ui/InfografiaPanel'
import { SliderControl } from '../components/ui/SliderControl'
import { FormulaCard } from '../components/ui/FormulaCard'
import { InfoPanel, ValueDisplay } from '../components/ui/InfoPanel'
import { QuizEngine } from '../components/ui/QuizEngine'
import { PotencialCargaScene } from '../simulations/potencial/PotencialCarga'
import { EquipotencialesScene } from '../simulations/potencial/Equipotenciales'
import { PotencialDipoloScene } from '../simulations/potencial/PotencialDipolo'
import { K_COULOMB, NC_TO_C, MIN_DISTANCE } from '../physics/constants'
import { useProgress } from '../hooks/useProgress'
import { QUIZZES } from '../data/quizzes'

type SceneId = 'potencial-carga' | 'equipotenciales' | 'dipolo'

const ACCENT = '#8b5cf6'
const quiz = QUIZZES.find((q) => q.moduleId === 'potencial')!

export function PotencialElectrico() {
  const [activeScene, setActiveScene] = useState<SceneId>('potencial-carga')
  const [charge, setCharge] = useState(5)
  const [numLines, setNumLines] = useState(12)
  const [dipoleSep, setDipoleSep] = useState(2.0)
  const [showQuiz, setShowQuiz] = useState(false)
  const { markVisited, saveQuizScore } = useProgress()

  useEffect(() => { markVisited('potencial') }, [markVisited])

  // Valores calculados para el InfoPanel
  const vAt1m = useMemo(() => {
    const r = 1
    return r < MIN_DISTANCE ? 0 : (K_COULOMB * charge * NC_TO_C) / r
  }, [charge])
  const vAt2m = useMemo(() => (K_COULOMB * charge * NC_TO_C) / 2, [charge])
  const vAt05m = useMemo(() => (K_COULOMB * charge * NC_TO_C) / 0.5, [charge])

  return (
    <Layout showSidebar activeScene={activeScene} onSceneChange={(id) => setActiveScene(id as SceneId)}>
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b" style={{ borderColor: `${ACCENT}20` }}>
        {[
          { id: 'potencial-carga', label: 'Potencial de Carga' },
          { id: 'equipotenciales', label: 'Equipotenciales' },
          { id: 'dipolo',          label: 'Potencial del Dipolo' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveScene(tab.id as SceneId)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={activeScene === tab.id ? { color: ACCENT, backgroundColor: `${ACCENT}15`, fontWeight: 600 } : { color: '#475569' }}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <InfografiaPanel src="/infografias/potencial.png" title="Infografía — Potencial Eléctrico" accentColor={ACCENT} />
          <button
            onClick={() => setShowQuiz((v) => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
            style={showQuiz ? { color: ACCENT, backgroundColor: `${ACCENT}20` } : { color: '#64748b', backgroundColor: '#1e293b' }}
          >
            <BookOpen size={12} />
            Quiz
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Wifi size={12} />
            <span>V calculado en tiempo real</span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
        {/* Controles */}
        <div className="w-64 shrink-0 border-r border-slate-800/60 p-4 overflow-y-auto" style={{ backgroundColor: '#0a101e' }}>
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Escena activa</p>
            <h2 className="text-base font-bold text-slate-200">
              {activeScene === 'potencial-carga' ? 'Potencial de Carga'
                : activeScene === 'equipotenciales' ? 'Superficies Equipotenciales'
                : 'Potencial del Dipolo Eléctrico'}
            </h2>
          </div>

          <div className="space-y-5">
            <SliderControl label="Carga q" value={charge} min={-10} max={10} step={0.5} unit=" nC"
              onChange={setCharge} color={ACCENT}
              formatValue={(v) => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
            />
            {activeScene === 'equipotenciales' && (
              <SliderControl label="Líneas equipotenciales" value={numLines} min={5} max={24} step={1}
                onChange={setNumLines} color="#34d399"
              />
            )}
            {activeScene === 'dipolo' && (
              <SliderControl label="Separación 2d" value={dipoleSep} min={0.5} max={4} step={0.1} unit=" m"
                onChange={setDipoleSep} color="#c4b5fd" />
            )}
          </div>

          {activeScene === 'potencial-carga' && (
            <div className="mt-5 p-3 rounded-lg text-xs text-slate-400 leading-relaxed" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
              El mapa de color muestra el potencial: <span style={{ color: '#ef4444' }}>rojo = V positivo</span>, <span style={{ color: '#3b82f6' }}>azul = V negativo</span>.
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-1">
            <p className="text-xs font-medium text-slate-600">Controles 3D</p>
            <p className="text-xs text-slate-700">🖱️ Arrastrar → Rotar</p>
            <p className="text-xs text-slate-700">🖱️ Rueda → Zoom</p>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          {activeScene === 'potencial-carga' && (
            <div className="absolute inset-0">
              <PotencialCargaScene charge={charge} />
            </div>
          )}
          {activeScene === 'equipotenciales' && (
            <div className="absolute inset-0">
              <EquipotencialesScene charge={charge} numLines={numLines} />
            </div>
          )}
          {activeScene === 'dipolo' && (
            <div className="absolute inset-0">
              <PotencialDipoloScene charge={Math.abs(charge) || 5} separation={dipoleSep} />
            </div>
          )}

          {/* Quiz overlay */}
          {showQuiz && (
            <div className="absolute inset-0 z-20 overflow-y-auto" style={{ backgroundColor: 'rgba(5,9,18,0.95)' }}>
              <div className="max-w-xl mx-auto py-6">
                <div className="rounded-2xl border border-slate-800" style={{ backgroundColor: '#111827' }}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h3 className="text-base font-bold text-slate-200">{quiz.title}</h3>
                    <button onClick={() => setShowQuiz(false)} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
                  </div>
                  <QuizEngine
                    quiz={quiz}
                    accentColor={ACCENT}
                    onComplete={(score, total) => saveQuizScore('potencial', score, total)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="w-72 shrink-0 border-l border-slate-800/60 overflow-y-auto" style={{ backgroundColor: '#0a101e' }}>
          <InfoPanel
            title="Potencial Eléctrico"
            concept="El potencial eléctrico V es la energía potencial por unidad de carga. A diferencia del campo vectorial E, el potencial es un escalar — más fácil de calcular en sistemas complejos."
            color={ACCENT}
          >
            <FormulaCard
              title="Potencial — carga puntual"
              latex={`V = \\frac{kq}{r} = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q}{r}`}
              description="V en Voltios. Decrece como 1/r (más lento que E ∝ 1/r²)."
              variables={[
                { symbol: 'k', description: 'Constante de Coulomb', value: '8.99×10⁹ N·m²/C²' },
                { symbol: 'q', description: 'Carga fuente', value: `${charge.toFixed(1)} nC` },
              ]}
              highlight
              color={ACCENT}
            />

            <FormulaCard
              title="Relación E y V"
              latex={`\\vec{E} = -\\nabla V = -\\frac{dV}{dr}\\hat{r}`}
              description="El campo eléctrico apunta de mayor a menor potencial."
              color="#34d399"
            />

            <div className="space-y-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">Potencial según distancia</p>
              <ValueDisplay label="V a r = 0.5 m" value={vAt05m} unit="V" color={ACCENT} />
              <ValueDisplay label="V a r = 1.0 m" value={vAt1m} unit="V" color={ACCENT} />
              <ValueDisplay label="V a r = 2.0 m" value={vAt2m} unit="V" color={ACCENT} />
            </div>

            <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed mt-2" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
              <span className="font-semibold text-slate-300">Equipotenciales: </span>
              Son superficies donde V = constante. El trabajo para mover una carga sobre una equipotencial es <strong>cero</strong>. Siempre son perpendiculares a las líneas de campo.
            </div>

            {activeScene === 'dipolo' && (
              <>
                <FormulaCard
                  title="Potencial del dipolo (lejos)"
                  latex={`V \\approx \\frac{kp\\cos\\theta}{r^2}`}
                  description="Cae como 1/r² (más rápido que carga puntual). p = qd es el momento dipolar."
                  color="#c4b5fd"
                />
                <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed" style={{ backgroundColor: '#0f172a', border: '1px solid #8b5cf630' }}>
                  <p className="font-semibold text-slate-300 mb-2">Guía del modelo 3D</p>
                  <p><span className="text-red-400">■</span> Esfera roja — carga +q</p>
                  <p><span className="text-blue-400">■</span> Esfera azul — carga −q</p>
                  <p><span className="text-red-400">— </span>Líneas rojas — equipotencial V {'>'} 0</p>
                  <p><span className="text-blue-400">— </span>Líneas azules — equipotencial V {'<'} 0</p>
                  <p><span className="text-yellow-400">— </span>Líneas amarillas — campo E (de + a −)</p>
                  <p><span style={{ color: '#64748b' }}>— </span>Línea gris — plano V = 0</p>
                  <p className="mt-2">El potencial es simétrico: V(θ) = −V(π−θ)</p>
                </div>
              </>
            )}
          </InfoPanel>
        </div>
      </div>
    </Layout>
  )
}
