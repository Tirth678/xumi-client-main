import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
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
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          charts: ["recharts"],
          markdown: ["react-markdown"],
        },
      },
    },
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
