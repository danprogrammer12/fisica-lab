/**
 * Aplicación de Ley de Gauss — Esfera con carga volumétrica uniforme.
 * Muestra el campo E dentro (∝ r) y fuera (∝ 1/r²) de la esfera.
 * La superficie gaussiana se mueve con el slider de radio.
 */
import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'

const EPSILON_0 = 8.854e-12
const K = 1 / (4 * Math.PI * EPSILON_0)

// ── Esfera cargada (distribución uniforme) ────────────────────
function ChargedSphere({ R, Q }: { R: number; Q: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const isPos   = Q >= 0
  const color   = isPos ? '#ef4444' : '#3b82f6'
  const emit    = isPos ? '#7f1d1d' : '#1e3a8a'

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.18 + Math.sin(clock.elapsedTime * 1.5) * 0.06
    }
  })

  return (
    <group>
      {/* Volumen sólido */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[R, 32, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.18}
          emissive={emit} emissiveIntensity={0.4} side={THREE.FrontSide} />
      </mesh>
      {/* Contorno */}
      <mesh>
        <sphereGeometry args={[R + 0.02, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} wireframe />
      </mesh>
      <Text position={[0, R + 0.35, 0]} fontSize={0.24} color={color} anchorX="center">
        {`R = ${R.toFixed(1)} m`}
      </Text>
      <Text position={[0, R + 0.65, 0]} fontSize={0.20} color={color} anchorX="center">
        {`Q = ${Q > 0 ? '+' : ''}${Q.toFixed(1)} nC`}
      </Text>
    </group>
  )
}

// ── Superficie gaussiana móvil (estilo globo) ─────────────────
function GaussianSurface({ r, R, Q }: { r: number; R: number; Q: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const inside  = r < R
  const color   = inside ? '#a78bfa' : '#10b981'
  const qEnc_C  = inside ? (Q * 1e-9) * (r / R) ** 3 : Q * 1e-9

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.08 + Math.sin(clock.elapsedTime * 2.0) * 0.03
    }
  })

  // Latitudes (5) y longitudes (8) para aspecto globo
  const latLines = useMemo(() => {
    const lines: THREE.Vector3[][] = []
    for (let l = 0; l < 5; l++) {
      const phi  = -Math.PI / 2 + (l + 1) * (Math.PI / 6)
      const cosP = Math.cos(phi), sinP = Math.sin(phi)
      lines.push(Array.from({ length: 65 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2
        return new THREE.Vector3(r * cosP * Math.cos(a), r * sinP, r * cosP * Math.sin(a))
      }))
    }
    return lines
  }, [r])

  const lonLines = useMemo(() => {
    const lines: THREE.Vector3[][] = []
    for (let l = 0; l < 8; l++) {
      const theta = (l / 8) * Math.PI * 2
      lines.push(Array.from({ length: 33 }, (_, i) => {
        const phi = -Math.PI / 2 + (i / 32) * Math.PI
        return new THREE.Vector3(r * Math.cos(phi) * Math.cos(theta), r * Math.sin(phi), r * Math.cos(phi) * Math.sin(theta))
      }))
    }
    return lines
  }, [r])

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[r, 48, 48]} />
        <meshStandardMaterial color={color} transparent opacity={0.08}
          emissive={color} emissiveIntensity={0.22} side={THREE.DoubleSide} />
      </mesh>
      {latLines.map((pts, i) => (
        <Line key={`lat${i}`} points={pts} color={color} lineWidth={1.0} transparent opacity={0.35} />
      ))}
      {lonLines.map((pts, i) => (
        <Line key={`lon${i}`} points={pts} color={color} lineWidth={1.0} transparent opacity={0.35} />
      ))}
      {/* Etiqueta q_enc */}
      <Text position={[r * 0.75, r * 0.75, 0]} fontSize={0.17} color={color} anchorX="center">
        {inside
          ? `q_enc=${(qEnc_C * 1e9).toFixed(2)} nC`
          : `q_enc=Q=${(qEnc_C * 1e9).toFixed(1)} nC`}
      </Text>
      {/* Etiqueta zona */}
      <Text position={[0, -(r + 0.4), 0]} fontSize={0.16} color={color} anchorX="center">
        {inside ? '◀ DENTRO de la esfera ▶' : '◀ FUERA de la esfera ▶'}
      </Text>
    </group>
  )
}

// ── Vectores E en la superficie gaussiana ─────────────────────
function EFieldOnSurface({ r, R, Q }: { r: number; R: number; Q: number }) {
  const isPos  = Q >= 0
  const q_C    = Q * 1e-9
  const inside = r < R
  const qEnc   = inside ? q_C * (r / R) ** 3 : q_C
  const E      = K * qEnc / (r * r)
  const lenVis = Math.min(Math.abs(E) / 50 + 0.2, 1.2)
  const color  = new THREE.Color(isPos ? '#fbbf24' : '#67e8f9')

  const arrows = useMemo(() => {
    const group = new THREE.Group()
    const NUM   = 20
    for (let i = 0; i < NUM; i++) {
      const phi   = (i / NUM) * Math.PI * 2
      const theta = Math.acos(1 - 2 * ((i * 0.618033988) % 1))
      const nx    = Math.sin(theta) * Math.cos(phi)
      const ny    = Math.cos(theta)
      const nz    = Math.sin(theta) * Math.sin(phi)
      const pos   = new THREE.Vector3(nx * r, ny * r, nz * r)
      const dir   = new THREE.Vector3(nx, ny, nz).multiplyScalar(isPos ? 1 : -1)
      const arr   = new THREE.ArrowHelper(dir, pos, lenVis, color, lenVis * 0.3, lenVis * 0.12)
        ; (arr.line.material as THREE.LineBasicMaterial).opacity = 0.65; (arr.line.material as THREE.LineBasicMaterial).transparent = true
        ; (arr.cone.material as THREE.MeshBasicMaterial).opacity = 0.65; (arr.cone.material as THREE.MeshBasicMaterial).transparent = true
      group.add(arr)
    }
    return group
  }, [r, R, Q, lenVis, isPos])

  useEffect(() => () => {
    arrows.children.forEach(c => {
      const a = c as THREE.ArrowHelper
      a.line?.geometry?.dispose(); a.cone?.geometry?.dispose()
    })
  }, [arrows])

  return <primitive object={arrows} />
}

// ── Gráfica de E vs r en 3D (perfil de campo) ─────────────────
function EProfileCurve({ R, Q }: { R: number; Q: number }) {
  const q_C  = Q * 1e-9
  const isPos = Q >= 0
  const colorOut = isPos ? '#fbbf24' : '#67e8f9'
  const colorIn  = '#a78bfa'

  // Rama interior: 0 < r < R  → E = Kqr/R³
  const innerPts = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 1; i <= 40; i++) {
      const r = (i / 40) * R
      const E = K * q_C * r / (R ** 3)
      // Mapeamos: X = r (eje), Z = E escalado
      pts.push(new THREE.Vector3(r + 0.5, -4.5, Math.abs(E) * 3e8 * (isPos ? 1 : -1)))
    }
    return pts
  }, [R, q_C, isPos])

  // Rama exterior: r > R → E = Kq/r²
  const outerPts = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 50; i++) {
      const r = R + i * 0.12
      const E = K * q_C / (r * r)
      pts.push(new THREE.Vector3(r + 0.5, -4.5, Math.abs(E) * 3e8 * (isPos ? 1 : -1)))
    }
    return pts
  }, [R, q_C, isPos])

  // Eje horizontal
  const axisEnd = R + 50 * 0.12 + 0.5

  return (
    <group>
      {/* Eje r */}
      <Line
        points={[new THREE.Vector3(0.5, -4.5, 0), new THREE.Vector3(axisEnd + 0.3, -4.5, 0)]}
        color="#475569" lineWidth={1} transparent opacity={0.5}
      />
      {/* Eje E */}
      <Line
        points={[new THREE.Vector3(0.5, -4.5, 0), new THREE.Vector3(0.5, -4.5, 2.5)]}
        color="#475569" lineWidth={1} transparent opacity={0.5}
      />
      <Text position={[axisEnd + 0.5, -4.5, 0]} fontSize={0.18} color="#475569">r</Text>
      <Text position={[0.5, -4.5, 2.7]} fontSize={0.18} color="#475569">E</Text>
      {/* Línea vertical en r=R */}
      <Line
        points={[new THREE.Vector3(R + 0.5, -4.5, -0.1), new THREE.Vector3(R + 0.5, -4.5, 0.1)]}
        color="#64748b" lineWidth={1.5}
      />
      <Text position={[R + 0.5, -4.5, -0.35]} fontSize={0.16} color="#64748b">R</Text>

      {innerPts.length > 1 && <Line points={innerPts} color={colorIn} lineWidth={2.5} transparent opacity={0.85} />}
      {outerPts.length > 1 && <Line points={outerPts} color={colorOut} lineWidth={2.5} transparent opacity={0.85} />}

      <Text position={[R / 2 + 0.5, -4.5, 1.9]} fontSize={0.16} color={colorIn}>E ∝ r (lineal)</Text>
      <Text position={[R + 1.5, -4.5, 1.6]} fontSize={0.16} color={colorOut}>E ∝ 1/r²</Text>
    </group>
  )
}

// ── Indicador móvil sobre la curva E(r) ───────────────────────
function EProfileIndicator({ r, R, Q }: { r: number; R: number; Q: number }) {
  const q_C    = Q * 1e-9
  const inside = r < R
  const isPos  = Q >= 0
  const qEnc   = inside ? q_C * (r / R) ** 3 : q_C
  const E      = K * qEnc / (r * r)
  const Ez     = Math.abs(E) * 3e8 * (isPos ? 1 : -1)
  const x      = r + 0.5

  // Línea vertical del indicador
  const pts: [number,number,number][] = [[x, -4.5, 0], [x, -4.5, Ez]]

  return (
    <group>
      <Line points={pts} color="#fde047" lineWidth={2} transparent opacity={0.9} />
      {/* Punto en la curva */}
      <mesh position={[x, -4.5, Ez]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={2} />
      </mesh>
      {/* Tick en el eje */}
      <mesh position={[x, -4.5, 0]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={1.5} />
      </mesh>
      <Text position={[x, -4.5, -0.32]} fontSize={0.15} color="#fde047" anchorX="center">
        {`r=${r.toFixed(1)}`}
      </Text>
    </group>
  )
}

// ── Líneas de campo radiales ──────────────────────────────────
function RadialFieldLines({ R, Q }: { R: number; Q: number }) {
  const isPos = Q >= 0
  const color = isPos ? '#fbbf24' : '#67e8f9'
  const NUM   = 14

  const lines = useMemo(() => Array.from({ length: NUM }, (_, i) => {
    const phi   = (i / NUM) * Math.PI * 2
    const theta = Math.acos(1 - 2 * ((i * 0.618033988) % 1))
    const dx    = Math.sin(theta) * Math.cos(phi)
    const dy    = Math.cos(theta)
    const dz    = Math.sin(theta) * Math.sin(phi)
    const inner = new THREE.Vector3(dx * 0.05, dy * 0.05, dz * 0.05)
    const outer = new THREE.Vector3(dx * 5.5, dy * 5.5, dz * 5.5)
    return isPos ? [inner, outer] : [outer, inner]
  }), [isPos])

  return (
    <>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={color} lineWidth={0.9} transparent opacity={0.22} />
      ))}
    </>
  )
}

// ── HUD ───────────────────────────────────────────────────────
function EsferaHUD({ r, R, Q }: { r: number; R: number; Q: number }) {
  const q_C    = Q * 1e-9
  const inside = r < R
  const qEnc   = inside ? q_C * (r / R) ** 3 : q_C
  const E      = K * qEnc / (r * r)
  const flux   = qEnc / EPSILON_0
  const zoneColor = inside ? '#a78bfa' : '#10b981'

  return (
    <group position={[-8.5, 6, 0]}>
      <Text fontSize={0.21} color="#10b981" anchorX="left" position={[0, 0, 0]}>
        {'Gauss — Esfera con Carga Uniforme'}
      </Text>

      {/* Zona activa */}
      <Text fontSize={0.19} color={zoneColor} anchorX="left" position={[0, -0.40, 0]}>
        {inside ? '● DENTRO: r < R' : '● FUERA: r > R'}
      </Text>
      <Text fontSize={0.17} color={zoneColor} anchorX="left" position={[0, -0.63, 0]}>
        {inside ? 'E = KQ·r / R³  →  E ∝ r' : 'E = KQ / r²  →  E ∝ 1/r²'}
      </Text>

      <Line points={[new THREE.Vector3(0,-0.80,0), new THREE.Vector3(5.5,-0.80,0)]}
        color="#1e293b" lineWidth={1} />

      {/* Valores */}
      <Text fontSize={0.17} color="#f59e0b" anchorX="left" position={[0, -1.00, 0]}>
        {`r = ${r.toFixed(1)} m  |  R = ${R.toFixed(1)} m`}
      </Text>
      <Text fontSize={0.17} color="#60a5fa" anchorX="left" position={[0, -1.24, 0]}>
        {`q_enc = ${(qEnc * 1e9).toFixed(2)} nC`}
      </Text>
      <Text fontSize={0.18} color={zoneColor} anchorX="left" position={[0, -1.48, 0]}>
        {`|E| = ${Math.abs(E).toExponential(2)} N/C`}
      </Text>
      <Text fontSize={0.17} color="#34d399" anchorX="left" position={[0, -1.72, 0]}>
        {`Φ = ${flux.toExponential(2)} N·m²/C`}
      </Text>

      <Line points={[new THREE.Vector3(0,-1.90,0), new THREE.Vector3(5.5,-1.90,0)]}
        color="#1e293b" lineWidth={1} />

      {/* Leyenda */}
      <Text fontSize={0.14} color="#a78bfa" anchorX="left" position={[0, -2.10, 0]}>
        {'◯ morado: sup. gaussiana DENTRO'}
      </Text>
      <Text fontSize={0.14} color="#10b981" anchorX="left" position={[0, -2.28, 0]}>
        {'◯ verde: sup. gaussiana FUERA'}
      </Text>
      <Text fontSize={0.14} color="#fde047" anchorX="left" position={[0, -2.46, 0]}>
        {'● amarillo: posición actual en E(r)'}
      </Text>
    </group>
  )
}

// ── Escena principal ───────────────────────────────────────────
interface GaussEsferaCargaProps {
  R: number        // Radio de la esfera física (m)
  Q: number        // Carga total (nC)
  gaussR: number   // Radio de la superficie gaussiana (m)
}

export function GaussEsferaCargaScene({ R, Q, gaussR }: GaussEsferaCargaProps) {
  return (
    <Canvas
      gl={{ antialias: true }}
      camera={{ fov: 50, near: 0.1, far: 60, position: [6, 4, 8] }}
      style={{ background: '#060d0f' }}
    >
      <color attach="background" args={['#060d0f']} />
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 6, 6]} intensity={1.5} />
      <pointLight position={[-4, 0, -4]} intensity={0.4} color="#10b981" />

      <ChargedSphere R={R} Q={Q} />
      <GaussianSurface r={gaussR} R={R} Q={Q} />
      <EFieldOnSurface r={gaussR} R={R} Q={Q} />
      <RadialFieldLines R={R} Q={Q} />
      <EProfileCurve R={R} Q={Q} />
      <EProfileIndicator r={gaussR} R={R} Q={Q} />
      <EsferaHUD r={gaussR} R={R} Q={Q} />

      <OrbitControls enablePan enableZoom enableRotate minDistance={1.5} maxDistance={30} />
    </Canvas>
  )
}
