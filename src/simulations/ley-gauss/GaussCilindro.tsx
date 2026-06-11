/**
 * Aplicación de Ley de Gauss — Conductor cilíndrico (alambre largo).
 * Superficie gaussiana cilíndrica. E = λ/(2πε₀r), decrece como 1/r.
 */
import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'

const EPSILON_0 = 8.854e-12
const K = 1 / (4 * Math.PI * EPSILON_0)

// ── Alambre (cilindro conductor) ──────────────────────────────
function Wire({ lambda }: { lambda: number }) {
  const isPos = lambda >= 0
  const color = isPos ? '#ef4444' : '#3b82f6'
  const emit  = isPos ? '#7f1d1d' : '#1e3a8a'
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(clock.elapsedTime * 2) * 0.3
    }
  })

  // Partículas de carga en el alambre
  const NUM_P  = 12
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const tRef   = useRef(0)
  useFrame((_, delta) => {
    tRef.current += delta * (lambda >= 0 ? 0.5 : -0.5)
    for (let i = 0; i < NUM_P; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const frac = ((i / NUM_P + tRef.current) % 1 + 1) % 1
      mesh.position.set(0, -3 + frac * 6, 0)
        ; (mesh.material as THREE.MeshStandardMaterial).opacity = Math.sin(frac * Math.PI) * 0.85
    }
  })

  return (
    <group>
      {/* Alambre */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.08, 0.08, 7, 16]} />
        <meshStandardMaterial color={color} emissive={emit} emissiveIntensity={0.5} roughness={0.2} />
      </mesh>
      {/* Cargas animadas */}
      {Array.from({ length: NUM_P }, (_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el }}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={isPos ? '#fca5a5' : '#93c5fd'} emissive={color}
            emissiveIntensity={1} transparent opacity={0.8} />
        </mesh>
      ))}
      <Text position={[0.5, 3.8, 0]} fontSize={0.22} color={color} anchorX="left">
        {`λ = ${lambda > 0 ? '+' : ''}${(lambda * 1e9).toFixed(1)} nC/m`}
      </Text>
    </group>
  )
}

// ── Superficie gaussiana cilíndrica ───────────────────────────
function GaussianCylinder({ r, L }: { r: number; L: number }) {
  const color    = '#10b981'
  const halfL    = L / 2
  const SEGS     = 60

  // Círculo superior, inferior y generatrices
  const topRing    = useMemo(() => Array.from({ length: SEGS + 1 }, (_, i) => {
    const a = (i / SEGS) * Math.PI * 2
    return new THREE.Vector3(r * Math.cos(a), halfL, r * Math.sin(a))
  }), [r, halfL])

  const botRing    = useMemo(() => topRing.map(p => new THREE.Vector3(p.x, -halfL, p.z)), [topRing, halfL])

  const vertLines  = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    return [
      new THREE.Vector3(r * Math.cos(a), halfL, r * Math.sin(a)),
      new THREE.Vector3(r * Math.cos(a), -halfL, r * Math.sin(a)),
    ]
  }), [r, halfL])

  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.07 + Math.sin(clock.elapsedTime * 1.8) * 0.03
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[r, r, L, 32, 1, true]} />
        <meshStandardMaterial color={color} transparent opacity={0.08}
          side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <Line points={topRing} color={color} lineWidth={1.5} transparent opacity={0.5} />
      <Line points={botRing} color={color} lineWidth={1.5} transparent opacity={0.5} />
      {vertLines.map((pts, i) => (
        <Line key={i} points={pts} color={color} lineWidth={0.8} transparent opacity={0.25} />
      ))}
      <Text position={[r + 0.25, 0, 0]} fontSize={0.18} color={color} anchorX="left">
        {`r = ${r.toFixed(1)} m`}
      </Text>
      <Text position={[r + 0.25, -0.35, 0]} fontSize={0.16} color="#64748b" anchorX="left">
        {`L = ${L.toFixed(1)} m`}
      </Text>
    </group>
  )
}

// ── Vectores E radiales en la superficie cilíndrica ──────────
function EFieldCylinder({ r, L, lambda }: { r: number; L: number; lambda: number }) {
  const isPos  = lambda >= 0
  const E      = Math.abs(lambda) / (2 * Math.PI * EPSILON_0 * r)
  const lenVis = Math.min(E * 2e8 + 0.2, 1.3)
  const color  = new THREE.Color(isPos ? '#fbbf24' : '#67e8f9')

  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const COLS = 8, ROWS = 5
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const a = (col / COLS) * Math.PI * 2
        const y = -L / 2 + (row + 0.5) * (L / ROWS)
        const nx = Math.cos(a), nz = Math.sin(a)
        const pos = new THREE.Vector3(r * nx, y, r * nz)
        const dir = new THREE.Vector3(nx * (isPos ? 1 : -1), 0, nz * (isPos ? 1 : -1))
        const arr = new THREE.ArrowHelper(dir, pos, lenVis, color, lenVis * 0.3, lenVis * 0.12)
          ; (arr.line.material as THREE.LineBasicMaterial).opacity = 0.6; (arr.line.material as THREE.LineBasicMaterial).transparent = true
          ; (arr.cone.material as THREE.MeshBasicMaterial).opacity = 0.6; (arr.cone.material as THREE.MeshBasicMaterial).transparent = true
        group.add(arr)
      }
    }
    return group
  }, [r, L, lambda, lenVis, isPos])

  useEffect(() => () => {
    arrows.children.forEach(c => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return <primitive object={arrows} />
}

// ── Gráfica E vs r (2D en escena 3D) ─────────────────────────
function EProfileCylinder({ lambda }: { lambda: number }) {
  const isPos = lambda >= 0
  const color = isPos ? '#fbbf24' : '#67e8f9'

  const pts = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 1; i <= 60; i++) {
      const r = 0.15 + i * 0.12
      const E = Math.abs(lambda) / (2 * Math.PI * EPSILON_0 * r)
      points.push(new THREE.Vector3(r, -4.8, E * 2e8 * (isPos ? 1 : -1)))
    }
    return points
  }, [lambda, isPos])

  const endX = 0.15 + 60 * 0.12

  return (
    <group>
      <Line points={[new THREE.Vector3(0, -4.8, 0), new THREE.Vector3(endX + 0.3, -4.8, 0)]}
        color="#475569" lineWidth={1} transparent opacity={0.45} />
      <Line points={[new THREE.Vector3(0, -4.8, 0), new THREE.Vector3(0, -4.8, 2.5)]}
        color="#475569" lineWidth={1} transparent opacity={0.45} />
      <Text position={[endX + 0.5, -4.8, 0]} fontSize={0.17} color="#475569">r</Text>
      <Text position={[0, -4.8, 2.7]} fontSize={0.17} color="#475569">E</Text>
      {pts.length > 1 && <Line points={pts} color={color} lineWidth={2} transparent opacity={0.75} />}
      <Text position={[2.5, -4.8, 1.5]} fontSize={0.16} color={color}>E ∝ 1/r</Text>
    </group>
  )
}

// ── HUD ───────────────────────────────────────────────────────
function CilindroHUD({ r, L, lambda }: { r: number; L: number; lambda: number }) {
  const E    = Math.abs(lambda) / (2 * Math.PI * EPSILON_0 * r)
  const qEnc = lambda * L
  const flux = qEnc / EPSILON_0

  return (
    <group position={[-7.5, 5, 0]}>
      <Text fontSize={0.20} color="#10b981" anchorX="left" position={[0, 0, 0]}>
        {'Gauss — Cilindro Conductor'}
      </Text>
      <Text fontSize={0.16} color="#94a3b8" anchorX="left" position={[0, -0.35, 0]}>
        {'E = λ / (2πε₀r)  →  E ∝ 1/r'}
      </Text>
      <Text fontSize={0.16} color="#f59e0b" anchorX="left" position={[0, -0.62, 0]}>
        {`|E| a r=${r.toFixed(1)}m = ${E.toExponential(2)} N/C`}
      </Text>
      <Text fontSize={0.16} color="#10b981" anchorX="left" position={[0, -0.89, 0]}>
        {`Φ = λL/ε₀ = ${flux.toExponential(2)} N·m²/C`}
      </Text>
      <Text fontSize={0.14} color="#64748b" anchorX="left" position={[0, -1.18, 0]}>
        {'— cilindro verde: sup. gaussiana'}
      </Text>
      <Text fontSize={0.14} color="#64748b" anchorX="left" position={[0, -1.38, 0]}>
        {'— gráfica inferior: E(r) ∝ 1/r'}
      </Text>
    </group>
  )
}

// ── Escena principal ───────────────────────────────────────────
interface GaussCilindroProps {
  lambda: number   // densidad lineal nC/m
  gaussR: number   // radio de la superficie gaussiana (m)
  gaussL: number   // longitud de la superficie gaussiana (m)
}

export function GaussCilindroScene({ lambda, gaussR, gaussL }: GaussCilindroProps) {
  const lambda_C = lambda * 1e-9  // nC/m → C/m
  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 60, position: [6, 3, 8] }}
      style={{ background: '#060d0f' }}
    >
      <color attach="background" args={['#060d0f']} />
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 6, 6]} intensity={1.5} />
      <pointLight position={[-4, 0, -4]} intensity={0.4} color="#10b981" />

      <Wire lambda={lambda_C} />
      <GaussianCylinder r={gaussR} L={gaussL} />
      <EFieldCylinder r={gaussR} L={gaussL} lambda={lambda_C} />
      <EProfileCylinder lambda={lambda_C} />
      <CilindroHUD r={gaussR} L={gaussL} lambda={lambda_C} />

      <OrbitControls enablePan enableZoom enableRotate minDistance={1.5} maxDistance={30} />
    </Canvas>
  )
}
