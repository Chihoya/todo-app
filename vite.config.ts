import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Für GitHub Pages: Setze BASE_URL Umgebungsvariable
  // Beispiel: BASE_URL=/todo-pwa/ pnpm run build
  // Für lokales Hosting: kein BASE_URL nötig, default ist '/'
  const base = process.env.BASE_URL || '/';

  return {
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
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