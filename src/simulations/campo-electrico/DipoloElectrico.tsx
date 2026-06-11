import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Sphere, Line } from '@react-three/drei'
import * as THREE from 'three'

const K_PHYS = 8.99e9

interface DipoloElectricoSceneProps {
  charge: number
  separation: number
  showFieldLines: boolean
  showVectors: boolean
  bothPositive?: boolean
}

interface Charge3D { x: number; y: number; q: number }

// Integración numérica de línea de campo en plano XY
function integrateLine(
  sx: number, sy: number,
  charges: Charge3D[],
  step: number, maxSteps: number, bound: number,
): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [new THREE.Vector3(sx, 0, sy)]
  let px = sx, py = sy
  for (let s = 0; s < maxSteps; s++) {
    let Ex = 0, Ey = 0, tooClose = false
    for (const c of charges) {
      const dx = px - c.x, dy = py - c.y
      const r2 = dx * dx + dy * dy, r = Math.sqrt(r2)
      if (r < 0.12) { tooClose = true; break }
      const f = K_PHYS * c.q / (r2 * r)
      Ex += f * dx; Ey += f * dy
    }
    if (tooClose || (px * px + py * py > bound * bound)) break
    const mag = Math.sqrt(Ex * Ex + Ey * Ey)
    if (mag < 1e-6) break
    px += (Ex / mag) * step; py += (Ey / mag) * step
    pts.push(new THREE.Vector3(px, 0, py))
  }
  return pts
}

// ── Líneas de campo ────────────────────────────────────────────
function DipoleFieldLines({
  charge, separation, bothPositive, show,
}: { charge: number; separation: number; bothPositive: boolean; show: boolean }) {
  if (!show) return null

  const color = bothPositive ? '#ef4444' : '#34d399'
  const halfD = separation / 2
  const qC    = Math.abs(charge) * 1e-9

  const lines = useMemo(() => {
    const charges: Charge3D[] = bothPositive
      ? [{ x: halfD, y: 0, q: qC }, { x: -halfD, y: 0, q: qC }]
      : [{ x: halfD, y: 0, q: qC }, { x: -halfD, y: 0, q: -qC }]
    const N = 16
    const startR = Math.min(0.20, halfD * 0.4)
    const result: THREE.Vector3[][] = []

    if (bothPositive) {
      for (const c of charges) {
        for (let i = 0; i < N / 2; i++) {
          const ang = (i / (N / 2)) * Math.PI * 2
          result.push(integrateLine(
            c.x + Math.cos(ang) * startR, c.y + Math.sin(ang) * startR,
            charges, 0.05, 600, separation * 2.5 + 2,
          ))
        }
      }
    } else {
      for (let i = 0; i < N; i++) {
        const ang = (i / N) * Math.PI * 2
        result.push(integrateLine(
          halfD + Math.cos(ang) * startR, Math.sin(ang) * startR,
          charges, 0.04, 1200, separation * 2.8 + 3,
        ))
      }
    }
    return result
  }, [charge, separation, bothPositive, halfD, qC])

  return (
    <>
      {lines.map((pts, i) =>
        pts.length > 1 ? (
          <Line key={i} points={pts} color={color} lineWidth={1.5} transparent opacity={0.55} />
        ) : null,
      )}
    </>
  )
}

// ── Partículas sobre líneas ────────────────────────────────────
function DipoleParticles({
  charge, separation, bothPositive, show,
}: { charge: number; separation: number; bothPositive: boolean; show: boolean }) {
  if (!show) return null
  const color = bothPositive ? '#fbbf24' : '#6ee7b7'
  const halfD = separation / 2
  const qC    = Math.abs(charge) * 1e-9

  const lines = useMemo(() => {
    const charges: Charge3D[] = bothPositive
      ? [{ x: halfD, y: 0, q: qC }, { x: -halfD, y: 0, q: qC }]
      : [{ x: halfD, y: 0, q: qC }, { x: -halfD, y: 0, q: -qC }]
    const N = 16, startR = Math.min(0.20, halfD * 0.4)
    const result: THREE.Vector3[][] = []
    if (bothPositive) {
      for (const c of charges) {
        for (let i = 0; i < N / 2; i++) {
          const ang = (i / (N / 2)) * Math.PI * 2
          result.push(integrateLine(c.x + Math.cos(ang) * startR, c.y + Math.sin(ang) * startR, charges, 0.06, 400, separation * 2.5 + 2))
        }
      }
    } else {
      for (let i = 0; i < N; i++) {
        const ang = (i / N) * Math.PI * 2
        result.push(integrateLine(halfD + Math.cos(ang) * startR, Math.sin(ang) * startR, charges, 0.05, 800, separation * 2.8 + 3))
      }
    }
    return result
  }, [charge, separation, bothPositive, halfD, qC])

  const N_LINES = lines.length
  const NUM_P   = N_LINES * 2
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const tRef = useRef(0)
  const particles = useMemo(() =>
    Array.from({ length: NUM_P }, (_, i) => ({
      li: i % N_LINES,
      phase: i < N_LINES ? i / N_LINES : (i - N_LINES) / N_LINES + 0.5,
    })), [N_LINES, NUM_P])

  useFrame((_, delta) => {
    tRef.current += delta
    for (let i = 0; i < NUM_P; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const p = particles[i]
      const line = lines[p.li]
      if (!line || line.length < 2) continue
      const frac = ((p.phase + tRef.current * 0.16) % 1 + 1) % 1
      const idx  = Math.min(Math.floor(frac * line.length), line.length - 1)
      const pt   = line[idx]
      mesh.position.set(pt.x, pt.y, pt.z)
        ; (mesh.material as THREE.MeshStandardMaterial).opacity = Math.sin(frac * Math.PI) * 0.9
    }
  })

  return (
    <>
      {Array.from({ length: NUM_P }, (_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el }}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  )
}

// ── Cargas ─────────────────────────────────────────────────────
function ChargeSphere({ x, isPositive }: { x: number; isPositive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const color   = isPositive ? '#ef4444' : '#3b82f6'
  const emit    = isPositive ? '#7f1d1d' : '#1e3a5f'
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.2 + x) * 0.06)
  })
  return (
    <group position={[x, 0, 0]}>
      <Sphere args={[0.28, 24, 24]}>
        <meshStandardMaterial color={color} transparent opacity={0.14} />
      </Sphere>
      <Sphere ref={meshRef} args={[0.18, 24, 24]}>
        <meshStandardMaterial color={color} emissive={emit} emissiveIntensity={1} roughness={0.1} />
      </Sphere>
      <Text position={[0, 0.38, 0]} fontSize={0.2} color={color} anchorX="center">
        {isPositive ? '+q' : '−q'}
      </Text>
    </group>
  )
}

// ── Vectores E en grilla ───────────────────────────────────────
function EVectors({ charge, separation, bothPositive, show }: {
  charge: number; separation: number; bothPositive: boolean; show: boolean
}) {
  const halfD = separation / 2
  const qC    = Math.abs(charge) * 1e-9

  const arrows = useMemo(() => {
    if (!show) return new THREE.Group()
    const group = new THREE.Group()
    const color = new THREE.Color('#fbbf24')
    const GRID = 5, GR = 3.2, step = (GR * 2) / (GRID - 1)

    for (let ix = 0; ix < GRID; ix++) {
      for (let iz = 0; iz < GRID; iz++) {
        const x = -GR + ix * step, z = -GR + iz * step, y = 0
        const charges: Charge3D[] = bothPositive
          ? [{ x: halfD, y: 0, q: qC }, { x: -halfD, y: 0, q: qC }]
          : [{ x: halfD, y: 0, q: qC }, { x: -halfD, y: 0, q: -qC }]
        let Ex = 0, Ez = 0
        for (const c of charges) {
          const dx = x - c.x, dz = z - c.y
          const r2 = dx * dx + dz * dz, r = Math.sqrt(r2)
          if (r < 0.4) { Ex = 0; Ez = 0; break }
          const f = K_PHYS * c.q / (r2 * r)
          Ex += f * dx; Ez += f * dz
        }
        const Emag = Math.sqrt(Ex * Ex + Ez * Ez)
        if (Emag < 1e2) continue
        const dir = new THREE.Vector3(Ex / Emag, 0, Ez / Emag)
        const len = 0.35
        const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(x, y, z), len, color, len * 0.35, len * 0.12)
        const mat = arrow.line.material as THREE.LineBasicMaterial
        mat.opacity = Math.min(0.6, 0.15 + Math.log10(Emag) * 0.04); mat.transparent = true
        group.add(arrow)
      }
    }
    return group
  }, [charge, separation, bothPositive, show, halfD, qC])

  useEffect(() => () => {
    arrows.children.forEach((c) => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return <primitive object={arrows} />
}

// ── Escena principal ───────────────────────────────────────────
export function DipoloElectricoScene({
  charge, separation, showFieldLines, showVectors, bothPositive = false,
}: DipoloElectricoSceneProps) {
  const halfD = separation / 2

  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 40, position: [0, 5, 8] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 5, 5]} intensity={1.5} />
      <pointLight position={[0, -3, -3]} intensity={0.4} color={bothPositive ? '#ef4444' : '#34d399'} />

      <ChargeSphere x={halfD} isPositive={true} />
      <ChargeSphere x={-halfD} isPositive={bothPositive} />

      {/* Eje del dipolo */}
      <Line
        points={[new THREE.Vector3(-halfD - 0.5, 0, 0), new THREE.Vector3(halfD + 0.5, 0, 0)]}
        color="#1e293b" lineWidth={1} dashed dashSize={0.2} gapSize={0.1}
      />

      <DipoleFieldLines charge={charge} separation={separation} bothPositive={bothPositive} show={showFieldLines} />
      <DipoleParticles  charge={charge} separation={separation} bothPositive={bothPositive} show={showFieldLines} />
      <EVectors charge={charge} separation={separation} bothPositive={bothPositive} show={showVectors} />

      <Text position={[0, -2.8, 0]} fontSize={0.18} color="#475569" anchorX="center">
        {bothPositive ? 'F = k·q²/d²  (repulsión)' : `p = q·d = ${(Math.abs(charge) * 1e-9 * separation).toExponential(2)} C·m`}
      </Text>

      <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={20} />
    </Canvas>
  )
}
