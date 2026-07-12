import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT || 5174),
      strictPort: false,
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://127.0.0.1:8787',
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT || 5174),
      strictPort: false
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
