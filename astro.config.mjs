// @ts-check
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },
  security: {
    checkOrigin: false,
  },

  prefetch: {
    prefetchAll: false, // Jangan semua link di-prefetch otomatis
    defaultStrategy: "load",
  },
});
