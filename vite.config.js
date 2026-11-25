import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "assets/js",
    // assets/js also holds the site's other scripts — never wipe the folder
    emptyOutDir: false,
    target: "es2020",
    minify: true,
    lib: {
      entry: "assets/js/hero3d.js",
      name: "Hero3d",
      formats: ["iife"],
      fileName: () => "hero3d.bundle.js",
    },
  },
});
