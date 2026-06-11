import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'

const MU0 = 4 * Math.PI * 1e-7

// ── Campo B en un punto por integración numérica de la espira ──
function bFieldAt(px: number, py: number, pz: number, I: number, R: number, segments = 120) {
  let bx = 0, by = 0, bz = 0
  const dPhi = (2 * Math.PI) / segments
  for (let i = 0; i < segments; i++) {
    const phi = i * dPhi
    // Posición del segmento en la espira (plano XY)
    const sx = R * Math.cos(phi), sy = R * Math.sin(phi), sz = 0
    // dl = R dφ × tangente
    const dlx = -R * Math.sin(phi) * dPhi
    const dly =  R * Math.cos(phi) * dPhi
    const dlz = 0
    // r = P - S
    const rx = px - sx, ry = py - sy, rz = pz - sz
    const r2 = rx * rx + ry * ry + rz * rz
    if (r2 < 1e-8) continue
    const r3 = Math.pow(r2, 1.5)
    const k = (MU0 * I) / (4 * Math.PI * r3)
    // dB = k × (dl × r)
    bx += k * (dly * rz - dlz * ry)
    by += k * (dlz * rx - dlx * rz)
    bz += k * (dlx * ry - dly * rx)
  }
  return new THREE.Vector3(bx, by, bz)
}

// ── Espira de corriente con partículas ────────────────────────
function CurrentLoop({ I, R }: { I: number; R: number }) {
  const SEGS = 80
  const pts = useMemo(() =>
    Array.from({ length: SEGS + 1 }, (_, i) => {
      const a = (i / SEGS) * Math.PI * 2
      return new THREE.Vector3(R * Math.cos(a), R * Math.sin(a), 0)
    }), [R])

  const meshRefs = useRef<(THREE.Mesh | null)[]>([])
  const NUM_P = 10
  const phases = useMemo(() => Array.from({ length: NUM_P }, (_, i) => i / NUM_P), [])
  const tRef = useRef(0)
  const dir = I >= 0 ? 1 : -1

  useFrame((_, delta) => {
    tRef.current += delta * 0.6 * dir
    for (let i = 0; i < NUM_P; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const frac = ((phases[i] + tRef.current) % 1 + 1) % 1
      const a = frac * Math.PI * 2
      mesh.position.set(R * Math.cos(a), R * Math.sin(a), 0)
        ; (mesh.material as THREE.MeshStandardMaterial).opacity = 0.5 + Math.sin(frac * Math.PI * 2) * 0.4
    }
  })

  return (
    <>
      <Line points={pts} color="#f59e0b" lineWidth={3} transparent opacity={0.9} />
      {Array.from({ length: NUM_P }, (_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el }}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={1.2} transparent opacity={0.9} />
        </mesh>
      ))}
    </>
  )
}

// ── Flechas dB en cada segmento de la espira ─────────────────
function DBContributions({ I, R, show }: { I: number; R: number; show: boolean }) {
  const NUM = 16
  const arrows = useMemo(() => {
    if (!show) return new THREE.Group()
    const group = new THREE.Group()
    const color = new THREE.Color('#34d399')
    for (let i = 0; i < NUM; i++) {
      const phi = (i / NUM) * Math.PI * 2
      const sx = R * Math.cos(phi), sy = R * Math.sin(phi)
      // dB en el centro de la espira desde este segmento apunta en +Z siempre (para espira circular)
      // Lo evaluamos en un punto justo encima del segmento para visualizar
      const px = sx * 0.6, py = sy * 0.6, pz = 0.5
      const b = bFieldAt(px, py, pz, Math.sign(I) || 1, R, 60)
      const len = b.length() * 1e5  // escalar para visualización
      if (len < 1e-4) continue
      const lenVis = Math.min(Math.max(len, 0.3), 0.9)
      const dir = b.clone().normalize()
      const arr = new THREE.ArrowHelper(dir, new THREE.Vector3(px, py, pz), lenVis,
        color, lenVis * 0.35, lenVis * 0.13)
        ; (arr.line.material as THREE.LineBasicMaterial).opacity = 0.7; (arr.line.material as THREE.LineBasicMaterial).transparent = true
        ; (arr.cone.material as THREE.MeshBasicMaterial).opacity = 0.7; (arr.cone.material as THREE.MeshBasicMaterial).transparent = true
      group.add(arr)
    }
    return group
  }, [I, R, show])

  useEffect(() => () => {
    arrows.children.forEach(c => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return <primitive object={arrows} />
}

// ── Campo B en una cuadrícula 3D ──────────────────────────────
function BFieldGrid({ I, R }: { I: number; R: number }) {
  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const color = new THREE.Color('#06b6d4')
    // Grid en plano XZ (corte transversal)
    const PTS: [number, number, number][] = []
    for (let xi = -2; xi <= 2; xi++) {
      for (let zi = -2; zi <= 2; zi++) {
        PTS.push([xi * 0.9, 0, zi * 0.9])
      }
    }
    // Agregar puntos en el eje Z
    for (let zi = -3; zi <= 3; zi++) PTS.push([0, 0, zi * 0.7])

    for (const [px, py, pz] of PTS) {
      const b = bFieldAt(px, py, pz, I, R)
      const mag = b.length()
      if (mag < 1e-10) continue
      const lenVis = Math.min(mag * 8e6, 1.2) + 0.15
      const dir = b.clone().normalize()
      const arr = new THREE.ArrowHelper(dir, new THREE.Vector3(px, py, pz), lenVis,
        color, lenVis * 0.3, lenVis * 0.12)
        ; (arr.line.material as THREE.LineBasicMaterial).opacity = 0.55; (arr.line.material as THREE.LineBasicMaterial).transparent = true
        ; (arr.cone.material as THREE.MeshBasicMaterial).opacity = 0.55; (arr.cone.material as THREE.MeshBasicMaterial).transparent = true
      group.add(arr)
    }
    return group
  }, [I, R])

  useEffect(() => () => {
    arrows.children.forEach(c => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return <primitive object={arrows} />
}

// ── Líneas de campo a lo largo del eje ───────────────────────
function AxisFieldLine({ I, R }: { I: number; R: number }) {
  const pts = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = -40; i <= 40; i++) {
      const z = i * 0.12
      const b = bFieldAt(0, 0, z, I, R)
      // Solo usamos la dirección para trazar la línea del eje
      points.push(new THREE.Vector3(0, 0, z))
    }
    return points
  }, [I, R])

  return (
    <Line points={pts} color="#06b6d4" lineWidth={1.5} transparent opacity={0.35}
      dashed dashSize={0.15} gapSize={0.08} />
  )
}

// ── Plano de referencia XZ ────────────────────────────────────
function RefPlaneXZ() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10, 10, 10]} />
      <meshBasicMaterial color="#0a0f1e" wireframe transparent opacity={0.18} />
    </mesh>
  )
}

// ── Ejes de referencia ────────────────────────────────────────
function Axes() {
  return (
    <group>
      <Line points={[[-5, 0, 0], [5, 0, 0]]} color="#3b9eff" lineWidth={1} transparent opacity={0.3} />
      <Line points={[[0, -5, 0], [0, 5, 0]]} color="#2de0a5" lineWidth={1} transparent opacity={0.3} />
      <Line points={[[0, 0, -5], [0, 0, 5]]} color="#ff4d6d" lineWidth={1} transparent opacity={0.3} />
      <Text position={[5.3, 0, 0]} fontSize={0.2} color="#3b9eff">x</Text>
      <Text position={[0, 5.3, 0]} fontSize={0.2} color="#2de0a5">y</Text>
      <Text position={[0, 0, 5.3]} fontSize={0.2} color="#ff4d6d">z (eje)</Text>
    </group>
  )
}

// ── HUD de valores ─────────────────────────────────────────────
function BiotHUD({ I, R }: { I: number; R: number }) {
  const bCenter = (MU0 * Math.abs(I)) / (2 * R)
  return (
    <group position={[-6.5, 4.5, 0]}>
      <Text fontSize={0.22} color="#f59e0b" anchorX="left" position={[0, 0, 0]}>
        {`Ley de Biot-Savart`}
      </Text>
      <Text fontSize={0.17} color="#94a3b8" anchorX="left" position={[0, -0.35, 0]}>
        {`dB = (μ₀I/4π) × dl×r̂/r²`}
      </Text>
      <Text fontSize={0.17} color="#06b6d4" anchorX="left" position={[0, -0.65, 0]}>
        {`B centro = μ₀I/2R = ${(bCenter * 1e6).toFixed(2)} µT`}
      </Text>
      <Text fontSize={0.17} color="#94a3b8" anchorX="left" position={[0, -0.95, 0]}>
        {`I = ${I.toFixed(1)} A   R = ${R.toFixed(2)} m`}
      </Text>
      <Text fontSize={0.14} color="#34d399" anchorX="left" position={[0, -1.30, 0]}>
        {'— flechas verdes: dB de cada segmento'}
      </Text>
      <Text fontSize={0.14} color="#06b6d4" anchorX="left" position={[0, -1.52, 0]}>
        {'— flechas cyan: campo B resultante'}
      </Text>
      <Text fontSize={0.14} color="#f59e0b" anchorX="left" position={[0, -1.74, 0]}>
        {'— anillo amarillo: espira con corriente'}
      </Text>
    </group>
  )
}

// ── Escena principal ───────────────────────────────────────────
interface BiotSavartProps {
  I: number       // Corriente en A
  R: number       // Radio de la espira en m
  showDB: boolean // Mostrar contribuciones dB
}

export function BiotSavartScene({ I, R, showDB }: BiotSavartProps) {
  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 60, position: [5, 3, 7] }}
      style={{ background: '#080c12' }}
    >
      <color attach="background" args={['#080c12']} />
      <ambientLight intensity={0.35} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[0, 0, -4]} intensity={0.5} color="#06b6d4" />

      <Axes />
      <RefPlaneXZ />
      <CurrentLoop I={I} R={R} />
      <BFieldGrid I={I} R={R} />
      <AxisFieldLine I={I} R={R} />
      {showDB && <DBContributions I={I} R={R} show={showDB} />}
      <BiotHUD I={I} R={R} />

      <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={30} />
    </Canvas>
  )
}

// Export del campo en el centro para el InfoPanel
export function bCenter(I: number, R: number) {
  return (MU0 * Math.abs(I)) / (2 * R)
}
export function bAxis(I: number, R: number, z: number) {
  return (MU0 * I * R * R) / (2 * Math.pow(R * R + z * z, 1.5))
}
