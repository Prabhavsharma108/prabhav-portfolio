import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// A small note for anyone who opens devtools. The site is drawn as a
// blueprint, so the console gets the title block.
if (typeof window !== 'undefined') {
  console.log(
    '%c PRABHAV SHARMA %c FRONTEND / AI ENGINEER ',
    'background:#35c8f5;color:#08131f;padding:5px 10px;font-weight:700;letter-spacing:.12em;',
    'background:#0c1e30;color:#a4d8f2;padding:5px 10px;letter-spacing:.12em;border:1px solid #1a4260;'
  );
  console.log(
    '%cDrawing no. PS-2026 · React 19 · three.js · GSAP\n%cSource: github.com/Prabhavsharma108',
    'color:#5f7c92;font-family:monospace;',
    'color:#5f7c92;font-family:monospace;'
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
