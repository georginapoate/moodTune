import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // optional, makes imports easier
    },
  },
  esbuild: {
    include: /src\/.*\.[jt]sx?$/, // all js, jsx, ts, tsx in src
    loader: 'jsx',                // force JSX parsing
  },
  server: {
    port: 3000,               // You can change this if needed
  },
});
