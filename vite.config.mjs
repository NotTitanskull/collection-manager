import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Build and development-server configuration, read by Vite rather than the browser.
export default defineConfig({
  // Relative built asset URLs support deployment under a GitHub repository path.
  base: "./",
  // Compile Vue single-file components and enable development hot updates.
  plugins: [vue()],
});
