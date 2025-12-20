
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' is used to load all env variables regardless of the VITE_ prefix.
  // Fix: use path.resolve('.') instead of process.cwd() to avoid TS error on 'process' type
  const env = loadEnv(mode, path.resolve('.'), '');

  return {
    plugins: [react()],
    base: './',
    define: {
      // This maps VITE_API_KEY from your .env to process.env.API_KEY in your code
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    }
  };
});
