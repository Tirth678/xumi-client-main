import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Social crawlers require absolute og:image/twitter:image URLs. Vercel exposes
 * the production domain at build time; SITE_URL can override it. Without
 * either, the relative URLs are kept (fine for local development).
 */
const absoluteSocialImages = (): Plugin => {
  const explicit = process.env.SITE_URL?.trim().replace(/\/$/, "");
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const origin = explicit || (vercelHost ? `https://${vercelHost}` : "");
  return {
    name: "absolute-social-images",
    transformIndexHtml(html) {
      if (!origin) return html;
      return html
        .replace(/(property="og:image" content=")\//g, `$1${origin}/`)
        .replace(/(name="twitter:image" content=")\//g, `$1${origin}/`);
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    // Extra dev-server hosts (e.g. remote previews), comma-separated.
    allowedHosts: process.env.VITE_DEV_ALLOWED_HOSTS?.split(",").map((h) => h.trim()).filter(Boolean) ?? [],
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
        },
      },
    },
  },
  plugins: [react(), absoluteSocialImages()],
  resolve: {
    // npm workspaces may hoist a second React for backend-only packages. Force
    // every UI dependency to use the storefront's React/ReactDOM pair.
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
