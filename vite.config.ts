import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  base: './', 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'), // Changed from ./src to ./
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});