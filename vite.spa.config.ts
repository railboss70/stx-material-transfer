import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const dir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(dir, "spa"),
  base: "/stx-material-transfer/",
  publicDir: resolve(dir, "spa/public"),
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    tsconfigPaths: true,
    alias: { "@": resolve(dir, "src") },
  },
  build: {
    outDir: resolve(dir, "docs"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
