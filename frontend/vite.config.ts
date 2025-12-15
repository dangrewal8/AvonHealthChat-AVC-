/**
 * Vite Configuration
 *
 * Production-optimized build configuration for React + Vite frontend.
 *
 * Tech Stack: React + Vite + TypeScript
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Development server configuration
  server: {
    port: 3000,
    host: true, // Listen on all addresses for Docker
    allowedHosts: ['chat.missionvalley.dev', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  // Production build configuration
  build: {
    // Output directory
    outDir: 'dist',

    // Disable source maps in production for security
    sourcemap: false,

    // Use Terser for better minification
    minify: 'terser',

    // Terser options
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },

    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for React core
          vendor: ['react', 'react-dom'],

          // Additional chunks can be added as needed
          // Example: ui: ['lucide-react'],
        },

        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          let extType = info?.[info.length - 1] || '';

          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
            extType = 'images';
          } else if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            extType = 'fonts';
          }

          return `assets/${extType}/[name]-[hash][extname]`;
        },

        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',

        // Entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // 1000 KB

    // Asset inlining threshold (10 KB)
    assetsInlineLimit: 10240,

    // CSS code splitting
    cssCodeSplit: true,

    // Target modern browsers for smaller bundles
    target: 'es2015',
  },

  // Preview server (for testing production build locally)
  preview: {
    port: 3000,
    host: true,
  },
});
