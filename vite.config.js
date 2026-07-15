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
      // Split CSS per chunk for better caching
      codeSplit: true,
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
      target: 'es2022',
      outDir: 'dist',
      sourcemap: false,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core vendor chunks
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'vendor-react';
            }
            
            // UI & Styling
            if (id.includes('node_modules/bootstrap') || id.includes('node_modules/react-bootstrap')) {
              return 'vendor-bootstrap';
            }
            if (id.includes('node_modules/swiper')) {
              return 'vendor-swiper';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            
            // State Management
            if (id.includes('node_modules/zustand')) {
              return 'vendor-zustand';
            }
            
            // Animation (used globally)
            if (id.includes('node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            
            // Utilities (axios for all API calls)
            if (id.includes('node_modules/axios')) {
              return 'vendor-axios';
            }
            
            // Lazy-loaded PDF generation - DO NOT include in initial bundle
            if (id.includes('node_modules/html2pdf') || id.includes('node_modules/html2canvas') || id.includes('node_modules/jspdf')) {
              return 'vendor-pdf';
            }
            
            // Helmet for SEO - used globally
            if (id.includes('node_modules/react-helmet') || id.includes('node_modules/react-helmet-async')) {
              return 'vendor-helmet';
            }
          },
        },
      },
    },
  };
});