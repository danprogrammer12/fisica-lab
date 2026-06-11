import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'

// ────────────────────────────────────────────────────────────
// Utilidades
// ────────────────────────────────────────────────────────────
const DIRS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, 0, 1),
] as const

const DIR_LABELS  = ['+X', '+Y', '+Z']
const DIR_LABELS_NEG = ['−X', '−Y', '−Z']

function cross3(a: THREE.Vector3, b: THREE.Vector3) {
  return new THREE.Vector3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  )
}

// ────────────────────────────────────────────────────────────
// Flecha 3D estilizada
// ────────────────────────────────────────────────────────────
interface ArrowProps {
  dir: THREE.Vector3
  length?: number
  color: string
  label: string
  pulse?: boolean
  dim?: boolean
}

function Arrow3D({ dir, length = 3.2, color, label, pulse = false, dim = false }: ArrowProps) {
  const coneRef = useRef<THREE.Mesh>(null)
  const lineRef = useRef<THREE.LineSegments>(null)
  const normalized = dir.clone().normalize()
  const end      = normalized.clone().multiplyScalar(length)
  const coneBase = normalized.clone().multiplyScalar(length - 0.55)
  const labelPos = normalized.clone().multiplyScalar(length + 0.55)

  const up        = new THREE.Vector3(0, 1, 0)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    up,
    Math.abs(normalized.dot(up)) > 0.999
      ? new THREE.Vector3(1, 0, 0).applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.001)).add(up).normalize()
      : normalized,
  )
  const euler = new THREE.Euler().setFromQuaternion(quaternion)

  const op = dim ? 0.28 : 1.0

  useFrame(({ clock }) => {
    if (!pulse) return
    const s = 1 + Math.sin(clock.elapsedTime * 3.5) * 0.12
    coneRef.current?.scale.setScalar(s)
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial
      mat.opacity = 0.7 + Math.sin(clock.elapsedTime * 3.5) * 0.3
    }
  })

  return (
    <group>
      <Line
        points={[[0, 0, 0], [coneBase.x, coneBase.y, coneBase.z]]}
        color={color} lineWidth={3.5} transparent opacity={op * 0.9}
      />
      <mesh ref={coneRef} position={coneBase} rotation={euler}>
        <coneGeometry args={[0.12, 0.55, 10]} />
        <meshStandardMaterial color={color} transparent opacity={op} emissive={color} emissiveIntensity={pulse ? 0.6 : 0.2} />
      </mesh>
      <Text position={labelPos} fontSize={0.32} color={color} anchorX="center" anchorY="middle"
        outlineWidth={0.015} outlineColor="#050912">
        {label}
      </Text>
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Ejes de referencia
// ────────────────────────────────────────────────────────────
function ReferenceAxes() {
  const S = 5
  const axes = [
    { pts: [[-S, 0, 0], [S, 0, 0]] as [number,number,number][], color: '#3b9eff', lbl: 'x', pos: [S+0.4, 0, 0] },
    { pts: [[0, -S, 0], [0, S, 0]] as [number,number,number][], color: '#2de0a5', lbl: 'y', pos: [0, S+0.4, 0] },
    { pts: [[0, 0, -S], [0, 0, S]] as [number,number,number][], color: '#ff4d6d', lbl: 'z', pos: [0, 0, S+0.4] },
  ]
  return (
    <group>
      {axes.map(a => (
        <group key={a.lbl}>
          <Line points={a.pts} color={a.color} lineWidth={1} transparent opacity={0.30} />
          <Text position={a.pos as [number,number,number]} fontSize={0.22} color={a.color}>
            {a.lbl}
          </Text>
        </group>
      ))}
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Plano del producto vectorial (v × B)
// ────────────────────────────────────────────────────────────
function CrossPlane({ v, b }: { v: THREE.Vector3; b: THREE.Vector3}) {
  const normal = cross3(v, b)
  if (normal.length() < 0.01) return null
  const up = new THREE.Vector3(0, 1, 0)
  const q  = new THREE.Quaternion().setFromUnitVectors(up, normal.clone().normalize())
  const e  = new THREE.Euler().setFromQuaternion(q)
  return (
    <mesh rotation={e}>
      <planeGeometry args={[7, 7]} />
      <meshStandardMaterial color="#1e3a5f" transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ────────────────────────────────────────────────────────────
// Arco de ángulo entre v y B
// ────────────────────────────────────────────────────────────
function AngleArc({ v, b }: { v: THREE.Vector3; b: THREE.Vector3 }) {
  const angle = v.angleTo(b)
  if (angle < 0.05 || Math.PI - angle < 0.05) return null  // paralelos

  const pts = useMemo(() => {
    const axis = cross3(v.clone().normalize(), b.clone().normalize()).normalize()
    const start = v.clone().normalize().multiplyScalar(1.5)
    const segs  = 24
    return Array.from({ length: segs + 1 }, (_, i) => {
      const frac = i / segs
      const q    = new THREE.Quaternion().setFromAxisAngle(axis, angle * frac)
      return start.clone().applyQuaternion(q)
    })
  }, [v, b, angle])

  const deg = Math.round((angle * 180) / Math.PI)
  const mid = pts[Math.floor(pts.length / 2)]

  return (
    <group>
      <Line points={pts} color="#a78bfa" lineWidth={2} transparent opacity={0.6} />
      <Text position={mid.clone().multiplyScalar(1.35)} fontSize={0.2} color="#a78bfa" anchorX="center">
        {`${deg}°`}
      </Text>
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Partícula animada mostrando la deflexión
// ────────────────────────────────────────────────────────────
function DeflectedParticle({
  v, f, chargeSign,
}: { v: THREE.Vector3; f: THREE.Vector3; chargeSign: 1 | -1 }) {
  const meshRef  = useRef<THREE.Mesh>(null)
  const trailRef = useRef<THREE.Points | null>(null)
  const tRef = useRef(0)
  const hasForce = f.length() > 0.01
  const color    = chargeSign > 0 ? '#3b9eff' : '#ff4d6d'
  const emit     = chargeSign > 0 ? '#0a2040' : '#400010'

  const TRAIL   = 60
  const trailPos = useMemo(() => new Float32Array(TRAIL * 3), [])
  const trailGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
    return g
  }, [trailPos])

  // Pre-calcular trayectoria: si hay fuerza → curva; si no → línea recta
  const trajectory = useMemo(() => {
    const steps = 80, dt = 0.04
    const vN = v.clone().normalize()
    const fN = hasForce ? f.clone().normalize() : new THREE.Vector3()
    let pos = new THREE.Vector3(0, 0, 0)
    let vel = vN.clone()
    const pts: THREE.Vector3[] = [pos.clone()]

    for (let i = 0; i < steps; i++) {
      // Curvatura simple proporcional a F
      if (hasForce) vel.addScaledVector(fN, dt * 0.5).normalize()
      pos = pos.clone().addScaledVector(vel, dt * 2.5)
      if (pos.length() > 5) break
      pts.push(pos.clone())
    }
    return pts
  }, [v, f, hasForce])

  useFrame((_, delta) => {
    tRef.current = (tRef.current + delta * 0.55) % 1
    const t   = tRef.current
    const idx = Math.min(Math.floor(t * trajectory.length), trajectory.length - 1)
    const pt  = trajectory[idx]

    if (meshRef.current) meshRef.current.position.copy(pt)

    // Trail
    for (let i = TRAIL - 1; i > 0; i--) {
      trailPos[i * 3]     = trailPos[(i - 1) * 3]
      trailPos[i * 3 + 1] = trailPos[(i - 1) * 3 + 1]
      trailPos[i * 3 + 2] = trailPos[(i - 1) * 3 + 2]
    }
    trailPos[0] = pt.x; trailPos[1] = pt.y; trailPos[2] = pt.z
    trailGeo.attributes.position.needsUpdate = true
    trailGeo.setDrawRange(0, TRAIL)
  })

  return (
    <>
      {/* Trayectoria punteada */}
      {trajectory.length > 1 && (
        <Line
          points={trajectory} color={color}
          lineWidth={1.2} transparent opacity={0.25}
          dashed dashSize={0.12} gapSize={0.08}
        />
      )}
      {/* Trail animado */}
      <points ref={trailRef} geometry={trailGeo}>
        <pointsMaterial color={color} size={0.06} transparent opacity={0.55} sizeAttenuation />
      </points>
      {/* Partícula */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={color} emissive={emit} emissiveIntensity={0.8} roughness={0.1} />
      </mesh>
      {/* Etiqueta carga */}
      <Text position={[0, -0.55, 0]} fontSize={0.22} color={color} anchorX="center">
        {chargeSign > 0 ? '+q' : '−q'}
      </Text>
    </>
  )
}

// ────────────────────────────────────────────────────────────
// F = 0: indicador visual cuando v ∥ B
// ────────────────────────────────────────────────────────────
function ZeroForceIndicator({ v }: { v: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.z = clock.elapsedTime * 1.5
  })

  return (
    <group position={[0, -1.6, 0]}>
      <mesh ref={meshRef}>
        <torusGeometry args={[0.35, 0.04, 8, 32]} />
        <meshStandardMaterial color="#64748b" transparent opacity={0.5} />
      </mesh>
      <Line
        points={[
          new THREE.Vector3(-0.25, 0.25, 0),
          new THREE.Vector3(0.25, -0.25, 0),
        ]}
        color="#ef4444" lineWidth={3}
      />
      <Text position={[0, -0.65, 0]} fontSize={0.26} color="#64748b" anchorX="center">
        {'F = 0'}
      </Text>
      <Text position={[0, -0.95, 0]} fontSize={0.18} color="#475569" anchorX="center">
        {'v ∥ B → sin θ = 0'}
      </Text>
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Panel pedagógico "Cómo usar la regla"
// ────────────────────────────────────────────────────────────
function HandRuleGuide({ vLabel, bLabel, fLabel, hasForce, chargeSign }: {
  vLabel: string; bLabel: string; fLabel: string; hasForce: boolean; chargeSign: 1 | -1
}) {
  return (
    <group position={[5.2, 3.8, 0]}>
      <Text fontSize={0.22} color="#e2e8f0" anchorX="left" position={[0, 0, 0]}>
        {'F = q(v × B)'}
      </Text>
      {hasForce ? (
        <>
          <Text fontSize={0.17} color="#2de0a5" anchorX="left" position={[0, -0.38, 0]}>
            {`1. Índice → v  (${vLabel})`}
          </Text>
          <Text fontSize={0.17} color="#f5c542" anchorX="left" position={[0, -0.64, 0]}>
            {`2. Medio   → B  (${bLabel})`}
          </Text>
          <Text fontSize={0.17} color="#ff4d6d" anchorX="left" position={[0, -0.90, 0]}>
            {`3. Pulgar  → F  (${fLabel})`}
          </Text>
          {chargeSign < 0 && (
            <Text fontSize={0.17} color="#fb923c" anchorX="left" position={[0, -1.20, 0]}>
              {'⚠ Carga −q: invertir F'}
            </Text>
          )}
        </>
      ) : (
        <Text fontSize={0.17} color="#64748b" anchorX="left" position={[0, -0.38, 0]}>
          {'v ∥ B → sin(θ)=0 → F=0'}
        </Text>
      )}
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Escena principal
// ────────────────────────────────────────────────────────────
interface RMDSceneProps {
  vDirIdx: number
  bDirIdx: number
  chargeSign: 1 | -1
}

export function ReglaManoDerechaScene({ vDirIdx, bDirIdx, chargeSign }: RMDSceneProps) {
  const v = DIRS[vDirIdx]
  const b = DIRS[bDirIdx]

  const rawF   = useMemo(() => cross3(v, b).multiplyScalar(chargeSign), [v, b, chargeSign])
  const hasF   = rawF.length() > 0.01
  const fDir   = hasF ? rawF.clone().normalize() : new THREE.Vector3()

  // Determinar etiqueta de F
  const fLabel = useMemo(() => {
    if (!hasF) return 'cero'
    const axes = DIRS.map((d, i) => ({ d, i, dot: fDir.dot(d) }))
    const best = axes.reduce((a, b2) => Math.abs(b2.dot) > Math.abs(a.dot) ? b2 : a)
    return best.dot > 0 ? DIR_LABELS[best.i] : DIR_LABELS_NEG[best.i]
  }, [fDir, hasF])

  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 48, near: 0.1, far: 100, position: [6, 5, 9] }}
      style={{ background: '#080c12' }}
    >
      <color attach="background" args={['#080c12']} />
      <ambientLight intensity={0.4} />
      <pointLight position={[8, 8, 8]} intensity={1.5} />
      <pointLight position={[-5, 0, 5]} intensity={0.5} color="#a78bfa" />

      <ReferenceAxes />

      {/* Campo B — grid de flechas */}
      <BFieldBackground b={b} />

      {/* v — verde */}
      <Arrow3D dir={v} length={3.2} color="#2de0a5" label={`v (${DIR_LABELS[vDirIdx]})`} />

      {/* B — amarillo */}
      <Arrow3D dir={b} length={3.2} color="#f5c542" label={`B (${DIR_LABELS[bDirIdx]})`} />

      {/* F — rojo, con pulso si existe */}
      {hasF && (
        <Arrow3D dir={fDir} length={3.2} color="#ff4d6d" label={`F (${fLabel})`} pulse />
      )}

      {/* Plano v × B */}
      {hasF && <CrossPlane v={v} b={b} />}

      {/* Arco de ángulo */}
      <AngleArc v={v} b={b} />

      {/* Partícula animada con deflexión */}
      <DeflectedParticle v={v} f={rawF} chargeSign={chargeSign} />

      {/* Indicador F=0 cuando v ∥ B */}
      {!hasF && <ZeroForceIndicator v={v} />}

      {/* Panel pedagógico */}
      <HandRuleGuide
        vLabel={DIR_LABELS[vDirIdx]}
        bLabel={DIR_LABELS[bDirIdx]}
        fLabel={fLabel}
        hasForce={hasF}
        chargeSign={chargeSign}
      />

      <OrbitControls enablePan enableZoom enableRotate minDistance={3} maxDistance={28} />
    </Canvas>
  )
}

// ── Fondo de flechas B ────────────────────────────────────────
function BFieldBackground({ b }: { b: THREE.Vector3 }) {
  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const color = new THREE.Color('#f5c542')
    const GRID = 5, GR = 4.5, step = (GR * 2) / (GRID - 1)
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const x = -GR + i * step, y = -GR + j * step
        const len = 0.55
        const arr = new THREE.ArrowHelper(b.clone().normalize(), new THREE.Vector3(x, y, -1), len, color, len * 0.3, len * 0.12)
          ; (arr.line.material as THREE.LineBasicMaterial).opacity = 0.18; (arr.line.material as THREE.LineBasicMaterial).transparent = true
          ; (arr.cone.material as THREE.MeshBasicMaterial).opacity = 0.18; (arr.cone.material as THREE.MeshBasicMaterial).transparent = true
        group.add(arr)
      }
    }
    return group
  }, [b])

  useEffect(() => () => {
    arrows.children.forEach(c => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return <primitive object={arrows} />
}

// ────────────────────────────────────────────────────────────
// Helper export
// ────────────────────────────────────────────────────────────
export function computeFResult(vIdx: number, bIdx: number, sign: 1 | -1) {
  const v = DIRS[vIdx], b = DIRS[bIdx]
  const F = cross3(v, b).multiplyScalar(sign)
  const mag = F.length()
  if (mag < 0.01) return { label: 'CERO', desc: 'v ∥ B → sin θ = 0', color: '#64748b' }

  const axes = DIRS.map((d, i) => ({ d, i, dot: F.clone().normalize().dot(d) }))
  const best = axes.reduce((a, c) => Math.abs(c.dot) > Math.abs(a.dot) ? c : a)
  const name = best.dot > 0 ? DIR_LABELS[best.i] : DIR_LABELS_NEG[best.i]
  return {
    label: name,
    desc: `v×B = ${DIR_LABELS[vIdx]}×${DIR_LABELS[bIdx]}`,
    color: '#ff4d6d',
  }
}
