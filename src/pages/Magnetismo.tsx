import { useState, useEffect } from 'react'
import { BookOpen, Wifi } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { SliderControl } from '../components/ui/SliderControl'
import { FormulaCard } from '../components/ui/FormulaCard'
import { InfoPanel, ValueDisplay } from '../components/ui/InfoPanel'
import { QuizEngine } from '../components/ui/QuizEngine'
import { CampoSolenoidScene, calcB } from '../simulations/magnetismo/CampoSolenoide'
import { FuerzaLorentzScene } from '../simulations/magnetismo/FuerzaLorentz'
import { useProgress } from '../hooks/useProgress'
import { QUIZZES } from '../data/quizzes'

type SceneId = 'solenoide' | 'lorentz'

const ACCENT = '#06b6d4'
const quiz = QUIZZES.find((q) => q.moduleId === 'magnetismo')!

export function Magnetismo() {
  const [activeScene, setActiveScene] = useState<SceneId>('solenoide')
  const [showQuiz, setShowQuiz] = useState(false)
  const { markVisited, saveQuizScore } = useProgress()

  // Controles solenoide
  const [N, setN] = useState(20)
  const [L, setL] = useState(2)
  const [radius, setRadius] = useState(0.5)
  const [current, setCurrent] = useState(5)

  // Controles Lorentz
  const [B, setB] = useState(0.5)
  const [chargeSign, setChargeSign] = useState<1 | -1>(1)
  const [v0x, setV0x] = useState(1e6)
  const [v0z, setV0z] = useState(0)

  useEffect(() => { markVisited('magnetismo') }, [markVisited])

  const B_sol = calcB(N, L, Math.abs(current))
  const electronMass = 9.109e-31
  const charge = chargeSign * 1.602e-19

  return (
    <Layout showSidebar activeScene={activeScene} onSceneChange={(id) => setActiveScene(id as SceneId)}>
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b" style={{ borderColor: `${ACCENT}20` }}>
        {[
          { id: 'solenoide', label: 'Solenoide' },
          { id: 'lorentz', label: 'Fuerza de Lorentz' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveScene(tab.id as SceneId)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={
              activeScene === tab.id
                ? { color: ACCENT, backgroundColor: `${ACCENT}15`, fontWeight: 600 }
                : { color: '#475569' }
            }
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setShowQuiz((v) => !v)}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
          style={showQuiz
            ? { color: ACCENT, backgroundColor: `${ACCENT}20` }
            : { color: '#64748b', backgroundColor: '#1e293b' }}
        >
          <BookOpen size={12} />Quiz
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-600 ml-2">
          <Wifi size={12} /><span>Dinámico en tiempo real</span>
        </div>
      </div>

      <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
        {/* Controles */}
        <div className="w-64 shrink-0 border-r border-slate-800/60 p-4 overflow-y-auto" style={{ backgroundColor: '#0a101e' }}>
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Escena activa</p>
            <h2 className="text-base font-bold text-slate-200">
              {activeScene === 'solenoide' ? 'Campo del Solenoide' : 'Fuerza de Lorentz'}
            </h2>
          </div>

          {activeScene === 'solenoide' ? (
            <div className="space-y-5">
              <SliderControl label="Número de espiras N" value={N} min={5} max={50} step={1} unit="" onChange={setN} color={ACCENT} />
              <SliderControl label="Longitud L" value={L} min={0.5} max={4} step={0.1} unit=" m" onChange={setL} color="#a78bfa" />
              <SliderControl label="Radio r" value={radius} min={0.2} max={1.2} step={0.05} unit=" m" onChange={setRadius} color="#f59e0b" />
              <SliderControl
                label="Corriente I"
                value={current}
                min={-20}
                max={20}
                step={1}
                unit=" A"
                onChange={setCurrent}
                color={current >= 0 ? ACCENT : '#f97316'}
                formatValue={(v) => (v >= 0 ? `+${v.toFixed(0)}` : v.toFixed(0))}
              />
              <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <p className="text-slate-400">Campo interior:</p>
                <p className="font-mono font-bold mt-1" style={{ color: ACCENT }}>
                  B = {(B_sol * 1000).toFixed(3)} mT
                </p>
                <p className="text-slate-500 mt-1">n = {(N / L).toFixed(1)} esp/m</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <SliderControl label="Campo B" value={B} min={0.1} max={2} step={0.05} unit=" T" onChange={setB} color={ACCENT} />
              <SliderControl
                label="Velocidad v₀x"
                value={v0x / 1e6}
                min={0.1}
                max={5}
                step={0.1}
                unit="×10⁶ m/s"
                onChange={(v) => setV0x(v * 1e6)}
                color="#f59e0b"
              />
              <SliderControl
                label="Paso helicoidal v₀z"
                value={v0z / 1e6}
                min={0}
                max={3}
                step={0.1}
                unit="×10⁶ m/s"
                onChange={(v) => setV0z(v * 1e6)}
                color="#a78bfa"
              />

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Tipo de carga</p>
                <div className="flex gap-2">
                  {([1, -1] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setChargeSign(s)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={
                        chargeSign === s
                          ? { color: s > 0 ? '#ef4444' : '#3b82f6', backgroundColor: s > 0 ? '#ef444415' : '#3b82f615', border: `1px solid ${s > 0 ? '#ef444450' : '#3b82f650'}` }
                          : { color: '#64748b', border: '1px solid #1e293b' }
                      }
                    >
                      {s > 0 ? '+q (protón)' : '−q (electrón)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-1">
            <p className="text-xs font-medium text-slate-600">Controles 3D</p>
            <p className="text-xs text-slate-700">🖱️ Arrastrar → Rotar</p>
            <p className="text-xs text-slate-700">🖱️ Rueda → Zoom</p>
            <p className="text-xs text-slate-700">🖱️ Clic derecho → Paneo</p>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          {activeScene === 'solenoide' ? (
            <div className="absolute inset-0">
              <CampoSolenoidScene N={N} L={L} radius={radius} current={current} />
            </div>
          ) : (
            <div className="absolute inset-0">
              <FuerzaLorentzScene B={B} charge={charge} mass={electronMass} v0x={v0x} v0z={v0z} />
            </div>
          )}

          {showQuiz && quiz && (
            <div className="absolute inset-0 z-20 overflow-y-auto" style={{ backgroundColor: 'rgba(5,9,18,0.95)' }}>
              <div className="max-w-xl mx-auto py-6">
                <div className="rounded-2xl border border-slate-800" style={{ backgroundColor: '#111827' }}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h3 className="text-base font-bold text-slate-200">{quiz.title}</h3>
                    <button onClick={() => setShowQuiz(false)} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
                  </div>
                  <QuizEngine quiz={quiz} accentColor={ACCENT} onComplete={(s, t) => saveQuizScore('magnetismo', s, t)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="w-72 shrink-0 border-l border-slate-800/60 overflow-y-auto" style={{ backgroundColor: '#0a101e' }}>
          {activeScene === 'solenoide' ? (
            <InfoPanel
              title="Campo Magnético — Solenoide"
              concept="Un solenoide es un alambre enrollado en hélice. Dentro genera un campo magnético uniforme y paralelo al eje. Fuera el campo es despreciable (se cancela). Es la base de electroimanes, transformadores y resonancia magnética."
              color={ACCENT}
            >
              <FormulaCard
                title="Campo dentro del solenoide"
                latex={`B = \\mu_0 n I = \\mu_0 \\frac{N}{L} I`}
                description="B en Tesla. n = N/L densidad de espiras (vueltas/metro)."
                variables={[
                  { symbol: '\\mu_0', description: 'Permeabilidad del vacío', value: '4π×10⁻⁷ T·m/A' },
                  { symbol: 'n', description: 'Densidad de espiras', value: `${(N / L).toFixed(1)} esp/m` },
                  { symbol: 'I', description: 'Corriente', value: `${current.toFixed(0)} A` },
                ]}
                highlight
                color={ACCENT}
              />
              <FormulaCard
                title="Flujo magnético"
                latex={`\\Phi_B = B \\cdot A = \\mu_0 n I \\pi r^2`}
                description="Φ_B en Webers. A = πr² es el área de la sección transversal."
                color="#a78bfa"
              />
              <ValueDisplay label="B interior" value={(B_sol * 1000).toFixed(3)} unit="mT" color={ACCENT} />
              <ValueDisplay label="n = N/L" value={(N / L).toFixed(1)} unit="esp/m" color="#a78bfa" />
              <ValueDisplay label="Φ_B = B·πr²" value={(B_sol * Math.PI * radius * radius * 1e6).toFixed(2)} unit="µWb" color="#f59e0b" />
              <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <span className="font-semibold text-slate-300">Regla de la mano derecha: </span>
                Envuelve el solenoide con la mano derecha con los dedos apuntando en el sentido de la corriente; el pulgar indica la dirección de B.
              </div>
            </InfoPanel>
          ) : (
            <InfoPanel
              title="Fuerza de Lorentz"
              concept="Una partícula cargada en un campo magnético experimenta la fuerza de Lorentz F = qv×B, siempre perpendicular a la velocidad. Esto genera movimiento circular (o helicoidal con componente paralela a B)."
              color={ACCENT}
            >
              <FormulaCard
                title="Fuerza de Lorentz"
                latex={`\\vec{F} = q\\vec{v} \\times \\vec{B}`}
                description="F siempre perpendicular a v. No realiza trabajo → la rapidez no cambia."
                highlight
                color={ACCENT}
              />
              <FormulaCard
                title="Radio y período ciclotrónico"
                latex={`r = \\frac{mv}{|q|B} \\qquad T = \\frac{2\\pi m}{|q|B}`}
                description="r depende de la velocidad; T es independiente de v (isocronismo)."
                color="#a78bfa"
              />
              {(() => {
                const r = (electronMass * v0x) / (Math.abs(charge) * B)
                const T = (2 * Math.PI * electronMass) / (Math.abs(charge) * B)
                return (
                  <>
                    <ValueDisplay label="Radio r" value={(r * 1000).toFixed(2)} unit="mm" color={ACCENT} />
                    <ValueDisplay label="Período T" value={(T * 1e6).toFixed(2)} unit="µs" color="#a78bfa" />
                    <ValueDisplay label="Frec. ciclotrón f" value={(1 / T / 1e6).toFixed(2)} unit="MHz" color="#f59e0b" />
                  </>
                )
              })()}
              <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <span className="font-semibold text-slate-300">Aplicaciones: </span>
                Ciclotrón (acelerador de partículas), espectrómetro de masas, auroras polares, confinamiento de plasma en tokamaks.
              </div>
            </InfoPanel>
          )}
        </div>
      </div>
    </Layout>
  )
}
