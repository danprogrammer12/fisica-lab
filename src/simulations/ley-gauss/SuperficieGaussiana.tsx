import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { gaussianFlux } from '../../physics/electrostatics'
import { sphericalPoints } from '../../physics/vectors'

const K     = 8.99e9
const EPS_0 = 8.854e-12

// ── Carga central ─────────────────────────────────────────────
function CentralCharge({ charge }: { charge: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const isPos   = charge >= 0
  const color   = isPos ? '#ef4444' : '#3b82f6'
  const emissive = isPos ? '#7f1d1d' : '#1e3a5f'

  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 2.8) * 0.07
    meshRef.current?.scale.setScalar(s)
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.20, 32, 32]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.2} roughness={0.1} />
      </mesh>
      <Text position={[0, 0.42, 0]} fontSize={0.22} color={color} anchorX="center">
        {isPos ? `+${Math.abs(charge).toFixed(1)} nC` : `−${Math.abs(charge).toFixed(1)} nC`}
      </Text>
    </group>
  )
}

// ── Líneas de campo radiales ──────────────────────────────────
function RadialFieldLines({ radius, charge }: { radius: number; charge: number }) {
  const isPos = charge >= 0
  const color = isPos ? '#f97316' : '#818cf8'

  const lines = useMemo(() => {
    const innerR = 0.24, outerR = radius + 0.9
    const result: THREE.Vector3[][] = []
    for (let i = 0; i < 24; i++) {
      const phi   = (i / 24) * Math.PI * 2
      const theta = Math.acos(1 - 2 * ((i * 0.618033988) % 1))
      const dir = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi),
      )
      const pts = [dir.clone().multiplyScalar(innerR), dir.clone().multiplyScalar(outerR)]
      result.push(isPos ? pts : [...pts].reverse())
    }
    return result
  }, [radius, isPos])

  return (
    <>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={color} lineWidth={1.3} transparent opacity={0.38} />
      ))}
    </>
  )
}

// ── Partículas de flujo ───────────────────────────────────────
function FluxParticles({ radius, charge }: { radius: number; charge: number }) {
  const NUM   = 32
  const isOut = charge >= 0
  const color = isOut ? '#fb923c' : '#a78bfa'
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const tRef = useRef(0)
  const qNorm = Math.min(Math.abs(charge) / 10, 1)

  const directions = useMemo(() =>
    Array.from({ length: NUM }, (_, i) => {
      const phi   = (i / NUM) * Math.PI * 2
      const theta = Math.acos(1 - 2 * ((i * 0.618033988) % 1))
      return new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi),
      ).normalize()
    }), [])

  const phases = useMemo(() => Array.from({ length: NUM }, (_, i) => i / NUM), [])

  useFrame((_, delta) => {
    tRef.current += delta * (0.3 + qNorm * 0.5)
    const t = tRef.current
    const outerR = radius + 0.8
    for (let i = 0; i < NUM; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const frac = ((phases[i] + t * 0.18) % 1 + 1) % 1
      const r = isOut ? frac * outerR : (1 - frac) * outerR
      const d = directions[i]
      mesh.position.set(d.x * r, d.y * r, d.z * r)
      const distSurface = Math.abs(r - radius) / outerR
      const boost = distSurface < 0.07 ? 1.6 : 1.0
        ;(mesh.material as THREE.MeshStandardMaterial).opacity = Math.sin(frac * Math.PI) * 0.9 * boost
        ;(mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + boost * 0.6
    }
  })

  return (
    <>
      {Array.from({ length: NUM }, (_, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el }}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4}
            transparent opacity={0.85} />
        </mesh>
      ))}
    </>
  )
}

// ── Esfera gaussiana visible (globo tipo latitud/longitud) ────
function GaussianSphere({ radius, charge }: { radius: number; charge: number }) {
  const isPos = charge >= 0
  const color = isPos ? '#3b82f6' : '#a855f7'
  const solidRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (solidRef.current) {
      const mat = solidRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.06 + Math.sin(clock.elapsedTime * 0.9) * 0.025
    }
  })

  // Líneas de latitud y longitud para hacer la esfera visible
  const latLines = useMemo(() => {
    const lines: THREE.Vector3[][] = []
    const LATS = 5, SEGS = 64
    for (let l = 0; l < LATS; l++) {
      const phi = -Math.PI / 2 + (l + 1) * (Math.PI / (LATS + 1))
      const cosP = Math.cos(phi), sinP = Math.sin(phi)
      const pts = Array.from({ length: SEGS + 1 }, (_, i) => {
        const a = (i / SEGS) * Math.PI * 2
        return new THREE.Vector3(radius * cosP * Math.cos(a), radius * sinP, radius * cosP * Math.sin(a))
      })
      lines.push(pts)
    }
    return lines
  }, [radius])

  const lonLines = useMemo(() => {
    const lines: THREE.Vector3[][] = []
    const LONS = 8, SEGS = 32
    for (let l = 0; l < LONS; l++) {
      const theta = (l / LONS) * Math.PI * 2
      const pts = Array.from({ length: SEGS + 1 }, (_, i) => {
        const phi = -Math.PI / 2 + (i / SEGS) * Math.PI
        return new THREE.Vector3(radius * Math.cos(phi) * Math.cos(theta), radius * Math.sin(phi), radius * Math.cos(phi) * Math.sin(theta))
      })
      lines.push(pts)
    }
    return lines
  }, [radius])

  return (
    <group>
      {/* Relleno sutil */}
      <mesh ref={solidRef}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial color={color} transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* Líneas de latitud */}
      {latLines.map((pts, i) => (
        <Line key={`lat-${i}`} points={pts} color={color} lineWidth={1.2} transparent opacity={0.30} />
      ))}
      {/* Líneas de longitud */}
      {lonLines.map((pts, i) => (
        <Line key={`lon-${i}`} points={pts} color={color} lineWidth={1.2} transparent opacity={0.30} />
      ))}

      {/* Vector radio con etiqueta */}
      <Line points={[new THREE.Vector3(0,0,0), new THREE.Vector3(radius * 0.85, 0, 0)]}
        color="#64748b" lineWidth={1.5} dashed dashSize={0.12} gapSize={0.07} />
      <Text position={[radius * 0.45, 0.22, 0]} fontSize={0.18} color="#64748b">
        {`r = ${radius.toFixed(1)} m`}
      </Text>

      {/* Normal en el polo "norte" de la gaussiana */}
      <arrowHelper args={[
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, radius, 0),
        0.55, 0x34d399, 0.18, 0.08,
      ]} />
      <Text position={[0.22, radius + 0.68, 0]} fontSize={0.16} color="#34d399">n̂</Text>
    </group>
  )
}

// ── Flechas E en la superficie ────────────────────────────────
function SurfaceArrows({ radius, charge }: { radius: number; charge: number }) {
  const isOutward = charge >= 0
  const color = new THREE.Color(isOutward ? '#f97316' : '#818cf8')
  const qNorm = Math.min(Math.abs(charge) / 10, 1)

  const arrows = useMemo(() => {
    const group  = new THREE.Group()
    const points = sphericalPoints(24, radius)
    const len    = 0.32 + qNorm * 0.42

    for (const pt of points) {
      const dir    = isOutward ? pt.clone().normalize() : pt.clone().normalize().negate()
      const origin = isOutward ? pt.clone() : pt.clone().addScaledVector(dir, len)
      const arrow  = new THREE.ArrowHelper(dir, origin, len, color, len * 0.32, len * 0.13)
        ;(arrow.line.material as THREE.LineBasicMaterial).transparent = true
        ;(arrow.line.material as THREE.LineBasicMaterial).opacity = 0.55 + qNorm * 0.3
        ;(arrow.cone.material as THREE.MeshBasicMaterial).transparent = true
        ;(arrow.cone.material as THREE.MeshBasicMaterial).opacity = 0.55 + qNorm * 0.3
      group.add(arrow)
    }
    return group
  }, [radius, charge, isOutward, qNorm])

  useEffect(() => () => {
    arrows.children.forEach(c => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return <primitive object={arrows} />
}

// ── Grid 3D de vectores E (opcional) ─────────────────────────
function VolumeFieldArrows({ charge }: { charge: number }) {
  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const q_C   = charge * 1e-9
    const sgn   = charge >= 0 ? 1 : -1
    const color = new THREE.Color(charge >= 0 ? '#3b82f6' : '#f43f5e')
    const GRID  = 5, GR = 4.0, step = (GR * 2) / (GRID - 1)
    for (let ix = 0; ix < GRID; ix++) {
      for (let iy = 0; iy < GRID; iy++) {
        for (let iz = 0; iz < GRID; iz++) {
          const x = -GR + ix * step, y = -GR + iy * step, z = -GR + iz * step
          const r = Math.sqrt(x * x + y * y + z * z)
          if (r < 0.5) continue
          const E   = K * Math.abs(q_C) / (r * r)
          const dir = new THREE.Vector3(x, y, z).normalize().multiplyScalar(sgn)
          const len = Math.min(E * 1.5e-4, 0.8) * 0.55 + 0.12
          const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(x, y, z), len, color, len * 0.3, len * 0.12)
            ;(arrow.line.material as THREE.LineBasicMaterial).opacity = Math.min(0.65, 1.2 / r)
            ;(arrow.line.material as THREE.LineBasicMaterial).transparent = true
          group.add(arrow)
        }
      }
    }
    return group
  }, [charge])

  useEffect(() => () => {
    arrows.children.forEach(c => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return <primitive object={arrows} />
}

// ── HUD principal — posición fija superior izquierda ─────────
function FluxHUD({ radius, charge }: { radius: number; charge: number }) {
  const flux   = gaussianFlux(charge)
  const q_C    = charge * 1e-9
  const E_surf = Math.abs(q_C) / (4 * Math.PI * EPS_0 * radius * radius)
  const isPos  = charge >= 0
  const color  = isPos ? '#f97316' : '#818cf8'

  return (
    <group position={[-8.5, 6.0, 0]}>
      {/* Título */}
      <Text fontSize={0.22} color="#10b981" anchorX="left" position={[0, 0, 0]}>
        {'Ley de Gauss — Esfera Gaussiana'}
      </Text>

      {/* Fórmula clave */}
      <Text fontSize={0.20} color={color} anchorX="left" position={[0, -0.40, 0]}>
        {'Φ = ∮ E⃗ · dA⃗ = q_enc / ε₀'}
      </Text>

      {/* Separador */}
      <Line points={[new THREE.Vector3(0,-0.58,0), new THREE.Vector3(5.5,-0.58,0)]}
        color="#1e293b" lineWidth={1} />

      {/* Valores actuales */}
      <Text fontSize={0.17} color="#f59e0b" anchorX="left" position={[0, -0.82, 0]}>
        {`q_enc = ${charge > 0 ? '+' : ''}${charge.toFixed(1)} nC`}
      </Text>
      <Text fontSize={0.17} color="#60a5fa" anchorX="left" position={[0, -1.05, 0]}>
        {`Radio r = ${radius.toFixed(1)} m`}
      </Text>
      <Text fontSize={0.18} color={color} anchorX="left" position={[0, -1.28, 0]}>
        {`Φ = ${flux.toExponential(2)} N·m²/C`}
      </Text>
      <Text fontSize={0.17} color="#94a3b8" anchorX="left" position={[0, -1.52, 0]}>
        {`|E| en r = ${E_surf.toFixed(1)} N/C`}
      </Text>

      {/* Insight clave */}
      <Line points={[new THREE.Vector3(0,-1.70,0), new THREE.Vector3(5.5,-1.70,0)]}
        color="#1e293b" lineWidth={1} />
      <Text fontSize={0.15} color="#34d399" anchorX="left" position={[0, -1.90, 0]}>
        {'★ Φ depende solo de q_enc (no del radio)'}
      </Text>
      <Text fontSize={0.14} color="#475569" anchorX="left" position={[0, -2.10, 0]}>
        {'  Cambia r → Φ es siempre igual'}
      </Text>

      {/* Leyenda visual */}
      <Line points={[new THREE.Vector3(0,-2.30,0), new THREE.Vector3(5.5,-2.30,0)]}
        color="#1e293b" lineWidth={1} />
      <Text fontSize={0.14} color="#f97316" anchorX="left" position={[0, -2.50, 0]}>
        {'→ naranja: líneas de campo E'}
      </Text>
      <Text fontSize={0.14} color={isPos ? '#3b82f6' : '#a855f7'} anchorX="left" position={[0, -2.70, 0]}>
        {'○ globo: superficie gaussiana S'}
      </Text>
      <Text fontSize={0.14} color="#34d399" anchorX="left" position={[0, -2.90, 0]}>
        {'↑ n̂: normal exterior a S'}
      </Text>
    </group>
  )
}

// ── Props ─────────────────────────────────────────────────────
interface SuperficieGaussianaSceneProps {
  radius: number
  charge: number
  showVolumeField?: boolean
}

export function SuperficieGaussianaScene({
  radius,
  charge,
  showVolumeField = false,
}: SuperficieGaussianaSceneProps) {
  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [5, 3.5, 7] }}
      style={{ background: '#050912' }}
    >
      <color attach="background" args={['#050912']} />
      <ambientLight intensity={0.28} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-4, -3, 4]} intensity={0.5} color={charge >= 0 ? '#ef4444' : '#3b82f6'} />

      <CentralCharge charge={charge} />
      <RadialFieldLines radius={radius} charge={charge} />
      <GaussianSphere radius={radius} charge={charge} />
      <SurfaceArrows radius={radius} charge={charge} />
      <FluxParticles radius={radius} charge={charge} />
      <FluxHUD radius={radius} charge={charge} />

      {showVolumeField && <VolumeFieldArrows charge={charge} />}

      <OrbitControls enablePan enableZoom enableRotate minDistance={1.5} maxDistance={22} />
    </Canvas>
  )
}
