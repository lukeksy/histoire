import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // En développement, redirige les appels /api vers le serveur Express
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    // Le build React va dans le dossier public/ du backend
    outDir: '../public',
    emptyOutDir: true
  }
});
