import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '');
  const apiOrigin = environment.JOBRADAR_API_ORIGIN?.trim() || 'http://localhost:8000';
  const apiToken = environment.JOBRADAR_API_TOKEN?.trim();
  const sitesEnabled = environment.OPENAI_SITES === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(sitesEnabled ? [sites()] : []),
    ],
    server: {
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
          headers: apiToken ? { Authorization: `Bearer ${apiToken}` } : undefined,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
