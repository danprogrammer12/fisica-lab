import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { electricFlux } from '../../physics/electrostatics'

interface FlujoElectricoSceneProps {
  area: number
  fieldMagnitude: number
  angleDeg: number
}

// ── Campo E: flechas amarillas densas ─────────────────────────
function UniformEField({ fieldMagnitude }: { fieldMagnitude: number }) {
  const len   = Math.min(2.2, 0.7 + fieldMagnitude * 0.005)
  const color = new THREE.Color('#f59e0b')

  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const ROWS = 7, COLS = 7
    const span = 6.5
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const y = -span / 2 + r * (span / (ROWS - 1))
        const z = -span / 2 + c * (span / (COLS - 1))
        const arr = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(-5.5, y, z),
          len, color, len * 0.25, len * 0.10,
        )
          ;(arr.line.material as THREE.LineBasicMaterial).opacity = 0.55
          ;(arr.line.material as THREE.LineBasicMaterial).transparent = true
          ;(arr.cone.material as THREE.MeshBasicMaterial).opacity = 0.65
          ;(arr.cone.material as THREE.MeshBasicMaterial).transparent = true
        group.add(arr)
      }
    }
    return group
  }, [fieldMagnitude, len])

  useEffect(() => () => {
    arrows.children.forEach(c => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return (
    <group>
      <primitive object={arrows} />
      <Text position={[-5.5, -4.2, 0]} fontSize={0.24} color="#f59e0b" anchorX="center">
        {`E⃗ = ${fieldMagnitude} N/C`}
      </Text>
    </group>
  )
}

// ── Plano gaussiano ───────────────────────────────────────────
function FluxPlane({ area, angleDeg }: { area: number; angleDeg: number }) {
  const angleRad  = (angleDeg * Math.PI) / 180
  const cosT      = Math.cos(angleRad)
  const side      = Math.sqrt(area)
  const h         = side / 2
  // Color: verde cuando flujo máximo, rojo cuando flujo 0
  const g = Math.floor(cosT * 220)
  const r = Math.floor((1 - cosT) * 220)
  const planeColor = `rgb(${r},${g},80)`

  const corners = useMemo<[number,number,number][]>(() =>
    [[-h,-h,0],[h,-h,0],[h,h,0],[-h,h,0],[-h,-h,0]]
  , [h])

  return (
    <group rotation={[0, angleRad, 0]}>
      {/* Relleno */}
      <mesh>
        <planeGeometry args={[side, side]} />
        <meshStandardMaterial color={planeColor} transparent
          opacity={0.12 + cosT * 0.22} side={THREE.DoubleSide} />
      </mesh>
      {/* Borde */}
      <Line points={corners} color={planeColor} lineWidth={2.5} transparent opacity={0.7 + cosT * 0.3} />

      {/* Normal n̂ */}
      <arrowHelper args={[
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        side * 0.6 + 0.5,
        0x34d399, 0.28, 0.11,
      ]} />
      <Text position={[0.18, 0, side * 0.6 + 0.75]} fontSize={0.22} color="#34d399">n̂</Text>

      {/* Etiqueta área */}
      <Text position={[0, -h - 0.35, 0]} fontSize={0.18} color="#64748b" anchorX="center">
        {`A = ${area.toFixed(1)} m²`}
      </Text>

      {/* Indicador Φ = 0 cuando θ = 90° */}
      {angleDeg >= 88 && (
        <Text position={[0, 0, 0]} fontSize={0.32} color="#ef4444" anchorX="center">
          Φ = 0
        </Text>
      )}
    </group>
  )
}

// ── Indicador del ángulo θ ────────────────────────────────────
function AngleIndicator({ angleDeg }: { angleDeg: number }) {
  const angleRad = (angleDeg * Math.PI) / 180
  const R = 1.5

  const arcPts = useMemo(() =>
    Array.from({ length: 33 }, (_, i) => {
      const a = (i / 32) * angleRad
      return new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R)
    })
  , [angleRad])

  const midA = angleRad / 2

  return (
    <group>
      {angleRad > 0.05 && (
        <>
          <Line points={arcPts} color="#a78bfa" lineWidth={2.5} transparent opacity={0.8} />
          <Text
            position={[Math.cos(midA) * (R + 0.4), 0.2, Math.sin(midA) * (R + 0.4)]}
            fontSize={0.22} color="#a78bfa"
          >
            {`θ = ${angleDeg}°`}
          </Text>
        </>
      )}
      {/* Línea de referencia: dirección E */}
      <Line
        points={[new THREE.Vector3(0,0,0), new THREE.Vector3(R + 0.3, 0, 0)]}
        color="#f59e0b" lineWidth={1.5} transparent opacity={0.5}
        dashed dashSize={0.12} gapSize={0.07}
      />
    </group>
  )
}

// ── Partículas que atraviesan el plano ────────────────────────
function FluxParticles({ area, angleDeg, fieldMagnitude }: {
  area: number; angleDeg: number; fieldMagnitude: number
}) {
  const NUM      = 22
  const cosT     = Math.cos((angleDeg * Math.PI) / 180)
  const normFlux = Math.max(0, cosT)
  const side     = Math.sqrt(area)
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const tRef     = useRef(0)

  const slots = useMemo(() =>
    Array.from({ length: NUM }, (_, i) => ({
      y:     ((i * 2654435761) % 1000) / 1000 * side - side / 2,
      z:     ((i * 1234567891) % 1000) / 1000 * side - side / 2,
      phase: i / NUM,
    }))
  , [side])

  useFrame((_, delta) => {
    tRef.current += delta * (0.1 + normFlux * 0.4)
    const t = tRef.current
    for (let i = 0; i < NUM; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const s    = slots[i]
      const frac = ((s.phase + t * 0.15) % 1 + 1) % 1
      mesh.position.set(-5.5 + frac * 11, s.y, s.z)

      const crossFrac  = Math.abs(mesh.position.x) / 5.5
      const crossBoost = crossFrac < 0.12 ? 1.8 : 1.0
      const alpha      = normFlux * Math.sin(frac * Math.PI) * 0.9 * crossBoost
        ;(mesh.material as THREE.MeshStandardMaterial).opacity = Math.min(1, alpha)
        ;(mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0 + crossBoost * 0.6
    }
  })

  return (
    <>
      {Array.from({ length: NUM }, (_, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el }}>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24"
            emissiveIntensity={1.2} transparent opacity={0.9} />
        </mesh>
      ))}
    </>
  )
}

// ── HUD con fórmula paso a paso ───────────────────────────────
function FluxHUD({ area, angleDeg, fieldMagnitude }: {
  area: number; angleDeg: number; fieldMagnitude: number
}) {
  const flux = electricFlux(fieldMagnitude, area, angleDeg)
  const cosT = Math.cos((angleDeg * Math.PI) / 180)
  const isZero = angleDeg >= 88

  return (
    <group position={[-8, 5, 0]}>
      <Text fontSize={0.22} color="#10b981" anchorX="left" position={[0, 0, 0]}>
        {'Φ = E · A · cos(θ)'}
      </Text>
      <Text fontSize={0.18} color="#f59e0b" anchorX="left" position={[0, -0.38, 0]}>
        {`E = ${fieldMagnitude} N/C`}
      </Text>
      <Text fontSize={0.18} color="#60a5fa" anchorX="left" position={[0, -0.64, 0]}>
        {`A = ${area.toFixed(1)} m²`}
      </Text>
      <Text fontSize={0.18} color="#a78bfa" anchorX="left" position={[0, -0.90, 0]}>
        {`cos(${angleDeg}°) = ${cosT.toFixed(3)}`}
      </Text>
      <Text fontSize={0.22} color={isZero ? '#ef4444' : '#10b981'} anchorX="left" position={[0, -1.28, 0]}>
        {`Φ = ${flux.toFixed(1)} N·m²/C`}
      </Text>

      {/* Casos especiales */}
      <Text fontSize={0.15} color="#374151" anchorX="left" position={[0, -1.75, 0]}>
        {'θ=0° → Φ_máx (E ⊥ plano)'}
      </Text>
      <Text fontSize={0.15} color="#374151" anchorX="left" position={[0, -1.98, 0]}>
        {'θ=90° → Φ=0 (E ∥ plano)'}
      </Text>
    </group>
  )
}

// ── Escena principal ──────────────────────────────────────────
export function FlujoElectricoScene({ area, fieldMagnitude, angleDeg }: FlujoElectricoSceneProps) {
  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [4, 5, 9] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 6, 5]} intensity={1.5} />
      <pointLight position={[-5, 0, 0]} intensity={0.6} color="#f59e0b" />

      <UniformEField fieldMagnitude={fieldMagnitude} />
      <FluxPlane area={area} angleDeg={angleDeg} />
      <AngleIndicator angleDeg={angleDeg} />
      <FluxParticles area={area} angleDeg={angleDeg} fieldMagnitude={fieldMagnitude} />
      <FluxHUD area={area} angleDeg={angleDeg} fieldMagnitude={fieldMagnitude} />

      {/* Ejes de referencia */}
      <Line points={[[-6,0,0],[6,0,0]]} color="#1e293b" lineWidth={0.8} />
      <Text position={[6.3,0,0]} fontSize={0.18} color="#334155">x (E⃗)</Text>

      <OrbitControls enablePan enableZoom enableRotate minDistance={3} maxDistance={25} />
    </Canvas>
  )
}
