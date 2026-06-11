import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { EPSILON_0 } from '../../physics/constants'

interface CapacitorPlanoProps {
  area: number        // m²
  separation: number  // m
  kappa: number
  voltage: number     // V
}

// ── Placa conductora ───────────────────────────────────────────
function Plate({ x, isPositive, sideLen }: { x: number; isPositive: boolean; sideLen: number }) {
  const color = isPositive ? '#ef4444' : '#3b82f6'
  const emit  = isPositive ? '#7f1d1d' : '#1e3a5f'
  return (
    <group position={[x, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.06, sideLen, sideLen]} />
        <meshStandardMaterial color={color} emissive={emit} emissiveIntensity={0.6} metalness={0.4} roughness={0.3} />
      </mesh>
      <Text position={[isPositive ? 0.25 : -0.25, sideLen * 0.5 + 0.15, 0]} fontSize={0.22} color={color} anchorX="center">
        {isPositive ? '+' : '−'}
      </Text>
    </group>
  )
}

// ── Dieléctrico entre placas ───────────────────────────────────
function Dielectric({ x0, x1, sideLen, kappa }: { x0: number; x1: number; sideLen: number; kappa: number }) {
  if (kappa <= 1.05) return null
  const cx = (x0 + x1) / 2, w = Math.abs(x1 - x0)
  return (
    <mesh position={[cx, 0, 0]}>
      <boxGeometry args={[w, sideLen, sideLen]} />
      <meshStandardMaterial color="#8b5cf6" transparent opacity={0.10} />
    </mesh>
  )
}

// ── Moléculas dieléctricas polarizadas ─────────────────────────
function DielectricMolecules({ x0, x1, sideLen, kappa }: { x0: number; x1: number; sideLen: number; kappa: number }) {
  if (kappa <= 1.05) return null
  const cx = (x0 + x1) / 2, w = x1 - x0
  const molecules = useMemo(() => {
    const result: THREE.Vector3[] = []
    const rows = 3
    for (let iy = 0; iy < rows; iy++) {
      for (let iz = 0; iz < rows; iz++) {
        const y = (iy / (rows - 1) - 0.5) * sideLen * 0.65
        const z = (iz / (rows - 1) - 0.5) * sideLen * 0.65
        result.push(new THREE.Vector3(cx, y, z))
      }
    }
    return result
  }, [cx, sideLen])

  return (
    <>
      {molecules.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#8b5cf6" /></mesh>
          <mesh position={[w * 0.18, 0, 0]}><sphereGeometry args={[0.045, 8, 8]} /><meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={0.8} /></mesh>
          <mesh position={[-w * 0.18, 0, 0]}><sphereGeometry args={[0.045, 8, 8]} /><meshStandardMaterial color="#3b82f6" emissive="#1e3a5f" emissiveIntensity={0.8} /></mesh>
        </group>
      ))}
    </>
  )
}

// ── Flechas de campo E ─────────────────────────────────────────
function EFieldArrows({ x0, x1, sideLen, voltage, separation }: {
  x0: number; x1: number; sideLen: number; voltage: number; separation: number
}) {
  const E = voltage / separation
  const cx = (x0 + x1) / 2
  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const rows = 3
    const dir = new THREE.Vector3(-1, 0, 0)
    const color = new THREE.Color('#fbbf24')
    const len = Math.min(Math.abs(x1 - x0) * 0.55, 0.7)
    const alpha = Math.min(0.85, 0.2 + E * 0.0003)

    for (let iy = 0; iy < rows; iy++) {
      for (let iz = 0; iz < rows; iz++) {
        const y = (iy / (rows - 1) - 0.5) * sideLen * 0.5
        const z = (iz / (rows - 1) - 0.5) * sideLen * 0.5
        const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(cx + len * 0.3, y, z), len, color, len * 0.3, len * 0.12)
        const mat = arrow.line.material as THREE.LineBasicMaterial
        mat.opacity = alpha; mat.transparent = true
        const cmat = arrow.cone.material as THREE.MeshBasicMaterial
        cmat.opacity = alpha; cmat.transparent = true
        group.add(arrow)
      }
    }
    return group
  }, [x0, x1, sideLen, voltage, separation, cx, E])

  return <primitive object={arrows} />
}

// ── Partículas animadas entre placas ──────────────────────────
function ChargeParticles({ x0, x1, sideLen, voltage }: { x0: number; x1: number; sideLen: number; voltage: number }) {
  const NUM = 12
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const tRef = useRef(0)

  const particles = useMemo(() => {
    const rng = (n: number) => (((n * 7919) % 100) / 100 - 0.5)
    return Array.from({ length: NUM }, (_, i) => ({
      y: rng(i * 3) * sideLen * 0.6,
      z: rng(i * 7) * sideLen * 0.6,
      phase: i / NUM,
    }))
  }, [sideLen])

  useFrame((_, delta) => {
    tRef.current += delta * Math.max(0.5, voltage / 50)
    const t = tRef.current
    for (let i = 0; i < NUM; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const p = particles[i]
      const frac = ((p.phase + t * 0.15) % 1 + 1) % 1
      const x = x1 + frac * (x0 - x1)
      mesh.position.set(x, p.y, p.z)
        ; (mesh.material as THREE.MeshStandardMaterial).opacity = Math.sin(frac * Math.PI) * 0.85
    }
  })

  if (Math.abs(voltage) < 0.5) return null

  return (
    <>
      {particles.map((_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el }}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.2} transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  )
}

// ── Escena principal ───────────────────────────────────────────
export function CapacitorPlanoScene({ area, separation, kappa, voltage }: CapacitorPlanoProps) {
  const C      = (kappa * EPSILON_0 * area) / separation
  const E_field = voltage / separation
  const Q_pC   = C * voltage * 1e12
  const sideLen = Math.sqrt(area) * 3.5 + 0.5

  const sepVis = Math.max(0.8, Math.min(3.5, separation * 120))
  const x1 =  sepVis / 2
  const x0 = -sepVis / 2

  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 40, position: [0, sideLen * 0.8 + 2, sideLen * 1.5 + 4] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-4, 0, 3]} intensity={0.6} color="#f59e0b" />

      <Plate x={x1} isPositive={true}  sideLen={sideLen} />
      <Plate x={x0} isPositive={false} sideLen={sideLen} />
      <Dielectric x0={x0} x1={x1} sideLen={sideLen} kappa={kappa} />
      <DielectricMolecules x0={x0} x1={x1} sideLen={sideLen} kappa={kappa} />
      <EFieldArrows x0={x0} x1={x1} sideLen={sideLen} voltage={voltage} separation={separation} />
      <ChargeParticles x0={x0} x1={x1} sideLen={sideLen} voltage={voltage} />

      <Line
        points={[new THREE.Vector3(x0, -sideLen * 0.65, 0), new THREE.Vector3(x1, -sideLen * 0.65, 0)]}
        color="#334155" lineWidth={1}
      />
      <Text position={[0, -sideLen * 0.65 - 0.28, 0]} fontSize={0.18} color="#475569" anchorX="center">
        {`d = ${(separation * 100).toFixed(1)} cm`}
      </Text>

      <Text position={[0, sideLen * 0.65 + 0.3, 0]} fontSize={0.18} color="#f59e0b" anchorX="center">
        {`C = ${(C * 1e12).toFixed(2)} pF   |   E = ${E_field.toFixed(0)} V/m   |   Q = ${Q_pC.toFixed(1)} pC`}
      </Text>

      {kappa > 1.05 && (
        <Text position={[0, sideLen * 0.65 + 0.58, 0]} fontSize={0.16} color="#8b5cf6" anchorX="center">
          {`κ = ${kappa.toFixed(1)}  (dieléctrico polarizado)`}
        </Text>
      )}

      <OrbitControls enablePan enableZoom enableRotate minDistance={1.5} maxDistance={20} />
    </Canvas>
  )
}
