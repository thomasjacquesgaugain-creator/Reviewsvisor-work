import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import i18n from './i18n/config'

// Initialiser le lang HTML au boot
document.documentElement.lang = i18n.language || 'fr';

createRoot(document.getElementById("root")!).render(<App />);
