import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { K_COULOMB, NC_TO_C, MIN_DISTANCE } from '../../physics/constants'

// Mapa de color: azul (V<0) → negro (V≈0) → rojo (V>0)
function potentialToColor(V: number, Vmax: number): THREE.Color {
  const t = Math.max(-1, Math.min(1, V / (Vmax + 1e-10)))
  if (t >= 0) {
    return new THREE.Color(t, 0.1 * (1 - t), 0.1 * (1 - t)) // rojo
  } else {
    return new THREE.Color(0.1 * (1 + t), 0.1 * (1 + t), -t) // azul
  }
}

// Malla de plano coloreada según V = kq/r
function PotentialPlane({ charge }: { charge: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const N = 60  // resolución de la grilla

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(10, 10, N - 1, N - 1)
    const positions = geo.attributes.position.array as Float32Array
    const colors = new Float32Array(positions.length)

    // Calcular V en cada vértice y asignar color
    const q_C = charge * NC_TO_C
    const Vs: number[] = []
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const r = Math.sqrt(x * x + y * y)
      const V = r < MIN_DISTANCE ? 0 : (K_COULOMB * q_C) / r
      Vs.push(V)
    }
    const Vmax = Math.max(...Vs.map(Math.abs))

    for (let i = 0; i < Vs.length; i++) {
      const col = potentialToColor(Vs[i], Vmax)
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [charge])

  // Rotación suave
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.z += delta * 0.05
  })

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  )
}

// Esfera de la carga
function ChargePoint({ charge }: { charge: number }) {
  const color = charge >= 0 ? '#ef4444' : '#3b82f6'
  const emissive = charge >= 0 ? '#7f1d1d' : '#1e3a5f'
  return (
    <group position={[0, 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.15, 24, 24]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.8} />
      </mesh>
      <Text position={[0, 0.3, 0]} fontSize={0.2} color={color} anchorX="center">
        {charge >= 0 ? '+q' : '−q'}
      </Text>
    </group>
  )
}

// Líneas de referencia (cruces)
function Grid() {
  const size = 5
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {[-4, -2, 0, 2, 4].map((v) => (
        <group key={v}>
          <line>
            <bufferGeometry
              attributes={{ position: new THREE.BufferAttribute(new Float32Array([-size, v, 0, size, v, 0]), 3) }}
            />
            <lineBasicMaterial color="#1e293b" opacity={0.4} transparent />
          </line>
          <line>
            <bufferGeometry
              attributes={{ position: new THREE.BufferAttribute(new Float32Array([v, -size, 0, v, size, 0]), 3) }}
            />
            <lineBasicMaterial color="#1e293b" opacity={0.4} transparent />
          </line>
        </group>
      ))}
    </group>
  )
}

interface PotencialCargaSceneProps {
  charge: number   // nC
}

export function PotencialCargaScene({ charge }: PotencialCargaSceneProps) {
  return (
    <Canvas
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [0, 7, 5] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1} />

      <PotentialPlane charge={charge} />
      <ChargePoint charge={charge} />
      <Grid />

      {/* Leyenda */}
      <Text position={[4.5, 0.1, -4.5]} fontSize={0.25} color="#ef4444">V+</Text>
      <Text position={[-4.5, 0.1, -4.5]} fontSize={0.25} color="#3b82f6">V−</Text>

      <OrbitControls makeDefault enablePan enableZoom enableRotate minDistance={2} maxDistance={20} target={[0, 0, 0]} />
    </Canvas>
  )
}
