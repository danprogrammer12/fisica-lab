import { useState, useEffect, useMemo } from 'react'
import { BookOpen, Wifi } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { SliderControl } from '../components/ui/SliderControl'
import { FormulaCard } from '../components/ui/FormulaCard'
import { InfoPanel, ValueDisplay } from '../components/ui/InfoPanel'
import { QuizEngine } from '../components/ui/QuizEngine'
import { CapacitorPlanoScene } from '../simulations/capacitancia/CapacitorPlano'
import { AsociacionCapacitoresScene } from '../simulations/capacitancia/AsociacionCapacitores'
import { EPSILON_0 } from '../physics/constants'
import { useProgress } from '../hooks/useProgress'
import { QUIZZES } from '../data/quizzes'

type SceneId = 'capacitor-plano' | 'asociacion'
type AssocMode = 'serie' | 'paralelo'

const ACCENT = '#f59e0b'
const quiz = QUIZZES.find((q) => q.moduleId === 'capacitancia')!

export function Capacitancia() {
  const [activeScene, setActiveScene] = useState<SceneId>('capacitor-plano')
  const [area, setArea] = useState(0.04)      // m² (20cm x 20cm)
  const [separation, setSeparation] = useState(0.01)  // m (1cm)
  const [kappa, setKappa] = useState(1)
  const [c1, setC1] = useState(4)
  const [c2, setC2] = useState(6)
  const [c3, setC3] = useState(3)
  const [voltage, setVoltage] = useState(12)
  const [assocMode, setAssocMode] = useState<AssocMode>('paralelo')
  const [showQuiz, setShowQuiz] = useState(false)
  const { markVisited, saveQuizScore } = useProgress()

  useEffect(() => { markVisited('capacitancia') }, [markVisited])

  const C_pF = useMemo(() => (kappa * EPSILON_0 * area) / separation * 1e12, [area, separation, kappa])
  const Q_pC = useMemo(() => C_pF * voltage, [C_pF, voltage])
  const U_J = useMemo(() => 0.5 * C_pF * 1e-12 * voltage * voltage, [C_pF, voltage])
  const E_field = useMemo(() => voltage / separation, [voltage, separation])

  return (
    <Layout showSidebar activeScene={activeScene} onSceneChange={(id) => setActiveScene(id as SceneId)}>
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b" style={{ borderColor: `${ACCENT}20` }}>
        {[
          { id: 'capacitor-plano', label: 'Capacitor Plano-Paralelo' },
          { id: 'asociacion', label: 'Asociación' },
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
        <div className="flex items-center gap-2 text-xs text-slate-600 ml-2"><Wifi size={12} /><span>Cálculo instantáneo</span></div>
      </div>

      <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
        {/* Controles */}
        <div className="w-64 shrink-0 border-r border-slate-800/60 p-4 overflow-y-auto" style={{ backgroundColor: '#0a101e' }}>
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Escena activa</p>
            <h2 className="text-base font-bold text-slate-200">
              {activeScene === 'capacitor-plano' ? 'Capacitor Plano-Paralelo' : 'Asociación de Capacitores'}
            </h2>
          </div>

          {activeScene === 'capacitor-plano' ? (
            <div className="space-y-5">
              <SliderControl label="Área de placa A" value={area * 1e4} min={1} max={100} step={1} unit=" cm²"
                onChange={(v) => setArea(v * 1e-4)} color={ACCENT} />
              <SliderControl label="Separación d" value={separation * 100} min={0.2} max={5} step={0.1} unit=" cm"
                onChange={(v) => setSeparation(v / 100)} color="#34d399" />
              <SliderControl label="Dieléctrico κ" value={kappa} min={1} max={10} step={0.1}
                onChange={setKappa} color="#8b5cf6"
                formatValue={(v) => v.toFixed(1)} />
              <SliderControl label="Voltaje V" value={voltage} min={1} max={100} step={1} unit=" V"
                onChange={setVoltage} color="#60a5fa" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex gap-2 mb-2">
                {(['paralelo', 'serie'] as AssocMode[]).map((m) => (
                  <button key={m} onClick={() => setAssocMode(m)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={assocMode === m ? { color: ACCENT, backgroundColor: `${ACCENT}20`, border: `1px solid ${ACCENT}50` } : { color: '#64748b', border: '1px solid #1e293b' }}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
              <SliderControl label="C₁" value={c1} min={1} max={20} step={0.5} unit=" µF" onChange={setC1} color="#3b82f6" />
              <SliderControl label="C₂" value={c2} min={1} max={20} step={0.5} unit=" µF" onChange={setC2} color="#f59e0b" />
              <SliderControl label="C₃" value={c3} min={1} max={20} step={0.5} unit=" µF" onChange={setC3} color="#8b5cf6" />
              <SliderControl label="Voltaje V" value={voltage} min={1} max={50} step={1} unit=" V" onChange={setVoltage} color="#60a5fa" />
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          {activeScene === 'capacitor-plano' ? (
            <div className="absolute inset-0">
              <CapacitorPlanoScene area={area} separation={separation} kappa={kappa} />
            </div>
          ) : (
            <div className="absolute inset-0">
              <AsociacionCapacitoresScene c1={c1} c2={c2} c3={c3} voltage={voltage} mode={assocMode} />
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
                  <QuizEngine quiz={quiz} accentColor={ACCENT} onComplete={(s, t) => saveQuizScore('capacitancia', s, t)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="w-72 shrink-0 border-l border-slate-800/60 overflow-y-auto" style={{ backgroundColor: '#0a101e' }}>
          <InfoPanel title="Capacitancia" concept="Un capacitor almacena energía en el campo eléctrico entre sus placas. La capacitancia C mide su capacidad de almacenar carga por unidad de voltaje." color={ACCENT}>
            {activeScene === 'capacitor-plano' ? (
              <>
                <FormulaCard title="Capacitor plano-paralelo" latex={`C = \\frac{\\kappa\\varepsilon_0 A}{d}`}
                  description="C en Faradios. κ es la constante dieléctrica relativa del material entre las placas."
                  variables={[
                    { symbol: '\\varepsilon_0', description: 'Permitividad del vacío', value: '8.85×10⁻¹² F/m' },
                    { symbol: 'A', description: 'Área de las placas', value: `${(area * 1e4).toFixed(0)} cm²` },
                    { symbol: 'd', description: 'Separación', value: `${(separation * 100).toFixed(1)} cm` },
                  ]}
                  highlight color={ACCENT}
                />
                <FormulaCard title="Energía almacenada" latex={`U = \\frac{1}{2}CV^2 = \\frac{Q^2}{2C}`} color="#34d399" />
                <ValueDisplay label="Capacitancia C" value={C_pF.toFixed(2)} unit="pF" color={ACCENT} />
                <ValueDisplay label="Carga Q" value={Q_pC.toFixed(1)} unit="pC" color="#60a5fa" />
                <ValueDisplay label="Campo E entre placas" value={E_field.toFixed(0)} unit="V/m" color="#f59e0b" />
                <ValueDisplay label="Energía U" value={U_J.toExponential(2)} unit="J" color="#34d399" />
              </>
            ) : (
              <>
                <FormulaCard title="Capacitores en paralelo" latex={`C_{eq} = C_1 + C_2 + C_3`} highlight={assocMode === 'paralelo'} color="#3b82f6" />
                <FormulaCard title="Capacitores en serie" latex={`\\frac{1}{C_{eq}} = \\frac{1}{C_1} + \\frac{1}{C_2} + \\frac{1}{C_3}`} highlight={assocMode === 'serie'} color="#8b5cf6" />
                {(() => {
                  const ceq = assocMode === 'paralelo' ? c1 + c2 + c3 : 1 / (1 / c1 + 1 / c2 + 1 / c3)
                  const Q = ceq * voltage
                  const U = 0.5 * ceq * voltage * voltage * 1e-6
                  return (
                    <>
                      <ValueDisplay label="Capacitancia Ceq" value={`${ceq.toFixed(2)} µF`} color={ACCENT} />
                      <ValueDisplay label="Carga total Q" value={`${Q.toFixed(1)} µC`} color="#60a5fa" />
                      <ValueDisplay label="Energía U" value={U.toExponential(2)} unit="J" color="#34d399" />
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
