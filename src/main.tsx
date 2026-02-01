import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App.tsx'
import '@/styles/tailwind.css'
import '@/styles/fonts.css'
import '@/styles/theme.css'
import { registerDynamicManifest } from '@/utils/manifestGenerator'

// Register dynamic manifest before app loads
registerDynamicManifest();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const swUrl = `${baseUrl}sw.js`;
    
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((error) => {
        console.log('SW registration failed: ', error);
      });
  });
}