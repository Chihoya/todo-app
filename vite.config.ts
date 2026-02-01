import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { manifestPlugin } from './vite-plugin-manifest'

export default defineConfig(({ mode }) => {
  // GitHub Pages: /todo-app/
  // Development: /
  const base = mode === 'production' ? '/todo-app/' : '/';

  return {
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
      manifestPlugin(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },
    base,
  };
})