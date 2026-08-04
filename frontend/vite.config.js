// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

const plugins = [react()];
if (process.env.ANALYZE) {
  plugins.push(visualizer({ open: true, filename: 'dist/stats.html', gzipSize: true, brotliSize: true }));
}

export default defineConfig({
  plugins,
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer/',
      stream: 'stream-browserify',
      process: 'process/browser',
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      host: '127.0.0.1',
      port: 5173,
      protocol: 'ws',
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/resources': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: 'esbuild',
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-hot-toast') || id.includes('node_modules/axios')) return 'react-core';
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) return 'charts';
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) return 'three';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/xlsx') || id.includes('node_modules/html2canvas')) return 'export';
          if (id.includes('node_modules/framer-motion')) return 'animation';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('node_modules/date-fns')) return 'dates';
          if (id.includes('node_modules/react-pdf') || id.includes('node_modules/pdfjs-dist')) return 'pdf';
          if (id.includes('node_modules/@react-pdf/renderer')) return 'react-pdf-renderer';
          if (id.includes('node_modules/react-markdown') || id.includes('node_modules/rehype-highlight')) return 'markdown';
          if (id.includes('node_modules/@sentry')) return 'sentry';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1600,
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'lucide-react', 'buffer', 'process'],
    exclude: ['three'],
  },
});
