import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Text, Environment, Line } from '@react-three/drei'
import * as THREE from 'three'
import { gaussianFlux } from '../../physics/electrostatics'
import { sphericalPoints } from '../../physics/vectors'

// ────────────────────────────────────────────────────────────
// Sub-componente: Esfera gaussiana transparente (con rotación)
// ────────────────────────────────────────────────────────────
function GaussianSphere({ radius }: { radius: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15
    }
  })

  return (
    <group>
      {/* Superficie principal (wireframe) */}
      <Sphere args={[radius, 32, 32]}>
        <meshStandardMaterial
          color="#3b82f6"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          wireframe={false}
        />
      </Sphere>

      {/* Wireframe externo */}
      <Sphere ref={meshRef} args={[radius, 16, 16]}>
        <meshStandardMaterial
          color="#60a5fa"
          transparent
          opacity={0.15}
          wireframe
        />
      </Sphere>

      {/* Radio label */}
      <Line
        points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(radius, 0, 0)]}
        color="#64748b"
        lineWidth={1}
        dashed
        dashSize={0.1}
        gapSize={0.05}
      />
      <Text position={[radius / 2, 0.15, 0]} fontSize={0.18} color="#64748b">
        r
      </Text>
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Sub-componente: Carga puntual central
// ────────────────────────────────────────────────────────────
function CentralCharge({ charge }: { charge: number }) {
  const isPositive = charge >= 0
  const color = isPositive ? '#ef4444' : '#3b82f6'
  const emissive = isPositive ? '#7f1d1d' : '#1e3a5f'
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.05)
    }
  })

  return (
    <group>
      <Sphere ref={meshRef} args={[0.18, 32, 32]}>
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.3}
        />
      </Sphere>
      <Text position={[0, 0.35, 0]} fontSize={0.18} color={color} anchorX="center">
        q
      </Text>
    </group>
  )
}

// ────────────────────────────────────────────────────────────
// Sub-componente: Flechas en la superficie de la esfera
// ────────────────────────────────────────────────────────────
function SurfaceArrows({ radius, charge }: { radius: number; charge: number }) {
  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const points = sphericalPoints(36, radius)
    const isOutward = charge >= 0
    const color = isOutward ? '#f97316' : '#818cf8'
    const len = 0.5

    for (const pt of points) {
      const dir = isOutward
        ? pt.clone().normalize()
        : pt.clone().normalize().negate()
      const origin = isOutward
        ? pt.clone()
        : pt.clone().addScaledVector(dir, len)

      const arrow = new THREE.ArrowHelper(
        dir,
        origin,
        len,
        new THREE.Color(color),
        len * 0.3,
        len * 0.12,
      )
      group.add(arrow)
    }

    return group
  }, [radius, charge])

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
// Overlay de valor del flujo (como Text 3D en la escena)
// ────────────────────────────────────────────────────────────
function FluxLabel({
  radius,
  charge,
}: {
  radius: number
  charge: number
}) {
  const flux = gaussianFlux(charge)
  const fluxStr = flux.toExponential(2)

  return (
    <Text
      position={[0, -radius - 0.6, 0]}
      fontSize={0.22}
      color="#94a3b8"
      anchorX="center"
    >
      {`Φ = ${fluxStr} N·m²/C`}
    </Text>
  )
}


// ────────────────────────────────────────────────────────────
// Componente principal exportado
// ────────────────────────────────────────────────────────────
interface SuperficieGaussianaSceneProps {
  radius: number    // metros
  charge: number    // nC
}

export function SuperficieGaussianaScene({
  radius,
  charge,
}: SuperficieGaussianaSceneProps) {
  return (
    <Canvas
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [5, 3, 7] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />

      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-3, -3, 3]} intensity={0.6} color="#3b82f6" />
      <Environment preset="night" />

      {/* Superficie gaussiana */}
      <GaussianSphere radius={radius} />

      {/* Carga central */}
      <CentralCharge charge={charge} />

      {/* Flechas en la superficie */}
      <SurfaceArrows radius={radius} charge={charge} />

      {/* Label del flujo */}
      <FluxLabel radius={radius} charge={charge} />

      <OrbitControls enablePan enableZoom enableRotate minDistance={1.5} maxDistance={20} />
    </Canvas>
  )
}
