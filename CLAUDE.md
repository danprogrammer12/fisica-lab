# PhysicsLab — Física Eléctrica UAC 2026

Aplicación educativa de simulaciones interactivas de física eléctrica. React 18 + TypeScript + Vite. **Todas las simulaciones de física son 3D** usando `@react-three/fiber` (R3F) + `@react-three/drei`. Solo los diagramas de circuitos usan canvas 2D.

## Stack

- React 18 + TypeScript + Vite
- Three.js via `@react-three/fiber` + `@react-three/drei`
- Tailwind CSS (clase utilitaria, sin config personalizada)
- Dev server: `npm run dev` → localhost:5174

## Estructura de módulos

| Módulo | Página | Accent | Simulaciones |
|--------|--------|--------|--------------|
| Campo Eléctrico | `src/pages/CampoElectrico.tsx` | `#3b82f6` / `#ef4444` | CargaPuntual, DipoloElectrico |
| Ley de Gauss | `src/pages/LeyDeGauss.tsx` | `#10b981` | FlujoElectrico, SuperficieGaussiana, GaussEsferaCarga, GaussCilindro |
| Potencial Eléctrico | `src/pages/PotencialElectrico.tsx` | `#8b5cf6` | PotencialCarga, Equipotenciales, PotencialDipolo |
| Capacitancia | `src/pages/Capacitancia.tsx` | `#f59e0b` | CapacitorPlano (toggle 3D/2D), AsociacionCapacitores |
| Circuitos DC | `src/pages/CircuitosDC.tsx` | `#ef4444` | CircuitoRC, CircuitoKirchhoff |
| Magnetismo | `src/pages/Magnetismo.tsx` | `#06b6d4` | CampoSolenoide, FuerzaLorentz, ReglaManoDerecha, BiotSavart |

## Convenciones de simulaciones 3D

```tsx
// Estructura estándar de una simulación 3D
export function NombreScene({ prop }: Props) {
  return (
    <Canvas gl={{ antialias: true }} camera={{ fov: 50, position: [x, y, z] }}
            style={{ background: '#080c12' }}>
      <color attach="background" args={['#080c12']} />
      <ambientLight intensity={0.35} />
      <pointLight position={[5,5,5]} intensity={1.5} />
      {/* Componentes de física */}
      <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={30} />
    </Canvas>
  )
}
```

- **ArrowHelper**: siempre limpiar geometría en `useEffect` cleanup
- **Trails**: `Float32Array` rolling buffer con `BufferGeometry`, `setDrawRange`
- **Fibonacci sphere**: `Math.acos(1 - 2 * ((i * 0.618033988) % 1))` para distribución uniforme
- **Animación**: `useFrame((_, delta) => ...)` — nunca usar `setTimeout`/`setInterval`
- **HUD en escena**: `<Text>` de drei, posición fija en espacio mundo (esquina superior izquierda ~[-6,4,0])

## Constantes físicas (`src/physics/constants.ts`)

```ts
K_COULOMB = 8.99e9      // N·m²/C²
EPSILON_0 = 8.854e-12   // F/m
MU_0 = 4π×10⁻⁷          // T·m/A
NC_TO_C = 1e-9          // nC → C
```

## Componentes UI reutilizables

- `<SliderControl>` — slider con label, valor, unidad, color
- `<FormulaCard>` — tarjeta con LaTeX (katex), variables, highlight
- `<InfoPanel>` — panel derecho con título, concepto, contenido
- `<ValueDisplay>` — fila de valor calculado en tiempo real
- `<QuizEngine>` — motor de quiz con progreso
- `<InfografiaPanel>` — botón que abre imagen en modal

## Layout de cada página

```
[Tabs] [Infografía] [Quiz] [Dinámico]
┌─────────────┬──────────────────┬──────────────┐
│ Controles   │   Canvas 3D      │  InfoPanel   │
│ w-64        │   flex-1         │  w-72        │
│ sliders     │   simulación     │  fórmulas    │
│ valores     │                  │  valores     │
└─────────────┴──────────────────┴──────────────┘
```

## Reglas de desarrollo

1. **Nunca 2D** para simulaciones de física — siempre R3F. Excepción: diagramas de circuito (CircuitoRC, CircuitoKirchhoff) y el toggle 2D del capacitor.
2. **No Plotly** — reemplazado con canvas nativo o R3F.
3. Cada página usa `renderControls()` y `renderInfo()` como funciones internas para evitar ternarios anidados en JSX.
4. El panel de info incluye siempre una sección **"Guía del modelo 3D"** explicando qué representa cada elemento visual.
5. Exports necesarios: la escena `XxxScene` + helpers de cálculo usados por la página (`calcB`, `bCenter`, `computeFResult`, etc.).

## Quizzes (`src/data/quizzes.ts`)

Cada módulo tiene un quiz referenciado por `moduleId`. Los IDs son: `campo-electrico`, `ley-gauss`, `potencial`, `capacitancia`, `circuitos`, `magnetismo`.

## Progreso (`src/hooks/useProgress.ts`)

`markVisited(moduleId)` y `saveQuizScore(moduleId, score, total)` — persisten en localStorage.
