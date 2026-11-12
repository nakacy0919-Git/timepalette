import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        missionCreator: resolve(import.meta.dirname, 'mission-creator.html'),
        ...(process.env.TP_QA_REFLECTION === '1' ? {reflectionQA:resolve(import.meta.dirname,'tests/creator-reflection-layout.html')} : {}),
      },
    },
  },
});
