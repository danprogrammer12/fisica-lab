import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Line, Sphere, Text, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { generateFieldLines, electricField } from '../../physics/electrostatics'
import type { PointCharge } from '../../types/physics'

// ────────────────────────────────────────────────────────────
// Sub-componente: Una carga del dipolo
// ────────────────────────────────────────────────────────────
function DipoleCharge({
  position,
  isPositive,
}: {
  position: [number, number, number]
  isPositive: boolean
}) {
  const color = isPositive ? '#ef4444' : '#3b82f6'
  const emissive = isPositive ? '#7f1d1d' : '#1e3a5f'
  const label = isPositive ? '+q' : '−q'

  return (
    <group position={position}>
      <Sphere args={[0.2, 32, 32]}>
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.6} roughness={0.1} metalness={0.2} />
      </Sphere>
      {/* Halo */}
      <Sphere args={[0.25, 16, 16]}>
        <meshStandardMaterial color={color} transparent opacity={0.1} />
      </Sphere>
      {/* Label */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.14}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Sub-componente: Líneas de campo del dipolo
// ────────────────────────────────────────────────────────────
function DipoleFieldLines({ charges }: { charges: PointCharge[] }) {
  const lines = useMemo(() => generateFieldLines(charges, 24), [charges])

  return (
    <>
      {lines.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#34d399"
          lineWidth={1.2}
          transparent
          opacity={0.6}
        />
      ))}
    </>
  )
}

// ────────────────────────────────────────────────────────────
// Sub-componente: Vectores de campo en grilla 2D (plano XY)
// ────────────────────────────────────────────────────────────
function DipoleVectors({ charges }: { charges: PointCharge[] }) {
  const arrowGroup = useMemo(() => {
    const group = new THREE.Group()
    const range = 3.5
    const step = 1.0

    for (let x = -range; x <= range; x += step) {
      for (let y = -range; y <= range; y += step) {
        const pos = new THREE.Vector3(x, y, 0)
        const tooClose = charges.some((c) => pos.distanceTo(c.position) < 0.5)
        if (tooClose) continue

        const E = electricField(pos, charges)
        const mag = E.length()
        if (mag < 1e-2) continue

        const dir = E.clone().normalize()
        const len = Math.min(0.45, 0.08 + Math.log10(1 + mag * 1e-7) * 0.15)

        const arrow = new THREE.ArrowHelper(dir, pos, len, '#fbbf24', len * 0.3, len * 0.12)
        group.add(arrow)
      }
    }
    return group
  }, [charges])

  useEffect(() => {
    return () => {
      arrowGroup.children.forEach((child) => {
        const a = child as THREE.ArrowHelper
        a.line?.geometry?.dispose()
        a.cone?.geometry?.dispose()
      })
    }
  }, [arrowGroup])

  return <primitive object={arrowGroup} />
}

// ────────────────────────────────────────────────────────────
// Linea de separación entre cargas (eje del dipolo)
// ────────────────────────────────────────────────────────────
function DipoleAxis({ separation }: { separation: number }) {
  return (
    <Line
      points={[
        new THREE.Vector3(-separation / 2 - 0.5, 0, 0),
        new THREE.Vector3(separation / 2 + 0.5, 0, 0),
      ]}
      color="#1e293b"
      lineWidth={1}
      dashed
      dashSize={0.15}
      gapSize={0.1}
    />
  )
}


// ────────────────────────────────────────────────────────────
// Componente principal exportado
// ────────────────────────────────────────────────────────────
interface DipoloElectricoSceneProps {
  charge: number        // nC (magnitud)
  separation: number    // metros (distancia entre cargas)
  showFieldLines: boolean
  showVectors: boolean
}

export function DipoloElectricoScene({
  charge,
  separation,
  showFieldLines,
  showVectors,
}: DipoloElectricoSceneProps) {
  const halfD = separation / 2

  const charges: PointCharge[] = useMemo(
    () => [
      {
        id: 'pos',
        position: new THREE.Vector3(halfD, 0, 0),
        charge: Math.abs(charge),
      },
      {
        id: 'neg',
        position: new THREE.Vector3(-halfD, 0, 0),
        charge: -Math.abs(charge),
      },
    ],
    [charge, halfD],
  )

  return (
    <Canvas
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0, 9] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />

      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 5]} intensity={2} />
      <Environment preset="night" />

      {/* Cargas del dipolo */}
      <DipoleCharge position={[halfD, 0, 0]} isPositive />
      <DipoleCharge position={[-halfD, 0, 0]} isPositive={false} />

      {/* Eje del dipolo */}
      <DipoleAxis separation={separation} />

      {/* Visualizaciones */}
      {showFieldLines && <DipoleFieldLines charges={charges} />}
      {showVectors && <DipoleVectors charges={charges} />}

      <OrbitControls makeDefault enablePan enableZoom enableRotate minDistance={2} maxDistance={20} target={[0, 0, 0]} />
    </Canvas>
  )
}
