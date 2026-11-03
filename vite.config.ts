import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// "single" mode bundles everything into one HTML file (used for quick test links).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [viteSingleFile()] : [],
  build: {
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    chunkSizeWarningLimit: 2000,
  },
}));
