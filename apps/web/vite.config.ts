import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'motion': ['framer-motion'],
          'radix-dialog': ['@radix-ui/react-dialog'],
          'radix-forms': [
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-switch',
          ],
          'radix-other': [
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
          ],
          'charts': ['recharts'],
          'markdown': ['react-markdown'],
          'form': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 600,
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    // npm workspaces may hoist a second React for backend-only packages. Force
    // every UI dependency to use the storefront's React/ReactDOM pair.
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
