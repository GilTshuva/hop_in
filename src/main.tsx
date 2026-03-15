import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import JumpInGame from './components/JumpIn'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JumpInGame />
  </StrictMode>,
)
