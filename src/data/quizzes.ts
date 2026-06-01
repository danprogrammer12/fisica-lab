export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct: number   // índice 0-based
  explanation: string
}

export interface ModuleQuiz {
  moduleId: string
  title: string
  questions: QuizQuestion[]
}

export const QUIZZES: ModuleQuiz[] = [
  {
    moduleId: 'campo-electrico',
    title: 'Quiz — Campo Eléctrico',
    questions: [
      {
        id: 'ce-1',
        question: 'La magnitud del campo eléctrico de una carga puntual varía con la distancia r como:',
        options: ['Proporcional a 1/r', 'Proporcional a 1/r²', 'Proporcional a 1/r³', 'Constante'],
        correct: 1,
        explanation: 'Por la Ley de Coulomb, E = kq/r², por lo tanto E ∝ 1/r². Al doblar la distancia el campo se reduce a ¼.',
      },
      {
        id: 'ce-2',
        question: 'Las líneas de campo eléctrico salen de cargas:',
        options: ['Negativas', 'Positivas', 'Neutras', 'De cualquier signo'],
        correct: 1,
        explanation: 'Por convención, las líneas de campo salen de cargas positivas y terminan en cargas negativas.',
      },
      {
        id: 'ce-3',
        question: 'Un dipolo eléctrico se compone de:',
        options: [
          'Dos cargas positivas iguales',
          'Dos cargas negativas iguales',
          'Dos cargas de igual magnitud y signo opuesto',
          'Una carga positiva y una neutra',
        ],
        correct: 2,
        explanation: 'El dipolo eléctrico es el sistema formado por dos cargas +q y -q separadas una distancia d. Su momento dipolar es p = qd.',
      },
      {
        id: 'ce-4',
        question: 'El principio de superposición establece que el campo eléctrico total de un sistema de cargas es:',
        options: [
          'El producto de los campos individuales',
          'La suma vectorial de los campos de cada carga',
          'El campo de la carga más cercana',
          'El promedio de todos los campos',
        ],
        correct: 1,
        explanation: 'E_total = ΣEᵢ. Los campos eléctricos se suman vectorialmente; cada carga contribuye de forma independiente.',
      },
    ],
  },
  {
    moduleId: 'ley-gauss',
    title: 'Quiz — Ley de Gauss',
    questions: [
      {
        id: 'lg-1',
        question: 'El flujo eléctrico Φ = EA·cos(θ) es máximo cuando:',
        options: ['θ = 90°', 'θ = 45°', 'θ = 0°', 'θ = 180°'],
        correct: 2,
        explanation: 'cos(0°) = 1, por lo que el flujo es máximo cuando el campo es perpendicular al plano (paralelo a la normal de la superficie).',
      },
      {
        id: 'lg-2',
        question: 'Según la Ley de Gauss, si duplicas el radio de la superficie gaussiana esférica alrededor de una carga puntual, el flujo:',
        options: ['Se cuadruplica', 'Se duplica', 'Permanece igual', 'Se reduce a la mitad'],
        correct: 2,
        explanation: 'Φ = q_enc/ε₀. El flujo solo depende de la carga encerrada, no del tamaño de la superficie gaussiana.',
      },
      {
        id: 'lg-3',
        question: 'La Ley de Gauss es especialmente útil cuando la distribución de carga tiene:',
        options: [
          'Simetría esférica, cilíndrica o plana',
          'Forma irregular cualquiera',
          'Solo simetría esférica',
          'Distribución de carga lineal',
        ],
        correct: 0,
        explanation: 'La Ley de Gauss permite calcular E fácilmente cuando hay simetría (esférica, cilíndrica o plana) para elegir una superficie gaussiana conveniente.',
      },
      {
        id: 'lg-4',
        question: 'En el interior de un conductor en equilibrio electrostático, el campo eléctrico es:',
        options: ['Máximo', 'Variable', 'Igual al exterior', 'Cero'],
        correct: 3,
        explanation: 'En equilibrio electrostático, E = 0 dentro del conductor. Las cargas se redistribuyen en la superficie hasta que el campo interno sea nulo.',
      },
    ],
  },
  {
    moduleId: 'potencial',
    title: 'Quiz — Potencial Eléctrico',
    questions: [
      {
        id: 'pe-1',
        question: 'Las superficies equipotenciales son siempre:',
        options: [
          'Paralelas a las líneas de campo',
          'Perpendiculares a las líneas de campo',
          'Paralelas al campo en algunos puntos',
          'Ninguna de las anteriores',
        ],
        correct: 1,
        explanation: 'El campo eléctrico es perpendicular a las superficies equipotenciales. No se realiza trabajo al mover una carga sobre una equipotencial.',
      },
      {
        id: 'pe-2',
        question: 'Si el potencial eléctrico es constante en una región, el campo eléctrico en esa región es:',
        options: ['Máximo', 'Cero', 'Igual al potencial', 'Igual a 1/ε₀'],
        correct: 1,
        explanation: 'E = -dV/dr. Si V = constante, dV/dr = 0 y por lo tanto E = 0.',
      },
      {
        id: 'pe-3',
        question: 'El trabajo realizado para mover una carga q entre dos puntos con diferencia de potencial ΔV es:',
        options: ['W = qΔV', 'W = q/ΔV', 'W = ΔV/q', 'W = q²ΔV'],
        correct: 0,
        explanation: 'W = qΔV. Si q > 0 y ΔV > 0, se realiza trabajo positivo al mover la carga hacia mayor potencial.',
      },
      {
        id: 'pe-4',
        question: 'El potencial eléctrico debido a una carga puntual q a distancia r es:',
        options: ['V = kq/r²', 'V = kq/r', 'V = kq·r', 'V = kq²/r'],
        correct: 1,
        explanation: 'V = kq/r. A diferencia del campo E = kq/r², el potencial decae más lentamente con la distancia (1/r vs 1/r²).',
      },
    ],
  },
  {
    moduleId: 'capacitancia',
    title: 'Quiz — Capacitancia',
    questions: [
      {
        id: 'cap-1',
        question: 'La capacitancia de un capacitor plano-paralelo aumenta si:',
        options: [
          'Se aumenta la separación entre las placas',
          'Se disminuye el área de las placas',
          'Se inserta un dieléctrico entre las placas',
          'Se aumenta la carga en las placas',
        ],
        correct: 2,
        explanation: 'C = κε₀A/d. Insertar un dieléctrico (κ > 1) aumenta la capacitancia. También aumenta al aumentar A o disminuir d.',
      },
      {
        id: 'cap-2',
        question: 'Dos capacitores en paralelo: la capacitancia equivalente es:',
        options: [
          '1/Ceq = 1/C₁ + 1/C₂',
          'Ceq = C₁ · C₂',
          'Ceq = C₁ + C₂',
          'Ceq = C₁ - C₂',
        ],
        correct: 2,
        explanation: 'En paralelo: Ceq = ΣCᵢ. Las capacitancias se suman directamente. Todos los capacitores tienen el mismo voltaje.',
      },
      {
        id: 'cap-3',
        question: 'La energía almacenada en un capacitor de capacitancia C con voltaje V es:',
        options: ['U = CV²', 'U = ½CV²', 'U = 2CV²', 'U = CV'],
        correct: 1,
        explanation: 'U = ½CV² = Q²/(2C) = QV/2. El factor ½ viene de que la energía se almacena gradualmente al cargar el capacitor.',
      },
      {
        id: 'cap-4',
        question: 'Al insertar un dieléctrico en un capacitor ya cargado (sin fuente conectada), el voltaje:',
        options: ['Aumenta', 'Permanece igual', 'Disminuye', 'Se hace cero'],
        correct: 2,
        explanation: 'Q = cte, C aumenta con el dieléctrico → V = Q/C disminuye. La energía almacenada también disminuye (la diferencia es cedida al insertar el dieléctrico).',
      },
    ],
  },
  {
    moduleId: 'circuitos',
    title: 'Quiz — Corriente Eléctrica y Circuitos',
    questions: [
      {
        id: 'cir-1',
        question: 'La constante de tiempo τ en un circuito RC representa:',
        options: [
          'El tiempo para cargarse completamente',
          'El tiempo en que la carga llega al 63.2% del valor máximo',
          'El tiempo en que el voltaje llega al 50%',
          'El tiempo de descarga total',
        ],
        correct: 1,
        explanation: 'τ = RC. En t = τ, q = Cε(1 - e⁻¹) ≈ 0.632·Cε. Es el tiempo característico de la exponencial.',
      },
      {
        id: 'cir-2',
        question: 'La Ley de Kirchhoff de nodos establece que:',
        options: [
          'La suma de voltajes en una malla es cero',
          'La suma de corrientes que entran a un nodo es igual a las que salen',
          'La resistencia equivalente en serie es la suma',
          'La corriente es igual en todo el circuito',
        ],
        correct: 1,
        explanation: 'KCL: ΣI_entrada = ΣI_salida. Es consecuencia de la conservación de la carga eléctrica.',
      },
      {
        id: 'cir-3',
        question: 'La potencia disipada en una resistencia R con corriente I es:',
        options: ['P = IR', 'P = I²R', 'P = IR²', 'P = I/R'],
        correct: 1,
        explanation: 'P = I²R = V²/R = IV. Esta es la Ley de Joule para la disipación de potencia en un resistor.',
      },
      {
        id: 'cir-4',
        question: 'La fuerza electromotriz (FEM) de una batería real con resistencia interna r y corriente I tiene un voltaje en bornes:',
        options: ['V = ε', 'V = ε + Ir', 'V = ε - Ir', 'V = ε · r'],
        correct: 2,
        explanation: 'V = ε - Ir. La resistencia interna causa una caída de voltaje cuando fluye corriente, reduciendo el voltaje disponible en los bornes.',
      },
    ],
  },
  {
    moduleId: 'magnetismo',
    title: 'Quiz — Campo Magnético',
    questions: [
      {
        id: 'mag-1',
        question: 'El campo magnético dentro de un solenoide largo e ideal es:',
        options: [
          'Variable a lo largo del eje',
          'Uniforme y paralelo al eje',
          'Cero en el centro',
          'Igual al campo exterior',
        ],
        correct: 1,
        explanation: 'B = μ₀nI es uniforme dentro del solenoide ideal e igual en todos los puntos del interior. Afuera el campo se cancela.',
      },
      {
        id: 'mag-2',
        question: 'La fuerza de Lorentz sobre una partícula cargada en movimiento es:',
        options: [
          'Paralela a la velocidad',
          'Paralela al campo magnético',
          'Perpendicular tanto a v como a B',
          'Siempre hacia el centro del campo',
        ],
        correct: 2,
        explanation: 'F = qv×B. El producto vectorial es perpendicular a ambos vectores. Por eso la fuerza no hace trabajo y la rapidez no cambia.',
      },
      {
        id: 'mag-3',
        question: 'El radio del movimiento circular de una partícula en un campo B es:',
        options: ['r = qB/mv', 'r = mv/(qB)', 'r = qvB/m', 'r = m/(qvB)'],
        correct: 1,
        explanation: 'Igualando la fuerza centrípeta con la de Lorentz: mv²/r = qvB → r = mv/(qB). Mayor velocidad o masa → mayor radio.',
      },
      {
        id: 'mag-4',
        question: 'Si se duplica la corriente en un solenoide, el campo magnético interior:',
        options: ['Se duplica', 'Se cuadruplica', 'Se reduce a la mitad', 'No cambia'],
        correct: 0,
        explanation: 'B = μ₀nI es directamente proporcional a I. Al duplicar I, B se duplica. La relación es lineal.',
      },
    ],
  },
]
