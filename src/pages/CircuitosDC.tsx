import { useState, useEffect } from 'react'
import { BookOpen, Wifi } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { SliderControl } from '../components/ui/SliderControl'
import { FormulaCard } from '../components/ui/FormulaCard'
import { InfoPanel, ValueDisplay } from '../components/ui/InfoPanel'
import { QuizEngine } from '../components/ui/QuizEngine'
import { CircuitoRCScene } from '../simulations/circuitos/CircuitoRC'
import { CircuitoKirchhoffScene } from '../simulations/circuitos/CircuitoKirchhoff'
import { useProgress } from '../hooks/useProgress'
import { QUIZZES } from '../data/quizzes'

type SceneId = 'circuito-rc' | 'kirchhoff'
type RCMode = 'carga' | 'descarga'

const ACCENT = '#ef4444'
const quiz = QUIZZES.find((q) => q.moduleId === 'circuitos')!

export function CircuitosDC() {
  const [activeScene, setActiveScene] = useState<SceneId>('circuito-rc')
  const [R, setR] = useState(10)        // kΩ
  const [C, setC] = useState(100)       // µF
  const [fem, setFem] = useState(12)    // V
  const [rcMode, setRcMode] = useState<RCMode>('carga')
  const [r, setR_int] = useState(1)     // Ω resistencia interna
  const [R1, setR1] = useState(20)      // Ω
  const [R2, setR2] = useState(30)      // Ω
  const [R3, setR3] = useState(40)      // Ω
  const [showQuiz, setShowQuiz] = useState(false)
  const { markVisited, saveQuizScore } = useProgress()

  useEffect(() => { markVisited('circuitos') }, [markVisited])

  const tau = R * 1000 * C * 1e-6
  const I_max = fem / (R * 1000)

  return (
    <Layout showSidebar activeScene={activeScene} onSceneChange={(id) => setActiveScene(id as SceneId)}>
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b" style={{ borderColor: `${ACCENT}20` }}>
        {[
          { id: 'circuito-rc', label: 'Circuito RC' },
          { id: 'kirchhoff', label: 'Leyes de Kirchhoff' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveScene(tab.id as SceneId)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={activeScene === tab.id ? { color: ACCENT, backgroundColor: `${ACCENT}15`, fontWeight: 600 } : { color: '#475569' }}
          >
            {tab.label}
          </button>
        ))}
        <button onClick={() => setShowQuiz((v) => !v)}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
          style={showQuiz ? { color: ACCENT, backgroundColor: `${ACCENT}20` } : { color: '#64748b', backgroundColor: '#1e293b' }}
        >
          <BookOpen size={12} />Quiz
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-600 ml-2"><Wifi size={12} /><span>Dinámico en tiempo real</span></div>
      </div>

      <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
        {/* Controles */}
        <div className="w-64 shrink-0 border-r border-slate-800/60 p-4 overflow-y-auto" style={{ backgroundColor: '#0a101e' }}>
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Escena activa</p>
            <h2 className="text-base font-bold text-slate-200">
              {activeScene === 'circuito-rc' ? 'Circuito RC' : 'Leyes de Kirchhoff'}
            </h2>
          </div>

          {activeScene === 'circuito-rc' ? (
            <div className="space-y-5">
              <div className="flex gap-2 mb-2">
                {(['carga', 'descarga'] as RCMode[]).map((m) => (
                  <button key={m} onClick={() => setRcMode(m)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={rcMode === m ? { color: ACCENT, backgroundColor: `${ACCENT}20`, border: `1px solid ${ACCENT}50` } : { color: '#64748b', border: '1px solid #1e293b' }}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
              <SliderControl label="Resistencia R" value={R} min={1} max={100} step={1} unit=" kΩ" onChange={setR} color={ACCENT} />
              <SliderControl label="Capacitancia C" value={C} min={10} max={1000} step={10} unit=" µF" onChange={setC} color="#3b82f6" />
              <SliderControl label="FEM ε" value={fem} min={1} max={50} step={1} unit=" V" onChange={setFem} color="#10b981" />
              <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <p className="text-slate-400">Constante de tiempo:</p>
                <p className="text-violet-400 font-mono font-bold mt-1">τ = RC = {(tau * 1000).toFixed(1)} ms</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <SliderControl label="FEM ε" value={fem} min={1} max={48} step={1} unit=" V" onChange={setFem} color="#10b981" />
              <SliderControl label="R interna r" value={r} min={0} max={10} step={0.5} unit=" Ω" onChange={setR_int} color="#64748b" />
              <SliderControl label="R₁" value={R1} min={5} max={100} step={5} unit=" Ω" onChange={setR1} color="#f59e0b" />
              <SliderControl label="R₂" value={R2} min={5} max={100} step={5} unit=" Ω" onChange={setR2} color="#8b5cf6" />
              <SliderControl label="R₃" value={R3} min={5} max={100} step={5} unit=" Ω" onChange={setR3} color="#ec4899" />
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          {activeScene === 'circuito-rc' ? (
            <div className="absolute inset-0">
              <CircuitoRCScene R={R} C={C} fem={fem} mode={rcMode} />
            </div>
          ) : (
            <div className="absolute inset-0">
              <CircuitoKirchhoffScene fem={fem} r={r} R1={R1} R2={R2} R3={R3} />
            </div>
          )}

          {showQuiz && (
            <div className="absolute inset-0 z-20 overflow-y-auto" style={{ backgroundColor: 'rgba(5,9,18,0.95)' }}>
              <div className="max-w-xl mx-auto py-6">
                <div className="rounded-2xl border border-slate-800" style={{ backgroundColor: '#111827' }}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h3 className="text-base font-bold text-slate-200">{quiz.title}</h3>
                    <button onClick={() => setShowQuiz(false)} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
                  </div>
                  <QuizEngine quiz={quiz} accentColor={ACCENT} onComplete={(s, t) => saveQuizScore('circuitos', s, t)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="w-72 shrink-0 border-l border-slate-800/60 overflow-y-auto" style={{ backgroundColor: '#0a101e' }}>
          <InfoPanel title={activeScene === 'circuito-rc' ? 'Circuito RC' : 'Leyes de Kirchhoff'}
            concept={activeScene === 'circuito-rc'
              ? 'En un circuito RC, la carga del capacitor sigue una curva exponencial definida por la constante de tiempo τ = RC. Cuando t = τ, el capacitor ha alcanzado el 63.2% de su carga máxima.'
              : 'Las Leyes de Kirchhoff son consecuencia de la conservación de la carga (KCL) y la energía (KVL). Permiten analizar cualquier circuito por complejo que sea.'}
            color={ACCENT}
          >
            {activeScene === 'circuito-rc' ? (
              <>
                <FormulaCard title="Carga del capacitor"
                  latex={`q(t) = C\\varepsilon\\left(1 - e^{-t/\\tau}\\right)`}
                  description="q(t) en Coulombs. τ = RC es la constante de tiempo."
                  highlight color={ACCENT}
                />
                <FormulaCard title="Descarga del capacitor"
                  latex={`q(t) = Q_0 e^{-t/\\tau}`}
                  description="La carga decae exponencialmente desde Q₀."
                  color="#3b82f6"
                />
                <ValueDisplay label="τ = RC" value={`${(tau * 1000).toFixed(1)} ms`} color="#a78bfa" />
                <ValueDisplay label="I₀ = ε/R" value={`${(I_max * 1000).toFixed(2)} mA`} color={ACCENT} />
                <ValueDisplay label="Q_max = Cε" value={`${(C * fem).toFixed(0)} µC`} color="#3b82f6" />
                <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                  <strong className="text-slate-300">t = τ:</strong> q = 63.2% de Q_max<br />
                  <strong className="text-slate-300">t = 2τ:</strong> q = 86.5% de Q_max<br />
                  <strong className="text-slate-300">t = 5τ:</strong> q ≈ 99.3% (prácticamente cargado)
                </div>
              </>
            ) : (
              <>
                <FormulaCard title="KCL — Ley de nodos"
                  latex={`\\sum I_{entrada} = \\sum I_{salida}`}
                  description="La suma de corrientes en un nodo es cero. Conservación de la carga."
                  highlight color={ACCENT}
                />
                <FormulaCard title="KVL — Ley de mallas"
                  latex={`\\sum \\Delta V = 0`}
                  description="La suma de todas las diferencias de potencial en una malla cerrada es cero."
                  color="#10b981"
                />
                {(() => {
                  const R23 = (R2 * R3) / (R2 + R3)
                  const Rtotal = r + R1 + R23
                  const I = fem / Rtotal
                  return (
                    <>
                      <ValueDisplay label="Corriente total I" value={`${(I * 1000).toFixed(1)} mA`} color={ACCENT} />
                      <ValueDisplay label="R₂ ∥ R₃" value={`${R23.toFixed(1)} Ω`} color="#a78bfa" />
                      <ValueDisplay label="Rtotal" value={`${Rtotal.toFixed(1)} Ω`} color="#64748b" />
                    </>
                  )
                })()}
              </>
            )}
          </InfoPanel>
        </div>
      </div>
    </Layout>
  )
}
