import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

performance.mark('sidebar:main-evaluated')
performance.measure('sidebar:module-evaluation', 'sidebar:html-start', 'sidebar:main-evaluated')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
