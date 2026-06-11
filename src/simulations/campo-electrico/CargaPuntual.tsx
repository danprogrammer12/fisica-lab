import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line, Sphere } from '@react-three/drei'
import * as THREE from 'three'

const K = 8.99e9
const NUM_LINES = 16

interface CargaPuntualSceneProps {
  charge: number
  showFieldLines: boolean
  showVectors: boolean
}

// ── Líneas de campo radiales ───────────────────────────────────
function FieldLines({ charge, showFieldLines }: { charge: number; showFieldLines: boolean }) {
  if (!showFieldLines) return null
  const isPos = charge >= 0
  const color = isPos ? '#ef4444' : '#3b82f6'

  const lines = useMemo(() => {
    const result: THREE.Vector3[][] = []
    const innerR = 0.28, outerR = 4.5
    const steps = 20
    for (let i = 0; i < NUM_LINES; i++) {
      const phi   = (i / NUM_LINES) * Math.PI * 2
      const theta = Math.PI * (0.12 + 0.76 * (i % 4) / 3)  // vary elevation
      const pts: THREE.Vector3[] = []
      for (let s = 0; s <= steps; s++) {
        const r = innerR + (outerR - innerR) * (s / steps)
        const px = r * Math.sin(theta) * Math.cos(phi)
        const py = r * Math.cos(theta)
        const pz = r * Math.sin(theta) * Math.sin(phi)
        pts.push(new THREE.Vector3(px, py, pz))
      }
      result.push(isPos ? pts : pts.slice().reverse())
    }
    return result
  }, [isPos])

  return (
    <>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={color} lineWidth={1.4} transparent opacity={0.5} />
      ))}
    </>
  )
}

// ── Partículas animadas sobre líneas ───────────────────────────
function FieldParticles({ charge, show }: { charge: number; show: boolean }) {
  if (!show) return null
  const isPos = charge >= 0
  const color = isPos ? '#fbbf24' : '#93c5fd'
  const NUM_P = NUM_LINES * 2

  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const tRef = useRef(0)

  const lines = useMemo(() => {
    const result: THREE.Vector3[][] = []
    const innerR = 0.28, outerR = 4.5, steps = 60
    for (let i = 0; i < NUM_LINES; i++) {
      const phi   = (i / NUM_LINES) * Math.PI * 2
      const theta = Math.PI * (0.12 + 0.76 * (i % 4) / 3)
      const pts: THREE.Vector3[] = []
      for (let s = 0; s <= steps; s++) {
        const r = innerR + (outerR - innerR) * (s / steps)
        pts.push(new THREE.Vector3(
          r * Math.sin(theta) * Math.cos(phi),
          r * Math.cos(theta),
          r * Math.sin(theta) * Math.sin(phi),
        ))
      }
      result.push(isPos ? pts : pts.slice().reverse())
    }
    return result
  }, [isPos])

  const particles = useMemo(() =>
    Array.from({ length: NUM_P }, (_, i) => ({
      li: i % NUM_LINES,
      phase: (i < NUM_LINES ? i / NUM_LINES : (i - NUM_LINES) / NUM_LINES + 0.5),
    })), [])

  useFrame((_, delta) => {
    tRef.current += delta
    const t = tRef.current
    for (let i = 0; i < NUM_P; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const p = particles[i]
      const line = lines[p.li]
      const speed = 0.18
      const frac = ((p.phase + t * speed) % 1 + 1) % 1
      const idx  = Math.min(Math.floor(frac * line.length), line.length - 1)
      const pt   = line[idx]
      mesh.position.set(pt.x, pt.y, pt.z)
      const alpha = Math.sin(frac * Math.PI) * 0.9
        ; (mesh.material as THREE.MeshStandardMaterial).opacity = alpha
    }
  })

  return (
    <>
      {Array.from({ length: NUM_P }, (_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el }}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  )
}

// ── Vectores E en grilla 3D ────────────────────────────────────
function EFieldVectors({ charge, show }: { charge: number; show: boolean }) {
  const arrows = useMemo(() => {
    if (!show) return new THREE.Group()
    const group = new THREE.Group()
    const q_C = charge * 1e-9
    const sgn = charge >= 0 ? 1 : -1
    const color = new THREE.Color('#fbbf24')
    const GRID = 5, GR = 3.5, step = (GR * 2) / (GRID - 1)
    for (let ix = 0; ix < GRID; ix++) {
      for (let iy = 0; iy < GRID; iy++) {
        for (let iz = 0; iz < GRID; iz++) {
          const x = -GR + ix * step, y = -GR + iy * step, z = -GR + iz * step
          const r = Math.sqrt(x * x + y * y + z * z)
          if (r < 0.6 || r > GR * 1.1) continue
          const E = K * Math.abs(q_C) / (r * r)
          const dir = new THREE.Vector3(x, y, z).normalize().multiplyScalar(sgn)
          const len = Math.min(E * 2e-5, 0.7) * 0.5 + 0.2
          const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(x, y, z), len, color, len * 0.3, len * 0.12)
          const mat = arrow.line.material as THREE.LineBasicMaterial
          mat.opacity = Math.min(0.7, 1.2 / r); mat.transparent = true
          group.add(arrow)
        }
      }
    }
    return group
  }, [charge, show])

  useEffect(() => () => {
    arrows.children.forEach((c) => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return <primitive object={arrows} />
}

// ── Carga central pulsante ─────────────────────────────────────
function ChargeCore({ charge }: { charge: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const isPos = charge >= 0
  const color = isPos ? '#ef4444' : '#3b82f6'
  const emit  = isPos ? '#7f1d1d' : '#1e3a5f'

  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.5) * 0.07)
  })

  return (
    <group>
      {/* Glow esfera exterior */}
      <Sphere args={[0.35, 32, 32]}>
        <meshStandardMaterial color={color} transparent opacity={0.12} />
      </Sphere>
      <Sphere ref={meshRef} args={[0.22, 32, 32]}>
        <meshStandardMaterial color={color} emissive={emit} emissiveIntensity={1.2} roughness={0.1} metalness={0.2} />
      </Sphere>
      <Text position={[0, 0.42, 0]} fontSize={0.22} color={color} anchorX="center">
        {isPos ? '+q' : '−q'}
      </Text>
    </group>
  )
}

// ── Anillos de referencia ──────────────────────────────────────
function ReferenceRings({ charge }: { charge: number }) {
  const color = charge >= 0 ? '#ef444430' : '#3b82f630'
  return (
    <>
      {[1.5, 2.8, 4.2].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.01, r + 0.01, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  )
}

// ── Label valor E ──────────────────────────────────────────────
function InfoLabel({ charge }: { charge: number }) {
  const qAbs = Math.abs(charge) * 1e-9
  return (
    <Text position={[0, -3.2, 0]} fontSize={0.18} color="#64748b" anchorX="center">
      {`E(1m) = ${(K * qAbs).toFixed(0)} N/C   |   E(2m) = ${(K * qAbs / 4).toFixed(0)} N/C`}
    </Text>
  )
}

// ── Escena principal ───────────────────────────────────────────
export function CargaPuntualScene({ charge, showFieldLines, showVectors }: CargaPuntualSceneProps) {
  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 50, position: [6, 4, 6] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-4, -2, 4]} intensity={0.5} color={charge >= 0 ? '#ef4444' : '#3b82f6'} />

      <ChargeCore charge={charge} />
      <ReferenceRings charge={charge} />
      <FieldLines charge={charge} showFieldLines={showFieldLines} />
      <FieldParticles charge={charge} show={showFieldLines} />
      <EFieldVectors charge={charge} show={showVectors} />
      <InfoLabel charge={charge} />

      <OrbitControls enablePan enableZoom enableRotate minDistance={1.5} maxDistance={15} />
    </Canvas>
  )
}

export function fieldInfoAt(charge_nC: number, r_m: number) {
  return { magnitude: K * Math.abs(charge_nC * 1e-9) / (r_m * r_m), unit: 'N/C' }
}
