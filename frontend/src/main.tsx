import { createRoot, type Container } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root') as Container).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
)
