import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line, Sphere, Text, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { generateFieldLines, electricField, fieldMagnitudeAt } from '../../physics/electrostatics'
import type { PointCharge } from '../../types/physics'

// ────────────────────────────────────────────────────────────
// Sub-componente: Esfera que representa la carga
// ────────────────────────────────────────────────────────────
function ChargeGlobe({ charge }: { charge: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const isPositive = charge >= 0
  const color = isPositive ? '#ef4444' : '#3b82f6'
  const emissive = isPositive ? '#7f1d1d' : '#1e3a5f'

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4
    }
  })

  return (
    <group>
      {/* Esfera principal */}
      <Sphere ref={meshRef} args={[0.22, 32, 32]}>
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.3}
        />
      </Sphere>

      {/* Halo exterior */}
      <Sphere args={[0.26, 16, 16]}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.08}
          wireframe={false}
        />
      </Sphere>

      {/* Símbolo + o - */}
      <Text
        position={[0, 0, 0.27]}
        fontSize={0.18}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor={color}
      >
        {isPositive ? '+' : '−'}
      </Text>
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Sub-componente: Vectores de campo en una grilla
// ────────────────────────────────────────────────────────────
function FieldVectors({ charges }: { charges: PointCharge[] }) {
  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const range = 3
    const step = 1.2

    for (let x = -range; x <= range; x += step) {
      for (let y = -range; y <= range; y += step) {
        for (let z = -range; z <= range; z += step) {
          const pos = new THREE.Vector3(x, y, z)
          const dist = pos.length()
          if (dist < 0.5 || dist > range + 0.5) continue

          const E = electricField(pos, charges)
          const mag = E.length()
          if (mag < 1e-3) continue

          const dir = E.clone().normalize()
          const logLen = Math.min(0.5, 0.1 + Math.log10(1 + mag * 1e-6) * 0.2)

          const arrow = new THREE.ArrowHelper(
            dir,
            pos,
            logLen,
            new THREE.Color().setHSL(0.15 - Math.min(0.15, mag * 5e-8), 1, 0.6),
            logLen * 0.3,
            logLen * 0.12,
          )
          group.add(arrow)
        }
      }
    }

    return group
  }, [charges])

  useEffect(() => {
    return () => {
      arrows.children.forEach((child) => {
        const a = child as THREE.ArrowHelper
        a.line?.geometry?.dispose()
        a.cone?.geometry?.dispose()
      })
    }
  }, [arrows])

  return <primitive object={arrows} />
}

// ────────────────────────────────────────────────────────────
// Sub-componente: Líneas de campo
// ────────────────────────────────────────────────────────────
function FieldLines({
  charges,
  color,
}: {
  charges: PointCharge[]
  color: string
}) {
  const lines = useMemo(
    () => generateFieldLines(charges, 20),
    [charges],
  )

  return (
    <>
      {lines.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color={color}
          lineWidth={1.2}
          transparent
          opacity={0.65}
        />
      ))}
    </>
  )
}

// ────────────────────────────────────────────────────────────
// Sub-componente: Ejes de referencia
// ────────────────────────────────────────────────────────────
function Axes() {
  const size = 4
  return (
    <group>
      <Line points={[[-size, 0, 0], [size, 0, 0]]} color="#1e293b" lineWidth={0.5} />
      <Line points={[[0, -size, 0], [0, size, 0]]} color="#1e293b" lineWidth={0.5} />
      <Line points={[[0, 0, -size], [0, 0, size]]} color="#1e293b" lineWidth={0.5} />
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Sub-componente: Esfera de campo de fondo (efecto visual)
// ────────────────────────────────────────────────────────────
function BackgroundSphere() {
  return (
    <Sphere args={[8, 32, 32]}>
      <meshStandardMaterial
        color="#0a0f1e"
        side={THREE.BackSide}
        roughness={1}
      />
    </Sphere>
  )
}


// ────────────────────────────────────────────────────────────
// Componente principal exportado
// ────────────────────────────────────────────────────────────
interface CargaPuntualSceneProps {
  charge: number         // nC
  showFieldLines: boolean
  showVectors: boolean
}

export function CargaPuntualScene({
  charge,
  showFieldLines,
  showVectors,
}: CargaPuntualSceneProps) {
  const charges: PointCharge[] = useMemo(
    () => [
      {
        id: 'q1',
        position: new THREE.Vector3(0, 0, 0),
        charge,
      },
    ],
    [charge],
  )

  const fieldColor = charge >= 0 ? '#f97316' : '#818cf8'

  return (
    <Canvas
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0, 7] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <BackgroundSphere />

      {/* Iluminación */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.5} color="#3b82f6" />
      <Environment preset="night" />

      {/* Carga */}
      <ChargeGlobe charge={charge} />

      {/* Visualizaciones condicionales */}
      {showFieldLines && <FieldLines charges={charges} color={fieldColor} />}
      {showVectors && <FieldVectors charges={charges} />}

      {/* Ejes de referencia */}
      <Axes />

      {/* Controles de cámara */}
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        minDistance={1.5}
        maxDistance={15}
        autoRotate={false}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}

// ────────────────────────────────────────────────────────────
// Overlay de información de campo (renderizado fuera del Canvas)
// ────────────────────────────────────────────────────────────
export function fieldInfoAt(charge_nC: number, r_m: number) {
  return {
    magnitude: fieldMagnitudeAt(charge_nC, r_m),
    unit: 'N/C',
  }
}
