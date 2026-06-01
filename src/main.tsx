import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')
if (!root) throw new Error('Elemento #root no encontrado en el DOM')

// StrictMode desactivado: en React 19 monta componentes dos veces,
// lo que genera Context Lost en WebGL (Two simultaneous WebGL contexts).
createRoot(root).render(<App />)
