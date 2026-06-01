import { useState, useMemo } from 'react'
import { Wifi } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { SliderControl } from '../components/ui/SliderControl'
import { FormulaCard } from '../components/ui/FormulaCard'
import { InfoPanel, ValueDisplay } from '../components/ui/InfoPanel'
import { FlujoElectricoScene } from '../simulations/ley-gauss/FlujoElectrico'
import { SuperficieGaussianaScene } from '../simulations/ley-gauss/SuperficieGaussiana'
import { electricFlux, gaussianFlux } from '../physics/electrostatics'

type SceneId = 'flujo' | 'superficie-gaussiana'

// ────────────────────────────────────────────────────────────
// Controles de la escena de flujo
// ────────────────────────────────────────────────────────────
interface FlujoControlesProps {
  area: number
  setArea: (v: number) => void
  field: number
  setField: (v: number) => void
  angle: number
  setAngle: (v: number) => void
}

function FlujoControles({ area, setArea, field, setField, angle, setAngle }: FlujoControlesProps) {
  return (
    <div className="space-y-5">
      <SliderControl
        label="Área del plano"
        value={area}
        min={0.5}
        max={9}
        step={0.5}
        unit=" m²"
        onChange={setArea}
        color="#10b981"
      />
      <SliderControl
        label="Campo eléctrico E"
        value={field}
        min={10}
        max={500}
        step={10}
        unit=" N/C"
        onChange={setField}
        color="#f59e0b"
      />
      <SliderControl
        label="Ángulo θ (E con normal)"
        value={angle}
        min={0}
        max={90}
        step={1}
        unit="°"
        onChange={setAngle}
        color="#a78bfa"
        formatValue={(v) => `${v.toFixed(0)}°`}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Controles de la superficie gaussiana
// ────────────────────────────────────────────────────────────
interface GaussControlesProps {
  radius: number
  setRadius: (v: number) => void
  charge: number
  setCharge: (v: number) => void
}

function GaussControles({ radius, setRadius, charge, setCharge }: GaussControlesProps) {
  const accentColor = charge >= 0 ? '#ef4444' : '#3b82f6'

  return (
    <div className="space-y-5">
      <SliderControl
        label="Radio de la esfera"
        value={radius}
        min={0.5}
        max={4}
        step={0.1}
        unit=" m"
        onChange={setRadius}
        color="#10b981"
      />
      <SliderControl
        label="Carga encerrada q"
        value={charge}
        min={-10}
        max={10}
        step={0.5}
        unit=" nC"
        onChange={setCharge}
        color={accentColor}
        formatValue={(v) => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
      />

      <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed mt-2"
        style={{ backgroundColor: '#0a101e', border: '1px solid #1e293b' }}>
        <span className="font-semibold text-slate-300">Observación clave: </span>
        Cambia el radio de la esfera y observa que el flujo NO cambia. Solo depende de la carga encerrada.
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Panel de info para Flujo
// ────────────────────────────────────────────────────────────
function FlujoInfoPanel({
  area,
  field,
  angle,
}: {
  area: number
  field: number
  angle: number
}) {
  const flux = useMemo(() => electricFlux(field, area, angle), [field, area, angle])
  const cosTheta = useMemo(() => Math.cos((angle * Math.PI) / 180), [angle])

  return (
    <InfoPanel
      title="Flujo Eléctrico"
      concept="El flujo eléctrico mide cuántas líneas de campo atraviesan una superficie. Es máximo cuando el campo es perpendicular a la superficie (θ=0°) y cero cuando es paralelo (θ=90°)."
      color="#10b981"
    >
      <FormulaCard
        title="Flujo eléctrico"
        latex={`\\Phi_E = \\vec{E} \\cdot \\vec{A} = EA\\cos\\theta`}
        description="Φ en N·m²/C, E en N/C, A en m², θ entre E y la normal a la superficie."
        variables={[
          { symbol: 'E', description: 'Campo eléctrico', value: `${field} N/C` },
          { symbol: 'A', description: 'Área de la superficie', value: `${area.toFixed(1)} m²` },
          { symbol: '\\theta', description: 'Ángulo E con normal', value: `${angle}°` },
        ]}
        highlight
        color="#10b981"
      />

      <ValueDisplay label="Flujo Φ" value={flux} unit="N·m²/C" color="#10b981" />
      <ValueDisplay label="cos(θ)" value={cosTheta} color="#a78bfa" />
      <ValueDisplay label="E × A" value={field * area} unit="N·m²/C" color="#f59e0b" />

      <div className="mt-2 space-y-1.5">
        <p className="text-xs font-semibold text-slate-500">Casos especiales</p>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">θ = 0° (perpendicular)</span>
          <span className="text-emerald-400">Φ_máx = EA</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">θ = 90° (paralelo)</span>
          <span className="text-red-400">Φ = 0</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">θ = 45°</span>
          <span className="text-amber-400">Φ = EA/√2</span>
        </div>
      </div>
    </InfoPanel>
  )
}

// ────────────────────────────────────────────────────────────
// Panel de info para Superficie Gaussiana
// ────────────────────────────────────────────────────────────
function GaussInfoPanel({
  radius,
  charge,
}: {
  radius: number
  charge: number
}) {
  const flux = useMemo(() => gaussianFlux(charge), [charge])
  const fieldOnSurface = useMemo(() => {
    const EPSILON_0 = 8.854187817e-12
    const q_C = charge * 1e-9
    return q_C / (4 * Math.PI * EPSILON_0 * radius * radius)
  }, [charge, radius])

  return (
    <InfoPanel
      title="Ley de Gauss"
      concept="La Ley de Gauss establece que el flujo eléctrico total a través de cualquier superficie cerrada es igual a la carga encerrada dividida por ε₀. El resultado es independiente del tamaño o forma de la superficie."
      color="#10b981"
    >
      <FormulaCard
        title="Ley de Gauss"
        latex={`\\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{enc}}{\\varepsilon_0}`}
        description="Válida para cualquier superficie gaussiana cerrada. q_enc es la carga total dentro de la superficie."
        variables={[
          { symbol: 'q_{enc}', description: 'Carga encerrada', value: `${charge.toFixed(1)} nC` },
          { symbol: '\\varepsilon_0', description: 'Permitividad del vacío', value: '8.85×10⁻¹² C²/N·m²' },
        ]}
        highlight
        color="#10b981"
      />

      <FormulaCard
        title="Campo en la superficie (esfera)"
        latex={`E = \\frac{q_{enc}}{4\\pi\\varepsilon_0 r^2}`}
        description="El campo en la superficie de la esfera gaussiana de radio r."
        color="#a78bfa"
      />

      <ValueDisplay label="Flujo total Φ" value={flux} unit="N·m²/C" color="#10b981" />
      <ValueDisplay label="Radio de superficie" value={radius} unit="m" color="#60a5fa" />
      <ValueDisplay label="|E| en superficie" value={Math.abs(fieldOnSurface)} unit="N/C" color="#f59e0b" />

      <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed"
        style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
        <span className="font-semibold text-slate-300">Punto clave: </span>
        El flujo no cambia al cambiar el radio porque las líneas que salen de q deben cruzar la superficie sin importar su tamaño. Solo si cambias q cambia el flujo.
      </div>
    </InfoPanel>
  )
}

// ────────────────────────────────────────────────────────────
// Página principal de Ley de Gauss
// ────────────────────────────────────────────────────────────
export function LeyDeGauss() {
  const [activeScene, setActiveScene] = useState<SceneId>('flujo')

  // Estado Flujo
  const [area, setArea] = useState(4)
  const [field, setField] = useState(200)
  const [angle, setAngle] = useState(30)

  // Estado Gauss
  const [radius, setRadius] = useState(2)
  const [gaussCharge, setGaussCharge] = useState(5)

  return (
    <Layout
      showSidebar
      activeScene={activeScene}
      onSceneChange={(id) => setActiveScene(id as SceneId)}
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-emerald-900/30">
        {[
          { id: 'flujo', label: 'Flujo Eléctrico' },
          { id: 'superficie-gaussiana', label: 'Superficie Gaussiana' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveScene(tab.id as SceneId)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={
              activeScene === tab.id
                ? { color: '#10b981', backgroundColor: '#10b98115', fontWeight: 600 }
                : { color: '#475569' }
            }
          >
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
          <Wifi size={12} />
          <span>Φ calculado en tiempo real</span>
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
        {/* Controles */}
        <div
          className="w-64 shrink-0 border-r border-slate-800/60 p-4 overflow-y-auto"
          style={{ backgroundColor: '#0a101e' }}
        >
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Escena activa
            </p>
            <h2 className="text-base font-bold text-slate-200">
              {activeScene === 'flujo' ? 'Flujo Eléctrico' : 'Superficie Gaussiana'}
            </h2>
          </div>

          {activeScene === 'flujo' ? (
            <FlujoControles area={area} setArea={setArea} field={field} setField={setField} angle={angle} setAngle={setAngle} />
          ) : (
            <GaussControles radius={radius} setRadius={setRadius} charge={gaussCharge} setCharge={setGaussCharge} />
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
          {activeScene === 'flujo' ? (
            <div className="absolute inset-0">
              <FlujoElectricoScene area={area} fieldMagnitude={field} angleDeg={angle} />
            </div>
          ) : (
            <div className="absolute inset-0">
              <SuperficieGaussianaScene radius={radius} charge={gaussCharge} />
            </div>
          )}
        </div>

        {/* Info */}
        <div
          className="w-72 shrink-0 border-l border-slate-800/60 overflow-y-auto"
          style={{ backgroundColor: '#0a101e' }}
        >
          {activeScene === 'flujo' ? (
            <div className="h-full">
              <FlujoInfoPanel area={area} field={field} angle={angle} />
            </div>
          ) : (
            <div className="h-full">
              <GaussInfoPanel radius={radius} charge={gaussCharge} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
