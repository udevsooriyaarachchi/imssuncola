import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prevent "process is not defined" error if libraries try to access process.env
      'process.env': JSON.stringify({}) 
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});