import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line, Text, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { MU_0 } from '../../physics/constants'

// B = μ₀ · n · I  donde  n = N / L
function calcB(N: number, L: number, I: number): number {
  const n = N / L
  return MU_0 * n * I
}

// ── Bobinas del solenoide ──────────────────────────────────────
function SolenoidCoils({
  N, L, radius, current,
}: { N: number; L: number; radius: number; current: number }) {
  const color = current >= 0 ? '#06b6d4' : '#f97316'
  const coils = useMemo(() => {
    const pts: [number, number, number][][] = []
    for (let k = 0; k < N; k++) {
      const z = -L / 2 + (k + 0.5) * (L / N)
      const ring: [number, number, number][] = []
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2
        ring.push([radius * Math.cos(angle), radius * Math.sin(angle), z])
      }
      pts.push(ring)
    }
    return pts
  }, [N, L, radius])

  return (
    <>
      {coils.map((pts, i) => (
        <Line key={i} points={pts} color={color} lineWidth={2} transparent opacity={0.85} />
      ))}
      {/* Eje central */}
      <Line
        points={[new THREE.Vector3(0, 0, -L / 2 - 0.3), new THREE.Vector3(0, 0, L / 2 + 0.3)]}
        color="#1e293b" lineWidth={1}
      />
    </>
  )
}

// ── Líneas de campo B ──────────────────────────────────────────
function BFieldLines({
  L, radius, current,
}: { L: number; radius: number; current: number }) {
  const dir = current >= 0 ? 1 : -1

  // Líneas interiores (paralelas al eje)
  const innerLines = useMemo(() => {
    const lines: [number, number, number][][] = []
    const rs = [0, radius * 0.35, radius * 0.65]
    const angles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3]
    for (const r of rs) {
      const pts: [number, number, number][] =
        r === 0
          ? [[0, 0, dir * (-L / 2 - 0.4)], [0, 0, dir * (L / 2 + 0.4)]]
          : angles.map((a) => [r * Math.cos(a), r * Math.sin(a), dir * (-L / 2 - 0.2)])
      if (r === 0) {
        lines.push(pts)
      } else {
        for (const a of angles) {
          lines.push([
            [r * Math.cos(a), r * Math.sin(a), dir * (-L / 2 - 0.15)],
            [r * Math.cos(a), r * Math.sin(a), dir * (L / 2 + 0.15)],
          ])
        }
      }
    }
    return lines
  }, [L, radius, dir])

  // Líneas exteriores (curvas de retorno)
  const outerLines = useMemo(() => {
    const lines: [number, number, number][][] = []
    const numOuter = 4
    for (let k = 0; k < numOuter; k++) {
      const angle = (k / numOuter) * Math.PI * 2
      const pts: [number, number, number][] = []
      const steps = 60
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI
        // Arco que sale del extremo, rodea por afuera y vuelve
        const rOuter = radius * 1.8 + Math.sin(t) * radius * 1.6
        const zPos = dir * Math.cos(t) * (L / 2 + 0.5)
        pts.push([
          rOuter * Math.cos(angle),
          rOuter * Math.sin(angle),
          zPos,
        ])
      }
      lines.push(pts)
    }
    return lines
  }, [L, radius, dir])

  return (
    <>
      {innerLines.map((pts, i) => (
        <Line key={`in-${i}`} points={pts} color="#34d399" lineWidth={1.5} transparent opacity={0.7} />
      ))}
      {outerLines.map((pts, i) => (
        <Line key={`out-${i}`} points={pts} color="#34d399" lineWidth={1} transparent opacity={0.3} dashed dashSize={0.15} gapSize={0.1} />
      ))}
    </>
  )
}

// ── Flechas de dirección dentro del solenoide ─────────────────
function BArrows({ L, current }: { L: number; current: number }) {
  const dir = current >= 0 ? 1 : -1
  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const positions = [-L * 0.35, 0, L * 0.35]
    for (const z of positions) {
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, dir),
        new THREE.Vector3(0, 0, z - dir * 0.2),
        0.4,
        new THREE.Color('#34d399'),
        0.12,
        0.06,
      )
      group.add(arrow)
    }
    return group
  }, [L, dir])

  useEffect(() => {
    return () => {
      arrows.children.forEach((c) => {
        const a = c as THREE.ArrowHelper
        a.line?.geometry?.dispose()
        a.cone?.geometry?.dispose()
      })
    }
  }, [arrows])

  return <primitive object={arrows} />
}

// ── Esfera pulsante en el centro ───────────────────────────────
function AxisGlow() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.08)
    }
  })
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={1} />
    </mesh>
  )
}

// ── Componente principal ───────────────────────────────────────
interface CampoSolenoidSceneProps {
  N: number       // número de espiras
  L: number       // longitud en metros
  radius: number  // radio en metros
  current: number // corriente en A
}

export function CampoSolenoidScene({ N, L, radius, current }: CampoSolenoidSceneProps) {
  const B = calcB(N, L, Math.abs(current))

  return (
    <Canvas
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [3, 2.5, 5] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-5, 0, 0]} intensity={0.6} color="#06b6d4" />
      <Environment preset="night" />

      <SolenoidCoils N={N} L={L} radius={radius} current={current} />
      <BFieldLines L={L} radius={radius} current={current} />
      <BArrows L={L} current={current} />
      <AxisGlow />

      {/* Label del campo */}
      <Text
        position={[radius + 0.8, 0, 0]}
        fontSize={0.22}
        color="#34d399"
        anchorX="left"
      >
        {`B = ${(B * 1000).toFixed(3)} mT`}
      </Text>

      {/* Etiquetas extremos */}
      <Text position={[0, radius + 0.4, L / 2 + 0.5]} fontSize={0.18} color="#06b6d4" anchorX="center">
        {current >= 0 ? 'N' : 'S'}
      </Text>
      <Text position={[0, radius + 0.4, -L / 2 - 0.5]} fontSize={0.18} color="#f97316" anchorX="center">
        {current >= 0 ? 'S' : 'N'}
      </Text>

      <OrbitControls makeDefault enablePan enableZoom enableRotate minDistance={2} maxDistance={20} target={[0, 0, 0]} />
    </Canvas>
  )
}

export { calcB }
