import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, Sphere, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { generateFieldLines } from '../../physics/electrostatics'
import type { PointCharge } from '../../types/physics'

function AutoCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.18
    camera.position.set(Math.sin(t) * 7.5, 2 + Math.sin(t * 0.4) * 1.2, Math.cos(t) * 7.5)
    camera.lookAt(0, 0, 0)
  })
  return null
}

function PulsingCharge({ charge }: { charge: number }) {
  const coreRef = useRef<THREE.Mesh>(null)
  const isPos = charge >= 0
  const color = isPos ? '#ef4444' : '#3b82f6'
  const emissive = isPos ? '#991b1b' : '#1e3a8a'

  useFrame(({ clock }) => {
    if (coreRef.current) {
      coreRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.8) * 0.1)
    }
  })

  return (
    <group>
      <Sphere ref={coreRef} args={[0.28, 48, 48]}>
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.2} roughness={0.05} metalness={0.5} />
      </Sphere>
      {[0.55, 1.0, 1.6].map((r, i) => (
        <Sphere key={i} args={[r, 24, 24]}>
          <meshBasicMaterial color={color} transparent opacity={0.025 - i * 0.006} side={THREE.BackSide} />
        </Sphere>
      ))}
    </group>
  )
}

function StarField() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(900)
    for (let i = 0; i < 900; i += 3) {
      pos[i]   = (Math.random() - 0.5) * 28
      pos[i+1] = (Math.random() - 0.5) * 28
      pos[i+2] = (Math.random() - 0.5) * 28
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  const ref = useRef<THREE.Points>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.02
  })

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#60a5fa" size={0.035} transparent opacity={0.45} sizeAttenuation />
    </points>
  )
}

function SpatialGrid() {
  const lines = useMemo(() => {
    const pts: [number, number, number][][] = []
    const size = 10
    const step = 2
    for (let i = -size; i <= size; i += step) {
      pts.push([[-size, -3.5, i], [size, -3.5, i]])
      pts.push([[i, -3.5, -size], [i, -3.5, size]])
    }
    return pts
  }, [])

  return (
    <>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color="#0f172a" lineWidth={0.5} transparent opacity={0.6} />
      ))}
    </>
  )
}

interface HeroSceneProps {
  charge?: number
  numLines?: number
}

export function HeroScene({ charge = 5, numLines = 22 }: HeroSceneProps) {
  const charges: PointCharge[] = useMemo(
    () => [{ id: 'q1', position: new THREE.Vector3(0, 0, 0), charge }],
    [charge],
  )
  const lines = useMemo(() => generateFieldLines(charges, numLines), [charges, numLines])
  const lineColor = charge >= 0 ? '#f97316' : '#818cf8'

  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 45, near: 0.1, far: 100, position: [7.5, 2, 0] }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 6, 5]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-6, -3, -4]} intensity={1} color="#3b82f6" />
      <pointLight position={[0, 0, 0]} intensity={0.6} color={charge >= 0 ? '#ef4444' : '#3b82f6'} />
      <Environment preset="night" />

      <AutoCamera />
      <StarField />
      <PulsingCharge charge={charge} />
      <SpatialGrid />

      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={lineColor} lineWidth={1.4} transparent opacity={0.65} />
      ))}
    </Canvas>
  )
}
