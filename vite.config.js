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
        voiceIpadDiagnostic: resolve(import.meta.dirname, 'mission-player-voice-ipad-check.html'),
      },
    },
  },
});
