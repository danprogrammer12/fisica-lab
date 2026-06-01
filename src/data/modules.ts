export interface ModuleInfo {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string
  color: string
  gradient: string
  path: string
  scenes: SceneInfo[]
  isAvailable: boolean
}

export interface SceneInfo {
  id: string
  title: string
  description: string
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'campo-electrico',
    title: 'Campo Eléctrico',
    subtitle: 'Electrostática',
    description:
      'Explora cómo las cargas eléctricas generan campos en el espacio. Visualiza líneas de campo, vectores y dipolos en 3D interactivo.',
    icon: '⚡',
    color: '#3b82f6',
    gradient: 'from-blue-600/20 to-blue-900/10',
    path: '/campo-electrico',
    isAvailable: true,
    scenes: [
      {
        id: 'carga-puntual',
        title: 'Carga Puntual',
        description: 'Campo eléctrico de una sola carga en 3D',
      },
      {
        id: 'dipolo',
        title: 'Dipolo Eléctrico',
        description: 'Campo resultante de dos cargas opuestas',
      },
    ],
  },
  {
    id: 'ley-gauss',
    title: 'Ley de Gauss',
    subtitle: 'Flujo Eléctrico',
    description:
      'Comprende el concepto de flujo eléctrico y la poderosa Ley de Gauss para calcular campos en configuraciones simétricas.',
    icon: '🔮',
    color: '#10b981',
    gradient: 'from-emerald-600/20 to-emerald-900/10',
    path: '/ley-de-gauss',
    isAvailable: true,
    scenes: [
      {
        id: 'flujo',
        title: 'Flujo Eléctrico',
        description: 'Φ = EA·cos(θ) en tiempo real',
      },
      {
        id: 'superficie-gaussiana',
        title: 'Superficie Gaussiana',
        description: 'Φ = q_enc/ε₀ — visualización esférica',
      },
    ],
  },
  {
    id: 'potencial',
    title: 'Potencial Eléctrico',
    subtitle: 'Electrostática',
    description:
      'Energía potencial eléctrica, diferencia de potencial y superficies equipotenciales visualizadas como mapas de color interactivos.',
    icon: '🌊',
    color: '#8b5cf6',
    gradient: 'from-violet-600/20 to-violet-900/10',
    path: '/potencial',
    isAvailable: true,
    scenes: [
      {
        id: 'potencial-carga',
        title: 'Potencial de Carga',
        description: 'V = kq/r — mapa de calor 3D',
      },
      {
        id: 'equipotenciales',
        title: 'Equipotenciales',
        description: 'Superficies equipotenciales + líneas de campo',
      },
    ],
  },
  {
    id: 'capacitancia',
    title: 'Capacitancia',
    subtitle: 'Almacenamiento de energía',
    description:
      'Condensadores plano-paralelos, dieléctricos y asociaciones en serie/paralelo con cálculo en tiempo real.',
    icon: '🔋',
    color: '#f59e0b',
    gradient: 'from-amber-600/20 to-amber-900/10',
    path: '/capacitancia',
    isAvailable: true,
    scenes: [
      {
        id: 'capacitor-plano',
        title: 'Capacitor Plano-Paralelo',
        description: 'C = ε₀A/d — visualización interactiva',
      },
      {
        id: 'asociacion',
        title: 'Asociación de Capacitores',
        description: 'Serie y paralelo — Ceq en tiempo real',
      },
    ],
  },
  {
    id: 'circuitos',
    title: 'Circuitos DC',
    subtitle: 'Corriente eléctrica',
    description:
      'Corriente eléctrica, leyes de Kirchhoff y circuito RC con gráfica dinámica exponencial.',
    icon: '⚙️',
    color: '#ef4444',
    gradient: 'from-red-600/20 to-red-900/10',
    path: '/circuitos',
    isAvailable: true,
    scenes: [
      {
        id: 'circuito-rc',
        title: 'Circuito RC',
        description: 'Carga y descarga — curva q(t) en tiempo real',
      },
      {
        id: 'kirchhoff',
        title: 'Leyes de Kirchhoff',
        description: 'KCL y KVL — circuito interactivo',
      },
    ],
  },
  {
    id: 'magnetismo',
    title: 'Campo Magnético',
    subtitle: 'Magnetostática',
    description:
      'Campo magnético del solenoide, fuerza de Lorentz y movimiento helicoidal de partículas cargadas en campo B.',
    icon: '🧲',
    color: '#06b6d4',
    gradient: 'from-cyan-600/20 to-cyan-900/10',
    path: '/magnetismo',
    isAvailable: true,
    scenes: [
      {
        id: 'solenoide',
        title: 'Solenoide',
        description: 'B = μ₀nI — campo interior y exterior en 3D',
      },
      {
        id: 'lorentz',
        title: 'Fuerza de Lorentz',
        description: 'Trayectoria circular/helicoidal de partícula cargada',
      },
    ],
  },
]
