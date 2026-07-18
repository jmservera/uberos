import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// UbeROS frontend build configuration.
// Output goes to dist/ and is served by nginx in the container.
export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3000,
    host: true,
  },
});
