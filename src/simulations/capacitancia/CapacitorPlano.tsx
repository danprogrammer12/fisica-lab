import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { EPSILON_0 } from '../../physics/constants'

// Placa del capacitor
function Plate({
  x,
  width,
  height,
  isPositive,
}: {
  x: number
  width: number
  height: number
  isPositive: boolean
}) {
  const color = isPositive ? '#ef4444' : '#3b82f6'
  const label = isPositive ? '+' : '−'

  return (
    <group position={[x, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.05, height, width]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Cargas en la placa */}
      {Array.from({ length: 4 }, (_, i) =>
        Array.from({ length: 4 }, (_, j) => (
          <Text
            key={`${i}-${j}`}
            position={[isPositive ? 0.08 : -0.08, -height / 2 + (i + 0.5) * (height / 4), -width / 2 + (j + 0.5) * (width / 4)]}
            fontSize={0.18}
            color={color}
            anchorX="center"
          >
            {label}
          </Text>
        )),
      )}
    </group>
  )
}

// Flechas del campo E entre las placas
function EFieldArrows({
  separation,
  height,
  width,
  isPositive,
}: {
  separation: number
  height: number
  width: number
  isPositive: boolean
}) {
  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const rows = 3
    const cols = 3
    const dir = isPositive ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0)
    const len = separation * 0.7
    const color = new THREE.Color('#f59e0b')

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const y = -height / 2 + (i + 0.5) * (height / rows)
        const z = -width / 2 + (j + 0.5) * (width / cols)
        const origin = new THREE.Vector3(-separation / 2 + separation * 0.15, y, z)
        const arrow = new THREE.ArrowHelper(dir, origin, len, color, len * 0.2, len * 0.1)
        group.add(arrow)
      }
    }
    return group
  }, [separation, height, width, isPositive])

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

interface CapacitorPlanoSceneProps {
  area: number          // m²
  separation: number    // m
  kappa: number         // constante dieléctrica (1 = vacío)
}

export function CapacitorPlanoScene({ area, separation, kappa }: CapacitorPlanoSceneProps) {
  const side = Math.sqrt(area)
  const C = (kappa * EPSILON_0 * area) / separation  // Faradios

  return (
    <Canvas
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [0, 3, 6] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-5, 0, 5]} intensity={0.8} color="#3b82f6" />

      {/* Placa positiva */}
      <Plate x={-separation / 2} width={side} height={side} isPositive />

      {/* Placa negativa */}
      <Plate x={separation / 2} width={side} height={side} isPositive={false} />

      {/* Dieléctrico entre placas */}
      {kappa > 1 && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[separation * 0.9, side * 0.9, side * 0.9]} />
          <meshStandardMaterial color="#8b5cf6" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Campo E */}
      <EFieldArrows separation={separation} height={side} width={side} isPositive />

      {/* Labels */}
      <Text position={[-separation / 2, side / 2 + 0.4, 0]} fontSize={0.22} color="#ef4444" anchorX="center">
        +Q
      </Text>
      <Text position={[separation / 2, side / 2 + 0.4, 0]} fontSize={0.22} color="#3b82f6" anchorX="center">
        −Q
      </Text>
      <Text position={[0, -side / 2 - 0.5, 0]} fontSize={0.2} color="#f59e0b" anchorX="center">
        {`C = ${(C * 1e12).toFixed(2)} pF`}
      </Text>
      {kappa > 1 && (
        <Text position={[0, 0, side / 2 + 0.3]} fontSize={0.18} color="#a78bfa" anchorX="center">
          {`κ = ${kappa.toFixed(1)}`}
        </Text>
      )}

      <OrbitControls makeDefault enablePan enableZoom enableRotate minDistance={2} maxDistance={20} target={[0, 0, 0]} />
    </Canvas>
  )
}
