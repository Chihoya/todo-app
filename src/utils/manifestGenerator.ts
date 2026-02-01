// This script dynamically generates the manifest.json at runtime
// to ensure correct paths for both local and GitHub Pages deployment

export function generateManifest() {
  const baseUrl = import.meta.env.BASE_URL || '/';
  
  const manifest = {
    name: 'Meine To-Do App',
    short_name: 'To-Do PWA',
    description: 'Organisiere deine Aufgaben in Allgemein, Daily und Weekly',
    start_url: baseUrl,
    scope: baseUrl,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: `${baseUrl}icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: `${baseUrl}icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    categories: ['productivity', 'utilities'],
    screenshots: []
  };

  return manifest;
}

export function registerDynamicManifest() {
  const manifest = generateManifest();
  const manifestJSON = JSON.stringify(manifest);
  const blob = new Blob([manifestJSON], { type: 'application/json' });
  const manifestURL = URL.createObjectURL(blob);

  // Remove old manifest link if exists
  const oldLink = document.querySelector('link[rel="manifest"]');
  if (oldLink) {
    oldLink.remove();
  }

  // Add new manifest link with dynamic URL
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = manifestURL;
  document.head.appendChild(link);
}
