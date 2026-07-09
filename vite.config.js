import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
          additionalData: `$env-google-fonts-noto: "${env.VITE_GOOGLE_FONTS_NOTO_URL || ''}";\n`,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@features': path.resolve(__dirname, './src/features'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@app': path.resolve(__dirname, './src/app'),
      },
    },
    server: { port: 3000, open: true },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rolldownOptions: {
        checks: { pluginTimings: false },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('html2pdf') || id.includes('jspdf') || id.includes('html2canvas')) return 'html2pdf';
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor';
              if (id.includes('bootstrap') || id.includes('react-bootstrap')) return 'bootstrap';
              if (id.includes('swiper')) return 'swiper';
              if (id.includes('zustand')) return 'zustand';
            }
          },
        },
      },
    },
  };
});