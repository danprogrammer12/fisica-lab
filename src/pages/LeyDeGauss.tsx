import { useState, useMemo } from 'react'
import { Wifi } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { InfografiaPanel } from '../components/ui/InfografiaPanel'
import { SliderControl } from '../components/ui/SliderControl'
import { FormulaCard } from '../components/ui/FormulaCard'
import { InfoPanel, ValueDisplay } from '../components/ui/InfoPanel'
import { FlujoElectricoScene } from '../simulations/ley-gauss/FlujoElectrico'
import { SuperficieGaussianaScene } from '../simulations/ley-gauss/SuperficieGaussiana'
import { GaussEsferaCargaScene } from '../simulations/ley-gauss/GaussEsferaCarga'
import { GaussCilindroScene } from '../simulations/ley-gauss/GaussCilindro'
import { electricFlux, gaussianFlux } from '../physics/electrostatics'

const EPSILON_0 = 8.854e-12
const K = 1 / (4 * Math.PI * EPSILON_0)
const ACCENT = '#10b981'

type SceneId = 'flujo' | 'superficie-gaussiana' | 'esfera-carga' | 'cilindro'

// ── Controles ─────────────────────────────────────────────────
function FlujoControles({ area, setArea, field, setField, angle, setAngle }: {
  area: number; setArea: (v: number) => void
  field: number; setField: (v: number) => void
  angle: number; setAngle: (v: number) => void
}) {
  return (
    <div className="space-y-5">
      <SliderControl label="Área del plano" value={area} min={0.5} max={9} step={0.5} unit=" m²" onChange={setArea} color={ACCENT} />
      <SliderControl label="Campo eléctrico E" value={field} min={10} max={500} step={10} unit=" N/C" onChange={setField} color="#f59e0b" />
      <SliderControl label="Ángulo θ (E con normal)" value={angle} min={0} max={90} step={1} unit="°"
        onChange={setAngle} color="#a78bfa" formatValue={(v) => `${v.toFixed(0)}°`} />
    </div>
  )
}

// ── Info panels ────────────────────────────────────────────────
function FlujoInfoPanel({ area, field, angle }: { area: number; field: number; angle: number }) {
  const flux     = useMemo(() => electricFlux(field, area, angle), [field, area, angle])
  const cosTheta = useMemo(() => Math.cos((angle * Math.PI) / 180), [angle])
  return (
    <InfoPanel title="Flujo Eléctrico"
      concept="El flujo eléctrico mide cuántas líneas de campo atraviesan una superficie. Es máximo cuando el campo es perpendicular (θ=0°) y cero cuando es paralelo (θ=90°)."
      color={ACCENT}>
      <FormulaCard title="Flujo eléctrico"
        latex={`\\Phi_E = \\vec{E}\\cdot\\vec{A} = EA\\cos\\theta`}
        description="Φ en N·m²/C. θ entre E y la normal a la superficie."
        variables={[
          { symbol: 'E', description: 'Campo eléctrico', value: `${field} N/C` },
          { symbol: 'A', description: 'Área de la superficie', value: `${area.toFixed(1)} m²` },
          { symbol: '\\theta', description: 'Ángulo E con normal', value: `${angle}°` },
        ]}
        highlight color={ACCENT}
      />
      <ValueDisplay label="Flujo Φ" value={flux} unit="N·m²/C" color={ACCENT} />
      <ValueDisplay label="cos(θ)" value={cosTheta} color="#a78bfa" />
      <ValueDisplay label="E × A" value={field * area} unit="N·m²/C" color="#f59e0b" />
      <div className="mt-2 space-y-1.5">
        <p className="text-xs font-semibold text-slate-500">Casos especiales</p>
        <div className="flex justify-between text-xs"><span className="text-slate-500">θ = 0° (perp.)</span><span className="text-emerald-400">Φ_máx = EA</span></div>
        <div className="flex justify-between text-xs"><span className="text-slate-500">θ = 90° (par.)</span><span className="text-red-400">Φ = 0</span></div>
        <div className="flex justify-between text-xs"><span className="text-slate-500">θ = 45°</span><span className="text-amber-400">Φ = EA/√2</span></div>
      </div>
      <div className="p-3 rounded-lg text-xs text-slate-400 mt-2" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
        <p className="font-semibold text-slate-300 mb-1">Guía del modelo 3D</p>
        <p><span style={{ color: '#f59e0b' }}>■</span> Flechas amarillas — campo E uniforme</p>
        <p><span style={{ color: ACCENT }}>■</span> Plano verde — superficie a estudiar</p>
        <p><span style={{ color: '#a78bfa' }}>■</span> Arco — ángulo θ entre E y normal</p>
      </div>
    </InfoPanel>
  )
}

function GaussInfoPanel({ radius, charge }: { radius: number; charge: number }) {
  const flux           = useMemo(() => gaussianFlux(charge), [charge])
  const fieldOnSurface = useMemo(() => {
    const q_C = charge * 1e-9
    return q_C / (4 * Math.PI * EPSILON_0 * radius * radius)
  }, [charge, radius])
  return (
    <InfoPanel title="Ley de Gauss — Carga Puntual"
      concept="El flujo total a través de cualquier superficie cerrada es q_enc/ε₀. No depende del tamaño ni forma de la superficie."
      color={ACCENT}>
      <FormulaCard title="Ley de Gauss"
        latex={`\\oint \\vec{E}\\cdot d\\vec{A} = \\frac{q_{enc}}{\\varepsilon_0}`}
        description="Válida para cualquier superficie gaussiana cerrada."
        variables={[
          { symbol: 'q_{enc}', description: 'Carga encerrada', value: `${charge.toFixed(1)} nC` },
          { symbol: '\\varepsilon_0', description: 'Permitividad del vacío', value: '8.85×10⁻¹² C²/N·m²' },
        ]}
        highlight color={ACCENT}
      />
      <FormulaCard title="Campo en la superficie (esfera)"
        latex={`E = \\frac{q_{enc}}{4\\pi\\varepsilon_0 r^2}`}
        description="El campo en la superficie de la esfera gaussiana de radio r."
        color="#a78bfa"
      />
      <ValueDisplay label="Flujo total Φ" value={flux} unit="N·m²/C" color={ACCENT} />
      <ValueDisplay label="Radio de superficie" value={radius} unit="m" color="#60a5fa" />
      <ValueDisplay label="|E| en superficie" value={Math.abs(fieldOnSurface)} unit="N/C" color="#f59e0b" />
      <div className="p-3 rounded-lg text-xs text-slate-400" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
        <p className="font-semibold text-slate-300 mb-1">Guía del modelo 3D</p>
        <p><span style={{ color: '#ef4444' }}>■</span> Carga central q (pulsa)</p>
        <p><span style={{ color: ACCENT }}>■</span> Esfera gaussiana (respira)</p>
        <p><span style={{ color: '#fbbf24' }}>■</span> Flechas — campo radial E</p>
        <p className="mt-1">Cambia el radio → flujo constante.</p>
      </div>
    </InfoPanel>
  )
}

function EsferaInfoPanel({ R, Q, gaussR }: { R: number; Q: number; gaussR: number }) {
  const q_C    = Q * 1e-9
  const inside = gaussR < R
  const qEnc   = inside ? q_C * (gaussR / R) ** 3 : q_C
  const E      = K * qEnc / (gaussR * gaussR)
  const flux   = qEnc / EPSILON_0
  return (
    <InfoPanel title="Gauss — Esfera con Carga Distribuida"
      concept="Una esfera sólida con carga uniforme tiene un campo distinto dentro y fuera. Dentro E ∝ r (crece), fuera E ∝ 1/r² (decrece). La gráfica inferior de la escena muestra ambos tramos."
      color={ACCENT}>
      <FormulaCard title="Campo dentro (r < R)"
        latex={`E = \\frac{Qr}{4\\pi\\varepsilon_0 R^3} = \\frac{KQr}{R^3}`}
        description="q_enc = Q(r/R)³. El campo crece linealmente con r."
        highlight={gaussR < R} color="#a78bfa"
      />
      <FormulaCard title="Campo fuera (r > R)"
        latex={`E = \\frac{Q}{4\\pi\\varepsilon_0 r^2} = \\frac{KQ}{r^2}`}
        description="Como si toda la carga estuviera concentrada en el centro."
        highlight={gaussR >= R} color="#fbbf24"
      />
      <ValueDisplay label="Radio sup. gaussiana" value={gaussR} unit="m" color={gaussR < R ? '#a78bfa' : ACCENT} />
      <ValueDisplay label="q_enc" value={(qEnc * 1e9).toFixed(3)} unit="nC" color="#60a5fa" />
      <ValueDisplay label="|E| en r" value={Math.abs(E).toExponential(2)} unit="N/C" color="#f59e0b" />
      <ValueDisplay label="Φ = q_enc/ε₀" value={flux.toExponential(2)} unit="N·m²/C" color={ACCENT} />
      <div className="p-3 rounded-lg text-xs text-slate-400" style={{ backgroundColor: '#0f172a', border: `1px solid ${gaussR < R ? '#a78bfa30' : '#10b98130'}` }}>
        <p className="font-semibold text-slate-300 mb-1">Guía del modelo 3D</p>
        <p><span style={{ color: '#ef4444' }}>■</span> Esfera roja/azul — distribución de carga Q</p>
        <p><span style={{ color: '#a78bfa' }}>■</span> Sup. gaussiana morada (r {'<'} R)</p>
        <p><span style={{ color: ACCENT }}>■</span> Sup. gaussiana verde (r {'>'} R)</p>
        <p><span style={{ color: '#fbbf24' }}>■</span> Flechas — vectores E en la superficie</p>
        <p>Gráfica inferior: perfil E(r) con transición en r = R.</p>
      </div>
    </InfoPanel>
  )
}

function CilindroInfoPanel({ lambda, gaussR, gaussL }: { lambda: number; gaussR: number; gaussL: number }) {
  const lambda_C = lambda * 1e-9
  const E        = Math.abs(lambda_C) / (2 * Math.PI * EPSILON_0 * gaussR)
  const qEnc     = lambda_C * gaussL
  const flux     = qEnc / EPSILON_0
  return (
    <InfoPanel title="Gauss — Conductor Cilíndrico"
      concept="Un alambre infinito con densidad lineal λ genera un campo que decrece como 1/r. La superficie gaussiana natural es un cilindro coaxial. A diferencia de la carga puntual (1/r²), aquí es 1/r."
      color={ACCENT}>
      <FormulaCard title="Campo del alambre infinito"
        latex={`E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}`}
        description="λ = carga por unidad de longitud (C/m). Campo perpendicular al eje, decrece como 1/r."
        variables={[
          { symbol: '\\lambda', description: 'Densidad lineal', value: `${lambda.toFixed(1)} nC/m` },
          { symbol: 'r', description: 'Distancia al eje', value: `${gaussR.toFixed(1)} m` },
        ]}
        highlight color={ACCENT}
      />
      <FormulaCard title="Flujo a través del cilindro"
        latex={`\\Phi = E \\cdot 2\\pi r L = \\frac{\\lambda L}{\\varepsilon_0}`}
        description="Solo la cara lateral contribuye (tapas paralelas al campo → flujo cero)."
        color="#f59e0b"
      />
      <ValueDisplay label="|E| a r" value={E.toExponential(2)} unit="N/C" color={ACCENT} />
      <ValueDisplay label="q_enc = λL" value={(qEnc * 1e9).toFixed(2)} unit="nC" color="#60a5fa" />
      <ValueDisplay label="Φ = λL/ε₀" value={flux.toExponential(2)} unit="N·m²/C" color="#f59e0b" />
      <div className="p-3 rounded-lg text-xs text-slate-400" style={{ backgroundColor: '#0f172a', border: '1px solid #10b98130' }}>
        <p className="font-semibold text-slate-300 mb-1">Guía del modelo 3D</p>
        <p><span style={{ color: '#ef4444' }}>■</span> Alambre rojo/azul — conductor con λ</p>
        <p><span style={{ color: ACCENT }}>■</span> Cilindro verde — superficie gaussiana</p>
        <p><span style={{ color: '#fbbf24' }}>■</span> Flechas — campo E radial en la superficie</p>
        <p>Gráfica inferior: E(r) ∝ 1/r (hipérbola).</p>
      </div>
    </InfoPanel>
  )
}

// ── Página principal ───────────────────────────────────────────
export function LeyDeGauss() {
  const [activeScene, setActiveScene] = useState<SceneId>('flujo')

  // Flujo
  const [area, setArea]   = useState(4)
  const [field, setField] = useState(200)
  const [angle, setAngle] = useState(30)

  // Carga puntual / Superficie gaussiana
  const [radius, setRadius]         = useState(2)
  const [gaussCharge, setGaussCharge] = useState(5)
  const [showVolumeField, setShowVolumeField] = useState(false)

  // Esfera cargada
  const [esferaR, setEsferaR]       = useState(2)
  const [esferaQ, setEsferaQ]       = useState(8)
  const [esferaGaussR, setEsferaGaussR] = useState(2.5)

  // Cilindro
  const [cilLambda, setCilLambda]   = useState(5)
  const [cilGaussR, setCilGaussR]   = useState(1.5)
  const [cilGaussL, setCilGaussL]   = useState(3)

  const tabs: { id: SceneId; label: string }[] = [
    { id: 'flujo',               label: 'Flujo Eléctrico' },
    { id: 'superficie-gaussiana', label: 'Carga Puntual' },
    { id: 'esfera-carga',        label: 'Esfera con Carga' },
    { id: 'cilindro',            label: 'Cilindro Conductor' },
  ]

  const renderControls = () => {
    if (activeScene === 'flujo') {
      return <FlujoControles area={area} setArea={setArea} field={field} setField={setField} angle={angle} setAngle={setAngle} />
    }
    if (activeScene === 'superficie-gaussiana') {
      return (
        <>
          <div className="space-y-5">
            <SliderControl label="Radio de la esfera" value={radius} min={0.5} max={4} step={0.1} unit=" m" onChange={setRadius} color={ACCENT} />
            <SliderControl label="Carga encerrada q" value={gaussCharge} min={-10} max={10} step={0.5} unit=" nC"
              onChange={setGaussCharge} color={gaussCharge >= 0 ? '#ef4444' : '#3b82f6'}
              formatValue={(v) => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))} />
          </div>
          <div className="p-3 rounded-lg text-xs text-slate-400 mt-4" style={{ backgroundColor: '#0a101e', border: '1px solid #1e293b' }}>
            Cambia el radio → flujo NO cambia. Solo depende de q.
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <button onClick={() => setShowVolumeField(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all w-full"
              style={showVolumeField ? { color: '#3b82f6', borderColor: '#3b82f650', backgroundColor: '#3b82f615' } : { color: '#475569', borderColor: '#1e293b', backgroundColor: 'transparent' }}>
              {showVolumeField ? '👁' : '👁‍🗨'} Vectores E en el espacio
            </button>
          </div>
        </>
      )
    }
    if (activeScene === 'esfera-carga') {
      return (
        <div className="space-y-5">
          <SliderControl label="Radio esfera R" value={esferaR} min={0.5} max={3.5} step={0.1} unit=" m" onChange={setEsferaR} color="#a78bfa" />
          <SliderControl label="Carga total Q" value={esferaQ} min={-10} max={10} step={0.5} unit=" nC"
            onChange={setEsferaQ} color={esferaQ >= 0 ? '#ef4444' : '#3b82f6'}
            formatValue={(v) => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))} />
          <SliderControl label="Radio gaussiano r" value={esferaGaussR} min={0.1} max={6} step={0.1} unit=" m"
            onChange={setEsferaGaussR} color={esferaGaussR < esferaR ? '#a78bfa' : ACCENT} />
          <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: '#0f172a', border: `1px solid ${esferaGaussR < esferaR ? '#a78bfa30' : '#10b98130'}` }}>
            <p className="font-semibold" style={{ color: esferaGaussR < esferaR ? '#a78bfa' : ACCENT }}>
              {esferaGaussR < esferaR ? '▶ DENTRO de la esfera' : '▶ FUERA de la esfera'}
            </p>
            <p className="text-slate-500 mt-1">
              {esferaGaussR < esferaR ? `q_enc = Q(r/R)³ = ${(esferaQ * (esferaGaussR / esferaR) ** 3).toFixed(2)} nC` : `q_enc = Q = ${esferaQ} nC`}
            </p>
          </div>
        </div>
      )
    }
    // cilindro
    return (
      <div className="space-y-5">
        <SliderControl label="Densidad λ" value={cilLambda} min={-10} max={10} step={0.5} unit=" nC/m"
          onChange={setCilLambda} color={cilLambda >= 0 ? '#ef4444' : '#3b82f6'}
          formatValue={(v) => (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))} />
        <SliderControl label="Radio gaussiano r" value={cilGaussR} min={0.3} max={4} step={0.1} unit=" m" onChange={setCilGaussR} color={ACCENT} />
        <SliderControl label="Longitud L" value={cilGaussL} min={1} max={6} step={0.2} unit=" m" onChange={setCilGaussL} color="#f59e0b" />
        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
          <p className="text-slate-400">E a r = {cilGaussR.toFixed(1)} m:</p>
          <p className="font-mono font-bold mt-1" style={{ color: ACCENT }}>
            {(Math.abs(cilLambda * 1e-9) / (2 * Math.PI * EPSILON_0 * cilGaussR)).toExponential(2)} N/C
          </p>
        </div>
      </div>
    )
  }

  const renderInfo = () => {
    if (activeScene === 'flujo')               return <FlujoInfoPanel area={area} field={field} angle={angle} />
    if (activeScene === 'superficie-gaussiana') return <GaussInfoPanel radius={radius} charge={gaussCharge} />
    if (activeScene === 'esfera-carga')        return <EsferaInfoPanel R={esferaR} Q={esferaQ} gaussR={esferaGaussR} />
    return <CilindroInfoPanel lambda={cilLambda} gaussR={cilGaussR} gaussL={cilGaussL} />
  }

  return (
    <Layout showSidebar activeScene={activeScene} onSceneChange={(id) => setActiveScene(id as SceneId)}>
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-emerald-900/30">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveScene(tab.id)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={activeScene === tab.id ? { color: ACCENT, backgroundColor: `${ACCENT}15`, fontWeight: 600 } : { color: '#475569' }}>
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <InfografiaPanel src="/infografias/ley-gauss.png" title="Infografía — Ley de Gauss" accentColor={ACCENT} />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Wifi size={12} /><span>Φ calculado en tiempo real</span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
        {/* Controles */}
        <div className="w-64 shrink-0 border-r border-slate-800/60 p-4 overflow-y-auto" style={{ backgroundColor: '#0a101e' }}>
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Escena activa</p>
            <h2 className="text-base font-bold text-slate-200">
              {activeScene === 'flujo' ? 'Flujo Eléctrico'
                : activeScene === 'superficie-gaussiana' ? 'Carga Puntual'
                : activeScene === 'esfera-carga' ? 'Esfera con Carga'
                : 'Cilindro Conductor'}
            </h2>
          </div>
          {renderControls()}
          <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-1">
            <p className="text-xs font-medium text-slate-600">Controles 3D</p>
            <p className="text-xs text-slate-700">🖱️ Arrastrar → Rotar</p>
            <p className="text-xs text-slate-700">🖱️ Rueda → Zoom</p>
            <p className="text-xs text-slate-700">🖱️ Clic derecho → Paneo</p>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          {activeScene === 'flujo' && (
            <div className="absolute inset-0">
              <FlujoElectricoScene area={area} fieldMagnitude={field} angleDeg={angle} />
            </div>
          )}
          {activeScene === 'superficie-gaussiana' && (
            <div className="absolute inset-0">
              <SuperficieGaussianaScene radius={radius} charge={gaussCharge} showVolumeField={showVolumeField} />
            </div>
          )}
          {activeScene === 'esfera-carga' && (
            <div className="absolute inset-0">
              <GaussEsferaCargaScene R={esferaR} Q={esferaQ} gaussR={esferaGaussR} />
            </div>
          )}
          {activeScene === 'cilindro' && (
            <div className="absolute inset-0">
              <GaussCilindroScene lambda={cilLambda} gaussR={cilGaussR} gaussL={cilGaussL} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="w-72 shrink-0 border-l border-slate-800/60 overflow-y-auto" style={{ backgroundColor: '#0a101e' }}>
          {renderInfo()}
        </div>
      </div>
    </Layout>
  )
}
