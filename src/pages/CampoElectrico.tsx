import { useState, useMemo } from 'react'
import { Eye, EyeOff, Wifi } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { InfografiaPanel } from '../components/ui/InfografiaPanel'
import { SliderControl } from '../components/ui/SliderControl'
import { FormulaCard } from '../components/ui/FormulaCard'
import { InfoPanel, ValueDisplay } from '../components/ui/InfoPanel'
import { CargaPuntualScene, fieldInfoAt } from '../simulations/campo-electrico/CargaPuntual'
import { DipoloElectricoScene } from '../simulations/campo-electrico/DipoloElectrico'
import { NC_TO_C } from '../physics/constants'

type SceneId = 'carga-puntual' | 'dipolo' | 'doble-positiva'

// ────────────────────────────────────────────────────────────
// Toggle visual on/off
// ────────────────────────────────────────────────────────────
function ToggleButton({
  label,
  active,
  color,
  onChange,
}: {
  label: string
  active: boolean
  color: string
  onChange: () => void
}) {
  return (
    <button
      onClick={onChange}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all w-full"
      style={
        active
          ? { color, borderColor: `${color}50`, backgroundColor: `${color}15` }
          : { color: '#475569', borderColor: '#1e293b', backgroundColor: 'transparent' }
      }
    >
      {active ? <Eye size={14} /> : <EyeOff size={14} />}
      {label}
    </button>
  )
}

// ────────────────────────────────────────────────────────────
// Panel de controles para Carga Puntual
// ────────────────────────────────────────────────────────────
interface CargaControlesProps {
  charge: number
  setCharge: (v: number) => void
  showLines: boolean
  setShowLines: (v: boolean) => void
  showVectors: boolean
  setShowVectors: (v: boolean) => void
}

function CargaControles({
  charge,
  setCharge,
  showLines,
  setShowLines,
  showVectors,
  setShowVectors,
}: CargaControlesProps) {
  const accentColor = charge >= 0 ? '#ef4444' : '#3b82f6'

  return (
    <div className="space-y-5">
      <SliderControl
        label="Magnitud de carga"
        value={charge}
        min={-10}
        max={10}
        step={0.5}
        unit=" nC"
        onChange={setCharge}
        color={accentColor}
        formatValue={(v) => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
      />

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Visualización</p>
        <ToggleButton
          label="Líneas de campo"
          active={showLines}
          color="#34d399"
          onChange={() => setShowLines(!showLines)}
        />
        <ToggleButton
          label="Vectores E"
          active={showVectors}
          color="#f59e0b"
          onChange={() => setShowVectors(!showVectors)}
        />
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Panel de controles para Dipolo
// ────────────────────────────────────────────────────────────
interface DipoloControlesProps {
  charge: number
  setCharge: (v: number) => void
  separation: number
  setSeparation: (v: number) => void
  showLines: boolean
  setShowLines: (v: boolean) => void
  showVectors: boolean
  setShowVectors: (v: boolean) => void
}

function DipoloControles({
  charge,
  setCharge,
  separation,
  setSeparation,
  showLines,
  setShowLines,
  showVectors,
  setShowVectors,
}: DipoloControlesProps) {
  return (
    <div className="space-y-5">
      <SliderControl
        label="Magnitud de carga"
        value={charge}
        min={1}
        max={15}
        step={0.5}
        unit=" nC"
        onChange={setCharge}
        color="#34d399"
      />
      <SliderControl
        label="Separación"
        value={separation}
        min={0.5}
        max={4}
        step={0.1}
        unit=" m"
        onChange={setSeparation}
        color="#a78bfa"
      />

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Visualización</p>
        <ToggleButton
          label="Líneas de campo"
          active={showLines}
          color="#34d399"
          onChange={() => setShowLines(!showLines)}
        />
        <ToggleButton
          label="Vectores E"
          active={showVectors}
          color="#f59e0b"
          onChange={() => setShowVectors(!showVectors)}
        />
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Panel de información para Carga Puntual
// ────────────────────────────────────────────────────────────
function CargaInfoPanel({ charge }: { charge: number }) {
  const accentColor = charge >= 0 ? '#ef4444' : '#3b82f6'
  const fieldAt1m = useMemo(() => fieldInfoAt(charge, 1), [charge])
  const fieldAt2m = useMemo(() => fieldInfoAt(charge, 2), [charge])
  const fieldAt0_5m = useMemo(() => fieldInfoAt(charge, 0.5), [charge])

  return (
    <InfoPanel
      title="Campo Eléctrico"
      concept="El campo eléctrico E de una carga puntual es radial: sale de las cargas positivas y entra a las negativas. Su magnitud disminuye con el cuadrado de la distancia (ley inversa del cuadrado)."
      color={accentColor}
    >
      <FormulaCard
        title="Ley de Coulomb — Campo"
        latex={`\\vec{E} = k_e \\frac{q}{r^2}\\hat{r}`}
        description="E es el campo en N/C, q la carga fuente en Coulombs, r la distancia en metros."
        variables={[
          { symbol: 'k_e', description: 'Constante de Coulomb', value: '8.99×10⁹ N·m²/C²' },
          { symbol: 'q', description: 'Carga fuente', value: `${charge.toFixed(1)} nC` },
          { symbol: 'r', description: 'Distancia desde la carga', value: 'm' },
        ]}
        highlight
        color={accentColor}
      />

      <div className="space-y-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">
          Campo |E| según distancia
        </p>
        <ValueDisplay label="A r = 0.5 m" value={fieldAt0_5m.magnitude} unit="N/C" color={accentColor} />
        <ValueDisplay label="A r = 1.0 m" value={fieldAt1m.magnitude} unit="N/C" color={accentColor} />
        <ValueDisplay label="A r = 2.0 m" value={fieldAt2m.magnitude} unit="N/C" color={accentColor} />
      </div>

      <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed"
        style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
        <span className="font-semibold text-slate-300">Nota:</span>{' '}
        Al doblar la distancia, el campo se reduce a ¼ de su valor. Esta es la ley del cuadrado inverso.
        Las líneas de campo son más densas cerca de la carga, reflejando mayor intensidad.
      </div>
    </InfoPanel>
  )
}

// ────────────────────────────────────────────────────────────
// Panel de información para Dipolo
// ────────────────────────────────────────────────────────────
function DipoloInfoPanel({
  charge,
  separation,
}: {
  charge: number
  separation: number
}) {
  const dipoleMoment = useMemo(
    () => Math.abs(charge) * NC_TO_C * separation,
    [charge, separation],
  )

  return (
    <InfoPanel
      title="Dipolo Eléctrico"
      concept="Un dipolo eléctrico consiste en dos cargas iguales y opuestas separadas por una distancia d. Las líneas de campo van desde la carga positiva hasta la negativa, formando el patrón característico del dipolo."
      color="#34d399"
    >
      <FormulaCard
        title="Momento dipolar"
        latex={`\\vec{p} = q \\cdot \\vec{d}`}
        description="p es el vector del momento dipolar, apunta de – a +."
        variables={[
          { symbol: 'q', description: 'Magnitud de la carga', value: `${charge.toFixed(1)} nC` },
          { symbol: 'd', description: 'Separación', value: `${separation.toFixed(2)} m` },
          { symbol: 'p', description: 'Momento dipolar', value: `${dipoleMoment.toExponential(2)} C·m` },
        ]}
        highlight
        color="#34d399"
      />

      <FormulaCard
        title="Campo en el eje del dipolo"
        latex={`E \\approx \\frac{2kp}{r^3}`}
        description="Para r >> d. El campo cae más rápido que el de una carga puntual (r³ vs r²)."
        color="#a78bfa"
      />

      <ValueDisplay label="Momento dipolar p" value={dipoleMoment} unit="C·m" color="#34d399" />
      <ValueDisplay label="Separación d" value={separation} unit="m" color="#a78bfa" />

      <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed"
        style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
        <span className="font-semibold text-slate-300">Aplicaciones:</span>{' '}
        Las moléculas polares (agua H₂O) son dipolos permanentes. Antenas de comunicación y muchos fenómenos en química cuántica se modelan como dipolos.
      </div>
    </InfoPanel>
  )
}

// ────────────────────────────────────────────────────────────
// Página principal de Campo Eléctrico
// ────────────────────────────────────────────────────────────
export function CampoElectrico() {
  const [activeScene, setActiveScene] = useState<SceneId>('carga-puntual')

  // Estado Carga Puntual
  const [charge, setCharge] = useState(5)
  const [showLines, setShowLines] = useState(true)
  const [showVectors, setShowVectors] = useState(false)

  // Estado Dipolo
  const [dipoleCharge, setDipoleCharge] = useState(5)
  const [separation, setSeparation] = useState(2)
  const [dipoleShowLines, setDipoleShowLines] = useState(true)
  const [dipoleShowVectors, setDipoleShowVectors] = useState(false)
  const [bothPositive, setBothPositive] = useState(false)

  const sceneTitle = activeScene === 'carga-puntual' ? 'Carga Puntual'
    : activeScene === 'dipolo' ? 'Dipolo Eléctrico'
    : 'Dos Cargas (+q, +q)'
  const accentColor = activeScene === 'carga-puntual'
    ? (charge >= 0 ? '#ef4444' : '#3b82f6')
    : '#34d399'

  return (
    <Layout
      showSidebar
      activeScene={activeScene}
      onSceneChange={(id) => setActiveScene(id as SceneId)}
    >
      {/* ── Tabs de escenas ─── */}
      <div
        className="flex items-center gap-1 px-4 py-2 border-b border-slate-800/60"
        style={{ borderBottomColor: `${accentColor}20` }}
      >
        {[
          { id: 'carga-puntual', label: 'Carga Puntual' },
          { id: 'dipolo', label: 'Dipolo (+q −q)' },
          { id: 'doble-positiva', label: 'Dos +q' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveScene(tab.id as SceneId)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={
              activeScene === tab.id
                ? { color: accentColor, backgroundColor: `${accentColor}15`, fontWeight: 600 }
                : { color: '#475569' }
            }
          >
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <InfografiaPanel src="/infografias/campo-electrico.png" title="Infografía — Líneas de Campo Eléctrico" accentColor={accentColor} />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Wifi size={12} />
            <span>Física calculada en tiempo real</span>
          </div>
        </div>
      </div>

      {/* ── Layout: Controles | Canvas | Info ─── */}
      <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
        {/* Panel de controles (izquierda) */}
        <div
          className="w-64 shrink-0 border-r border-slate-800/60 p-4 overflow-y-auto"
          style={{ backgroundColor: '#0a101e' }}
        >
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Escena activa
            </p>
            <h2 className="text-base font-bold text-slate-200">{sceneTitle}</h2>
          </div>

          {activeScene === 'carga-puntual' ? (
            <CargaControles
              charge={charge}
              setCharge={setCharge}
              showLines={showLines}
              setShowLines={setShowLines}
              showVectors={showVectors}
              setShowVectors={setShowVectors}
            />
          ) : (
            <DipoloControles
              charge={dipoleCharge}
              setCharge={setDipoleCharge}
              separation={separation}
              setSeparation={setSeparation}
              showLines={dipoleShowLines}
              setShowLines={setDipoleShowLines}
              showVectors={dipoleShowVectors}
              setShowVectors={setDipoleShowVectors}
            />
          )}

          {(activeScene === 'dipolo' || activeScene === 'doble-positiva') && (
            <div className="mt-4 p-3 rounded-lg text-xs text-slate-400" style={{ backgroundColor: '#0a101e', border: '1px solid #1e293b' }}>
              {activeScene === 'dipolo'
                ? 'Las líneas salen de +q y llegan a −q. El campo es máximo entre las cargas.'
                : 'Las líneas se repelen entre sí. No hay líneas que conecten las dos cargas.'}
            </div>
          )}

          {/* Instrucciones de interacción */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-1">
            <p className="text-xs font-medium text-slate-600">Controles 3D</p>
            <p className="text-xs text-slate-700">🖱️ Arrastrar → Rotar</p>
            <p className="text-xs text-slate-700">🖱️ Rueda → Zoom</p>
            <p className="text-xs text-slate-700">🖱️ Clic derecho → Paneo</p>
          </div>
        </div>

        {/* Canvas 3D (centro) */}
        <div className="flex-1 relative">
          {activeScene === 'carga-puntual' ? (
            <div className="absolute inset-0">
              <CargaPuntualScene charge={charge} showFieldLines={showLines} showVectors={showVectors} />
            </div>
          ) : (
            <div className="absolute inset-0">
              <DipoloElectricoScene
                charge={dipoleCharge}
                separation={separation}
                showFieldLines={dipoleShowLines}
                showVectors={dipoleShowVectors}
                bothPositive={activeScene === 'doble-positiva'}
              />
            </div>
          )}
        </div>

        {/* Panel de información (derecha) */}
        <div
          className="w-72 shrink-0 border-l border-slate-800/60 overflow-y-auto"
          style={{ backgroundColor: '#0a101e' }}
        >
          {activeScene === 'carga-puntual' ? (
            <div className="h-full"><CargaInfoPanel charge={charge} /></div>
          ) : activeScene === 'dipolo' ? (
            <div className="h-full"><DipoloInfoPanel charge={dipoleCharge} separation={separation} /></div>
          ) : (
            <div className="h-full">
              <InfoPanel
                title="Dos Cargas del Mismo Signo"
                concept="Cuando dos cargas del mismo signo se acercan, sus campos se repelen. Las líneas de campo nunca conectan las dos cargas: se doblan hacia afuera y existe un punto neutro entre ellas donde el campo es cero."
                color="#34d399"
              >
                <FormulaCard
                  title="Fuerza repulsiva (Coulomb)"
                  latex={`F = k_e \\frac{q_1 q_2}{r^2}`}
                  description="Con q₁ y q₂ del mismo signo, F > 0: se repelen."
                  highlight
                  color="#34d399"
                />
                <FormulaCard
                  title="Punto neutro (en el eje)"
                  latex={`E = 0 \\text{ en el centro}`}
                  description="Por simetría, el campo es cero en el punto medio entre las dos cargas iguales."
                  color="#a78bfa"
                />
                <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                  <span className="font-semibold text-slate-300">Diferencia con el dipolo:</span>{' '}
                  En el dipolo (+q, −q) las líneas conectan las cargas. En el par (+q, +q) las líneas se repelen y existe un punto donde E = 0.
                </div>
              </InfoPanel>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
