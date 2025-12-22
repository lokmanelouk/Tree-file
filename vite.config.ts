import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  // Essential for Electron (makes paths relative)
  base: './', 
  resolve: {
    alias: {
      // Maps '@' to the current directory
      '@': path.resolve(__dirname, './'), 
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});