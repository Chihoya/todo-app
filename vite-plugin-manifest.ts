import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function manifestPlugin(): Plugin {
  return {
    name: 'vite-plugin-manifest-generator',
    
    closeBundle() {
      // Get the base URL from environment or config
      const baseUrl = process.env.BASE_URL || '/';
      
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
            src: `${baseUrl}icon-192.png`.replace(/\/+/g, '/'),
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `${baseUrl}icon-512.png`.replace(/\/+/g, '/'),
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['productivity', 'utilities'],
        screenshots: []
      };

      // Write manifest.json to dist folder
      const distPath = path.resolve(process.cwd(), 'dist');
      const manifestPath = path.join(distPath, 'manifest.json');
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`✅ Generated manifest.json with base: ${baseUrl}`);
    }
  };
}
