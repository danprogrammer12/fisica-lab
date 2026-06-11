import { useState, useEffect } from 'react'
import { BookOpen, Wifi } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { InfografiaPanel } from '../components/ui/InfografiaPanel'
import { SliderControl } from '../components/ui/SliderControl'
import { FormulaCard } from '../components/ui/FormulaCard'
import { InfoPanel, ValueDisplay } from '../components/ui/InfoPanel'
import { QuizEngine } from '../components/ui/QuizEngine'
import { CampoSolenoidScene, calcB } from '../simulations/magnetismo/CampoSolenoide'
import { FuerzaLorentzScene } from '../simulations/magnetismo/FuerzaLorentz'
import { ReglaManoDerechaScene, computeFResult } from '../simulations/magnetismo/ReglaManoDerecha'
import { BiotSavartScene, bCenter, bAxis } from '../simulations/magnetismo/BiotSavart'
import { useProgress } from '../hooks/useProgress'
import { QUIZZES } from '../data/quizzes'

type SceneId = 'solenoide' | 'lorentz' | 'mano-derecha' | 'biot-savart'

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

  // Controles Mano Derecha
  const [rmdV, setRmdV] = useState(0)
  const [rmdB, setRmdB] = useState(1)
  const [rmdQ, setRmdQ] = useState<1 | -1>(1)

  // Controles Biot-Savart
  const [bsI, setBsI] = useState(10)
  const [bsR, setBsR] = useState(0.5)
  const [bsShowDB, setBsShowDB] = useState(true)

  useEffect(() => { markVisited('magnetismo') }, [markVisited])

  const B_sol      = calcB(N, L, Math.abs(current))
  const electronMass = 9.109e-31
  const charge     = chargeSign * 1.602e-19

  const tabs: { id: SceneId; label: string }[] = [
    { id: 'solenoide',    label: 'Solenoide' },
    { id: 'lorentz',      label: 'Fuerza de Lorentz' },
    { id: 'mano-derecha', label: 'Regla Mano Derecha' },
    { id: 'biot-savart',  label: 'Ley de Biot-Savart' },
  ]

  // ── Controles por escena ──────────────────────────────────────
  const renderControls = () => {
    if (activeScene === 'solenoide') {
      return (
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
      )
    }

    if (activeScene === 'lorentz') {
      return (
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
      )
    }

    if (activeScene === 'biot-savart') {
      return (
        <div className="space-y-5">
          <SliderControl label="Corriente I" value={bsI} min={0.5} max={50} step={0.5} unit=" A"
            onChange={setBsI} color={ACCENT}
            formatValue={(v) => v.toFixed(1)} />
          <SliderControl label="Radio de espira R" value={bsR} min={0.1} max={1.5} step={0.05} unit=" m"
            onChange={setBsR} color="#f59e0b" />
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Mostrar contribuciones dB</p>
            <button
              onClick={() => setBsShowDB(v => !v)}
              className="w-full py-1.5 rounded-lg text-xs font-medium transition-all"
              style={bsShowDB
                ? { color: '#34d399', backgroundColor: '#34d39915', border: '1px solid #34d39950' }
                : { color: '#64748b', border: '1px solid #1e293b' }}
            >
              {bsShowDB ? 'dB visibles ✓' : 'Mostrar dB'}
            </button>
          </div>
          <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
            <p className="text-slate-400">B en el centro:</p>
            <p className="font-mono font-bold mt-1" style={{ color: ACCENT }}>
              {(bCenter(bsI, bsR) * 1e6).toFixed(2)} µT
            </p>
            <p className="text-slate-500 mt-1">B eje a z=R: {(bAxis(bsI, bsR, bsR) * 1e6).toFixed(2)} µT</p>
          </div>
        </div>
      )
    }

    // mano-derecha
    const res = computeFResult(rmdV, rmdB, rmdQ)
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Dirección de v</p>
          <div className="flex gap-2">
            {(['+X', '+Y', '+Z'] as const).map((label, i) => (
              <button
                key={i}
                onClick={() => setRmdV(i)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={rmdV === i
                  ? { color: '#2de0a5', backgroundColor: '#2de0a515', border: '1px solid #2de0a550' }
                  : { color: '#64748b', border: '1px solid #1e293b' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Dirección de B</p>
          <div className="flex gap-2">
            {(['+X', '+Y', '+Z'] as const).map((label, i) => (
              <button
                key={i}
                onClick={() => setRmdB(i)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={rmdB === i
                  ? { color: '#f5c542', backgroundColor: '#f5c54215', border: '1px solid #f5c54250' }
                  : { color: '#64748b', border: '1px solid #1e293b' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Signo de la carga</p>
          <div className="flex gap-2">
            {([1, -1] as const).map((s) => (
              <button
                key={s}
                onClick={() => setRmdQ(s)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={rmdQ === s
                  ? { color: s > 0 ? '#3b9eff' : '#ff4d6d', backgroundColor: s > 0 ? '#3b9eff15' : '#ff4d6d15', border: `1px solid ${s > 0 ? '#3b9eff50' : '#ff4d6d50'}` }
                  : { color: '#64748b', border: '1px solid #1e293b' }}
              >
                {s > 0 ? '+q' : '−q'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: '#0f172a', border: `1px solid ${res.color}30` }}>
          <p className="text-slate-400 mb-1">Resultado F = q(v × B)</p>
          <p className="font-mono font-bold text-lg" style={{ color: res.color }}>{res.label}</p>
          <p className="text-slate-500 mt-1">{res.desc}</p>
        </div>

        <div className="p-3 rounded-lg text-xs text-slate-500" style={{ backgroundColor: '#0a101e', border: '1px solid #1e293b' }}>
          <span className="text-green-400 font-semibold">Verde</span> = v &nbsp;
          <span className="text-yellow-400 font-semibold">Amarillo</span> = B &nbsp;
          <span className="text-red-400 font-semibold">Rojo</span> = F
        </div>
      </div>
    )
  }

  // ── Panel de información por escena ──────────────────────────
  const renderInfo = () => {
    if (activeScene === 'solenoide') {
      return (
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
      )
    }

    if (activeScene === 'lorentz') {
      const qB  = Math.abs(charge) * B
      const r   = qB > 0 ? (electronMass * v0x) / qB : 0
      const T   = qB > 0 ? (2 * Math.PI * electronMass) / qB : 0
      const F_N = qB > 0 ? Math.abs(charge) * v0x * B : 0
      const KE  = 0.5 * electronMass * (v0x * v0x + v0z * v0z)
      const isHel = v0z > 1e-4
      return (
        <InfoPanel
          title="Fuerza de Lorentz"
          concept="Una partícula cargada que se mueve en un campo magnético experimenta una fuerza perpendicular a su velocidad. Esta fuerza no hace trabajo —la rapidez es constante— pero curva la trayectoria en una circunferencia perfecta (o hélice si hay componente paralela a B)."
          color={ACCENT}
        >
          {/* Fórmula principal */}
          <FormulaCard
            title="Fuerza de Lorentz magnética"
            latex={`\\vec{F} = q\\,\\vec{v} \\times \\vec{B}`}
            description="Producto vectorial: F siempre perpendicular a v y a B. Para carga negativa la dirección se invierte."
            highlight
            color={ACCENT}
          />
          <FormulaCard
            title="Magnitud de la fuerza"
            latex={`|F| = |q|\\,v_{\\perp}\\,B\\,\\sin\\theta`}
            description="θ = ángulo entre v y B. Máxima cuando v ⊥ B (θ=90°). Cero cuando v ∥ B (θ=0°)."
            color="#f59e0b"
          />

          {/* ¿Por qué órbita circular? */}
          <div className="p-3 rounded-lg text-xs leading-relaxed space-y-1"
            style={{ backgroundColor: '#0f172a', border: `1px solid ${ACCENT}30` }}>
            <p className="font-semibold text-slate-200 mb-1">¿Por qué la trayectoria es circular?</p>
            <p className="text-slate-400">
              La fuerza de Lorentz siempre apunta <span className="text-cyan-400 font-medium">hacia el centro</span> de la órbita
              (es centrípeta) y es perpendicular a v. Esto significa que <span className="text-emerald-400">no realiza trabajo</span>:
            </p>
            <p className="text-slate-500 font-mono text-center mt-1">W = F⃗ · d⃗s = 0  →  Ec = constante</p>
            <p className="text-slate-400 mt-1">
              Como |v| no cambia, el radio de curvatura tampoco cambia → <span className="text-amber-400">circunferencia perfecta</span>.
            </p>
          </div>

          {/* Radio y período */}
          <FormulaCard
            title="Radio ciclotrónico (de Larmor)"
            latex={`r = \\frac{m\\,v_{\\perp}}{|q|B}`}
            description="Mayor velocidad → órbita más grande. Mayor B → órbita más pequeña. r ∝ v⊥."
            color="#fbbf24"
          />
          <FormulaCard
            title="Período y frecuencia ciclotrón"
            latex={`T = \\frac{2\\pi m}{|q|B} \\qquad f_c = \\frac{|q|B}{2\\pi m}`}
            description="⚡ Isocronismo: T y f son independientes de v. Esta propiedad hace posible el ciclotrón."
            color="#a78bfa"
          />

          {/* Valores en tiempo real */}
          <ValueDisplay label="Radio r" value={(r * 1000).toFixed(2)} unit="mm" color={ACCENT} />
          <ValueDisplay label="Período T" value={T > 0 ? (T * 1e9).toFixed(1) : '—'} unit="ns" color="#a78bfa" />
          <ValueDisplay label="Frec. ciclotrón f" value={T > 0 ? (1/T/1e6).toFixed(1) : '—'} unit="MHz" color="#f59e0b" />
          <ValueDisplay label="|F| = |q|v⊥B" value={F_N.toExponential(2)} unit="N" color="#ef4444" />
          <ValueDisplay label="Ec = ½mv² (cte.)" value={KE.toExponential(2)} unit="J" color="#34d399" />

          {/* Régimen */}
          <div className="p-3 rounded-lg text-xs leading-relaxed"
            style={{ backgroundColor: '#0f172a', border: `1px solid ${isHel ? '#a78bfa30' : '#fbbf2430'}` }}>
            <p className="font-semibold mb-1" style={{ color: isHel ? '#a78bfa' : '#fbbf24' }}>
              {isHel ? '⟳ Régimen: HELICOIDAL' : '⟳ Régimen: CIRCULAR'}
            </p>
            {isHel ? (
              <>
                <p className="text-slate-400">v tiene componente paralela a B (v∥ ≠ 0).</p>
                <p className="text-slate-400 mt-1">La partícula describe una <span className="text-purple-400">hélice</span>: circula en XY mientras avanza en Z.</p>
                <p className="text-slate-500 mt-1 font-mono">Paso: p = v∥ · T = v∥ · 2πm/|q|B</p>
              </>
            ) : (
              <>
                <p className="text-slate-400">v⊥ al campo B → circunferencia en plano XY.</p>
                <p className="text-slate-400 mt-1">Aumenta v∥ en los controles para ver la hélice.</p>
              </>
            )}
          </div>

          {/* Aplicaciones */}
          <div className="p-3 rounded-lg text-xs leading-relaxed space-y-1.5"
            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
            <p className="font-semibold text-slate-300 mb-1">Aplicaciones reales</p>
            <p className="text-slate-400"><span className="text-cyan-400 font-medium">Ciclotrón</span> — acelerador de partículas: usa el isocronismo (T = cte.) para sincronizar el campo eléctrico acelerador con la órbita.</p>
            <p className="text-slate-400"><span className="text-cyan-400 font-medium">Espectrómetro de masas</span> — r = mv/|q|B: midiendo r con velocidad y B conocidos se calcula la masa m de iones.</p>
            <p className="text-slate-400"><span className="text-cyan-400 font-medium">Auroras polares</span> — partículas del viento solar atrapadas por B terrestre describen hélices a lo largo de las líneas de campo hasta los polos.</p>
            <p className="text-slate-400"><span className="text-cyan-400 font-medium">Tokamak</span> — confinamiento de plasma de fusión: B intenso obliga al plasma a describir órbitas que lo mantienen alejado de las paredes.</p>
            <p className="text-slate-400"><span className="text-cyan-400 font-medium">Tubo de rayos catódicos</span> — deflexión de electrones con B para generar imágenes (TV antigua, osciloscopio analógico).</p>
          </div>

          {/* Guía del modelo */}
          <div className="p-3 rounded-lg text-xs leading-relaxed space-y-1"
            style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
            <p className="font-semibold text-slate-300 mb-1">Guía del modelo 3D</p>
            <p><span className="text-cyan-400">║</span> Líneas cyan verticales — campo B en dirección Z</p>
            <p><span className="text-emerald-400">→</span> Flecha verde — vector velocidad v⃗ (tangente)</p>
            <p><span className="text-red-400">→</span> Flecha roja — fuerza de Lorentz F⃗ (centrípeta)</p>
            <p><span className="text-amber-400">- -</span> Círculo amarillo — radio ciclotrónico r</p>
            <p><span className="text-cyan-400">~~~</span> Trail cyan — trayectoria reciente</p>
            <p className="text-slate-500 mt-1">Rota la escena para ver que F⃗ siempre apunta al centro.</p>
          </div>
        </InfoPanel>
      )
    }

    if (activeScene === 'biot-savart') {
      return (
        <InfoPanel
          title="Ley de Biot-Savart"
          concept="Cada segmento de un conductor con corriente produce un campo magnético dB en los puntos del espacio. La ley de Biot-Savart integra todas esas contribuciones: B = (μ₀/4π) ∫ I dl×r̂/r²."
          color={ACCENT}
        >
          <FormulaCard
            title="Ley de Biot-Savart"
            latex={`d\\vec{B} = \\frac{\\mu_0 I}{4\\pi}\\frac{d\\vec{l}\\times\\hat{r}}{r^2}`}
            description="Cada elemento dl de la espira contribuye dB perpendicular al plano dl-r."
            highlight
            color={ACCENT}
          />
          <FormulaCard
            title="Campo en el centro de la espira"
            latex={`B_{centro} = \\frac{\\mu_0 I}{2R}`}
            description="Suma de todos los dB apuntan en la misma dirección (eje)."
            color="#f59e0b"
          />
          <FormulaCard
            title="Campo sobre el eje a distancia z"
            latex={`B_{eje} = \\frac{\\mu_0 I R^2}{2(R^2+z^2)^{3/2}}`}
            description="Cae más rápido que 1/r al alejarse del centro."
            color="#a78bfa"
          />
          <ValueDisplay label="B centro" value={(bCenter(bsI, bsR) * 1e6).toFixed(3)} unit="µT" color={ACCENT} />
          <ValueDisplay label="B eje z=R" value={(bAxis(bsI, bsR, bsR) * 1e6).toFixed(3)} unit="µT" color="#f59e0b" />
          <ValueDisplay label="B eje z=2R" value={(bAxis(bsI, bsR, 2 * bsR) * 1e6).toFixed(3)} unit="µT" color="#a78bfa" />
          <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
            <p className="font-semibold text-slate-300 mb-1">Guía del modelo 3D</p>
            <p><span className="text-yellow-400">■</span> Anillo amarillo — espira con corriente I</p>
            <p><span className="text-green-400">■</span> Flechas verdes — contribución dB de cada segmento dl</p>
            <p><span className="text-cyan-400">■</span> Flechas cyan — campo B resultante en el espacio</p>
            <p className="mt-2">El campo es máximo en el centro y decrece a lo largo del eje z.</p>
          </div>
        </InfoPanel>
      )
    }

    // mano-derecha
    return (
      <InfoPanel
        title="Regla de la Mano Derecha"
        concept="La fuerza magnética sobre una carga en movimiento es F = q(v × B). Su dirección se determina con la regla de la mano derecha: índice apunta en v, dedo medio en B, el pulgar da la dirección de v × B. Para carga negativa, la fuerza se invierte."
        color="#ff4d6d"
      >
        <FormulaCard
          title="Fuerza magnética"
          latex={`\\vec{F} = q(\\vec{v} \\times \\vec{B})`}
          description="Producto vectorial de v y B. Siempre perpendicular a ambos."
          highlight
          color="#ff4d6d"
        />
        <FormulaCard
          title="Magnitud de la fuerza"
          latex={`|F| = |q||v||B|\\sin\\theta`}
          description="θ es el ángulo entre v y B. Si v ∥ B entonces θ=0 y F=0."
          color="#f5c542"
        />
        <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed" style={{ backgroundColor: '#0f172a', border: '1px solid #ff4d6d30' }}>
          <p className="font-semibold text-slate-300 mb-2">Cómo usar la regla:</p>
          <p>1. Apunta el <strong className="text-green-400">índice → v</strong></p>
          <p>2. Dobla el <strong className="text-yellow-400">medio → B</strong></p>
          <p>3. El <strong className="text-red-400">pulgar → F</strong> (para +q)</p>
          <p className="mt-2 text-slate-500">Para carga negativa, invierte F.</p>
        </div>
        <div className="p-3 rounded-lg text-xs text-slate-400 leading-relaxed" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
          <span className="font-semibold text-slate-300">Casos clave: </span>
          Si v ∥ B (paralelos) → F = 0. Si v ⊥ B → F es máxima.
        </div>
      </InfoPanel>
    )
  }

  return (
    <Layout showSidebar activeScene={activeScene} onSceneChange={(id) => setActiveScene(id as SceneId)}>
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b" style={{ borderColor: `${ACCENT}20` }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveScene(tab.id)}
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
        <div className="ml-auto flex items-center gap-2">
          <InfografiaPanel src="/infografias/mano-derecha.png" title="Infografía — Regla de la Mano Derecha" accentColor={ACCENT} />
          <button
            onClick={() => setShowQuiz((v) => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
            style={showQuiz
              ? { color: ACCENT, backgroundColor: `${ACCENT}20` }
              : { color: '#64748b', backgroundColor: '#1e293b' }}
          >
            <BookOpen size={12} />Quiz
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Wifi size={12} /><span>Dinámico en tiempo real</span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
        {/* Controles */}
        <div className="w-64 shrink-0 border-r border-slate-800/60 p-4 overflow-y-auto" style={{ backgroundColor: '#0a101e' }}>
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Escena activa</p>
            <h2 className="text-base font-bold text-slate-200">
              {activeScene === 'solenoide' ? 'Campo del Solenoide'
                : activeScene === 'lorentz' ? 'Fuerza de Lorentz'
                : activeScene === 'biot-savart' ? 'Ley de Biot-Savart'
                : 'Regla de la Mano Derecha'}
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
          {activeScene === 'solenoide' && (
            <div className="absolute inset-0">
              <CampoSolenoidScene N={N} L={L} radius={radius} current={current} />
            </div>
          )}
          {activeScene === 'lorentz' && (
            <div className="absolute inset-0">
              <FuerzaLorentzScene B={B} charge={charge} mass={electronMass} v0x={v0x} v0z={v0z} />
            </div>
          )}
          {activeScene === 'mano-derecha' && (
            <div className="absolute inset-0">
              <ReglaManoDerechaScene vDirIdx={rmdV} bDirIdx={rmdB} chargeSign={rmdQ} />
            </div>
          )}
          {activeScene === 'biot-savart' && (
            <div className="absolute inset-0">
              <BiotSavartScene I={bsI} R={bsR} showDB={bsShowDB} />
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
          {renderInfo()}
        </div>
      </div>
    </Layout>
  )
}
