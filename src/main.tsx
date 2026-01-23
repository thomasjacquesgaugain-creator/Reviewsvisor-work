import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'
import { loadCustomization } from './utils/theme'

// Charger la personnalisation AVANT le rendu React
loadCustomization();

createRoot(document.getElementById("root")!).render(<App />);
